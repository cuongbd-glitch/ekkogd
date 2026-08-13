/**
 * Admin portal API. Every entity in the game world is editable here:
 * levels, badges, learning modules / lessons / frames, the three feature
 * islands, and expense categories.
 *
 * Writes go through an explicit column whitelist per entity, so a stray field
 * in the request body can never reach SQL.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

import { all, get, run, tx } from '../db.js';
import { bad, notFound, Router } from '../lib/http.js';
import { dayKey } from '../lib/time.js';
import { BADGE_RULES } from '../services/progression.js';
import { adminUserSummary } from './session.js';

export const adminRouter = new Router();

const UPLOAD_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'uploads');

/** @type {Record<string, {table:string, columns:string[], order:string, required?:string[]}>} */
const ENTITIES = {
  levels: {
    table: 'levels',
    columns: ['order_index', 'name', 'emoji', 'perk', 'xp_required', 'island_image', 'character_image', 'is_active'],
    required: ['name'],
    order: 'order_index',
  },
  badges: {
    table: 'badges',
    columns: ['code', 'name', 'description', 'icon', 'rule_type', 'rule_value', 'rule_target', 'xp_reward', 'order_index', 'is_active'],
    required: ['code', 'name', 'rule_type'],
    order: 'order_index, id',
  },
  modules: {
    table: 'modules',
    columns: ['order_index', 'title', 'slug', 'summary', 'emoji', 'cover_image', 'unlock_level', 'xp_reward', 'is_published'],
    required: ['title', 'slug'],
    order: 'order_index',
  },
  lessons: {
    table: 'lessons',
    columns: ['module_id', 'order_index', 'title', 'slug', 'summary', 'content_type', 'cover_image', 'est_minutes', 'xp_reward', 'is_published'],
    required: ['module_id', 'title', 'slug'],
    order: 'module_id, order_index',
  },
  questions: {
    table: 'module_questions',
    columns: ['module_id', 'order_index', 'question', 'options'],
    required: ['module_id', 'question'],
    order: 'module_id, order_index',
  },
  frames: {
    table: 'frames',
    columns: ['lesson_id', 'order_index', 'kind', 'payload'],
    required: ['lesson_id', 'kind'],
    order: 'lesson_id, order_index',
  },
  features: {
    table: 'features',
    columns: ['code', 'name', 'description', 'island_image', 'route', 'order_index', 'xp_per_day', 'is_enabled'],
    required: ['code', 'name', 'route'],
    order: 'order_index',
  },
  categories: {
    table: 'categories',
    columns: ['code', 'name', 'icon', 'color', 'keywords', 'daily_limit', 'order_index'],
    required: ['code', 'name'],
    order: 'order_index, id',
  },
};

const FRAME_KINDS = ['text_image', 'slide', 'interactive', 'quiz'];
const CONTENT_TYPES = ['text', 'slides'];

function entity(name) {
  const spec = ENTITIES[name];
  if (!spec) throw notFound(`Không có loại dữ liệu "${name}"`);
  return spec;
}

/** Keeps only whitelisted columns and serialises frame payloads. */
function sanitize(spec, body, { partial = false } = {}) {
  const data = {};
  for (const column of spec.columns) {
    if (!(column in body)) continue;
    let value = body[column];
    if ((column === 'payload' || column === 'options') && typeof value === 'object' && value !== null) value = JSON.stringify(value);
    if (typeof value === 'boolean') value = value ? 1 : 0;
    data[column] = value;
  }
  if (!partial) {
    for (const field of spec.required || []) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw bad(`Thiếu trường bắt buộc: ${field}`);
      }
    }
  }
  if (spec.table === 'frames' && data.kind && !FRAME_KINDS.includes(data.kind)) {
    throw bad(`Loại frame không hợp lệ. Chọn một trong: ${FRAME_KINDS.join(', ')}`);
  }
  if (spec.table === 'lessons' && data.content_type && !CONTENT_TYPES.includes(data.content_type)) {
    throw bad(`Kiểu nội dung không hợp lệ. Chọn một trong: ${CONTENT_TYPES.join(', ')}`);
  }
  if (spec.table === 'module_questions' && data.options !== undefined) {
    const parsed = typeof data.options === 'string' ? JSON.parse(data.options) : data.options;
    if (!Array.isArray(parsed) || parsed.length < 2) throw bad('Câu hỏi cần ít nhất hai lựa chọn');
    if (!parsed.some((o) => o.correct)) throw bad('Hãy đánh dấu một đáp án đúng');
  }
  if (spec.table === 'badges' && data.rule_type && !BADGE_RULES[data.rule_type]) {
    throw bad(`Loại điều kiện huy hiệu không hợp lệ: ${data.rule_type}`);
  }
  if (!Object.keys(data).length) throw bad('Không có trường nào để cập nhật');
  return data;
}

const parseFrame = (row) => ({ ...row, payload: JSON.parse(row.payload || '{}') });
const parseQuestion = (row) => ({ ...row, options: JSON.parse(row.options || '[]') });
const decode = (table, row) => {
  if (table === 'frames') return parseFrame(row);
  if (table === 'module_questions') return parseQuestion(row);
  return row;
};

// ------------------------------------------------------- content helpers
/** The whole learning tree in one call, for the content tree in the portal. */
adminRouter.get('/api/admin/content/tree', () => all('SELECT * FROM modules ORDER BY order_index').map((m) => ({
  ...m,
  lessons: all('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index', m.id).map((l) => ({
    ...l,
    frameCount: get('SELECT COUNT(*) n FROM frames WHERE lesson_id = ?', l.id).n,
    slideCount: get("SELECT COUNT(*) n FROM frames WHERE lesson_id = ? AND kind = 'slide'", l.id).n,
  })),
  questions: all('SELECT * FROM module_questions WHERE module_id = ? ORDER BY order_index', m.id).map(parseQuestion),
})));

adminRouter.get('/api/admin/meta/options', () => ({
  badgeRules: BADGE_RULES,
  frameKinds: FRAME_KINDS,
  contentTypes: CONTENT_TYPES,
  slideAspectRatio: '1:1.371',
  levels: all('SELECT id, order_index, name FROM levels ORDER BY order_index'),
  modules: all('SELECT id, title, order_index FROM modules ORDER BY order_index'),
  categories: all('SELECT id, code, name, icon FROM categories ORDER BY order_index'),
}));

// --------------------------------------------------------------- uploads
const ALLOWED_IMAGE = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
const MAX_UPLOAD_BYTES = 1_500_000;

/**
 * Base64 data-URL upload. Avoids a multipart parser dependency, and the admin
 * portal is the only client.
 */
adminRouter.post('/api/admin/upload', async ({ body }) => {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(String(body.dataUrl || ''));
  if (!match) throw bad('Cần gửi ảnh dưới dạng data URL base64');

  const extension = ALLOWED_IMAGE[match[1]];
  if (!extension) throw bad(`Định dạng không hỗ trợ. Chấp nhận: ${Object.keys(ALLOWED_IMAGE).join(', ')}`);

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_UPLOAD_BYTES) throw bad('Ảnh vượt quá 1,5 MB. Hãy nén lại trước khi tải lên.');

  const safeName = String(body.filename || 'anh')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'anh';
  const filename = `${safeName}-${randomUUID().slice(0, 8)}.${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return { url: `/assets/uploads/${filename}`, bytes: buffer.length };
});

// ------------------------------------------------------------ dashboard
adminRouter.get('/api/admin/stats/overview', () => {
  const today = dayKey();
  const counts = (sql, ...args) => get(sql, ...args).n;

  return {
    users: {
      total: counts('SELECT COUNT(*) n FROM users'),
      activeToday: counts('SELECT COUNT(DISTINCT user_id) n FROM activity_log WHERE day = ?', today),
      withStreak: counts('SELECT COUNT(*) n FROM user_state WHERE streak_count > 0'),
      streak7Plus: counts('SELECT COUNT(*) n FROM user_state WHERE streak_count >= 7'),
    },
    content: {
      modules: counts('SELECT COUNT(*) n FROM modules WHERE is_published = 1'),
      lessons: counts('SELECT COUNT(*) n FROM lessons WHERE is_published = 1'),
      frames: counts('SELECT COUNT(*) n FROM frames'),
      badges: counts('SELECT COUNT(*) n FROM badges WHERE is_active = 1'),
      levels: counts('SELECT COUNT(*) n FROM levels WHERE is_active = 1'),
    },
    engagement: {
      lessonsCompleted: counts('SELECT COUNT(*) n FROM lesson_progress WHERE status = ?', 'completed'),
      badgesAwarded: counts('SELECT COUNT(*) n FROM user_badges'),
      budgets: counts('SELECT COUNT(*) n FROM budgets'),
      goals: counts('SELECT COUNT(*) n FROM goals'),
      expenses: counts('SELECT COUNT(*) n FROM expenses'),
      botMessages: counts('SELECT COUNT(*) n FROM bot_messages WHERE role = ?', 'user'),
    },
    levelDistribution: all(
      `SELECT l.name, l.order_index, COUNT(s.user_id) AS members
         FROM levels l LEFT JOIN user_state s ON s.level_id = l.id
        GROUP BY l.id ORDER BY l.order_index`,
    ),
    popularLessons: all(
      `SELECT l.title, m.title AS module_title, COUNT(p.user_id) AS completions
         FROM lessons l
         JOIN modules m ON m.id = l.module_id
         LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.status = 'completed'
        GROUP BY l.id ORDER BY completions DESC, l.order_index LIMIT 8`,
    ),
    dailyActive: all(
      `SELECT day, COUNT(DISTINCT user_id) AS users
         FROM activity_log WHERE day >= date('now', '-13 days')
        GROUP BY day ORDER BY day`,
    ),
  };
});

adminRouter.get('/api/admin/stats/users', () => adminUserSummary());

// ------------------------------------------------------------------ CRUD
adminRouter.get('/api/admin/:entity', ({ params, url }) => {
  const spec = entity(params.entity);
  const filters = [];
  const args = [];
  for (const [key, value] of url.searchParams) {
    if (!spec.columns.includes(key)) continue;
    filters.push(`${key} = ?`);
    args.push(value);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const rows = all(`SELECT * FROM ${spec.table} ${where} ORDER BY ${spec.order}`, ...args);
  return rows.map((r) => decode(spec.table, r));
});

adminRouter.get('/api/admin/:entity/:id', ({ params }) => {
  const spec = entity(params.entity);
  const row = get(`SELECT * FROM ${spec.table} WHERE id = ?`, Number(params.id));
  if (!row) throw notFound('Không tìm thấy bản ghi');
  return decode(spec.table, row);
});

adminRouter.post('/api/admin/:entity', ({ params, body }) => {
  const spec = entity(params.entity);
  const data = sanitize(spec, body);
  const columns = Object.keys(data);
  const info = run(
    `INSERT INTO ${spec.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    ...columns.map((c) => data[c]),
  );
  const row = get(`SELECT * FROM ${spec.table} WHERE id = ?`, Number(info.lastInsertRowid));
  return decode(spec.table, row);
});

adminRouter.patch('/api/admin/:entity/:id', ({ params, body }) => {
  const spec = entity(params.entity);
  const id = Number(params.id);
  if (!get(`SELECT id FROM ${spec.table} WHERE id = ?`, id)) throw notFound('Không tìm thấy bản ghi');

  const data = sanitize(spec, body, { partial: true });
  const columns = Object.keys(data);
  run(
    `UPDATE ${spec.table} SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    ...columns.map((c) => data[c]), id,
  );
  const row = get(`SELECT * FROM ${spec.table} WHERE id = ?`, id);
  return decode(spec.table, row);
});

adminRouter.delete('/api/admin/:entity/:id', ({ params }) => {
  const spec = entity(params.entity);
  const id = Number(params.id);
  if (!get(`SELECT id FROM ${spec.table} WHERE id = ?`, id)) throw notFound('Không tìm thấy bản ghi');
  run(`DELETE FROM ${spec.table} WHERE id = ?`, id);
  return { ok: true, id };
});

/** Drag-and-drop reordering: one transaction for the whole list. */
adminRouter.post('/api/admin/:entity/reorder', ({ params, body }) => {
  const spec = entity(params.entity);
  if (!spec.columns.includes('order_index')) throw bad('Loại dữ liệu này không sắp xếp được');
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger) : [];
  if (!ids.length) throw bad('Danh sách ids trống');

  tx(() => {
    ids.forEach((id, index) => run(`UPDATE ${spec.table} SET order_index = ? WHERE id = ?`, index + 1, id));
  });
  return all(`SELECT * FROM ${spec.table} ORDER BY ${spec.order}`);
});
