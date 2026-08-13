/**
 * Admin portal shell and router.
 *
 * Pages live in ./pages/*.js and export `render(ctx)`. `ctx` carries the API,
 * the metadata options (asset lists, badge rules, frame kinds) and a `reload()`
 * that re-renders the current page after a mutation.
 */
import { api, ApiError, el, mount } from '/shared/client.js';
import { closeDrawer, notify } from './ui.js';

import dashboard from './pages/dashboard.js';
import levels from './pages/levels.js';
import badges from './pages/badges.js';
import content from './pages/content.js';
import lesson from './pages/lesson.js';
import features from './pages/features.js';
import categories from './pages/categories.js';
import members from './pages/members.js';

const root = document.getElementById('admin');

/**
 * Mounts into #admin and drops the boot placeholder's padding. Leaving that
 * class on pushed the whole shell down 48px, so the 100dvh sidebar hung below
 * the fold and clipped its own footer.
 */
function mountRoot(...children) {
  root.classList.remove('admin-boot');
  mount(root, ...children);
}

const PAGES = {
  '/': dashboard,
  '/levels': levels,
  '/badges': badges,
  '/content': content,
  '/lesson': lesson,
  '/features': features,
  '/categories': categories,
  '/members': members,
};

const NAV = [
  { group: 'Tổng quan' },
  { route: '/', icon: '📊', label: 'Bảng điều khiển' },
  { route: '/members', icon: '👥', label: 'Người học' },
  { group: 'Trò chơi hoá' },
  { route: '/levels', icon: '🏝️', label: 'Cấp độ heo' },
  { route: '/badges', icon: '🏅', label: 'Huy hiệu' },
  { group: 'Nội dung' },
  { route: '/content', icon: '📚', label: 'Mô đun & bài học' },
  { group: 'Chức năng' },
  { route: '/features', icon: '🧭', label: 'Đảo chức năng' },
];

let meta = null;
let sidebar = null;
let sideNav = null;   // just the link list; the brand and footer live outside it
let mainNode = null;

const ctx = {
  api,
  get meta() { return meta; },
  navigate(route) {
    if (location.hash.slice(1) === route) render();
    else location.hash = route;
  },
  async reload() {
    meta = await api.get('/api/admin/meta/options');
    await render();
  },
  notify,
  uploader: (body) => api.post('/api/admin/upload', body),
};

function renderNav(active) {
  mount(sideNav, NAV.map((item) => (item.group
    ? el('div.sidebar__group', {}, item.group)
    : el('button.navlink', {
      onclick: () => ctx.navigate(item.route),
      'aria-current': active === item.route ? 'page' : null,
    }, [el('span', {}, item.icon), item.label]))));
}

async function render() {
  closeDrawer();
  const hash = location.hash.slice(1) || '/';
  const [path] = hash.split('?');
  const page = PAGES[path] || PAGES['/'];

  renderNav(path);
  mount(mainNode, el('div.empty-state', {}, 'Đang tải…'));

  try {
    mount(mainNode, await page(ctx));
    window.scrollTo({ top: 0 });
  } catch (err) {
    mount(mainNode, el('div.panel', {}, [
      el('h2', {}, 'Không tải được trang'),
      el('p.hint', {}, err instanceof ApiError ? err.message : String(err)),
    ]));
  }
}

async function boot() {
  let session;
  try {
    session = await api.get('/api/session/whoami');
  } catch {
    session = { authenticated: false };
  }

  if (!session.authenticated || session.role !== 'admin') {
    mountRoot(el('div', { style: { display: 'grid', placeContent: 'center', minHeight: '100dvh', gap: '16px', textAlign: 'center' } }, [
      el('img', { src: '/assets/logo/Ekko_Primary_Logo_PaydayBlue.svg', alt: 'Ekko', style: { height: '32px' } }),
      el('h1', { style: { margin: '0', fontSize: '20px' } }, 'Cần quyền quản trị viên'),
      el('p.hint', {}, session.authenticated
        ? `Bạn đang đăng nhập với vai trò ${session.role}. Admin portal chỉ dành cho quản trị viên.`
        : 'Đăng nhập bằng tài khoản quản trị của Ekko để tiếp tục.'),
      el('a.ekko-btn.ekko-btn--primary.ekko-btn--md', { href: '/dev/login?role=admin' }, 'Đăng nhập demo (quản trị)'),
    ]));
    return;
  }

  meta = await api.get('/api/admin/meta/options');

  sideNav = el('div', { style: { display: 'contents' } });
  mainNode = el('main.main');
  sidebar = el('nav.sidebar', { 'aria-label': 'Điều hướng quản trị' }, [
    el('div.sidebar__brand', {}, [
      el('img', { src: '/assets/logo/Ekko_Primary_Logo_PaydayBlue.svg', alt: 'Ekko' }),
      el('span', {}, 'Giáo dục tài chính'),
    ]),
    sideNav,
    el('div.sidebar__foot', {}, [
      el('div', {}, session.name),
      el('a', { href: '/app/', style: { fontSize: '12px' } }, 'Mở app người học →'),
    ]),
  ]);

  mountRoot(el('div.shell', {}, [sidebar, mainNode]));

  window.addEventListener('hashchange', render);
  await render();
}

boot().catch((err) => {
  console.error(err);
  mountRoot(el('div.panel', { style: { margin: '48px' } }, [
    el('h2', {}, 'Không khởi động được Admin portal'),
    el('p.hint', {}, String(err.message || err)),
  ]));
});
