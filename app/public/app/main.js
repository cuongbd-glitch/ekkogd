/**
 * App shell: session bootstrap, world state store, hash router and HUD.
 *
 * There is no tab bar: the island map is the hub and every other screen is a
 * spoke reached from it, so the HUD carries a single back control instead.
 *
 * Views are plain functions `(ctx) => HTMLElement`. `ctx.refreshWorld()` pulls
 * the HUD numbers again after anything that can earn XP.
 */
import { api, ApiError, el, guard, mount, setApiLang, setLocale, setOverlayRoot, setScrollRoot, singleFlight, toast, vnd } from '/shared/client.js';
import { celebrateRewards, closeSheet } from './ui.js';
import { openBot } from './bot.js';
import { getLang, languageSwitch, onLangChange, t } from './i18n.js';

import worldView from './views/world.js';
import exploreView from './views/explore.js';
import budgetView from './views/budget.js';
import goalsView from './views/goals.js';
import expensesView from './views/expenses.js';
import badgesView from './views/badges.js';
import { openLesson } from './views/lesson.js';

const root = document.getElementById('app');
const screen = document.getElementById('screen');
const scroller = document.getElementById('scroll');

// The screen anchors every floating layer; the inner element does the scrolling.
setOverlayRoot(screen);
setScrollRoot(scroller);

// `data-device` on .device is the single switch for the chassis colour.
const chassis = document.querySelector('.device__chassis');
const variant = document.querySelector('.device')?.dataset.device || 'black';
if (chassis) chassis.src = `/assets/device/iphone-${variant}.png`;

// Số, ngày, và nội dung do server trả về cũng phải theo ngôn ngữ đang chọn.
setLocale(getLang());
setApiLang(getLang());

export const store = {
  user: null,
  world: null,
};

const ROUTES = {
  '': worldView,
  '/': worldView,
  '/explore': exploreView,
  '/budget': budgetView,
  '/goals': goalsView,
  '/expenses': expensesView,
  '/badges': badgesView,
};

// --- context handed to every view ---------------------------------------
const ctx = {
  get world() { return store.world; },
  get user() { return store.user; },
  navigate,
  openLesson: (lessonId) => openLesson(lessonId, ctx),
  openBot: () => openBot(ctx),
  async refreshWorld() {
    store.world = await api.get('/api/me/world');
    renderHud();
    return store.world;
  },
};

export function navigate(route) {
  const target = route.startsWith('#') ? route.slice(1) : route;
  if (location.hash.slice(1) === target) render();
  else location.hash = target;
}

// --- chrome --------------------------------------------------------------
let hudNode = null;
let bodyNode = null;
let currentPath = '/';

function streakPill(streak) {
  if (streak.status === 'frozen') {
    return el('span.pill.pill--frozen', {
      title: t('Còn {n} ngày trước khi mất chuỗi', { n: streak.freezeDaysLeft }),
    }, ['🧊', ` ${streak.count}`]);
  }
  return el('span.pill.pill--streak', {
    title: streak.countedToday ? t('Hôm nay đã được tính') : t('Hôm nay chưa được tính'),
  }, ['🔥', ` ${streak.count}`]);
}

function renderHud() {
  if (!hudNode || !store.world) return;
  const { level, progress, streak } = store.world;
  const atHome = currentPath === '/' || currentPath === '';

  mount(hudNode,
    // The island map is the hub, so every other screen needs one tap back to it.
    atHome ? null : el('button.hud__back', { onclick: () => navigate('/'), 'aria-label': t('Về trang chủ') }, '←'),
    el('button.hud__level', { onclick: () => navigate('/badges'), 'aria-label': t('Xem tiến độ và huy hiệu') }, [
      el('span.hud__avatar', {}, [el('img', { src: level?.character_image || '/assets/levels/pig-1.png', alt: '' })]),
      el('span.hud__meta', {}, [
        el('span.hud__name', {}, `${t('Cấp {n}', { n: level?.order_index ?? 1 })} · ${level?.name ?? ''}`),
        el('span.hud__xpbar', {}, [el('span.hud__xpfill', { style: { width: `${progress.percent}%` } })]),
        el('span.hud__xptext', {}, progress.xpForNextLevel
          ? `${progress.xpIntoLevel}/${progress.xpForNextLevel} XP`
          : t('{xp} XP · cấp tối đa', { xp: progress.xp })),
      ]),
    ]),
    streakPill(streak),
  );
}

// --- routing -------------------------------------------------------------
async function render() {
  closeSheet();
  const hash = location.hash.slice(1) || '/';
  const [path] = hash.split('?');
  const view = ROUTES[path] || ROUTES['/'];

  currentPath = path === '' ? '/' : path;
  renderHud();

  mount(bodyNode, el('div.screen__body', {}, [
    el('div.skeleton', { style: { height: '160px', marginBottom: '12px' } }),
    el('div.skeleton', { style: { height: '96px' } }),
  ]));

  try {
    const node = await view(ctx);
    // The world view brings its own edge-to-edge shell; everything else gets
    // the standard screen padding.
    mount(bodyNode, node.classList.contains('screen__body') ? node : el('div.screen__body', {}, [node]));
    scroller.scrollTo({ top: 0 });
  } catch (err) {
    mount(bodyNode, el('div.empty', {}, [
      el('img', { src: '/assets/mascot/bot-9.png', alt: '' }),
      el('h3', {}, t('Chưa tải được màn hình này')),
      el('p.muted', {}, err instanceof ApiError ? err.message : t('Kiểm tra kết nối rồi thử lại nhé.')),
      el('button.btn', { onclick: render, style: { marginTop: '12px' } }, t('Thử lại')),
    ]));
  }
}

// --- bootstrap -----------------------------------------------------------
async function boot() {
  try {
    const me = await api.get('/api/me');
    store.user = me.user;
    store.world = me.world;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return renderSignedOut();
    throw err;
  }

  hudNode = el('header.hud');
  bodyNode = el('main.screen');

  const fab = el('button.botfab', { onclick: () => openBot(ctx), 'aria-label': t('Mở Ekko bot') }, [
    el('img', { src: '/assets/mascot/ekko-bot.png', alt: '' }),
  ]);

  mount(root, hudNode, bodyNode);
  screen.append(buildQuickBar(), fab);
  // Nút đổi ngôn ngữ gắn vào <body>, tức là NGOÀI khung điện thoại.
  document.body.append(languageSwitch());
  startStatusClock();

  window.addEventListener('hashchange', render);
  onLangChange(relanguage);
  await render();

  // A returning member whose streak is frozen should hear about it once.
  const streak = store.world.streak;
  if (streak.status === 'frozen') {
    toast({
      title: t('Chuỗi {n} ngày đang đóng băng', { n: streak.count }),
      body: t('Còn {n} ngày để cứu chuỗi.', { n: streak.freezeDaysLeft }),
    }, 'info');
  }
}

/**
 * Đổi ngôn ngữ khi app đang chạy. Ba thứ phải dựng lại: định dạng số/ngày, phần
 * chrome viết một lần lúc khởi động (thanh ghi nhanh, nút bot), và màn hình
 * hiện tại. Nội dung bài học lấy lại từ server vì server dịch theo `lang`.
 */
async function relanguage() {
  setLocale(getLang());
  setApiLang(getLang());
  closeSheet();

  document.querySelector('.quickbar')?.remove();
  document.querySelector('.botfab')?.remove();
  const fab = el('button.botfab', { onclick: () => openBot(ctx), 'aria-label': t('Mở Ekko bot') }, [
    el('img', { src: '/assets/mascot/ekko-bot.png', alt: '' }),
  ]);
  screen.append(buildQuickBar(), fab);

  await ctx.refreshWorld();
  await render();
}

/**
 * Always-on quick expense entry. The member types the way they speak
 * ("cà phê 35k") and the server's Vietnamese parser turns it into a ledger
 * entry, so logging a coffee costs one line instead of a four-field form.
 */
function buildQuickBar() {
  const input = el('input', {
    type: 'text',
    enterkeyhint: 'done',
    autocomplete: 'off',
    placeholder: t('Ghi nhanh: cà phê 35k'),
    'aria-label': t('Ghi nhanh một khoản chi'),
  });
  const send = el('button.quickbar__send', { 'aria-label': t('Lưu khoản chi') }, '↑');
  const bar = el('div.quickbar', {}, [input, send]);

  const sync = () => bar.classList.toggle('is-ready', input.value.trim().length > 0);
  input.addEventListener('input', sync);

  /**
   * Hai lớp chống ghi trùng, vì một lần "ghi" của người dùng có thể phát ra hai
   * lần gọi (bấm hai lần, hoặc bộ gõ tiếng Việt gửi Enter hai lần):
   *
   * 1. `singleFlight` chặn lần gọi thứ hai khi lần đầu còn đang chạy.
   * 2. Ô nhập được dọn NGAY khi đã lấy được nội dung, nên lần gọi đến sau khi
   *    lần đầu xong cũng không còn gì để gửi. Gửi lỗi thì trả chữ lại cho người
   *    dùng, không để họ gõ lại.
   *
   * `.is-busy` chỉ làm mờ và khoá chuột, không khoá bàn phím, nên nó không thay
   * được hai lớp trên.
   */
  const submit = singleFlight(async () => {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    sync();
    bar.classList.add('is-busy');
    const result = await guard(() => api.post('/api/expenses/quick', { text }));
    bar.classList.remove('is-busy');
    if (!result) {
      input.value = text;   // guard already surfaced why
      sync();
      return;
    }

    const { expense, category, alerts } = result;
    // Khoản chi đã lưu; cảnh báo chỉ thay chỗ của lời xác nhận, không chặn việc ghi.
    if (alerts?.length) {
      toast({ title: alerts[0].title, body: alerts[0].text }, 'warning');
    } else {
      toast({
        title: t('Đã ghi {amount}', { amount: vnd(expense.amount) }),
        body: `${category?.icon || '📦'} ${category?.name || t('Khác')}`,
      }, 'success');
    }

    await ctx.refreshWorld();
    // Only pays out on the first entry of the day, so this stays rare.
    await celebrateRewards(result.rewards, { title: t('Đã ghi vào sổ') });
    if (currentPath === '/expenses' || currentPath === '/') render();
  });

  send.addEventListener('click', submit);
  input.addEventListener('keydown', (event) => {
    // isComposing: bộ gõ tiếng Việt dùng Enter để chốt chữ đang gõ dở, lần Enter
    // đó không phải là "gửi".
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    submit();
  });

  return bar;
}

/** Keeps the mockup's status-bar clock honest instead of freezing it at 9:41. */
function startStatusClock() {
  const node = document.getElementById('statusTime');
  if (!node) return;
  const tick = () => {
    node.textContent = new Intl.DateTimeFormat(getLang() === 'en' ? 'en-GB' : 'vi-VN', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date());
  };
  tick();
  setInterval(tick, 20000);
}

function renderSignedOut() {
  mount(root, el('div.empty', { style: { minHeight: '70vh', display: 'grid', alignContent: 'center' } }, [
    el('img', { src: '/assets/mascot/ekko-bot.png', alt: '' }),
    el('h3', {}, t('Hãy mở từ app Ekko')),
    el('p.muted', {}, t('Tính năng Giáo dục tài chính đăng nhập bằng tài khoản Ekko của bạn.')),
    el('a.btn', { href: '/dev/login', style: { marginTop: '16px' } }, t('Mở bản demo')),
  ]));
}

boot().catch((err) => {
  console.error(err);
  mount(root, el('div.empty', { style: { minHeight: '70vh', display: 'grid', alignContent: 'center' } }, [
    el('h3', {}, t('Không khởi động được')),
    el('p.muted', {}, String(err.message || err)),
  ]));
});
