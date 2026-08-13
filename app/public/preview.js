/**
 * Cổng vào preview: hai tab, mỗi tab nhúng một giao diện thật trong iframe.
 *
 * Cả hai dùng chung một phiên đăng nhập, nên tài khoản demo phải có quyền quản
 * trị: chỉ có một cookie phiên, không thể đồng thời là hai người khác nhau. Vì
 * vậy trang này đăng nhập bằng tài khoản quản trị, và app người dùng hiển thị
 * đúng tiến độ của tài khoản đó.
 */
import { api, el, mount } from '/shared/client.js';

const root = document.getElementById('preview');

const TABS = [
  { key: 'app', icon: '📱', label: 'App người dùng', src: '/app/' },
  { key: 'admin', icon: '🗂️', label: 'Admin portal', src: '/admin/' },
];

let active = 'app';
const frames = new Map();   // key -> panel node, built on first activation

async function boot() {
  let session = { authenticated: false };
  try {
    session = await api.get('/api/session/whoami');
  } catch { /* treated as signed out */ }

  if (!session.authenticated || session.role !== 'admin') {
    return renderSignIn(session);
  }

  const tabs = el('div.pv__tabs', { role: 'tablist' });
  const stage = el('div.pv__stage');

  const renderTabs = () => mount(tabs, TABS.map((tab) => el('button', {
    role: 'tab',
    'aria-selected': String(tab.key === active),
    onclick: () => {
      active = tab.key;
      renderTabs();
      show(stage, tab);
    },
  }, [el('em', {}, tab.icon), tab.label])));

  mount(root,
    el('div.pv__bar', {}, [
      el('div.pv__brand', {}, [
        el('img', { src: '/assets/logo/Ekko_Primary_Logo_PaydayBlue.svg', alt: 'Ekko' }),
        el('span', {}, 'Giáo dục tài chính'),
      ]),
      tabs,
      el('div.pv__right', {}, [
        el('span.pv__who', {}, ['Đang xem với ', el('b', {}, session.name)]),
        el('a.ekko-btn.ekko-btn--secondary.ekko-btn--sm', {
          href: '#',
          onclick: (event) => {
            event.preventDefault();
            window.open(TABS.find((t) => t.key === active).src, '_blank');
          },
        }, 'Mở tab mới ↗'),
      ]),
    ]),
    stage,
  );

  renderTabs();
  show(stage, TABS[0]);
}

/** Panels are created lazily and then kept, so switching back keeps the state. */
function show(stage, tab) {
  if (!frames.has(tab.key)) {
    const panel = el('div.pv__panel', {}, [
      el('iframe', { src: tab.src, title: tab.label, loading: 'lazy' }),
    ]);
    frames.set(tab.key, panel);
    stage.append(panel);
  }
  for (const [key, panel] of frames) {
    panel.classList.toggle('is-active', key === tab.key);
  }
}

function renderSignIn(session) {
  mount(root, el('div.pv__note', { style: { margin: 'auto' } }, [
    el('img', { src: '/assets/logo/Ekko_Primary_Logo_PaydayBlue.svg', alt: 'Ekko', style: { height: '30px', marginBottom: '20px' } }),
    el('h2', {}, 'Mở bản demo'),
    el('p', {}, session.authenticated
      ? `Bạn đang đăng nhập với vai trò ${session.role}. Trang preview cần một tài khoản có quyền quản trị để xem được cả hai giao diện trong cùng một phiên.`
      : 'Trang này nhúng cả app người dùng và Admin portal. Cả hai dùng chung một phiên nên cần đăng nhập bằng tài khoản quản trị.'),
    el('a.ekko-btn.ekko-btn--primary.ekko-btn--md', { href: '/dev/login?role=admin&redirect=/' }, 'Đăng nhập demo'),
  ]));
}

boot().catch((err) => {
  mount(root, el('div.pv__note', { style: { margin: 'auto' } }, [
    el('h2', {}, 'Không mở được trang preview'),
    el('p', {}, String(err.message || err)),
  ]));
});
