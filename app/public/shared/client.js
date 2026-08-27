/** Shared browser helpers for both the member app and the admin portal. */

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });

  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }

  if (!response.ok) {
    throw new ApiError(response.status, payload?.error || `Lỗi ${response.status}`);
  }
  return payload;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

// --- DOM ----------------------------------------------------------------
/**
 * el('div.card', { onclick }, ['text', childNode])
 * Tag syntax supports `.class` and `#id`.
 */
export function el(spec, props = {}, children = []) {
  const [tagAndId, ...classes] = String(spec).split('.');
  const [tag, id] = tagAndId.split('#');
  const node = document.createElement(tag || 'div');
  if (id) node.id = id;
  if (classes.length) node.className = classes.join(' ');

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = `${node.className} ${value}`.trim();
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? '' : value);
  }

  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); return node; };
export const mount = (node, ...children) => { clear(node).append(...children.flat().filter(Boolean)); return node; };

// --- formatting ---------------------------------------------------------
export const vnd = (amount) => `${Math.round(Number(amount) || 0).toLocaleString('vi-VN')}đ`;

/** 1.250.000đ -> "1,25 tr" for tight spaces like chart labels. */
export function vndShort(amount) {
  const n = Math.round(Number(amount) || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace('.', ',')} tr`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function formatDay(key) {
  if (!key) return '';
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

export function relativeDay(key, today) {
  if (key === today) return 'Hôm nay';
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${key}T00:00:00Z`)) / 86400000);
  if (diff === 1) return 'Hôm qua';
  if (diff > 1 && diff < 7) return `${diff} ngày trước`;
  return formatDay(key);
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/**
 * Deliberately tiny markdown: paragraphs, **bold**, `- ` bullets and `> ` quotes.
 * Everything is escaped first, so lesson content can never inject markup.
 */
export function renderText(source) {
  const blocks = String(source || '').split(/\n{2,}/);
  return blocks.map((block) => {
    const lines = block.split('\n').filter((l) => l.trim());
    if (!lines.length) return '';

    const inline = (text) => escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    if (lines.every((l) => l.trim().startsWith('- '))) {
      return `<ul>${lines.map((l) => `<li>${inline(l.trim().slice(2))}</li>`).join('')}</ul>`;
    }
    if (lines[0].trim().startsWith('> ')) {
      return `<blockquote>${lines.map((l) => inline(l.trim().replace(/^>\s?/, ''))).join('<br>')}</blockquote>`;
    }
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}

// --- overlay root --------------------------------------------------------
/**
 * Everything that floats (toasts, sheets, the lesson player, celebrations)
 * attaches here rather than to <body>. In the member app this is the iPhone
 * mockup's screen, so `position: fixed` resolves against the phone rather than
 * against the browser window.
 */
let overlayRoot = document.body;
/** The element that actually scrolls. Separate from the overlay root, because
 *  in the member app the overlay anchor deliberately does not scroll. */
let scrollRoot = document.scrollingElement || document.body;

export const setOverlayRoot = (node) => { overlayRoot = node || document.body; };
export const getOverlayRoot = () => overlayRoot;
export const setScrollRoot = (node) => { scrollRoot = node || document.body; };
export const getScrollRoot = () => scrollRoot;

export function lockScroll() { scrollRoot.style.overflow = 'hidden'; }
export function unlockScroll() { scrollRoot.style.overflow = ''; }

// --- feedback -----------------------------------------------------------
let toastHost = null;

/** Thời gian một toast nằm lại trên màn hình, chưa tính lúc trượt vào/ra. */
const TOAST_HOLD = 4000;
/** Khớp với thời lượng của hiệu ứng trượt lên trong `.toast.is-leaving`. */
const TOAST_EXIT = 280;

const TOAST_ICONS = {
  success: 'checkmark-circle-01-stroke',
  warning: 'alert-02-stroke',
  error: 'alert-circle-stroke',
  info: 'information-circle-stroke',
};

/**
 * Icon của Ekko Design System: sprite `icons-core.svg` + class `.ekko-icon` của
 * `ekko-icons.css`. Icon ăn màu theo `color` của phần tử cha (currentColor), nên
 * đặt màu ở chỗ dùng chứ không đặt ở đây.
 *
 * `size` phải là một trong các cỡ DS có sẵn: 16 · 20 · 24 · 32.
 */
export function spriteIcon(name, size = 20) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', `ekko-icon ekko-icon--${size}`);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', `/shared/icons-core.svg#${name}`);
  svg.append(use);
  return svg;
}

/**
 * Thông báo ngắn, dùng component `.ekko-toast` của Ekko Design System: thẻ trắng,
 * viền nhạt, ô icon 36px, tiêu đề và dòng phụ. Sắc thái nằm ở màu ô icon chứ
 * không tô cả thẻ — nền xanh/đỏ kín thẻ không có trong design system.
 *
 * `message` là một chuỗi (thành tiêu đề) hoặc `{ title, body }`.
 */
export function toast(message, tone = 'info') {
  if (!toastHost) {
    toastHost = el('div.toast-host', { role: 'status', 'aria-live': 'polite' });
    getOverlayRoot().append(toastHost);
  }

  const { title, body } = typeof message === 'string' ? { title: message } : (message || {});

  /**
   * Đóng sớm. Gọi nhiều lần cũng chỉ chạy một lần, và bấm đóng thì huỷ luôn hẹn
   * tự tắt — nếu không, hai lần trượt lên sẽ đè nhau.
   */
  let closing = false;
  let holdTimer = null;
  const dismiss = () => {
    if (closing) return;
    closing = true;
    clearTimeout(holdTimer);
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), TOAST_EXIT);
  };

  const node = el(`div.toast.toast--${tone}.ekko-toast`, {}, [
    el('span.ekko-toast__icon', {}, [spriteIcon(TOAST_ICONS[tone] || TOAST_ICONS.info)]),
    el('div.toast__text', {}, [
      el('p.ekko-toast__title', {}, title ?? ''),
      body ? el('p.ekko-toast__body', {}, body) : null,
    ]),
    el('button.toast__close', { type: 'button', onclick: dismiss, 'aria-label': 'Đóng thông báo' }, [
      spriteIcon('cancel-01-stroke', 16),
    ]),
  ]);

  holdTimer = setTimeout(dismiss, TOAST_HOLD);
  toastHost.append(node);
  // Trả lại cách đóng sớm: việc chạy nền xong trước 4 giây thì tắt luôn thông báo
  // "đang chạy…", không để nó nằm lại sau khi mọi thứ đã xong.
  return dismiss;
}

/**
 * Bọc một hành động async lại: trong lúc nó còn đang chạy thì mọi lần gọi thêm
 * đều bị bỏ qua.
 *
 * Cần cho mọi thao tác ghi dữ liệu. Một lần bấm của người dùng có thể sinh ra
 * hai lần gọi: bấm hai lần liên tiếp, bàn phím tiếng Việt gửi hai lần Enter khi
 * chốt bộ gõ, hay `click` chồng lên `keydown`. Không có chốt này thì một lần
 * "ghi" thành hai dòng trong sổ, hoặc một lần nạp thành hai lần trừ tiền.
 */
export function singleFlight(fn) {
  let running = false;
  return async (...args) => {
    if (running) return undefined;
    running = true;
    try {
      return await fn(...args);
    } finally {
      running = false;
    }
  };
}

/** Runs `fn`, showing a toast on failure instead of an unhandled rejection. */
export async function guard(fn, fallbackMessage = 'Không thực hiện được, thử lại nhé') {
  try {
    return await fn();
  } catch (err) {
    toast(err instanceof ApiError ? err.message : fallbackMessage, 'error');
    return null;
  }
}
