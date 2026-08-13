/**
 * SSO entry point and "who am I" endpoints.
 *
 * Integration contract for the Ekko app:
 *   1. Mint a JWT (HS256) with the shared secret EKKO_SSO_SECRET:
 *        { sub, name, email?, avatar?, employer?, role?, exp }   exp <= 5 minutes
 *   2. Open a webview at  https://<gdtc-host>/sso?token=<jwt>&redirect=/app/
 *   3. This service verifies it, upserts the member and sets its own session
 *      cookie, then 302s to `redirect`.
 */
import { acceptSsoToken, currentUser, issueSession, mintDevSsoToken } from '../auth.js';
import { config } from '../config.js';
import { all } from '../db.js';
import { bad, Router, sendJson } from '../lib/http.js';
import { clearCookie } from '../lib/http.js';
import { seedDemoData } from '../seed/index.js';
import { evaluateBadges } from '../services/progression.js';
import { buildWorld } from '../services/world.js';

export const sessionRouter = new Router();

/** Only same-origin paths are accepted, so the token cannot bounce a user off-site. */
function safeRedirect(value) {
  const target = String(value || '/app/');
  return /^\/(?!\/)/.test(target) ? target : '/app/';
}

sessionRouter.get('/sso', ({ url, res }) => {
  const token = url.searchParams.get('token');
  if (!token) throw bad('Thiếu tham số token');

  const user = acceptSsoToken(token);
  issueSession(res, user);
  if (config.devMode && seedDemoData(user.id)) {
    // Settle badges the sample data already satisfies, so the member's first
    // real action does not fire a celebration they did not earn.
    evaluateBadges(user.id);
  }

  res.writeHead(302, { location: safeRedirect(url.searchParams.get('redirect')) });
  res.end();
  return undefined; // response already written
});

sessionRouter.post('/api/session/logout', ({ res }) => {
  clearCookie(res, config.sessionCookie);
  return { ok: true, returnUrl: config.appReturnUrl };
});

sessionRouter.get('/api/me', ({ user }) => ({
  user: {
    id: user.id, name: user.name, email: user.email, avatar: user.avatar_url,
    employer: user.employer, role: user.role,
  },
  world: buildWorld(user.id),
}));

sessionRouter.get('/api/me/world', ({ user }) => buildWorld(user.id));

sessionRouter.get('/api/me/badges', ({ user }) => buildWorld(user.id).badges);

sessionRouter.get('/api/me/activity', ({ user, url }) => {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 30));
  return all(
    'SELECT id, kind, ref, day, xp, meta, created_at FROM activity_log WHERE user_id = ? ORDER BY id DESC LIMIT ?',
    user.id, limit,
  ).map((r) => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : null }));
});

// --- development-only mock identity provider -----------------------------
// Lets you open the feature without running the real Ekko app.
sessionRouter.get('/dev/login', ({ url, res }) => {
  if (!config.devMode) throw bad('Chỉ dùng được ở môi trường phát triển');

  const asAdmin = url.searchParams.get('role') === 'admin';
  const token = mintDevSsoToken({
    sub: url.searchParams.get('sub') || (asAdmin ? 'admin@ekko.vn' : 'demo-nv-001'),
    name: url.searchParams.get('name') || (asAdmin ? 'Quản trị viên Ekko' : 'Trần Bảo Ngọc'),
    email: url.searchParams.get('email') || (asAdmin ? 'admin@ekko.vn' : 'ngoc.tran@congty.vn'),
    employer: 'Công ty TNHH Minh Phát',
    role: asAdmin ? 'admin' : 'member',
  });

  const redirect = safeRedirect(url.searchParams.get('redirect') || (asAdmin ? '/admin/' : '/app/'));
  res.writeHead(302, { location: `/sso?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}` });
  res.end();
  return undefined;
});

/** Handy for wiring up the real app: shows the exact token shape expected. */
sessionRouter.get('/dev/sso-token', ({ url }) => {
  if (!config.devMode) throw bad('Chỉ dùng được ở môi trường phát triển');
  const sub = url.searchParams.get('sub') || 'demo-nv-001';
  return {
    token: mintDevSsoToken({ sub, name: url.searchParams.get('name') || 'Nhân viên Ekko', email: url.searchParams.get('email') || null }),
    usage: `/sso?token=<token>&redirect=/app/`,
    claims: { sub: 'ma-nhan-vien', name: 'Ho ten', email: 'tuy chon', avatar: 'tuy chon', employer: 'tuy chon', role: 'member | admin', exp: 'unix seconds' },
  };
});

export function whoami(req, res) {
  const user = currentUser(req);
  sendJson(res, 200, user ? { authenticated: true, role: user.role, name: user.name } : { authenticated: false });
}

export function adminUserSummary() {
  return all(
    `SELECT u.id, u.name, u.email, u.employer, u.role, u.created_at, u.last_seen_at,
            s.xp, s.streak_count, s.streak_best, s.last_active_day,
            (SELECT name FROM levels WHERE id = s.level_id) AS level_name,
            (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = u.id AND p.status = 'completed') AS lessons_done,
            (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = u.id) AS badges
       FROM users u LEFT JOIN user_state s ON s.user_id = u.id
      ORDER BY s.xp DESC, u.id`,
  );
}
