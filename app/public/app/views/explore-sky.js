/**
 * Khám phá · Concept 1 "Đảo trên trời".
 *
 * A vertical serpentine map: the journey starts at the player's home island at
 * the very bottom and climbs. Lessons and end-of-module tests are stops on the
 * path; module markers sit beside it as signposts.
 *
 * Reading order is bottom-to-top, so the list renders with
 * `flex-direction: column-reverse` and the DOM stays in learning order.
 *
 * The dashed path is drawn as one SVG measured from the real node positions
 * after layout, rather than a decorative background that only roughly lines up.
 */
import { api, el, toast } from '/shared/client.js';
import { t } from '../i18n.js';
import { openModuleQuiz } from './quiz.js';

const ART = {
  lesson: '/assets/islands/lesson.png',
  quiz: '/assets/islands/feature-goals.png',
  module: '/assets/islands/module.png',
};

export default function exploreSky(ctx, { entries }) {
  const level = ctx.world.level;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'trail');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.append(path);

  const trailNodes = [];   // only lessons and quizzes sit on the path
  const rows = [];

  entries.forEach((entry) => {
    if (entry.type === 'module') {
      rows.push(moduleMarker(entry));
      return;
    }
    const side = trailNodes.length % 2 === 0 ? 'right' : 'left';
    const row = entry.type === 'quiz'
      ? quizNode(entry, side, ctx)
      : lessonNode(entry, side, ctx, trailNodes.length + 1);
    trailNodes.push(row.querySelector('.mapnode__art'));
    rows.push(row);
  });

  const home = el('div.maphome', {}, [
    el('img', { src: level?.island_image || '/assets/islands/level-1.png', alt: t('Đảo của bạn'), fetchpriority: 'high' }),
  ]);

  const track = el('div.maptrack', {}, [home, ...rows]);
  const board = el('div.mapboard', {}, [
    svg,
    el('div.skyhead', {}, [el('span.skyhead__pill', {}, t('Khám phá · Bản đồ học tập'))]),
    track,
  ]);

  const screen = el('div.screen__body.screen__body--flush.screen__body--map', {}, [board]);

  // Layout has to exist before the path can be measured, and the scroller has to
  // exist before we can jump to the current stop.
  requestAnimationFrame(() => {
    drawTrail(board, svg, path, trailNodes);
    scrollToCurrent(board);
    window.addEventListener('resize', () => drawTrail(board, svg, path, trailNodes), { passive: true });
  });

  return screen;
}

// ------------------------------------------------------------------- markers
function moduleMarker(entry) {
  return el('div.mapmodule', {}, [
    el('div.mapmodule__art', {}, [
      el('img', { src: ART.module, alt: '', loading: 'lazy' }),
      el('span.mapmodule__tag', {}, `MÔ-ĐUN ${entry.order_index}`),
    ]),
    el('div.mapmodule__label', {}, [
      el('span.mapmodule__emoji', {}, entry.emoji || '📚'),
      el('span.mapmodule__title', {}, entry.title),
    ]),
    entry.summary ? el('div.mapmodule__summary', {}, entry.summary) : null,
    entry.locked ? el('div.mapmodule__locked', {}, `🔒 ${t('Mở khoá ở cấp {n}', { n: entry.unlock_level })}`) : null,
  ]);
}

/** Câu nhắc khi bấm vào bài còn khoá — hai lý do khoá cần hai câu khác nhau. */
const lockedNote = (entry) => (entry.lockReason === 'level'
  ? t('Mô-đun này mở khoá ở cấp cao hơn.')
  : t('Học xong bài phía trên đã, rồi bài này mới mở.'));

function lessonNode(entry, side, ctx, position) {
  const open = () => {
    if (entry.locked) return toast(lockedNote(entry), 'error');
    return ctx.openLesson(entry.id);
  };

  return el(`div.mapnode.mapnode--${side}`, { dataset: { state: nodeState(entry) } }, [
    el('div.mapnode__art', {}, [
      el('button', { onclick: open, 'aria-label': entry.title }, [
        el('img', { src: ART.lesson, alt: '', loading: 'lazy' }),
      ]),
      el('span.mapnode__num', {}, entry.completed ? '✓' : String(position)),
      entry.current ? el('img.mapnode__pig', { src: '/assets/levels/pig-1.png', alt: t('Bạn đang ở đây') }) : null,
    ]),
    el('div.mapnode__info', {}, [
      stateChip(entry, open),
      el('button.mapnode__title', { onclick: open }, entry.title),
      el('span.mapnode__meta', {}, `🕐 ${entry.est_minutes} phút`),
    ]),
  ]);
}

function quizNode(entry, side, ctx) {
  const open = async () => {
    if (entry.locked) return toast(t('Học hết bài trong mô đun này để mở phần trắc nghiệm.'), 'error');
    const module = await api.get(`/api/learn/modules/${encodeURIComponent(entry.moduleSlug)}`);
    return openModuleQuiz(module, ctx);
  };

  return el(`div.mapnode.mapnode--${side}.mapnode--quiz`, { dataset: { state: nodeState(entry) } }, [
    el('div.mapnode__art', {}, [
      el('button', { onclick: open, 'aria-label': t('Trắc nghiệm · Mô-đun {n}', { n: entry.moduleOrder }) }, [
        el('img', { src: ART.quiz, alt: '', loading: 'lazy' }),
      ]),
      el('span.mapnode__num', {}, entry.completed ? '✓' : '?'),
    ]),
    el('div.mapnode__info', {}, [
      stateChip(entry, open),
      el('button.mapnode__title', { onclick: open }, t('Trắc nghiệm kiến thức · Mô-đun {n}', { n: entry.moduleOrder })),
      el('span.mapnode__meta', {}, entry.result
        ? `🕐 ${entry.result.correct}/${entry.result.total} đúng`
        : `🕐 ${entry.total} câu`),
    ]),
  ]);
}

const nodeState = (entry) => (entry.locked ? 'locked' : entry.completed ? 'done' : entry.current ? 'current' : 'open');

const stateChip = (entry, open) => el('button.mapnode__chip', {
  onclick: open,
  'aria-label': entry.locked ? t('Chưa mở khoá') : t('Bắt đầu'),
}, entry.locked ? '🔒' : entry.completed ? '✓' : '▶');

// ------------------------------------------------------------------- drawing
/**
 * One smooth dashed path through every stop. Cubic segments with vertical
 * control points give the S-curve that a straight polyline cannot.
 */
function drawTrail(board, svg, path, arts) {
  const box = board.getBoundingClientRect();
  if (!box.height || arts.length < 2) return;

  const points = arts.map((art) => {
    const r = art.getBoundingClientRect();
    return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
  });

  svg.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`);
  svg.setAttribute('width', Math.round(box.width));
  svg.setAttribute('height', Math.round(box.height));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const mid = (a.y + b.y) / 2;
    d += ` C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`;
  }
  path.setAttribute('d', d);
}

/** Open the map where the member left off, not at the far end of the journey. */
function scrollToCurrent(board) {
  const scroller = document.getElementById('scroll');
  if (!scroller) return;

  const target = board.querySelector('.mapnode[data-state="current"]')
    || board.querySelector('.mapnode[data-state="open"]');
  if (!target) {
    scroller.scrollTop = scroller.scrollHeight;   // everything done: show the top
    return;
  }

  const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  scroller.scrollTop += offset - scroller.clientHeight * 0.45;
}

