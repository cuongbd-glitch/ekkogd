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

    // Chỉ cấp đang đứng. Năm cấp còn lại nằm sau "Xem tất cả" — trang này là bộ
    // sưu tập, không phải bảng xếp hạng cấp độ.
    el('div.section-title', {}, [
      levelsTitle(world),
      el('button.linkbtn', { onclick: () => openLevels(world) }, 'Xem tất cả'),
    ]),
    currentLevelCard(world),

    el('div.section-title', {}, ['Hoạt động gần đây']),
    activity.length
      ? el('div.card', { style: { paddingTop: '0' } }, activity.map(activityRow))
      : el('p.muted', {}, 'Chưa có hoạt động nào được ghi lại.'),
  ]);
}

/** Hòn đảo người học đang đứng, hiển thị thẳng trên trang. */
function currentLevelCard(world) {
  const level = world.levels.find((l) => l.id === world.level?.id) || world.levels[0];
  if (!level) return null;

  return el('div.card', {}, [
    el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } }, [
      levelArt(level, world.concept),
      el('div', { style: { flex: '1' } }, [
        el('div', { style: { fontSize: '15px', fontWeight: '600' } }, levelName(level)),
        el('div.muted', {}, level.perk || `${level.xp_required} XP`),
      ]),
      el('span.pill', {}, 'Đang ở đây'),
    ]),
  ]);
}

/**
 * Cả sáu cấp trong một bottom sheet — đây là chỗ duy nhất trong app xem được trọn
 * bộ nhân vật.
 */
function openLevels(world) {
  const pigOnly = world.concept === 'path';
  sheet({
    title: levelsTitle(world),
    body: [
      el('p.muted', { style: { marginTop: '0' } }, pigOnly
        ? 'Mỗi cấp độ là một chú heo riêng. Học bài và dùng ba chức năng để lên cấp.'
        : 'Mỗi cấp độ là một hòn đảo và một chú heo riêng. Học bài và dùng ba chức năng để lên cấp.'),
      ...world.levels.map((level) => el('div.levelrow', { dataset: { locked: String(!level.unlocked) } }, [
        levelArt(level, world.concept),
        el('div', { style: { flex: '1', minWidth: '0' } }, [
          el('div', { style: { fontSize: '15px', fontWeight: '600' } }, levelName(level)),
          el('div.muted', {}, level.unlocked ? (level.perk || `${level.xp_required} XP`) : `🔒 Cần ${level.xp_required} XP`),
        ]),
        level.id === world.level?.id ? el('span.pill', {}, 'Đang ở đây') : null,
      ])),
    ],
  });
}

const levelName = (level) => `${level.order_index}. ${level.emoji ? `${level.emoji} ` : ''}${level.name}`;

/** Tên của mục cấp độ: concept "lối học" không có hòn đảo nào để mà gọi tên. */
const levelsTitle = (world) => (world.concept === 'path' ? 'Sáu cấp độ' : 'Sáu hòn đảo');

/**
 * Đảo là ảnh chính, chú heo của cấp đó nép ở góc — trừ concept "lối học nút tròn":
 * concept đó bỏ hết hình đảo, nên cấp độ chỉ còn chính chú heo, phóng to lên cho
 * rõ mặt. Thiếu ảnh heo thì vẫn lùi về ảnh đảo, thà có hình còn hơn ô trống.
 */
function levelArt(level, concept) {
  const pigOnly = concept === 'path' && level.character_image;
  if (pigOnly) {
    return el('div.levelart.levelart--pig', {}, [
      el('img.levelart__isle', { src: level.character_image, alt: '', loading: 'lazy' }),
    ]);
  }
  return el('div.levelart', {}, [
    el('img.levelart__isle', { src: level.island_image, alt: '', loading: 'lazy' }),
    level.character_image
      ? el('img.levelart__pig', { src: level.character_image, alt: '', loading: 'lazy' })
      : null,
  ]);
}

const KIND_LABEL = {
  lesson_completed: ['📖', 'Hoàn thành bài học'],
  module_completed: ['🎓', 'Hoàn thành mô đun'],
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

