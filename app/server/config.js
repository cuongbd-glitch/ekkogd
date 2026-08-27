import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSetting, setSetting } from './db.js';

/**
 * Nạp tệp `.env` cạnh `package.json` vào `process.env`.
 *
 * Cần thiết vì server không phải lúc nào cũng do terminal của bạn khởi động:
 * khung preview chạy `npm start` với môi trường của chính nó, nên một dòng
 * `export` trong terminal không tới được tiến trình này. Đặt khoá vào tệp thì
 * chạy kiểu gì cũng thấy.
 *
 * Biến đã có sẵn trong môi trường **thắng** tệp — ở máy chủ thật, môi trường mới
 * là nguồn đúng, tệp chỉ để tiện lúc phát triển.
 */
function loadEnvFile() {
  const file = join(dirname(dirname(fileURLToPath(import.meta.url))), '.env');
  if (!existsSync(file)) return;

  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    // Bỏ nháy bao quanh nếu có; giá trị không bao giờ được ghi ra log.
    process.env[key] = line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadEnvFile();

/**
 * Secrets are read from the environment in production. For local development we
 * generate one once and persist it, so restarting the server does not log
 * everybody out.
 */
function persistentSecret(key, envValue) {
  if (envValue) return envValue;
  let stored = getSetting(key);
  if (!stored) {
    stored = randomBytes(32).toString('hex');
    setSetting(key, stored);
  }
  return stored;
}

export const config = {
  port: Number(process.env.PORT || 4321),
  host: process.env.HOST || '127.0.0.1',

  /** Shared with the Ekko app: it signs the SSO handoff token with this. */
  ssoSecret: persistentSecret('sso_secret', process.env.EKKO_SSO_SECRET),
  /** Only this service knows this one: it signs the session cookie. */
  sessionSecret: persistentSecret('session_secret', process.env.EKKO_SESSION_SECRET),

  sessionCookie: 'ekko_gdtc_session',
  sessionTtl: 60 * 60 * 24 * 30,

  /** Where to bounce users who arrive without a valid SSO token. */
  appReturnUrl: process.env.EKKO_APP_URL || 'https://ekko.vn',

  /** Emails or ekko user ids that get the admin role on first login. */
  adminSubjects: (process.env.EKKO_ADMIN_SUBJECTS || 'admin@ekko.vn,cuongbd@ekko.vn')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),

  /**
   * Dev-only conveniences: the mock SSO launcher and the simulated-date header
   * used to demo streak freezing. Never enable in production.
   */
  devMode: process.env.NODE_ENV !== 'production',

  /** Optional: set ANTHROPIC_API_KEY to let Ekko bot fall back to Claude. */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-opus-5',
};
