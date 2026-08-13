/**
 * Cảnh báo khi một khoản chi vừa ghi trông bất thường.
 *
 * Việc cần bắt nhất là **gõ nhầm số**: "ăn trưa 2 triệu" gần như luôn là 200
 * nghìn bị gõ thêm số 0. Việc thứ hai là nhắc nhẹ khi một lần chi ăn hết phần
 * lớn hạn mức của cả tháng.
 *
 * Ba luật, xếp theo mức đáng nói:
 *
 *   1. `daily_large`   — vượt ngưỡng "một lần" của nhóm (Admin đặt được).
 *   2. `personal_spike`— gấp nhiều lần mức thường của chính người dùng.
 *   3. `budget_share`  — một khoản chiếm phần lớn hạn mức tháng của nhóm.
 *
 * Ngưỡng của nhóm chỉ là phỏng đoán mặc định. Nếu chính người dùng vẫn thường
 * chi ở mức đó (`normalForYou`) thì luật 1 im lặng — người hay ăn nhà hàng không
 * đáng bị nhắc mỗi ngày. Đó là lý do luật 1 và luật 2 phải đi cùng nhau.
 */
import { all, get } from '../db.js';
import { formatVnd, monthKey } from '../lib/time.js';

/** Số bản ghi tối thiểu để "mức thường của bạn" có nghĩa. */
const MIN_HISTORY = 5;
/** Lấy mức giữa của 20 khoản gần nhất, không lấy trung bình: một khoản lệch lớn không kéo mức tham chiếu. */
const HISTORY_WINDOW = 20;
const SPIKE_FACTOR = 4;
const NORMAL_FACTOR = 3;
/** Một khoản bằng nửa hạn mức tháng của nhóm là đáng nói. */
const BUDGET_SHARE = 0.5;

function personalMedian(userId, categoryId, excludeId) {
  if (!categoryId) return null;
  const rows = all(
    `SELECT amount FROM expenses
      WHERE user_id = ? AND category_id = ? AND id <> ?
      ORDER BY id DESC LIMIT ?`,
    userId, categoryId, excludeId ?? 0, HISTORY_WINDOW,
  ).map((r) => r.amount);

  if (rows.length < MIN_HISTORY) return null;
  const sorted = rows.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function categoryPlan(userId, categoryId, month) {
  if (!categoryId) return null;
  const row = get(
    `SELECT bi.planned
       FROM budget_items bi JOIN budgets b ON b.id = bi.budget_id
      WHERE b.user_id = ? AND b.month = ? AND bi.category_id = ?`,
    userId, month, categoryId,
  );
  return row?.planned > 0 ? row.planned : null;
}

/**
 * @returns {Array<{code:string, tone:string, title:string, text:string}>}
 *          Rỗng nếu khoản chi này bình thường. Phần tử đầu là cái đáng nói nhất.
 */
export function expenseAlerts(userId, expense, category) {
  const amount = Number(expense?.amount) || 0;
  if (amount <= 0) return [];

  const alerts = [];
  const name = category?.name || 'Khác';
  const limit = category?.daily_limit > 0 ? category.daily_limit : null;
  const median = personalMedian(userId, expense.category_id, expense.id);

  const normalForYou = median !== null && amount <= median * NORMAL_FACTOR;
  const spike = median !== null && amount >= median * SPIKE_FACTOR;

  if (limit && amount >= limit && !normalForYou) {
    alerts.push({
      code: 'daily_large',
      tone: 'warning',
      title: `${formatVnd(amount)} cho một lần ${name.toLowerCase()}?`,
      text: `Mức này lớn bất thường cho một khoản ${name.toLowerCase()} thường ngày (trên ${formatVnd(limit)}). Nếu bạn gõ nhầm số, sửa lại trong sổ chi tiêu nhé.`,
    });
  } else if (spike) {
    alerts.push({
      code: 'personal_spike',
      tone: 'warning',
      title: `Gấp ${Math.floor(amount / median)} lần mức thường của bạn`,
      text: `Bạn thường chi khoảng ${formatVnd(median)} mỗi lần ở nhóm ${name}. Khoản này là ${formatVnd(amount)}.`,
    });
  }

  const planned = categoryPlan(userId, expense.category_id, expense.spent_on?.slice(0, 7) || monthKey());
  if (planned && amount >= planned * BUDGET_SHARE) {
    const share = Math.round((amount / planned) * 100);
    alerts.push({
      code: 'budget_share',
      tone: 'warning',
      title: `Một khoản bằng ${share}% hạn mức ${name}`,
      text: `Hạn mức ${name} tháng này là ${formatVnd(planned)}. Riêng khoản vừa ghi đã chiếm ${share}%.`,
    });
  }

  return alerts;
}

/** Một dòng gọn để chèn vào câu trả lời của Ekko bot. */
export const alertLine = (alerts) => (alerts.length ? `\n\n⚠️ **${alerts[0].title}** ${alerts[0].text}` : '');
