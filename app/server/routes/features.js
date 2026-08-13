/**
 * The three tool islands: Lập ngân sách, Mục tiêu tài chính, Ghi chép chi tiêu.
 *
 * Every read marks the feature as opened today (first open per day pays XP and
 * feeds the streak); every write goes through the same helper so the streak
 * cannot be farmed by repeat taps.
 */
import { all, get, run, tx } from '../db.js';
import { bad, notFound, Router } from '../lib/http.js';
import { dayKey, endOfMonth, endOfWeek, monthKey, nowIso, startOfMonth, startOfWeek } from '../lib/time.js';
import { useFeature } from '../services/progression.js';
import { extractNote, guessCategory, parseAmount } from '../services/nlp.js';
import { appendMessages, expenseLoggedReply } from '../services/botLog.js';
import { GOAL_GROUPS, GOAL_PERIODS, templateByCode } from '../services/goalTemplates.js';
import { alertLine, expenseAlerts } from '../services/spendingAlerts.js';

export const featureRouter = new Router();

const MONTH_RE = /^\d{4}-\d{2}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The home screen reads budget and expense totals for its summary card. That
 * is not the member visiting the island, so `?peek=1` reads without claiming
 * the daily reward or the streak day.
 */
const claimVisit = (userId, code, url) => (url.searchParams.get('peek') === '1' ? null : useFeature(userId, code));

const categories = () => all('SELECT * FROM categories ORDER BY order_index, id');

function resolveCategory(body) {
  if (body.categoryId) {
    const row = get('SELECT * FROM categories WHERE id = ?', Number(body.categoryId));
    if (row) return row;
  }
  if (body.categoryCode) {
    const row = get('SELECT * FROM categories WHERE code = ?', String(body.categoryCode));
    if (row) return row;
  }
  return get('SELECT * FROM categories WHERE code = ?', 'other');
}

function positiveAmount(value, field = 'Số tiền') {
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount) || amount <= 0) throw bad(`${field} phải là một số dương`);
  if (amount > 100_000_000_000) throw bad(`${field} vượt quá giới hạn cho phép`);
  return amount;
}

// ---------------------------------------------------------------- categories
featureRouter.get('/api/categories', () => categories());

// ------------------------------------------------------------------- budget
function budgetPayload(userId, month) {
  const budget = get('SELECT * FROM budgets WHERE user_id = ? AND month = ?', userId, month);
  const spentRows = all(
    `SELECT category_id, SUM(amount) AS spent
       FROM expenses
      WHERE user_id = ? AND substr(spent_on, 1, 7) = ?
      GROUP BY category_id`,
    userId, month,
  );
  const spentByCategory = new Map(spentRows.map((r) => [r.category_id, r.spent]));

  const items = budget
    ? all(
      `SELECT bi.*, c.code, c.name, c.icon, c.color
         FROM budget_items bi JOIN categories c ON c.id = bi.category_id
        WHERE bi.budget_id = ?
        ORDER BY c.order_index`,
      budget.id,
    ).map((item) => {
      const spent = spentByCategory.get(item.category_id) || 0;
      return {
        ...item,
        spent,
        remaining: item.planned - spent,
        percent: item.planned > 0 ? Math.round((spent / item.planned) * 100) : 0,
      };
    })
    : [];

  const totalPlanned = items.reduce((sum, i) => sum + i.planned, 0);
  const totalSpent = [...spentByCategory.values()].reduce((sum, v) => sum + v, 0);

  return {
    month,
    exists: Boolean(budget),
    budget: budget ?? null,
    items,
    categories: categories(),
    totals: {
      income: budget?.income ?? 0,
      planned: totalPlanned,
      spent: totalSpent,
      remaining: totalPlanned - totalSpent,
      unallocated: (budget?.income ?? 0) - totalPlanned,
      percent: totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0,
    },
  };
}

featureRouter.get('/api/budget', ({ user, url }) => {
  const month = url.searchParams.get('month') || monthKey();
  if (!MONTH_RE.test(month)) throw bad('Tháng phải có dạng YYYY-MM');
  const rewards = claimVisit(user.id, 'budget', url);
  return { ...budgetPayload(user.id, month), rewards };
});

featureRouter.put('/api/budget', ({ user, body }) => {
  const month = String(body.month || monthKey());
  if (!MONTH_RE.test(month)) throw bad('Tháng phải có dạng YYYY-MM');
  const income = Math.max(0, Math.round(Number(body.income) || 0));
  const items = Array.isArray(body.items) ? body.items : [];

  tx(() => {
    run(
      `INSERT INTO budgets (user_id, month, income, note, created_at) VALUES (?,?,?,?,?)
       ON CONFLICT(user_id, month) DO UPDATE SET income = excluded.income, note = excluded.note`,
      user.id, month, income, body.note ?? null, nowIso(),
    );
    const budget = get('SELECT * FROM budgets WHERE user_id = ? AND month = ?', user.id, month);
    run('DELETE FROM budget_items WHERE budget_id = ?', budget.id);
    for (const item of items) {
      const category = resolveCategory(item);
      const planned = Math.max(0, Math.round(Number(item.planned) || 0));
      if (!category || planned <= 0) continue;
      run(
        'INSERT INTO budget_items (budget_id, category_id, planned) VALUES (?,?,?) ON CONFLICT(budget_id, category_id) DO UPDATE SET planned = excluded.planned',
        budget.id, category.id, planned,
      );
    }
  });

  const rewards = useFeature(user.id, 'budget');
  return { ...budgetPayload(user.id, month), rewards };
});

// -------------------------------------------------------------------- goals
const goalPeriod = (value, fallback = 'month') => (
  Object.hasOwn(GOAL_PERIODS, String(value)) ? String(value) : fallback
);

function goalPayload(userId) {
  const goals = all('SELECT * FROM goals WHERE user_id = ? AND status <> ? ORDER BY status, created_at DESC', userId, 'archived')
    .map((g) => ({
      ...g,
      percent: g.target_amount > 0 ? Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100)) : 0,
      remaining: Math.max(0, g.target_amount - g.saved_amount),
      group: templateByCode(g.template)?.group ?? null,
      deposits: all('SELECT * FROM goal_deposits WHERE goal_id = ? ORDER BY id DESC LIMIT 5', g.id),
    }));
  return {
    goals,
    templates: GOAL_GROUPS,
    periods: GOAL_PERIODS,
    // Mọi phép tính thời hạn trên màn hình neo theo ngày ở Việt Nam, không theo
    // đồng hồ của thiết bị.
    today: dayKey(),
    totals: {
      target: goals.reduce((s, g) => s + g.target_amount, 0),
      saved: goals.reduce((s, g) => s + g.saved_amount, 0),
      active: goals.filter((g) => g.status === 'active').length,
      done: goals.filter((g) => g.status === 'done').length,
    },
  };
}

featureRouter.get('/api/goals', ({ user, url }) => {
  const rewards = claimVisit(user.id, 'goals', url);
  return { ...goalPayload(user.id), rewards };
});

featureRouter.post('/api/goals', ({ user, body }) => {
  const template = templateByCode(body.template);
  const name = String(body.name || '').trim();
  if (!name) throw bad('Hãy đặt tên cho mục tiêu');
  if (name.length > 120) throw bad('Tên mục tiêu quá dài');
  const target = positiveAmount(body.targetAmount ?? body.target_amount, 'Số tiền mục tiêu');
  const deadline = body.deadline && DAY_RE.test(body.deadline) ? body.deadline : null;

  const info = run(
    `INSERT INTO goals (user_id, name, target_amount, saved_amount, deadline, icon, period, template, status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    user.id, name, target, 0, deadline,
    body.icon || template?.emoji || '🎯',
    goalPeriod(body.period),
    template?.code ?? null,
    'active', nowIso(),
  );
  const rewards = useFeature(user.id, 'goals');
  return { goal: get('SELECT * FROM goals WHERE id = ?', Number(info.lastInsertRowid)), ...goalPayload(user.id), rewards };
});

featureRouter.post('/api/goals/:id/deposit', ({ user, params, body }) => {
  const goal = get('SELECT * FROM goals WHERE id = ? AND user_id = ?', Number(params.id), user.id);
  if (!goal) throw notFound('Không tìm thấy mục tiêu này');
  const amount = positiveAmount(body.amount, 'Số tiền nạp');

  const result = tx(() => {
    run('INSERT INTO goal_deposits (goal_id, amount, note, created_at) VALUES (?,?,?,?)', goal.id, amount, body.note ?? null, nowIso());
    const saved = goal.saved_amount + amount;
    const justCompleted = saved >= goal.target_amount && goal.status !== 'done';
    run(
      'UPDATE goals SET saved_amount = ?, status = ?, completed_at = ? WHERE id = ?',
      saved,
      justCompleted ? 'done' : goal.status,
      justCompleted ? nowIso() : goal.completed_at,
      goal.id,
    );
    return { justCompleted };
  });

  const rewards = useFeature(user.id, 'goals');
  return { ...goalPayload(user.id), justCompleted: result.justCompleted, rewards };
});

featureRouter.patch('/api/goals/:id', ({ user, params, body }) => {
  const goal = get('SELECT * FROM goals WHERE id = ? AND user_id = ?', Number(params.id), user.id);
  if (!goal) throw notFound('Không tìm thấy mục tiêu này');
  run(
    'UPDATE goals SET name = ?, target_amount = ?, deadline = ?, icon = ?, period = ?, status = ? WHERE id = ?',
    body.name ? String(body.name).trim() : goal.name,
    body.targetAmount ? positiveAmount(body.targetAmount, 'Số tiền mục tiêu') : goal.target_amount,
    body.deadline && DAY_RE.test(body.deadline) ? body.deadline : goal.deadline,
    body.icon ?? goal.icon,
    goalPeriod(body.period, goal.period),
    ['active', 'done', 'archived'].includes(body.status) ? body.status : goal.status,
    goal.id,
  );
  return goalPayload(user.id);
});

featureRouter.delete('/api/goals/:id', ({ user, params }) => {
  const goal = get('SELECT * FROM goals WHERE id = ? AND user_id = ?', Number(params.id), user.id);
  if (!goal) throw notFound('Không tìm thấy mục tiêu này');
  run('DELETE FROM goals WHERE id = ?', goal.id);
  return goalPayload(user.id);
});

// ----------------------------------------------------------------- expenses
export const EXPENSE_RANGES = { today: 'Hôm nay', week: 'Tuần này', month: 'Tháng này' };

/**
 * Turns `?range=today|week|month` (or an explicit `?month=YYYY-MM`) into a pair
 * of day keys. Ranges cover the whole period, not just up to today, so an entry
 * back-dated or post-dated inside the period still shows up.
 */
export function resolveRange({ range, month } = {}) {
  const today = dayKey();

  if (month) {
    if (!MONTH_RE.test(month)) throw bad('Tháng phải có dạng YYYY-MM');
    const anchor = `${month}-01`;
    return { range: 'month', from: anchor, to: endOfMonth(anchor), month };
  }

  switch (range) {
    case 'today': return { range: 'today', from: today, to: today, month: monthKey() };
    case 'week': return { range: 'week', from: startOfWeek(today), to: endOfWeek(today), month: monthKey() };
    case 'month':
    case undefined:
    case null:
    case '': return { range: 'month', from: startOfMonth(today), to: endOfMonth(today), month: monthKey() };
    default: throw bad(`Khoảng thời gian không hợp lệ. Chọn: ${Object.keys(EXPENSE_RANGES).join(', ')}`);
  }
}

export function expensePayload(userId, spec = resolveRange()) {
  const { from, to } = spec;

  const list = all(
    `SELECT e.*, c.code AS category_code, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM expenses e LEFT JOIN categories c ON c.id = e.category_id
      WHERE e.user_id = ? AND e.spent_on BETWEEN ? AND ?
      ORDER BY e.spent_on DESC, e.id DESC`,
    userId, from, to,
  );

  const byCategory = all(
    `SELECT c.id, c.code, c.name, c.icon, c.color, SUM(e.amount) AS total, COUNT(*) AS count
       FROM expenses e JOIN categories c ON c.id = e.category_id
      WHERE e.user_id = ? AND e.spent_on BETWEEN ? AND ?
      GROUP BY c.id
      ORDER BY total DESC`,
    userId, from, to,
  );

  const total = list.reduce((sum, e) => sum + e.amount, 0);
  const todayTotal = list.filter((e) => e.spent_on === dayKey()).reduce((sum, e) => sum + e.amount, 0);

  return {
    ...spec,
    label: EXPENSE_RANGES[spec.range],
    ranges: EXPENSE_RANGES,
    expenses: list,
    byCategory: byCategory.map((c) => ({ ...c, percent: total ? Math.round((c.total / total) * 100) : 0 })),
    categories: categories(),
    totals: { total, today: todayTotal, count: list.length },
  };
}

featureRouter.get('/api/expenses', ({ user, url }) => {
  const spec = resolveRange({ range: url.searchParams.get('range'), month: url.searchParams.get('month') });
  const rewards = claimVisit(user.id, 'expenses', url);
  return { ...expensePayload(user.id, spec), rewards };
});

/** Shared by the manual form and by Ekko bot's quick-log flow. */
export function createExpense(userId, body, source = 'manual') {
  const amount = positiveAmount(body.amount);
  const category = resolveCategory(body);
  const spentOn = body.spentOn && DAY_RE.test(body.spentOn) ? body.spentOn : dayKey();
  const note = body.note ? String(body.note).slice(0, 200) : null;

  const info = run(
    'INSERT INTO expenses (user_id, amount, category_id, note, spent_on, source, created_at) VALUES (?,?,?,?,?,?,?)',
    userId, amount, category?.id ?? null, note, spentOn, source, nowIso(),
  );
  const rewards = useFeature(userId, 'expenses');
  const expense = get('SELECT * FROM expenses WHERE id = ?', Number(info.lastInsertRowid));
  return {
    expense,
    category,
    rewards,
    // Khoản chi vẫn được lưu; cảnh báo là lời nhắc, không phải chặn.
    alerts: expenseAlerts(userId, expense, category),
  };
}

featureRouter.post('/api/expenses', ({ user, body }) => {
  const created = createExpense(user.id, body, 'manual');
  return { ...created, ...expensePayload(user.id, resolveRange({ month: created.expense.spent_on.slice(0, 7) })) };
});

/**
 * The bottom quick-entry bar. Same Vietnamese parser Ekko bot uses, so the same
 * sentence works in both places.
 *
 * Whatever is typed here is also written into the Ekko bot chat log: the member
 * typed a sentence and got an answer, which is a conversation whichever box it
 * happened in. Keeping one timeline means "what did I log yesterday" has a single
 * place to look. The rows carry source `quick` so the "Bạn của Ekko bot" badge
 * still counts real conversations only.
 *
 * The expense's own source stays `manual`: the member typed it themselves,
 * parsing is only an input method.
 */
featureRouter.post('/api/expenses/quick', ({ user, body }) => {
  const text = String(body.text || '').trim();
  if (!text) throw bad('Bạn chưa nhập gì');
  if (text.length > 200) throw bad('Nội dung quá dài');

  const parsed = parseAmount(text);
  if (!parsed) {
    throw bad('Chưa thấy số tiền trong câu này. Thử kiểu "cà phê 35k" hoặc "ăn trưa 60 nghìn".');
  }

  const note = extractNote(text);
  const category = guessCategory(note || text, categories());
  const created = createExpense(user.id, {
    amount: parsed.amount,
    categoryId: category?.id,
    note: note || category?.name || null,
  }, 'manual');

  const reply = expenseLoggedReply({ amount: parsed.amount, category, note });
  appendMessages(user.id, [
    { role: 'user', text },
    // rewards: null — thanh ghi nhanh đã hiện phần thưởng ngay lúc ghi rồi.
    {
      role: 'bot',
      text: reply.text + alertLine(created.alerts),
      meta: { kind: reply.kind, action: reply.action, suggestions: reply.suggestions, rewards: null },
    },
  ], 'quick');

  return { ...created, category, ...expensePayload(user.id, resolveRange({ month: created.expense.spent_on.slice(0, 7) })) };
});

featureRouter.delete('/api/expenses/:id', ({ user, params }) => {
  const expense = get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', Number(params.id), user.id);
  if (!expense) throw notFound('Không tìm thấy khoản chi này');
  run('DELETE FROM expenses WHERE id = ?', expense.id);
  return expensePayload(user.id, resolveRange({ month: expense.spent_on.slice(0, 7) }));
});
