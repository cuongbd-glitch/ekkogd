/**
 * Sổ hội thoại của Ekko bot.
 *
 * Một cái sổ duy nhất cho hai đường vào: khung chat, và thanh ghi nhanh ở đáy
 * màn hình. Ghi nhanh cũng là một câu người dùng tự gõ ("cà phê 35k"), nên nó
 * hiện trong khung chat y như khi nhắn cho bot — người dùng chỉ có một dòng thời
 * gian, không phải hai chỗ rời rạc.
 *
 * `source` phân biệt hai đường vào: huy hiệu "Bạn của Ekko bot" chỉ đếm trò
 * chuyện thật ('chat'), không đếm ghi nhanh ('quick').
 */
import { run } from '../db.js';
import { formatVnd, nowIso } from '../lib/time.js';

export const CHAT_SOURCES = ['chat', 'quick'];

export function appendMessages(userId, messages, source = 'chat') {
  const at = nowIso();
  for (const message of messages) {
    run(
      'INSERT INTO bot_messages (user_id, role, text, meta, created_at, source) VALUES (?,?,?,?,?,?)',
      userId,
      message.role,
      message.text,
      message.meta ? JSON.stringify(message.meta) : null,
      at,
      source,
    );
  }
}

/**
 * Câu xác nhận sau khi ghi một khoản chi. Dùng chung cho Ekko bot và thanh ghi
 * nhanh, nên hai đường vào nói cùng một kiểu trong khung chat.
 */
export function expenseLoggedReply({ amount, category, note }) {
  return {
    kind: 'expense_logged',
    text: `Đã ghi **${formatVnd(amount)}** vào nhóm ${category?.icon || ''} **${category?.name || 'Khác'}**${note ? ` (${note})` : ''}. Nếu nhóm chưa đúng, bạn đổi trong sổ chi tiêu nhé.`,
    action: { type: 'navigate', route: '/app/#/expenses', label: 'Mở sổ chi tiêu' },
    suggestions: ['Tháng này tôi tiêu bao nhiêu?', 'Ngân sách còn bao nhiêu?'],
  };
}
