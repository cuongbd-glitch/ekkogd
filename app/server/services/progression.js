/**
 * XP, the six levels, and the badge rule engine.
 *
 * Every rewarding action in the product funnels through `recordActivity`, which
 * is the single place that writes the activity log, moves the streak, grants XP,
 * re-evaluates the level, and awards badges. Routes never touch user_state
 * directly.
 */
import { all, get, run } from '../db.js';
import { dayKey, nowIso } from '../lib/time.js';
import { readState, touchStreak } from './streak.js';

/** Actions that count towards the daily streak. */
const STREAK_KINDS = new Set(['lesson_completed', 'feature_used']);

export const BADGE_RULES = {
  lessons_completed: 'So bai hoc da hoan thanh',
  modules_completed: 'So mo dun da hoan thanh',
  streak_days: 'Do dai chuoi streak',
  feature_used: 'So lan dung mot chuc nang (rule_target = ma chuc nang)',
  expenses_logged: 'So khoan chi tieu da ghi',
  goals_created: 'So muc tieu da tao',
  goals_completed: 'So muc tieu da hoan thanh',
  budgets_created: 'So ngan sach da lap',
  level_reached: 'Dat toi cap do thu N',
  xp_total: 'Tong XP tich luy',
  bot_chats: 'So luot tro chuyen voi Ekko bot',
};

export function levels() {
  return all('SELECT * FROM levels WHERE is_active = 1 ORDER BY order_index');
}

/** Highest level whose xp_required is covered by `xp`. */
export function levelForXp(xp) {
  const list = levels();
  let current = list[0] || null;
  for (const level of list) {
    if (xp >= level.xp_required) current = level;
    else break;
  }
  return current;
}

export function nextLevel(level) {
  if (!level) return null;
  return get('SELECT * FROM levels WHERE is_active = 1 AND order_index > ? ORDER BY order_index LIMIT 1', level.order_index);
}

/** Level plus the progress bar numbers the HUD needs. */
export function levelProgress(xp) {
  const current = levelForXp(xp);
  const next = nextLevel(current);
  const floor = current ? current.xp_required : 0;
  const ceiling = next ? next.xp_required : floor;
  const span = Math.max(1, ceiling - floor);
  return {
    level: current,
    next,
    xp,
    xpIntoLevel: xp - floor,
    xpForNextLevel: next ? ceiling - floor : 0,
    xpToNextLevel: next ? Math.max(0, ceiling - xp) : 0,
    percent: next ? Math.min(100, Math.round(((xp - floor) / span) * 100)) : 100,
  };
}

// --- badge evaluation ----------------------------------------------------

function metricFor(userId, badge, state) {
  switch (badge.rule_type) {
    case 'lessons_completed':
      return get('SELECT COUNT(*) n FROM lesson_progress WHERE user_id = ? AND status = ?', userId, 'completed').n;
    case 'modules_completed':
      return countCompletedModules(userId);
    case 'streak_days':
      return state.streak_count;
    case 'feature_used':
      return badge.rule_target
        ? get('SELECT COUNT(*) n FROM activity_log WHERE user_id = ? AND kind = ? AND ref = ?', userId, 'feature_used', badge.rule_target).n
        : get('SELECT COUNT(*) n FROM activity_log WHERE user_id = ? AND kind = ?', userId, 'feature_used').n;
    case 'expenses_logged':
      return get('SELECT COUNT(*) n FROM expenses WHERE user_id = ?', userId).n;
    case 'goals_created':
      return get('SELECT COUNT(*) n FROM goals WHERE user_id = ?', userId).n;
    case 'goals_completed':
      return get('SELECT COUNT(*) n FROM goals WHERE user_id = ? AND status = ?', userId, 'done').n;
    case 'budgets_created':
      return get('SELECT COUNT(*) n FROM budgets WHERE user_id = ?', userId).n;
    case 'level_reached': {
      const level = levelForXp(state.xp);
      return level ? level.order_index : 0;
    }
    case 'xp_total':
      return state.xp;
    case 'bot_chats':
      // Chỉ đếm trò chuyện thật. Thanh ghi nhanh cũng ghi vào sổ hội thoại
      // (source = 'quick') nhưng đó không phải là trò chuyện với bot.
      return get(
        "SELECT COUNT(*) n FROM bot_messages WHERE user_id = ? AND role = 'user' AND source = 'chat'",
        userId,
      ).n;
    default:
      return 0;
  }
}

export function countCompletedModules(userId) {
  return get(
    `SELECT COUNT(*) n FROM (
       SELECT m.id
         FROM modules m
         JOIN lessons l ON l.module_id = m.id AND l.is_published = 1
         LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ? AND p.status = 'completed'
        WHERE m.is_published = 1
        GROUP BY m.id
       HAVING COUNT(l.id) > 0 AND COUNT(l.id) = COUNT(p.lesson_id)
     )`,
    userId,
  ).n;
}

/** Awards every active badge whose threshold is now met. Idempotent. */
export function evaluateBadges(userId) {
  const state = readState(userId);
  const owned = new Set(all('SELECT badge_id FROM user_badges WHERE user_id = ?', userId).map((r) => r.badge_id));
  const awarded = [];

  for (const badge of all('SELECT * FROM badges WHERE is_active = 1 ORDER BY order_index, id')) {
    if (owned.has(badge.id)) continue;
    if (metricFor(userId, badge, state) < badge.rule_value) continue;

    run('INSERT OR IGNORE INTO user_badges (user_id, badge_id, awarded_at) VALUES (?, ?, ?)', userId, badge.id, nowIso());
    awarded.push(badge);

    if (badge.xp_reward > 0) {
      run('UPDATE user_state SET xp = xp + ?, updated_at = ? WHERE user_id = ?', badge.xp_reward, nowIso(), userId);
      run(
        'INSERT INTO activity_log (user_id, kind, ref, day, xp, meta, created_at) VALUES (?,?,?,?,?,?,?)',
        userId, 'badge_awarded', badge.code, dayKey(), badge.xp_reward, null, nowIso(),
      );
    }
  }
  return awarded;
}

/**
 * The one entry point for anything that earns rewards.
 *
 * @returns rewards envelope consumed by the client to run its celebrations.
 */
export function recordActivity(userId, {
  kind,
  ref = null,
  xp = 0,
  meta = null,
  countsForStreak = STREAK_KINDS.has(kind),
  day = dayKey(),
}) {
  const before = readState(userId);
  const beforeLevel = levelForXp(before.xp);

  run(
    'INSERT INTO activity_log (user_id, kind, ref, day, xp, meta, created_at) VALUES (?,?,?,?,?,?,?)',
    userId, kind, ref, day, xp, meta ? JSON.stringify(meta) : null, nowIso(),
  );

  if (xp) {
    run('UPDATE user_state SET xp = xp + ?, updated_at = ? WHERE user_id = ?', xp, nowIso(), userId);
  }

  const streak = countsForStreak ? touchStreak(userId, day) : null;

  const after = readState(userId);
  const afterLevel = levelForXp(after.xp);
  if (afterLevel && afterLevel.id !== after.level_id) {
    run('UPDATE user_state SET level_id = ?, updated_at = ? WHERE user_id = ?', afterLevel.id, nowIso(), userId);
  }
  const levelUp = afterLevel && beforeLevel && afterLevel.order_index > beforeLevel.order_index ? afterLevel : null;
  if (levelUp) {
    run(
      'INSERT INTO activity_log (user_id, kind, ref, day, xp, meta, created_at) VALUES (?,?,?,?,?,?,?)',
      userId, 'level_up', String(levelUp.id), day, 0, JSON.stringify({ name: levelUp.name }), nowIso(),
    );
  }

  const badges = evaluateBadges(userId);
  const finalState = readState(userId);

  return {
    xp,
    streak,
    levelUp,
    badges,
    progress: levelProgress(finalState.xp),
    totals: { xp: finalState.xp },
  };
}

/**
 * Ghi nhận người dùng đã LÀM một việc trong một trong ba chức năng hôm nay (lưu
 * ngân sách, đặt/nạp mục tiêu, ghi một khoản chi). Chỉ riêng việc mở màn hình thì
 * không gọi tới đây, nên mở app rồi bấm quanh không sinh ra XP hay streak nào.
 *
 * Chỉ lần đầu mỗi ngày cho mỗi chức năng mới trả thưởng.
 */
export function useFeature(userId, featureCode, day = dayKey()) {
  const feature = get('SELECT * FROM features WHERE code = ? AND is_enabled = 1', featureCode);
  if (!feature) return null;

  const already = get(
    'SELECT id FROM activity_log WHERE user_id = ? AND kind = ? AND ref = ? AND day = ?',
    userId, 'feature_used', featureCode, day,
  );
  if (already) {
    // Still keep badges honest (e.g. a "use every tool" badge) but pay nothing.
    return { xp: 0, streak: null, levelUp: null, badges: evaluateBadges(userId), alreadyToday: true };
  }

  return { ...recordActivity(userId, { kind: 'feature_used', ref: featureCode, xp: feature.xp_per_day, day }), alreadyToday: false };
}
