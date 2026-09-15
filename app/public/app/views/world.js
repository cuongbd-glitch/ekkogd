/**
 * Màn chủ. Hình hài của nó phụ thuộc concept đang bật:
 *
 * - concept "đảo trên trời" và "quần đảo so le": đảo của người chơi ở giữa, bốn
 *   đảo chức năng vây quanh, bên dưới là mấy thẻ chuỗi – tiền – tiến độ.
 * - concept "lối học nút tròn": **màn chủ chính là bản đồ học tập**. Không còn
 *   hòn đảo nào; các tính năng rút về một thanh icon dọc ở góc phải bên dưới.
 */
import { api, el, spriteIcon, vnd } from '/shared/client.js';
import { bar } from '../ui.js';
import { t } from '../i18n.js';
import { pathBoard, ICON } from './explore-path.js';

const POSITIONS = ['nw', 'ne', 'sw', 'se'];

function island({ image, label, badge, badgeTone, position, onclick, alt }) {
  return el(`div.isle.isle--${position}`, {}, [
    el('button', { onclick, 'aria-label': label }, [
      el('div.isle__frame', {}, [
        el('img.isle__art', { src: image, alt: alt || label, loading: 'lazy' }),
        badge ? el(`div.isle__badge${badgeTone ? `.isle__badge--${badgeTone}` : ''}`, {}, badge) : null,
      ]),
      el('span.isle__label', {}, label),
    ]),
  ]);
}

export default async function worldView(ctx) {
  const world = ctx.world;
  if (world.concept === 'path') return pathHome(ctx);

  const { level, progress, streak, features, learning, badges } = world;

  const featureByCode = Object.fromEntries(features.map((f) => [f.code, f]));
  const order = ['explore', 'budget', 'goals', 'expenses'];

  const stage = el('div.world__stage', {}, [
    // The centre island is the level the member is currently on. The pig
    // character is painted into each level's artwork, so nothing is overlaid.
    el('div.isle.isle--center', {}, [
      el('div.isle__frame', {}, [
        el('img.isle__art', {
          src: level?.island_image || '/assets/islands/level-1.png',
          alt: t('Đảo của bạn: {name}, cùng nhân vật chú heo', { name: level?.name || '' }),
          fetchpriority: 'high',
        }),
      ]),
    ]),

    ...order.map((code, index) => {
      const feature = featureByCode[code];
      if (!feature) return null;

      const config = {
        explore: {
          badge: learning.lessonsTotal - learning.lessonsDone > 0 ? String(learning.lessonsTotal - learning.lessonsDone) : '✓',
          badgeTone: learning.lessonsDone >= learning.lessonsTotal ? 'done' : null,
        },
        budget: { badge: feature.usedToday ? '✓' : null, badgeTone: 'done' },
        goals: { badge: feature.usedToday ? '✓' : null, badgeTone: 'done' },
        expenses: { badge: feature.usedToday ? '✓' : null, badgeTone: 'done' },
      }[code] || {};

      return island({
        image: feature.island_image,
        label: feature.name,
        alt: t('Đảo {name}', { name: feature.name }),
        position: POSITIONS[index],
        onclick: () => ctx.navigate(feature.route.replace('/app/#', '')),
        ...config,
      });
    }),
  ]);

  const nextUp = learning.next;
  const cta = nextUp
    ? el('button.cta', { onclick: () => ctx.openLesson(nextUp.id) }, [
      el('div', { style: { minWidth: '0', flex: '1' } }, [
        el('div.cta__label', {}, learning.lessonsDone ? t('Học tiếp') : t('Bắt đầu hành trình')),
        el('div.cta__title', {}, nextUp.title),
      ]),
      el('span.cta__go', {}, [spriteIcon('chevron-right-01-stroke', 20)]),
    ])
    : el('button.cta', { onclick: () => ctx.navigate('/badges') }, [
      el('div', { style: { minWidth: '0', flex: '1' } }, [
        el('div.cta__label', {}, t('Bạn đã học hết')),
        el('div.cta__title', {}, t('Xem bộ sưu tập huy hiệu')),
      ]),
      el('span.cta__go', {}, [spriteIcon('chevron-right-01-stroke', 20)]),
    ]);

  const streakCard = el('div.card', {}, [
    el('div.card__head', {}, [
      el('span', { style: { fontSize: '22px' } }, streak.status === 'frozen' ? '🧊' : '🔥'),
      el('h3', {}, streak.status === 'frozen'
        ? t('Chuỗi {n} ngày đang đóng băng', { n: streak.count })
        : t('Chuỗi {n} ngày', { n: streak.count })),
    ]),
    el('p.muted', {}, streakMessage(streak)),
    el('div', { style: { display: 'flex', gap: '6px', marginTop: '12px' } },
      Array.from({ length: streak.maxFreezeDays }, (_, i) => el('div', {
        style: {
          flex: '1', height: '6px', borderRadius: '999px',
          background: i < streak.frozenDays ? 'var(--bg-warning-500)' : 'var(--bg-grey-200)',
        },
      }))),
    el('div.muted', { style: { marginTop: '8px', fontSize: '12px' } },
      t('Kỷ lục của bạn: {best} ngày · Đóng băng tối đa {max} ngày', { best: streak.best, max: streak.maxFreezeDays })),
  ]);

  const progressCard = el('div.card', {}, [
    el('div.card__head', {}, [el('h3', {}, t('Tiến độ học'))]),
    el('div.stat-row', {}, [
      el('b', {}, t('{done}/{total} bài học', { done: learning.lessonsDone, total: learning.lessonsTotal })),
      el('small', {}, `${learning.percent}%`),
    ]),
    el('div', { style: { marginTop: '8px' } }, [bar(learning.percent, learning.percent === 100 ? 'good' : '')]),
    el('div.stat-row', { style: { marginTop: '14px' } }, [
      el('b', {}, t('{earned}/{total} huy hiệu', { earned: badges.earned, total: badges.total })),
      el('button.btn.btn--sm.btn--ghost', { onclick: () => ctx.navigate('/badges') }, t('Xem tất cả')),
    ]),
    world.nextLevel
      ? el('p.muted', { style: { marginTop: '12px' } },
        t('Còn {xp} XP nữa là mở khoá {name}.', { xp: progress.xpToNextLevel, name: world.nextLevel.name }))
      : el('p.muted', { style: { marginTop: '12px' } }, t('Bạn đang ở cấp cao nhất.')),
  ]);

  const today = await todaySnapshot();

  // Nút "Học tiếp" nằm giữa thẻ chuỗi và thẻ tiền: đọc xong tình hình hôm nay
  // thì gặp ngay việc nên làm tiếp, không phải cuộn tìm.
  return el('div.screen__body.screen__body--flush', {}, [
    el('div.world', {}, [stage]),
    el('div', { style: { padding: '0 var(--gutter)' } }, [
      streakCard,
      cta,
      today,
      progressCard,
    ]),
  ]);
}

/**
 * Màn chủ của concept "lối học nút tròn": bản đồ chiếm trọn màn hình, các tính
 * năng nằm trong thanh icon dọc ở góc phải bên dưới. Cấp độ, XP và chuỗi vẫn đọc
 * được ở HUD phía trên, nên bỏ mấy hòn đảo không mất thông tin nào.
 */
async function pathHome(ctx) {
  const map = await api.get('/api/learn/map');
  return el('div.screen__body.screen__body--path', {}, [
    pathBoard(ctx, map),
    featureRail(ctx),
  ]);
}

/**
 * Thanh icon dọc: mỗi tính năng một nút tròn **cùng cỡ nút Ekko bot** ở đáy, kèm
 * tên ngay bên dưới — một cái icon ví tiền đứng trơ thì không ai đoán ra nó mở
 * cái gì. Chấm xanh nghĩa là hôm nay đã dùng rồi.
 *
 * Nút giữ đúng bề ngang bằng vòng tròn, còn chữ được phép tràn ra hai bên: có vậy
 * cột nút mới thẳng hàng với nút Ekko bot ở đáy.
 */
const RAIL_LABEL = {
  budget: 'Ngân sách',
  goals: 'Mục tiêu',
  expenses: 'Ghi chép',
};

function featureRail(ctx) {
  const items = (ctx.world.features || []).filter((f) => f.code !== 'explore');
  return el('div.pathrail', {}, items.map((feature) => el('button.pathrail__btn', {
    onclick: () => ctx.navigate(feature.route.replace('/app/#', '')),
    'aria-label': feature.name,
    dataset: { used: String(Boolean(feature.usedToday)) },
  }, [
    el('span.pathrail__dot', {}, [spriteIcon(ICON[feature.code] || ICON.story, 24)]),
    // Tên rút gọn cho vừa một dòng; tên đầy đủ vẫn nằm ở aria-label cho trình đọc
    // màn hình. Tên nào không có trong bảng thì dùng nguyên tên trong Admin.
    el('span.pathrail__label', {}, RAIL_LABEL[feature.code] ? t(RAIL_LABEL[feature.code]) : feature.name),
  ])));
}

function streakMessage(streak) {
  if (streak.count === 0) return t('Hoàn thành một bài học, hoặc ghi một khoản chi, lưu ngân sách, hoặc đặt/nạp một mục tiêu hôm nay để bắt đầu chuỗi.');
  if (streak.status === 'frozen') {
    return t('Bạn đã nghỉ {off} ngày. Còn {left} ngày để quay lại trước khi mất chuỗi.',
      { off: streak.frozenDays, left: streak.freezeDaysLeft });
  }
  if (streak.countedToday) return t('Hôm nay đã được tính. Hẹn gặp lại bạn ngày mai.');
  return t('Hôm nay chưa được tính. Làm một việc bất kỳ để giữ chuỗi.');
}

/** A light summary of the month's money so the home screen is not all game. */
async function todaySnapshot() {
  const [expenses, budget] = await Promise.all([
    api.get('/api/expenses'),
    api.get('/api/budget'),
  ]);

  const spent = budget.totals.spent;
  const planned = budget.totals.planned;
  const percent = planned ? Math.round((spent / planned) * 100) : 0;
  const tone = percent > 100 ? 'over' : percent > 80 ? 'warn' : '';

  return el('div.card', {}, [
    el('div.card__head', {}, [el('h3', {}, t('Tiền của bạn tháng này'))]),
    el('div.stat-row', {}, [
      el('span.stat-big', {}, vnd(spent)),
      el('small', {}, planned ? t('trên {amount}', { amount: vnd(planned) }) : t('chưa lập ngân sách')),
    ]),
    planned ? el('div', { style: { marginTop: '10px' } }, [bar(percent, tone)]) : null,
    el('div.stat-row', { style: { marginTop: '12px' } }, [
      el('small', {}, t('Hôm nay: {amount}', { amount: vnd(expenses.totals.today) })),
      el('small', {}, t('{count} khoản đã ghi', { count: expenses.totals.count })),
    ]),
  ]);
}
