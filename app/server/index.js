/**
 * Ekko - Giáo dục tài chính
 * HTTP entry point: static files, API routing, auth gate, error shaping.
 */
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { currentUser, requireAdmin, requireUser } from './auth.js';
import { HttpError, readJson, sendJson, serveStatic } from './lib/http.js';
import { langOf, translate } from './i18n/index.js';
import { seed, listSeedTables } from './seed/index.js';
import { adminRouter } from './routes/admin.js';
import { botRouter } from './routes/bot.js';
import { featureRouter } from './routes/features.js';
import { learnRouter } from './routes/learn.js';
import { sessionRouter, whoami } from './routes/session.js';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

seed();

/**
 * Routers are tried in order. `auth` says what the whole router requires:
 *   'none'   public
 *   'user'   any signed-in member
 *   'admin'  admin role only
 */
const ROUTERS = [
  { router: sessionRouter, auth: 'mixed' },
  { router: learnRouter, auth: 'user' },
  { router: featureRouter, auth: 'user' },
  { router: botRouter, auth: 'user' },
  { router: adminRouter, auth: 'admin' },
];

/** Session router mixes public (SSO, dev login) and private (`/api/me`) paths. */
const PUBLIC_PATHS = new Set(['/sso', '/dev/login', '/dev/sso-token', '/api/session/logout', '/healthz']);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/healthz') {
      return sendJson(res, 200, { ok: true, content: listSeedTables() });
    }
    if (pathname === '/api/session/whoami') {
      return whoami(req, res);
    }

    for (const { router, auth } of ROUTERS) {
      const match = router.match(req.method, pathname);
      if (!match) continue;

      const user = currentUser(req);
      const ctx = { req, res, url, params: match.params, user, body: {} };

      if (auth === 'admin') requireAdmin(ctx);
      else if (auth === 'user') requireUser(ctx);
      else if (auth === 'mixed' && !PUBLIC_PATHS.has(pathname)) requireUser(ctx);

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        ctx.body = await readJson(req);
      }

      const result = await match.handler(ctx);
      if (res.writableEnded) return undefined; // handler wrote its own response (redirects)
      // Một chỗ duy nhất dịch nội dung: app người dùng gửi `x-lang`, Admin thì
      // không, nên Admin luôn thấy bản gốc tiếng Việt đang được biên tập.
      const lang = auth === 'admin' ? 'vi' : langOf(req);
      return sendJson(res, 200, translate(result ?? { ok: true }, lang));
    }

    // Static assets and the two SPA shells.
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (await serveStatic(PUBLIC_DIR, pathname, req, res)) return undefined;
      if (pathname === '/') {
        res.writeHead(302, { location: '/app/' });
        return res.end();
      }
      // Hash-based routing means deep links still resolve to the shell.
      const shell = pathname.startsWith('/admin') ? '/admin/index.html' : '/app/index.html';
      if (!pathname.startsWith('/assets') && await serveStatic(PUBLIC_DIR, shell, req, res)) return undefined;
    }

    return sendJson(res, 404, { error: 'Không tìm thấy đường dẫn này' });
  } catch (err) {
    if (err instanceof HttpError) {
      return sendJson(res, err.status,
        translate({ error: err.message, details: err.details ?? null }, langOf(req)));
    }
    console.error(`[${req.method} ${pathname}]`, err);
    return sendJson(res, 500, { error: 'Có lỗi xảy ra ở máy chủ' });
  }
});

server.listen(config.port, config.host, () => {
  const base = `http://${config.host}:${config.port}`;
  console.log('Ekko - Giáo dục tài chính');
  console.log(`  Ứng dụng   ${base}/app/`);
  console.log(`  Admin      ${base}/admin/`);
  if (config.devMode) {
    console.log(`  Dev login  ${base}/dev/login            (nhân viên)`);
    console.log(`             ${base}/dev/login?role=admin (quản trị)`);
  }
  console.log(`  Nội dung   ${JSON.stringify(listSeedTables())}`);
});
