/**
 * SQLite storage via Node's built-in `node:sqlite` (Node >= 22.5) so the whole
 * project installs with zero dependencies.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.EKKO_DATA_DIR || join(here, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, 'gdtc.sqlite'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

db.exec(`
-- ---------- identity ----------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  ekko_user_id  TEXT NOT NULL UNIQUE,          -- subject from the Ekko app SSO token
  name          TEXT NOT NULL,
  email         TEXT,
  avatar_url    TEXT,
  employer      TEXT,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  created_at    TEXT NOT NULL,
  last_seen_at  TEXT
);

CREATE TABLE IF NOT EXISTS user_state (
  user_id            INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp                 INTEGER NOT NULL DEFAULT 0,
  level_id           INTEGER REFERENCES levels(id),
  streak_count       INTEGER NOT NULL DEFAULT 0,
  streak_best        INTEGER NOT NULL DEFAULT 0,
  last_active_day    TEXT,                     -- YYYY-MM-DD in app timezone
  streak_started_day TEXT,
  updated_at         TEXT NOT NULL
);

-- ---------- admin-managed catalogue ----------
CREATE TABLE IF NOT EXISTS levels (
  id              INTEGER PRIMARY KEY,
  order_index     INTEGER NOT NULL,
  name            TEXT NOT NULL,
  emoji           TEXT,                        -- shorthand icon for the rank
  perk            TEXT,                        -- what the member unlocks here
  tagline         TEXT,                        -- legacy, no longer edited
  description     TEXT,                        -- legacy, no longer edited
  xp_required     INTEGER NOT NULL DEFAULT 0,
  island_image    TEXT,                        -- island artwork for this level
  character_image TEXT,                        -- pig character artwork for this level
  is_active       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS badges (
  id            INTEGER PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,                          -- emoji or asset path
  rule_type     TEXT NOT NULL,                 -- see services/progression.js RULES
  rule_value    INTEGER NOT NULL DEFAULT 1,
  rule_target   TEXT,                          -- optional scope (feature code, module id)
  xp_reward     INTEGER NOT NULL DEFAULT 0,
  order_index   INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TEXT NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS modules (
  id           INTEGER PRIMARY KEY,
  order_index  INTEGER NOT NULL,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  summary      TEXT,
  cover_image  TEXT,
  unlock_level INTEGER NOT NULL DEFAULT 1,     -- level order_index needed to open
  xp_reward    INTEGER NOT NULL DEFAULT 0,     -- bonus on finishing the whole module
  is_published INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lessons (
  id           INTEGER PRIMARY KEY,
  module_id    INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL,
  summary      TEXT,
  cover_image  TEXT,
  est_minutes  INTEGER NOT NULL DEFAULT 3,
  xp_reward    INTEGER NOT NULL DEFAULT 20,
  is_published INTEGER NOT NULL DEFAULT 1,
  UNIQUE (module_id, slug)
);

-- A lesson is an ordered list of frames. The kind column decides how the
-- player renders payload (JSON): text_image | slide | interactive | quiz.
CREATE TABLE IF NOT EXISTS frames (
  id          INTEGER PRIMARY KEY,
  lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('text_image','slide','interactive','quiz')),
  payload     TEXT NOT NULL DEFAULT '{}'
);

-- Trắc nghiệm cuối mô đun. Tách khỏi frames vì nó thuộc mô đun, không thuộc
-- một bài học cụ thể.
CREATE TABLE IF NOT EXISTS module_questions (
  id          INTEGER PRIMARY KEY,
  module_id   INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  question    TEXT NOT NULL,
  options     TEXT NOT NULL DEFAULT '[]'   -- [{ text, correct, explain }]
);

CREATE TABLE IF NOT EXISTS module_quiz_results (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id    INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  correct      INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  attempts     INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  PRIMARY KEY (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  frame_index  INTEGER NOT NULL DEFAULT 0,
  quiz_correct INTEGER NOT NULL DEFAULT 0,
  quiz_total   INTEGER NOT NULL DEFAULT 0,
  started_at   TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (user_id, lesson_id)
);

-- The three back-office features surfaced as islands in the world.
CREATE TABLE IF NOT EXISTS features (
  id           INTEGER PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,           -- budget | goals | expenses | explore
  name         TEXT NOT NULL,
  description  TEXT,
  island_image TEXT,
  route        TEXT NOT NULL,
  order_index  INTEGER NOT NULL DEFAULT 0,
  xp_per_day   INTEGER NOT NULL DEFAULT 10,    -- XP for first use of the day
  is_enabled   INTEGER NOT NULL DEFAULT 1
);

-- ---------- feature data ----------
CREATE TABLE IF NOT EXISTS categories (
  id        INTEGER PRIMARY KEY,
  code      TEXT NOT NULL UNIQUE,
  name      TEXT NOT NULL,
  icon      TEXT,
  color     TEXT,
  keywords  TEXT,                              -- comma list used by the bot's parser
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budgets (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month      TEXT NOT NULL,                    -- YYYY-MM
  income     INTEGER NOT NULL DEFAULT 0,
  note       TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, month)
);

CREATE TABLE IF NOT EXISTS budget_items (
  id          INTEGER PRIMARY KEY,
  budget_id   INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  planned     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (budget_id, category_id)
);

CREATE TABLE IF NOT EXISTS goals (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  saved_amount  INTEGER NOT NULL DEFAULT 0,
  deadline      TEXT,
  icon          TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','done','archived')),
  created_at    TEXT NOT NULL,
  completed_at  TEXT
);

CREATE TABLE IF NOT EXISTS goal_deposits (
  id         INTEGER PRIMARY KEY,
  goal_id    INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  note        TEXT,
  spent_on    TEXT NOT NULL,                   -- YYYY-MM-DD
  source      TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','bot')),
  created_at  TEXT NOT NULL
);

-- ---------- gamification bookkeeping ----------
CREATE TABLE IF NOT EXISTS activity_log (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,                    -- lesson_completed | module_completed | feature_used | ...
  ref        TEXT,
  day        TEXT NOT NULL,
  xp         INTEGER NOT NULL DEFAULT 0,
  meta       TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_messages (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','bot')),
  text       TEXT NOT NULL,
  meta       TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lessons_module   ON lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_frames_lesson    ON frames(lesson_id, order_index);
CREATE INDEX IF NOT EXISTS idx_mquestions_module ON module_questions(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_progress_user    ON lesson_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_user    ON expenses(user_id, spent_on);
CREATE INDEX IF NOT EXISTS idx_activity_user    ON activity_log(user_id, day);
CREATE INDEX IF NOT EXISTS idx_activity_kind    ON activity_log(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_botmsg_user      ON bot_messages(user_id, id);
`);

// --- tiny query helpers -------------------------------------------------
export const all = (sql, ...args) => db.prepare(sql).all(...args);
export const get = (sql, ...args) => db.prepare(sql).get(...args);
export const run = (sql, ...args) => db.prepare(sql).run(...args);

/** Runs `fn` inside a transaction, rolling back if it throws. */
export function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
    throw err;
  }
}

/**
 * Adds a column to an existing database. SQLite's ALTER TABLE ADD COLUMN is
 * cheap and non-destructive, so this is safe to run on every boot.
 */
function addColumn(table, column, definition) {
  const present = all(`PRAGMA table_info(${table})`).some((c) => c.name === column);
  if (!present) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

/**
 * Bỏ một cột đã ngừng dùng. Chỉ gọi cho cột không nằm trong index hay ràng buộc
 * nào, vì SQLite từ chối DROP COLUMN trong các trường hợp đó.
 */
function dropColumn(table, column) {
  const present = all(`PRAGMA table_info(${table})`).some((c) => c.name === column);
  if (present) db.exec(`ALTER TABLE ${table} DROP COLUMN ${column}`);
}

addColumn('levels', 'emoji', 'TEXT');
addColumn('levels', 'perk', 'TEXT');
addColumn('modules', 'emoji', 'TEXT');
// text = trang chữ và hình · slides = bộ slide ảnh 1:1,371
addColumn('lessons', 'content_type', "TEXT NOT NULL DEFAULT 'text'");
// Kỳ tiết kiệm của mục tiêu (month | week) và mã mục tiêu gợi ý đã chọn.
addColumn('goals', 'period', "TEXT NOT NULL DEFAULT 'month'");
addColumn('goals', 'template', 'TEXT');
// Tin nhắn đến từ đâu: chat = khung trò chuyện · quick = thanh ghi nhanh ở đáy.
addColumn('bot_messages', 'source', "TEXT NOT NULL DEFAULT 'chat'");
// Ngưỡng cảnh báo cho MỘT khoản chi trong nhóm. NULL = không cảnh báo theo ngưỡng
// (tiền nhà, học phí vốn đã lớn); chỉ đặt cho các nhóm chi thường ngày.
addColumn('categories', 'daily_limit', 'INTEGER');
addColumn('expenses', 'receipt_path', 'TEXT');

// "Xu" đã bị bỏ khỏi sản phẩm: không có gì tiêu xu, nên nó chỉ là một con số
// tăng dần vô nghĩa. Bỏ luôn cột để không ai tưởng đây là dữ liệu còn dùng.
dropColumn('user_state', 'coins');
dropColumn('activity_log', 'coins');
dropColumn('lessons', 'coin_reward');

export function getSetting(key, fallback = null) {
  const row = get('SELECT value FROM settings WHERE key = ?', key);
  return row ? row.value : fallback;
}

export function setSetting(key, value) {
  run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    String(value),
  );
}
