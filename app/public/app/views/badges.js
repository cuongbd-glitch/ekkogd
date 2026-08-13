/** Bộ sưu tập: badges, the six islands, and recent activity. */
import { api, el, formatDay } from '/shared/client.js';
import { sheet } from '../ui.js';

export default async function badgesView(ctx) {
  const [board, activity] = await Promise.all([
    api.get('/api/me/badges'),
    api.get('/api/me/activity?limit=20'),
  ]);
  const world = ctx.world;

  return el('div', {}, [
    el('div', { style: { fontSize: '17px', fontWeight: '600', marginBottom: '4px' } }, 'Bộ sưu tập của bạn'),
    el('p.muted', { style: { marginTop: '0' } }, `${board.earned}/${board.total} huy hiệu · cấp ${world.level?.order_index ?? 1}/6`),

    el('div.section-title', {}, ['Huy hiệu']),
    el('div.badge-grid', {}, board.all.map((badge) => el('button.badge-tile', {
      dataset: { earned: String(badge.earned) },
      onclick: () => sheet({
        title: badge.name,
        body: [
          el('div', { style: { textAlign: 'center', fontSize: '52px', lineHeight: '64px', filter: badge.earned ? 'none' : 'grayscale(1)', opacity: badge.earned ? '1' : '.45' } }, badge.icon || '🏅'),
          el('p', { style: { textAlign: 'center' } }, badge.description || ''),
          el('p.muted', { style: { textAlign: 'center' } }, badge.earned
            ? `Đã nhận ngày ${formatDay(badge.awarded_at?.slice(0, 10))}`
            : `Điều kiện: ${ruleText(badge)}`),
          badge.xp_reward ? el('p.muted', { style: { textAlign: 'center' } }, `Thưởng ${badge.xp_reward} XP`) : null,
        ],
      }),
    }, [
      el('div.badge-tile__icon', {}, badge.icon || '🏅'),
      el('div.badge-tile__name', {}, badge.name),
    ]))),

    el('div.section-title', {}, ['Sáu hòn đảo']),
    ...world.levels.map((level) => el('div.card', { style: { opacity: level.unlocked ? '1' : '.55' } }, [
      el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } }, [
        el('img', { src: level.island_image, alt: '', width: 64, height: 64, style: { objectFit: 'contain' }, loading: 'lazy' }),
        el('div', { style: { flex: '1' } }, [
          el('div', { style: { fontSize: '15px', fontWeight: '600' } },
            `${level.order_index}. ${level.emoji ? `${level.emoji} ` : ''}${level.name}`),
          el('div.muted', {}, level.unlocked ? (level.perk || `${level.xp_required} XP`) : `🔒 Cần ${level.xp_required} XP`),
        ]),
        level.id === world.level?.id ? el('span.pill', {}, 'Đang ở đây') : null,
      ]),
    ])),

    el('div.section-title', {}, ['Hoạt động gần đây']),
    activity.length
      ? el('div.card', { style: { paddingTop: '0' } }, activity.map(activityRow))
      : el('p.muted', {}, 'Chưa có hoạt động nào được ghi lại.'),
  ]);
}

const KIND_LABEL = {
  lesson_completed: ['📖', 'Hoàn thành bài học'],
  module_completed: ['🏝️', 'Hoàn thành mô đun'],
  feature_used: ['🧭', 'Dùng chức năng'],
  badge_awarded: ['🏅', 'Nhận huy hiệu'],
  level_up: ['⬆️', 'Lên cấp'],
};

const FEATURE_LABEL = {
  budget: 'Lập ngân sách',
  goals: 'Mục tiêu tài chính',
  expenses: 'Ghi chép chi tiêu',
  explore: 'Khám phá',
};

function activityRow(entry) {
  const [icon, label] = KIND_LABEL[entry.kind] || ['•', entry.kind];
  const detail = entry.meta?.title
    || entry.meta?.name
    || FEATURE_LABEL[entry.ref]
    || '';

  return el('div.row', {}, [
    el('span.row__icon', {}, icon),
    el('div.row__main', {}, [
      el('div.row__title', {}, detail || label),
      el('div.row__sub', {}, `${label} · ${formatDay(entry.day)}`),
    ]),
    entry.xp ? el('span.row__value', { style: { color: 'var(--text-brand-500)' } }, `+${entry.xp} XP`) : null,
  ]);
}

function ruleText(badge) {
  const map = {
    lessons_completed: `hoàn thành ${badge.rule_value} bài học`,
    modules_completed: `hoàn thành ${badge.rule_value} mô đun`,
    streak_days: `giữ chuỗi ${badge.rule_value} ngày`,
    feature_used: `dùng chức năng ${FEATURE_LABEL[badge.rule_target] || ''} ${badge.rule_value} lần`,
    expenses_logged: `ghi ${badge.rule_value} khoản chi tiêu`,
    goals_created: `tạo ${badge.rule_value} mục tiêu`,
    goals_completed: `hoàn thành ${badge.rule_value} mục tiêu`,
    budgets_created: `lập ${badge.rule_value} ngân sách`,
    level_reached: `đạt cấp độ ${badge.rule_value}`,
    xp_total: `tích luỹ ${badge.rule_value} XP`,
    bot_chats: `trò chuyện với Ekko bot ${badge.rule_value} lần`,
  };
  return map[badge.rule_type] || 'chưa xác định';
}

