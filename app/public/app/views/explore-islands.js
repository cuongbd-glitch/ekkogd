/**
 * Khám phá · Concept 2 "Quần đảo".
 *
 * Bài học là các hòn đảo bay trong `assets/islands/trail/`, cắt từ file Đảo.svg
 * của Ekko. Các đảo xếp **so le trái – phải**, nhãn bài nằm ở nửa còn lại của
 * hàng, nên nhìn ra một lối mòn lượn qua lượn lại.
 *
 * Hành trình đi **từ dưới lên**: đảo của người chơi nằm dưới cùng, học tới đâu leo
 * lên tới đó. DOM vẫn giữ đúng thứ tự học, phần đảo chiều là việc của CSS
 * (`flex-direction: column-reverse` trên `.isltrack`) — nhờ vậy thứ tự đọc màn
 * hình và thứ tự tab vẫn khớp với thứ tự bài.
 *
 * Đường nối là **một nét đứt tròn** vẽ bằng SVG, đo theo vị trí thật của từng đảo
 * sau khi layout xong — cùng cách concept 1 vẽ lối mòn, dùng chung class `.trail`.
 * Điểm nối lấy ở **vành cỏ** của mỗi đảo (`GROUND`) chứ không lấy giữa hộp ảnh, vì
 * hộp của đảo có cây gần nửa trên là tán lá và trời.
 */
import { api, el, toast } from '/shared/client.js';
import { openModuleQuiz } from './quiz.js';

const ART = '/assets/islands/trail';

/** Sáu kiểu đảo, xoay vòng theo thứ tự chặng nên bản đồ không bị đơn điệu. */
const ISLANDS = ['island-1', 'island-2', 'island-3', 'island-4', 'island-5', 'island-6'];
const CLOUDS = ['cloud-1', 'cloud-2', 'cloud-3'];

/**
 * Tỉ lệ khung của từng hình, lấy từ chính viewBox lúc cắt file.
 *
 * Bắt buộc phải khai báo: đường nối được tính từ vị trí thật của đảo, mà nếu hộp
 * ảnh chưa biết chiều cao (SVG chưa tải xong) thì số đo sai và mối nối rơi lệch
 * hẳn khỏi đảo. Có `aspect-ratio` thì chiều cao đúng ngay từ khung hình đầu.
 */
const RATIO = {
  'island-1': 347 / 308,
  'island-2': 400 / 384,
  'island-3': 383 / 339,
  'island-4': 402 / 356,
  'island-5': 364 / 502,
  'island-6': 403 / 688,
  'island-home': 402 / 565,
  'island-small': 239 / 199,
};

/**
 * Vành cỏ của từng hình nằm ở đâu (tỉ lệ chiều cao hộp ảnh). Mỗi hình cắt ra một
 * khác: đảo trơn có mặt cỏ ở khoảng 0.36, còn đảo có cây thì nửa trên hộp là tán
 * lá nên vành cỏ tụt xuống quá nửa. Neo theo vành cỏ chứ theo giữa hộp thì mối
 * nối của mấy đảo có cây sẽ lơ lửng trên không.
 */
const GROUND = {
  'island-1': 0.38,
  'island-2': 0.40,
  'island-3': 0.35,
  'island-4': 0.37,
  'island-5': 0.56,
  'island-6': 0.55,
  'island-small': 0.35,
  'island-home': 0.59,
};

/** Nét đứt đi qua vành cỏ của đảo, nhích lên một chút cho khỏi cắt ngang mặt cỏ. */
const TRAIL_DY = -0.04;

export default function exploreIslands(ctx, { entries }) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'trail');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.append(path);

  const nodes = [];
  const stops = [];               // các mốc mà nét đứt đi qua, theo thứ tự học

  const home = homeIsland(ctx);
  stops.push(home);

  let position = 0;
  let side = 'left';
  let newModule = false;

  for (const entry of entries) {
    if (entry.type === 'module') {
      nodes.push(moduleTag(entry));
      newModule = true;
      continue;
    }

    position += 1;
    if (position > 1) side = side === 'left' ? 'right' : 'left';   // so le trái – phải

    const stop = stopBlock({
      entry,
      position,
      side,
      art: entry.type === 'quiz' ? 'island-small' : ISLANDS[(position - 1) % ISLANDS.length],
    }, ctx);
    if (newModule) stop.dataset.afterModule = 'true';
    nodes.push(stop);
    stops.push(stop);
    newModule = false;
  }

  // DOM theo thứ tự học, CSS lật ngược lại: đảo nhà xuống dưới cùng, bài học leo lên.
  const track = el('div.isltrack', {}, [home, ...nodes]);
  const board = el('div.islboard', {}, [
    svg,
    el('div.skyhead', {}, [el('span.skyhead__pill', {}, 'Khám phá · Quần đảo')]),
    ...CLOUDS.map((cloud, i) => el(`img.islcloud.islcloud--${i + 1}`, { src: `${ART}/${cloud}.svg`, alt: '', loading: 'lazy' })),
    track,
  ]);

  // Đo một lần rồi thôi là chắc chắn lệch: chiều cao bố cục còn đổi khi ảnh tải
  // xong, khi font về, khi máy quay ngang. Nên vẽ lại mỗi lần bản đồ đổi chiều cao.
  const draw = () => drawTrail(board, svg, path, stops);
  requestAnimationFrame(() => {
    draw();
    scrollToCurrent(board);
  });
  new ResizeObserver(draw).observe(board);
  window.addEventListener('resize', draw, { passive: true });

  return el('div.screen__body.screen__body--islands', {}, [board]);
}

/**
 * Vẽ nét đứt đi qua các đảo theo đúng thứ tự học. Mỗi đoạn là một đường cong
 * Bézier có hai điểm điều khiển nằm ở giữa chiều dọc, nên nét đứt lượn mềm khi
 * chuyển cột chứ không gấp khúc.
 */
function drawTrail(board, svg, path, stops) {
  const box = board.getBoundingClientRect();
  if (!box.height || stops.length < 2) return;

  const points = stops.map((stop) => {
    const art = stop.querySelector('.islstop__art, .islhome__art');
    const r = art.getBoundingClientRect();
    const ground = GROUND[stop.dataset.art] ?? 0.38;
    return {
      x: r.left - box.left + r.width / 2,
      y: r.top - box.top + r.height * (ground + TRAIL_DY),
    };
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

/** Đảo của người chơi mở đầu hành trình, nên nằm ở chân trang: đọc từ dưới lên. */
function homeIsland(ctx) {
  const node = el('div.islhome', { dataset: { art: 'island-home' } }, [
    islandImage('island-home', 'islhome__art'),
    el('span.islhome__label', {}, ctx.world.level?.name || 'Đảo của bạn'),
  ]);
  node.style.setProperty('--ground', String(GROUND['island-home']));
  return node;
}

const moduleTag = (module) => el('div.islmodule', { dataset: { locked: String(module.locked) } }, [
  el('div.islmodule__row', {}, [
    el('span.islmodule__tag', {}, `MÔ-ĐUN ${module.order_index}`),
    el('span.islmodule__title', {}, [module.emoji ? `${module.emoji} ` : '', module.title]),
  ]),
  module.locked ? el('div.islmodule__locked', {}, `🔒 Mở khoá ở cấp ${module.unlock_level}`) : null,
]);

function stopBlock({ entry, position, side, art }, ctx) {
  const quiz = entry.type === 'quiz';

  const open = async () => {
    if (entry.locked) {
      return toast(quiz
        ? 'Học hết bài trong mô đun này để mở phần trắc nghiệm.'
        : 'Bài học này chưa mở khoá.', 'error');
    }
    if (!quiz) return ctx.openLesson(entry.id);
    const module = await api.get(`/api/learn/modules/${encodeURIComponent(entry.moduleSlug)}`);
    return openModuleQuiz(module, ctx);
  };

  const node = el(`div.islstop.islstop--${side}`, { dataset: { state: state(entry), art, link: 'none' } }, [
    el('div.islstop__art', {}, [
      el('button', { onclick: open, 'aria-label': quiz ? `Trắc nghiệm mô-đun ${entry.moduleOrder}` : entry.title }, [
        islandImage(art),
      ]),
      el('span.islstop__num', {}, entry.locked ? '🔒' : entry.completed ? '✓' : quiz ? '?' : String(position)),
      entry.current ? el('img.islstop__pig', { src: '/assets/levels/pig-1.png', alt: 'Bạn đang ở đây' }) : null,
    ]),

    el('div.islstop__meta', {}, [
      el('button.islstop__title', { onclick: open }, quiz ? `Trắc nghiệm · Mô-đun ${entry.moduleOrder}` : entry.title),
      el('span.islstop__sub', {}, quiz
        ? (entry.result ? `${entry.result.correct}/${entry.result.total} đúng` : `${entry.total} câu`)
        : `${entry.est_minutes} phút`),
    ]),
  ]);

  // CSS đặt số chặng và chú heo theo vành cỏ của chính hình này, và gióng cả hòn
  // đảo vào đường chuẩn để các vành cỏ thẳng hàng nhau.
  node.style.setProperty('--ground', String(GROUND[art] ?? 0.38));
  node.style.setProperty('--align', alignOffset(art));
  return node;
}

/** Bề ngang ảnh đảo so với khung — phải khớp cột đảo trong `.islstop--left/right`. */
const ART_WIDTH = 0.46;

/**
 * Vành cỏ nằm cách đỉnh chặng bao nhiêu, tính theo **bề ngang khung**: hộp ảnh cao
 * `ART_WIDTH / RATIO` lần bề ngang khung, và vành cỏ ở `GROUND` của chiều cao đó.
 */
const groundDepth = (art) => (ART_WIDTH * (GROUND[art] ?? 0.38)) / (RATIO[art] ?? 1);

/** Đường chuẩn của hàng: lấy theo đảo trơn, các đảo khác gióng vào đây. */
const BASELINE = groundDepth('island-1');

/**
 * Độ dịch dọc của một chặng (đơn vị %), kéo đảo lên hay xuống sao cho vành cỏ của
 * nó trùng đường chuẩn. Không có nó thì đảo có cây để lại một mảng trời rỗng to
 * tướng phía trên, làm nhịp giữa các chặng lúc sát lúc thưa.
 *
 * Đơn vị % là theo bề ngang khung, đúng mốc mà lề phần trăm của chặng dùng. Đảo
 * có cây (`island-6`) lệch tới -28%: gần nửa trên hộp của nó là tán lá và trời.
 */
const alignOffset = (art) => `${((BASELINE - groundDepth(art)) * 100).toFixed(2)}%`;

/** Ảnh đảo luôn kèm tỉ lệ khung, nên chiều cao hộp đúng trước cả khi SVG tải. */
const islandImage = (name, className = '') => el(`img${className ? `.${className}` : ''}`, {
  src: `${ART}/${name}.svg`,
  alt: '',
  style: { aspectRatio: String(RATIO[name] ?? 1) },
});

const state = (entry) => (entry.locked ? 'locked' : entry.completed ? 'done' : entry.current ? 'current' : 'open');

function scrollToCurrent(board) {
  const scroller = document.getElementById('scroll');
  if (!scroller) return;

  const target = board.querySelector('.islstop[data-state="current"]')
    || board.querySelector('.islstop[data-state="open"]');
  if (!target) {
    scroller.scrollTop = scroller.scrollHeight;   // học hết rồi thì cho nhìn lên đỉnh
    return;
  }

  const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  scroller.scrollTop += offset - scroller.clientHeight * 0.45;
}
