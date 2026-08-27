/**
 * Khám phá · Concept 3 "Lối học nút tròn".
 *
 * Concept này bỏ hẳn hình đảo: mỗi chặng là **một nút tròn mang icon**, xếp thành
 * lối đi lượn từ trên xuống — cùng kiểu bản đồ mà mấy app học ngôn ngữ hay dùng.
 *
 * Mỗi mô-đun là một khối riêng, tên mô-đun **ghim ở đầu khối**: cuộn tới mô-đun
 * nào thì tên mô-đun đó dính lên đỉnh màn hình và có nền màu; các mô-đun còn lại
 * chỉ là một dòng chữ có gạch hai bên, không nền — nên người học luôn biết mình
 * đang ở phần nào mà bản đồ vẫn thoáng.
 *
 * Điểm khác quan trọng nhất so với hai concept kia: **các tính năng nằm ngay trên
 * lối đi**. Học xong phần lý thuyết của một mô-đun thì gặp luôn nút "Ghi chép chi
 * tiêu" hay "Lập ngân sách" — người học không phải nhớ quay về đảo chức năng mới
 * dùng được thứ vừa học.
 *
 * Chú heo vẫn giữ, đứng cạnh nút đang học.
 */
import { api, el, toast, spriteIcon } from '/shared/client.js';
import { openModuleQuiz } from './quiz.js';

/**
 * Lối đi lượn qua lại bằng cách dịch ngang từng nút theo một nhịp cố định. Mảng
 * này là số bước dịch (mỗi bước `--path-step`), lặp vòng theo thứ tự chặng nên
 * bản đồ luôn giống nhau chứ không ngẫu nhiên mỗi lần mở.
 */
const SWAY = [0, 1, 2, 1, 0, -1, -2, -1];

/**
 * Icon của một chặng **nói chặng đó là gì**, không nói nó đang ở trạng thái nào:
 * bài bắt tay làm, bài lật thẻ, bài kể chuyện, hay bài trắc nghiệm. Xong hay chưa
 * mở là việc của màu nút — vẽ dấu tích hay ổ khoá lên mặt nút thì cả lối đi chỉ
 * còn toàn tích với khoá, nhìn không ra mình sắp học cái gì.
 *
 * Trạng thái vẫn phải đọc được khi không nhìn thấy màu, nên nó nằm trong nhãn
 * `aria-label` của nút.
 */
export const ICON = {
  practice: 'pencil-edit-01',   // bài có khung tương tác: có việc phải làm
  deck: 'clipboard',            // bài có slide: một xấp thẻ lật qua
  story: 'message-01',          // bài kể chuyện bằng thẻ chữ và hình
  quiz: 'star',
  budget: 'wallet-01',
  goals: 'save-money-dollar',
  expenses: 'invoice-01',
  badges: 'checkmark-badge-01',
};

/** Câu mô tả trạng thái, ghép vào nhãn nút cho người dùng trình đọc màn hình. */
const STATE_NOTE = {
  done: 'đã học xong',
  current: 'đang học',
  open: 'mở, chưa học',
  locked: 'chưa mở khoá',
};

/** Tính năng chen vào lối đi, xoay vòng theo thứ tự mô-đun. */
const WOVEN = ['expenses', 'budget', 'goals'];

export default function explorePath(ctx, map) {
  return el('div.screen__body.screen__body--path', {}, [pathBoard(ctx, map)]);
}

/**
 * Bản đồ lối học, tách riêng vì ở concept này **màn chủ chính là bản đồ** — không
 * còn mấy hòn đảo chức năng nữa. Cả route Khám phá lẫn màn chủ đều dựng từ đây,
 * nên hai chỗ không thể lệch nhau.
 */
export function pathBoard(ctx, { entries }) {
  const features = new Map((ctx.world.features || []).map((f) => [f.code, f]));
  const sections = [];
  let step = 0;              // đếm chặng để lấy nhịp lượn
  let moduleIndex = 0;
  let openModule = null;     // mô-đun đang gom nút, để chèn tính năng khi hết
  let section = null;

  const push = (node) => {
    node.style.setProperty('--sway', String(SWAY[step % SWAY.length]));
    step += 1;
    section.append(node);
  };

  /** Hết một mô-đun thì mời người học dùng luôn tính năng hợp với mô-đun đó. */
  const closeModule = () => {
    if (!openModule) return;
    const feature = features.get(WOVEN[(moduleIndex - 1) % WOVEN.length]);
    if (feature && !openModule.locked) push(featureNode(feature, ctx));
    openModule = null;
  };

  for (const entry of entries) {
    if (entry.type === 'module') {
      closeModule();
      moduleIndex += 1;
      openModule = entry;
      section = el('section.pathsection', { dataset: { locked: String(entry.locked), active: 'false' } }, [
        unitHead(entry),
      ]);
      sections.push(section);
      continue;
    }
    if (!section) continue;   // bản đồ luôn mở đầu bằng một mô-đun
    push(entry.type === 'quiz' ? quizNode(entry, ctx) : lessonNode(entry, ctx));
  }
  closeModule();

  const board = el('div.pathboard', {}, sections);
  // Chờ tới khi bản đồ thật sự nằm trong trang mới cuộn: ở màn chủ, hàm này chạy
  // lúc dựng xong nhưng router chưa gắn vào DOM, đo lúc đó chỉ ra số 0.
  whenMounted(board, () => {
    scrollToCurrent(board);
    trackSections(board);
  });
  return board;
}

// --------------------------------------------------------------------- chặng

/** Câu nhắc khi bấm vào bài còn khoá — hai lý do khoá cần hai câu khác nhau. */
const lockedNote = (entry) => (entry.lockReason === 'level'
  ? 'Mô-đun này mở khoá ở cấp cao hơn.'
  : 'Học xong bài phía trên đã, rồi bài này mới mở.');

/**
 * Tên mô-đun ở đầu khối. Chỉ mỗi cái tên — số thứ tự mô-đun không giúp người học
 * biết mình đang học gì. Lời nhắc khoá chỉ hiện khi tên đang được ghim, vì ở dạng
 * dòng chữ mảnh thì thêm chữ là rối.
 */
const unitHead = (module) => el('div.pathsection__head', {}, [
  el('span.pathsection__title', {}, [module.emoji ? `${module.emoji} ` : '', module.title]),
  module.locked ? el('span.pathsection__lock', {}, `Mở khoá ở cấp ${module.unlock_level}`) : null,
]);

/**
 * Đánh dấu khối đang xem: khối cuối cùng có mép trên đã trôi qua chỗ ghim. Nghe
 * qua thì CSS làm được, nhưng không có selector nào cho "đang bị ghim", nên phải
 * tự tính theo vị trí cuộn.
 */
function trackSections(board) {
  const scroller = document.getElementById('scroll');
  const sections = [...board.querySelectorAll('.pathsection')];
  if (!scroller || !sections.length) return;

  const head = sections[0].querySelector('.pathsection__head');
  const stickyTop = parseFloat(getComputedStyle(head).top) || 0;
  let queued = false;

  const mark = () => {
    queued = false;
    // Bản đồ bị gỡ khỏi trang (đổi màn) thì tự tháo listener, không để rác lại.
    if (!board.isConnected) return scroller.removeEventListener('scroll', onScroll);

    const line = scroller.getBoundingClientRect().top + stickyTop + 1;
    let active = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= line) active = s;
    for (const s of sections) s.dataset.active = String(s === active);
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(mark);
  };

  scroller.addEventListener('scroll', onScroll, { passive: true });
  mark();
}

function lessonNode(entry, ctx) {
  const open = () => (entry.locked
    ? toast(lockedNote(entry), 'error')
    : ctx.openLesson(entry.id));

  return node({
    state: entry.locked ? 'locked' : entry.completed ? 'done' : entry.current ? 'current' : 'open',
    icon: ICON[entry.shape] || ICON.story,
    label: entry.title,
    bubble: entry.current ? entry.title : null,
    pig: entry.current,
    onclick: open,
  });
}

function quizNode(entry, ctx) {
  const open = async () => {
    if (entry.locked) return toast('Học hết bài trong mô đun này để mở phần trắc nghiệm.', 'error');
    const module = await api.get(`/api/learn/modules/${encodeURIComponent(entry.moduleSlug)}`);
    return openModuleQuiz(module, ctx);
  };

  return node({
    kind: 'quiz',
    state: entry.locked ? 'locked' : entry.completed ? 'done' : 'open',
    icon: ICON.quiz,
    label: `Trắc nghiệm · Mô-đun ${entry.moduleOrder}`,
    onclick: open,
  });
}

/**
 * Tính năng hiện đúng như một chặng bình thường — cùng cỡ nút, cùng nhịp lượn —
 * chỉ khác màu và có nhãn, vì một cái icon ví tiền đứng trơ thì không đoán ra.
 */
const featureNode = (feature, ctx) => node({
  kind: 'feature',
  state: feature.usedToday ? 'done' : 'open',
  icon: ICON[feature.code] || ICON.story,
  label: feature.name,
  caption: feature.name,
  onclick: () => ctx.navigate(feature.route.replace('/app/#', '')),
});

function node({ kind = 'lesson', state, icon, label, caption = null, bubble = null, pig = false, onclick }) {
  return el(`div.pathnode.pathnode--${kind}`, { dataset: { state } }, [
    bubble ? el('span.pathnode__bubble', {}, bubble) : null,
    el('div.pathnode__seat', {}, [
      el('button.pathnode__dot', {
        onclick,
        'aria-label': STATE_NOTE[state] ? `${label} — ${STATE_NOTE[state]}` : label,
      }, [spriteIcon(icon, 24)]),
      pig ? el('img.pathnode__pig', { src: '/assets/levels/pig-1.png', alt: 'Bạn đang ở đây' }) : null,
    ]),
    caption ? el('span.pathnode__caption', {}, caption) : null,
  ]);
}

function whenMounted(node, run) {
  const tick = () => (node.isConnected ? run() : requestAnimationFrame(tick));
  requestAnimationFrame(tick);
}

function scrollToCurrent(board) {
  const scroller = document.getElementById('scroll');
  if (!scroller) return;

  const target = board.querySelector('.pathnode[data-state="current"]')
    || board.querySelector('.pathnode[data-state="open"]');
  if (!target) return;

  const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  scroller.scrollTop += offset - scroller.clientHeight * 0.4;
}
