/**
 * The main screen: the player's island in the middle with the pig character,
 * four satellite islands around it, and the HUD numbers above.
 */
import { api, el, spriteIcon, vnd } from '/shared/client.js';
import { bar } from '../ui.js';

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
          alt: `Đảo của bạn: ${level?.name || ''}, cùng nhân vật chú heo`,
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
        alt: `Đảo ${feature.name}`,
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
        el('div.cta__label', {}, learning.lessonsDone ? 'Học tiếp' : 'Bắt đầu hành trình'),
        el('div.cta__title', {}, nextUp.title),
      ]),
      el('span.cta__go', {}, [spriteIcon('chevron-right-01-stroke', 20)]),
    ])
    : el('button.cta', { onclick: () => ctx.navigate('/badges') }, [
      el('div', { style: { minWidth: '0', flex: '1' } }, [
        el('div.cta__label', {}, 'Bạn đã học hết'),
        el('div.cta__title', {}, 'Xem bộ sưu tập huy hiệu'),
      ]),
      el('span.cta__go', {}, [spriteIcon('chevron-right-01-stroke', 20)]),
    ]);

  const streakCard = el('div.card', {}, [
    el('div.card__head', {}, [
      el('span', { style: { fontSize: '22px' } }, streak.status === 'frozen' ? '🧊' : '🔥'),
      el('h3', {}, streak.status === 'frozen' ? `Chuỗi ${streak.count} ngày đang đóng băng` : `Chuỗi ${streak.count} ngày`),
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
      `Kỷ lục của bạn: ${streak.best} ngày · Đóng băng tối đa ${streak.maxFreezeDays} ngày`),
  ]);

  const progressCard = el('div.card', {}, [
    el('div.card__head', {}, [el('h3', {}, 'Tiến độ học')]),
    el('div.stat-row', {}, [
      el('b', {}, `${learning.lessonsDone}/${learning.lessonsTotal} bài học`),
      el('small', {}, `${learning.percent}%`),
    ]),
    el('div', { style: { marginTop: '8px' } }, [bar(learning.percent, learning.percent === 100 ? 'good' : '')]),
    el('div.stat-row', { style: { marginTop: '14px' } }, [
      el('b', {}, `${badges.earned}/${badges.total} huy hiệu`),
      el('button.btn.btn--sm.btn--ghost', { onclick: () => ctx.navigate('/badges') }, 'Xem tất cả'),
    ]),
    world.nextLevel
      ? el('p.muted', { style: { marginTop: '12px' } },
        `Còn ${progress.xpToNextLevel} XP nữa là mở khoá ${world.nextLevel.name}.`)
      : el('p.muted', { style: { marginTop: '12px' } }, 'Bạn đang ở cấp cao nhất.'),
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

function streakMessage(streak) {
  if (streak.count === 0) return 'Hoàn thành một bài học hoặc mở một chức năng hôm nay để bắt đầu chuỗi.';
  if (streak.status === 'frozen') {
    return `Bạn đã nghỉ ${streak.frozenDays} ngày. Còn ${streak.freezeDaysLeft} ngày để quay lại trước khi mất chuỗi.`;
  }
  if (streak.countedToday) return 'Hôm nay đã được tính. Hẹn gặp lại bạn ngày mai.';
  return 'Hôm nay chưa được tính. Làm một việc bất kỳ để giữ chuỗi.';
}

/** A light summary of the month's money so the home screen is not all game. */
async function todaySnapshot() {
  // `peek=1`: reading the summary here must not count as visiting the islands.
  const [expenses, budget] = await Promise.all([
    api.get('/api/expenses?peek=1'),
    api.get('/api/budget?peek=1'),
  ]);

  const spent = budget.totals.spent;
  const planned = budget.totals.planned;
  const percent = planned ? Math.round((spent / planned) * 100) : 0;
  const tone = percent > 100 ? 'over' : percent > 80 ? 'warn' : '';

  return el('div.card', {}, [
    el('div.card__head', {}, [el('h3', {}, 'Tiền của bạn tháng này')]),
    el('div.stat-row', {}, [
      el('span.stat-big', {}, vnd(spent)),
      el('small', {}, planned ? `trên ${vnd(planned)}` : 'chưa lập ngân sách'),
    ]),
    planned ? el('div', { style: { marginTop: '10px' } }, [bar(percent, tone)]) : null,
    el('div.stat-row', { style: { marginTop: '12px' } }, [
      el('small', {}, `Hôm nay: ${vnd(expenses.totals.today)}`),
      el('small', {}, `${expenses.totals.count} khoản đã ghi`),
    ]),
  ]);
}
