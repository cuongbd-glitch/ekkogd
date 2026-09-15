/**
 * Idempotent seeding. Runs on every boot but only fills in what is missing, so
 * admin edits made in the portal are never overwritten.
 */
import { all, get, run, tx, getSetting, setSetting } from '../db.js';
import { nowIso } from '../lib/time.js';
import { BADGES, CATEGORIES, FEATURES, LEVELS, MODULE_EMOJI } from './catalogue.js';
import { MODULES } from './curriculum.js';
import { EN } from '../i18n/en.js';
import { parseSaid } from './chatReplay.js';

const CURRICULUM_VERSION = '1';
const LEVELS_VERSION = '2';
const MODULE_QUIZ_VERSION = '1';
const CATEGORY_LIMITS_VERSION = '1';
const CHAT_LOGGED_VERSION = '3';

export function seed() {
  tx(() => {
    if (getSetting('levels_version') !== LEVELS_VERSION) {
      seedLevels();
      setSetting('levels_version', LEVELS_VERSION);
    }
    seedBadges();
    seedFeatures();
    seedCategories();
    if (getSetting('category_limits_version') !== CATEGORY_LIMITS_VERSION) {
      seedCategoryLimits();
      setSetting('category_limits_version', CATEGORY_LIMITS_VERSION);
    }
    if (getSetting('curriculum_version') !== CURRICULUM_VERSION) {
      seedCurriculum();
      setSetting('curriculum_version', CURRICULUM_VERSION);
    }
    if (getSetting('module_quiz_version') !== MODULE_QUIZ_VERSION) {
      liftQuizzesToModules();
      setSetting('module_quiz_version', MODULE_QUIZ_VERSION);
    }
    if (getSetting('chat_logged_version') !== CHAT_LOGGED_VERSION) {
      backfillChatLogged();
      setSetting('chat_logged_version', CHAT_LOGGED_VERSION);
    }
  });
}

/**
 * Upserts the six default ranks by `order_index`. Gated on LEVELS_VERSION, so a
 * change to the default ladder reaches existing databases exactly once. Extra
 * levels an admin added by hand are left alone.
 */
function seedLevels() {
  for (const l of LEVELS) {
    const existing = get('SELECT id FROM levels WHERE order_index = ?', l.order_index);
    if (existing) {
      run(
        `UPDATE levels
            SET name = ?, emoji = ?, perk = COALESCE(NULLIF(perk, ''), ?), xp_required = ?,
                island_image = ?, character_image = ?
          WHERE id = ?`,
        l.name, l.emoji, l.perk, l.xp_required, l.island_image, l.character_image, existing.id,
      );
      continue;
    }
    run(
      `INSERT INTO levels (order_index, name, emoji, perk, xp_required, island_image, character_image, is_active)
       VALUES (?,?,?,?,?,?,?,1)`,
      l.order_index, l.name, l.emoji, l.perk, l.xp_required, l.island_image, l.character_image,
    );
  }
}

function seedBadges() {
  for (const b of BADGES) {
    if (get('SELECT id FROM badges WHERE code = ?', b.code)) continue;
    run(
      `INSERT INTO badges (code, name, description, icon, rule_type, rule_value, rule_target, xp_reward, order_index, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      b.code, b.name, b.description, b.icon, b.rule_type, b.rule_value, b.rule_target ?? null, b.xp_reward, b.order_index,
    );
  }
}

function seedFeatures() {
  for (const f of FEATURES) {
    if (get('SELECT id FROM features WHERE code = ?', f.code)) continue;
    run(
      `INSERT INTO features (code, name, description, island_image, route, order_index, xp_per_day, is_enabled)
       VALUES (?,?,?,?,?,?,?,1)`,
      f.code, f.name, f.description, f.island_image, f.route, f.order_index, f.xp_per_day,
    );
  }
}

function seedCategories() {
  for (const c of CATEGORIES) {
    if (get('SELECT id FROM categories WHERE code = ?', c.code)) continue;
    run(
      'INSERT INTO categories (code, name, icon, color, keywords, order_index, daily_limit) VALUES (?,?,?,?,?,?,?)',
      c.code, c.name, c.icon, c.color, c.keywords, c.order_index, c.daily_limit ?? null,
    );
  }
}

/**
 * Điền ngưỡng cảnh báo mặc định cho cơ sở dữ liệu đã có sẵn. Chỉ chạy một lần
 * (gated theo version) và chỉ ghi vào nhóm còn để trống, nên ngưỡng do Admin đặt
 * không bị ghi đè.
 */
function seedCategoryLimits() {
  for (const c of CATEGORIES) {
    if (!c.daily_limit) continue;
    run('UPDATE categories SET daily_limit = ? WHERE code = ? AND daily_limit IS NULL', c.daily_limit, c.code);
  }
}

function seedCurriculum() {
  MODULES.forEach((m, mi) => {
    let moduleRow = get('SELECT * FROM modules WHERE slug = ?', m.slug);
    if (!moduleRow) {
      const info = run(
        `INSERT INTO modules (order_index, title, slug, summary, emoji, cover_image, unlock_level, xp_reward, is_published)
         VALUES (?,?,?,?,?,?,?,?,1)`,
        mi + 1, m.title, m.slug, m.summary, MODULE_EMOJI[mi + 1] ?? null, m.cover_image, m.unlock_level, m.xp_reward,
      );
      moduleRow = get('SELECT * FROM modules WHERE id = ?', Number(info.lastInsertRowid));
    }

    m.lessons.forEach((l, li) => {
      let lessonRow = get('SELECT * FROM lessons WHERE module_id = ? AND slug = ?', moduleRow.id, l.slug);
      if (!lessonRow) {
        const info = run(
          `INSERT INTO lessons (module_id, order_index, title, slug, summary, cover_image, est_minutes, xp_reward, is_published)
           VALUES (?,?,?,?,?,?,?,?,1)`,
          moduleRow.id, li + 1, l.title, l.slug, l.summary, l.cover_image ?? m.cover_image,
          l.est_minutes, l.xp_reward,
        );
        lessonRow = get('SELECT * FROM lessons WHERE id = ?', Number(info.lastInsertRowid));
      }

      if (get('SELECT COUNT(*) n FROM frames WHERE lesson_id = ?', lessonRow.id).n > 0) return;

      // A lesson holds pages; its quiz question belongs to the module's
      // end-of-module test instead of sitting inside the lesson.
      let order = 0;
      l.frames.forEach((f) => {
        if (f.kind === 'quiz') {
          const next = get('SELECT COALESCE(MAX(order_index), 0) n FROM module_questions WHERE module_id = ?', moduleRow.id).n + 1;
          run(
            'INSERT INTO module_questions (module_id, order_index, question, options) VALUES (?,?,?,?)',
            moduleRow.id, next, f.payload.question, JSON.stringify(f.payload.options || []),
          );
          return;
        }
        order += 1;
        run(
          'INSERT INTO frames (lesson_id, order_index, kind, payload) VALUES (?,?,?,?)',
          lessonRow.id, order, f.kind, JSON.stringify(f.payload),
        );
      });
    });
  });
}

/**
 * One-time move for databases seeded before the module quiz existed: lift each
 * lesson's quiz frame up to its module, in lesson order, then drop the frame.
 * Also fills in the derived fields the new admin UI needs.
 */
function liftQuizzesToModules() {
  const stale = all(
    `SELECT f.id, f.payload, l.module_id, m.order_index AS mi, l.order_index AS li, f.order_index AS fi
       FROM frames f
       JOIN lessons l ON l.id = f.lesson_id
       JOIN modules m ON m.id = l.module_id
      WHERE f.kind = 'quiz'
      ORDER BY m.order_index, l.order_index, f.order_index`,
  );

  for (const frame of stale) {
    let payload = {};
    try { payload = JSON.parse(frame.payload || '{}'); } catch { /* skip malformed */ }
    if (payload.question) {
      const next = get('SELECT COALESCE(MAX(order_index), 0) n FROM module_questions WHERE module_id = ?', frame.module_id).n + 1;
      run(
        'INSERT INTO module_questions (module_id, order_index, question, options) VALUES (?,?,?,?)',
        frame.module_id, next, payload.question, JSON.stringify(payload.options || []),
      );
    }
    run('DELETE FROM frames WHERE id = ?', frame.id);
  }

  // Renumber the frames each lesson has left so there are no gaps.
  for (const lesson of all('SELECT id FROM lessons')) {
    all('SELECT id FROM frames WHERE lesson_id = ? ORDER BY order_index', lesson.id)
      .forEach((f, i) => run('UPDATE frames SET order_index = ? WHERE id = ?', i + 1, f.id));
  }

  // A lesson made only of slides authors as a deck; anything else is text.
  for (const lesson of all('SELECT id FROM lessons')) {
    const counts = get(
      "SELECT SUM(kind = 'slide') slides, COUNT(*) total FROM frames WHERE lesson_id = ?",
      lesson.id,
    );
    const type = counts.total > 0 && counts.slides === counts.total ? 'slides' : 'text';
    run('UPDATE lessons SET content_type = ? WHERE id = ?', type, lesson.id);
  }

  for (const [order, emoji] of Object.entries(MODULE_EMOJI)) {
    run("UPDATE modules SET emoji = ? WHERE order_index = ? AND COALESCE(emoji, '') = ''", emoji, Number(order));
  }
}

/** Sample expenses + a budget + a goal, so a fresh demo account is not empty. */
export function seedDemoData(userId) {
  if (get('SELECT COUNT(*) n FROM expenses WHERE user_id = ?', userId).n > 0) return false;

  const cat = (code) => get('SELECT id FROM categories WHERE code = ?', code)?.id ?? null;
  const today = new Date();
  const dayOffset = (n) => {
    const d = new Date(today.getTime() - n * 86400000);
    return d.toISOString().slice(0, 10);
  };

  const samples = [
    [45000, 'food', 'Cà phê sáng với đồng nghiệp', 0],
    [65000, 'food', 'Cơm trưa văn phòng', 0],
    [120000, 'transport', 'Đổ xăng', 1],
    [35000, 'food', 'Trà sữa', 1],
    [250000, 'shopping', 'Đồ dùng nhà tắm', 2],
    [80000, 'food', 'Ăn tối quán quen', 2],
    [15000, 'transport', 'Gửi xe cả tuần', 3],
    [420000, 'family', 'Sữa cho con', 4],
    [90000, 'entertainment', 'Vé xem phim', 5],
    [55000, 'food', 'Bún bò', 6],
  ];
  for (const [amount, code, note, ago] of samples) {
    run(
      'INSERT INTO expenses (user_id, amount, category_id, note, spent_on, source, created_at) VALUES (?,?,?,?,?,?,?)',
      userId, amount, cat(code), note, dayOffset(ago), 'manual', nowIso(),
    );
  }

  const month = new Date().toISOString().slice(0, 7);
  const info = run(
    'INSERT INTO budgets (user_id, month, income, note, created_at) VALUES (?,?,?,?,?)',
    userId, month, 12000000, 'Ngân sách mẫu theo quy tắc 50/30/20', nowIso(),
  );
  const budgetId = Number(info.lastInsertRowid);
  const plan = [['food', 3000000], ['transport', 900000], ['housing', 3500000], ['shopping', 800000], ['family', 1200000], ['entertainment', 600000], ['saving', 2000000]];
  for (const [code, planned] of plan) {
    const categoryId = cat(code);
    if (categoryId) run('INSERT INTO budget_items (budget_id, category_id, planned) VALUES (?,?,?)', budgetId, categoryId, planned);
  }

  run(
    'INSERT INTO goals (user_id, name, target_amount, saved_amount, deadline, icon, status, created_at) VALUES (?,?,?,?,?,?,?,?)',
    userId, 'Quỹ khẩn cấp 1 tháng', 6000000, 1800000, null, '🛟', 'active', nowIso(),
  );
  return true;
}

export function listSeedTables() {
  return {
    levels: all('SELECT COUNT(*) n FROM levels')[0].n,
    badges: all('SELECT COUNT(*) n FROM badges')[0].n,
    modules: all('SELECT COUNT(*) n FROM modules')[0].n,
    lessons: all('SELECT COUNT(*) n FROM lessons')[0].n,
    frames: all('SELECT COUNT(*) n FROM frames')[0].n,
  };
}

/**
 * Câu xác nhận cũ trong sổ chat của Ekko bot chỉ có chữ, không có dữ liệu thô,
 * nên không đọc lại được bằng ngôn ngữ khác. Lần này tách số tiền / nhóm / ghi
 * chú ra khỏi câu đã lưu và đặt vào `meta.logged` — từ đó trở đi việc đổi ngôn
 * ngữ dựng lại được cả những câu đã nói từ trước.
 *
 * Chỉ đọc và ghi phần `meta`; cột `text` giữ nguyên, nên chạy lại cũng không
 * làm hỏng gì. Câu nào không khớp mẫu thì bỏ qua.
 */
function backfillChatLogged() {
  const rows = all("SELECT id, text, meta FROM bot_messages WHERE role = 'bot'");
  const frames = lessonFrames();

  for (const row of rows) {
    let meta = null;
    try { meta = JSON.parse(row.meta || 'null'); } catch { continue; }
    if (!meta) continue;

    const next = { ...meta };
    let changed = false;

    if (!next.logged && !next.say) {
      // Câu xác nhận ghi chi tiêu có dạng riêng; còn lại đều là mẫu trong `SAY`.
      const logged = meta.kind === 'expense_logged' ? parseLoggedText(row.text) : null;
      const said = logged ? null : parseSaid(row.text, frames);
      if (logged) { next.logged = logged; changed = true; } else if (said) { next.say = said; changed = true; }
    }

    // Nhãn nút "Học bài …" cũng là một câu sinh ra từ mẫu, nên khôi phục luôn.
    if (meta.action?.label && !meta.action.labelSay) {
      const labelSay = parseSaid(meta.action.label, frames);
      if (labelSay) { next.action = { ...meta.action, labelSay }; changed = true; }
    }

    if (changed) run('UPDATE bot_messages SET meta = ? WHERE id = ?', JSON.stringify(next), row.id);
  }
}

/** Từng khung bài thành danh sách câu, đúng thứ tự Ekko bot vẫn ghép. */
function lessonFrames() {
  return all('SELECT payload FROM frames').map((row) => {
    let payload = {};
    try { payload = JSON.parse(row.payload || '{}'); } catch { /* bỏ khung hỏng */ }
    return {
      parts: [
        payload.title, payload.body, payload.caption, payload.intro, payload.question,
        ...(payload.hotspots || []).flatMap((h) => [h.label, h.text]),
        ...(payload.options || []).map((o) => o.text),
      ].filter(Boolean),
    };
  });
}

/**
 * Tên nhóm chi tiêu trong câu cũ có thể đã là bản tiếng Anh (câu đó được viết
 * lúc app đang chạy tiếng Anh). Lưu về **bản gốc tiếng Việt** để dịch xuôi được
 * sang cả hai chiều.
 */
const VI_BY_EN = new Map(Object.entries(EN).map(([vi, en]) => [en, vi]));

/** "Đã ghi **50.000đ** vào nhóm 🍜 **Ăn uống** (ăn sáng)." → dữ liệu thô. */
function parseLoggedText(text) {
  // `đ` hoặc `d`: bản rất cũ của app viết đơn vị tiền không có dấu.
  const match = /\*\*([\d.,]+)[đd]\*\*\s*(?:vào nhóm|under)\s*(\S+)?\s*\*\*(.+?)\*\*(?:\s*\(([^)]*)\))?/u.exec(String(text || ''));
  if (!match) return null;

  const amount = Number(match[1].replace(/\D/g, ''));
  if (!amount) return null;

  const name = match[3].trim();
  return {
    amount,
    categoryName: VI_BY_EN.get(name) || name,
    categoryIcon: match[2] && !match[2].startsWith('**') ? match[2] : null,
    note: match[4]?.trim() || null,
  };
}
