/**
 * Assembles the payload behind the main screen: the player's island, the pig
 * character, the four satellite islands, the HUD numbers and what to do next.
 */
import { all, get } from '../db.js';
import { activeConcept } from './concepts.js';
import { dayKey } from '../lib/time.js';
import { levelProgress, levels } from './progression.js';
import { readState, streakStatus, MAX_FREEZE_DAYS } from './streak.js';

export function moduleOverview(userId) {
  return all(
    `SELECT m.*,
            (SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id AND l.is_published = 1) AS lesson_count,
            (SELECT COUNT(*) FROM lessons l
               JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ? AND p.status = 'completed'
              WHERE l.module_id = m.id AND l.is_published = 1) AS completed_count
       FROM modules m
      WHERE m.is_published = 1
      ORDER BY m.order_index`,
    userId,
  );
}

/** First unfinished lesson in the first unlocked, unfinished module. */
export function nextLesson(userId, currentLevelOrder) {
  return get(
    `SELECT l.*, m.title AS module_title, m.slug AS module_slug, m.unlock_level
       FROM lessons l
       JOIN modules m ON m.id = l.module_id
       LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ?
      WHERE l.is_published = 1 AND m.is_published = 1
        AND m.unlock_level <= ?
        AND (p.status IS NULL OR p.status <> 'completed')
      ORDER BY m.order_index, l.order_index
      LIMIT 1`,
    userId, currentLevelOrder,
  );
}

export function badgeBoard(userId) {
  return all(
    `SELECT b.*, ub.awarded_at
       FROM badges b
       LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
      WHERE b.is_active = 1
      ORDER BY b.order_index, b.id`,
    userId,
  ).map((b) => ({ ...b, earned: Boolean(b.awarded_at) }));
}

export function buildWorld(userId) {
  const state = readState(userId);
  const progress = levelProgress(state.xp);
  const levelOrder = progress.level ? progress.level.order_index : 1;
  const streak = streakStatus(userId, dayKey());
  const modules = moduleOverview(userId);
  const badges = badgeBoard(userId);

  const features = all('SELECT * FROM features WHERE is_enabled = 1 ORDER BY order_index').map((f) => ({
    ...f,
    usedToday: Boolean(get(
      'SELECT 1 ok FROM activity_log WHERE user_id = ? AND kind = ? AND ref = ? AND day = ?',
      userId, 'feature_used', f.code, dayKey(),
    )),
  }));

  const lessonsDone = get('SELECT COUNT(*) n FROM lesson_progress WHERE user_id = ? AND status = ?', userId, 'completed').n;
  const lessonsTotal = get('SELECT COUNT(*) n FROM lessons WHERE is_published = 1').n;

  return {
    today: dayKey(),
    // Màn chủ đổi hình hài theo concept (concept "lối học" bỏ hẳn mấy hòn đảo),
    // nên nó cần biết concept ngay từ payload này thay vì gọi thêm một vòng nữa.
    concept: activeConcept(),
    level: progress.level,
    nextLevel: progress.next,
    levels: levels().map((l) => ({ ...l, unlocked: l.order_index <= levelOrder })),
    progress: {
      xp: state.xp,
      percent: progress.percent,
      xpIntoLevel: progress.xpIntoLevel,
      xpForNextLevel: progress.xpForNextLevel,
      xpToNextLevel: progress.xpToNextLevel,
    },
    streak: { ...streak, maxFreezeDays: MAX_FREEZE_DAYS },
    features,
    modules,
    badges: {
      earned: badges.filter((b) => b.earned).length,
      total: badges.length,
      recent: badges.filter((b) => b.earned).slice(-3),
      all: badges,
    },
    learning: {
      lessonsDone,
      lessonsTotal,
      percent: lessonsTotal ? Math.round((lessonsDone / lessonsTotal) * 100) : 0,
      next: nextLesson(userId, levelOrder),
    },
  };
}
