/**
 * Ekko bot.
 *
 * Intent order matters and is deliberate:
 *   1. quick expense   - the highest-value shortcut, so it wins whenever the
 *                        message clearly contains money
 *   2. status          - streak / level / budget / spending questions answered
 *                        from the user's own data
 *   3. navigation      - "mở ngân sách" style commands
 *   4. knowledge       - FAQ plus a search over every published lesson frame
 *   5. Claude fallback - only when ANTHROPIC_API_KEY is configured
 *   6. graceful miss   - suggestions, never a dead end
 *
 * Nothing here calls out to the network unless step 5 is reached.
 */
import { all, get } from '../db.js';
import { config } from '../config.js';
import { dayKey, formatVnd, monthKey } from '../lib/time.js';
import { extractNote, guessCategory, normalize, parseAmount, similarity, tokenize } from './nlp.js';
import { expenseLoggedReply } from './botLog.js';
import { alertLine } from './spendingAlerts.js';
import { levelProgress } from './progression.js';
import { readState, streakStatus, MAX_FREEZE_DAYS } from './streak.js';
import { badgeBoard, nextLesson } from './world.js';

// --- static knowledge about the product ---------------------------------
const FAQ = [
  {
    id: 'about-ekko',
    q: ['ekko la gi', 'ekko lam gi', 'gioi thieu ekko', 'ung luong', 'ekko.vn'],
    a: 'Ekko là nền tảng phúc lợi tài chính cho người lao động Việt Nam. Ekko cung cấp ứng lương linh hoạt (nhận trước phần lương bạn đã làm ra, không phí ẩn), các công cụ quản lý tài chính cá nhân, và chương trình Giáo dục tài chính mà bạn đang dùng đây.',
  },
  {
    id: 'about-gdtc',
    q: ['giao duc tai chinh la gi', 'tinh nang nay', 'app nay lam gi', 'choi the nao', 'huong dan'],
    a: 'Đây là hành trình Giáo dục tài chính của Ekko. Bạn là chú heo khám phá các hòn đảo trên trời: đảo trung tâm là cấp độ hiện tại của bạn, xung quanh là 4 đảo chức năng gồm Khám phá (bài học), Lập ngân sách, Mục tiêu tài chính và Ghi chép chi tiêu. Học bài và dùng các chức năng để nhận XP, lên cấp và mở huy hiệu.',
  },
  {
    id: 'streak-rule',
    q: ['streak', 'chuoi ngay', 'dong bang', 'mat streak', 'giu chuoi'],
    a: `Mỗi ngày, hành động đầu tiên của bạn (hoàn thành một bài học, hoặc làm một việc trong ba chức năng: ghi một khoản chi, lưu ngân sách, hoặc đặt/nạp một mục tiêu) sẽ cộng +1 streak. Nếu hôm sau bạn không vào, streak sẽ bị **đóng băng** thay vì mất ngay. Streak giữ được tối đa ${MAX_FREEZE_DAYS} ngày đóng băng. Quay lại trong khoảng đó là chuỗi tiếp tục; qua ${MAX_FREEZE_DAYS} ngày mà vẫn không hoạt động thì chuỗi sẽ mất và bắt đầu lại từ 1.`,
  },
  {
    id: 'levels',
    q: ['cap do', 'level', 'len cap', 'xp', 'diem kinh nghiem', 'bao nhieu cap'],
    a: 'Có 6 cấp độ, mỗi cấp là một hòn đảo riêng với hình chú heo tương ứng: Đảo Khởi Hành, Đảo Ghi Chép, Đảo Kế Hoạch, Đảo Tích Luỹ, Đảo Vững Vàng và Đảo Thịnh Vượng. Bạn lên cấp bằng XP nhận được khi hoàn thành bài học, mô đun và dùng các chức năng mỗi ngày.',
  },
  {
    id: 'badges',
    q: ['huy hieu', 'badge', 'thanh tich'],
    a: 'Huy hiệu ghi lại các cột mốc: hoàn thành bài học đầu tiên, hoàn thành mô đun đầu tiên, streak 7 ngày, lập ngân sách đầu tiên, đạt mục tiêu tiết kiệm và nhiều mốc khác. Mở mục Huy hiệu để xem bạn còn thiếu những gì.',
  },
  {
    id: 'quick-expense',
    q: ['ghi chi tieu nhanh', 'ghi nhanh', 'ghi tien', 'cach ghi chi tieu'],
    a: 'Bạn chỉ cần nhắn cho mình một câu như "cà phê 35k" hoặc "ăn trưa 60 nghìn". Mình sẽ đọc số tiền, đoán nhóm chi tiêu và lưu vào sổ ngay. Nếu đoán sai nhóm, bạn đổi lại trong màn Ghi chép chi tiêu.',
  },
  {
    id: 'privacy',
    q: ['du lieu', 'bao mat', 'rieng tu', 'ai thay duoc'],
    a: 'Dữ liệu chi tiêu, ngân sách và mục tiêu của bạn là riêng tư. Công ty của bạn chỉ thấy số liệu tổng hợp ẩn danh về mức độ tham gia chương trình học, không thấy từng khoản chi của cá nhân.',
  },
  {
    id: 'help-human',
    q: ['gap nguoi that', 'ho tro', 'lien he', 'tong dai', 'nhan vien'],
    a: 'Với các câu hỏi về tài khoản, ứng lương hoặc thanh toán, bạn liên hệ bộ phận hỗ trợ Ekko qua app Ekko chính hoặc bộ phận nhân sự của công ty bạn. Mình chỉ hỗ trợ phần Giáo dục tài chính.',
  },
];

const NAV = [
  { keys: ['mo ngan sach', 'ngan sach', 'lap ngan sach', 'budget'], route: '/app/#/budget', label: 'Lập ngân sách' },
  { keys: ['muc tieu', 'tiet kiem', 'goal'], route: '/app/#/goals', label: 'Mục tiêu tài chính' },
  { keys: ['ghi chep', 'chi tieu', 'so chi tieu'], route: '/app/#/expenses', label: 'Ghi chép chi tiêu' },
  { keys: ['bai hoc', 'kham pha', 'hoc bai', 'mo dun'], route: '/app/#/explore', label: 'Khám phá' },
  { keys: ['huy hieu', 'badge'], route: '/app/#/badges', label: 'Huy hiệu' },
];

const STATUS_KEYS = {
  streak: ['streak', 'chuoi', 'bao nhieu ngay lien tiep'],
  level: ['cap do cua toi', 'toi cap may', 'level cua toi', 'xp cua toi', 'bao nhieu xp', 'toi dang o cap'],
  spending: ['toi tieu bao nhieu', 'chi tieu thang nay', 'da tieu', 'tieu het bao nhieu', 'hom nay tieu'],
  budget: ['ngan sach cua toi', 'con bao nhieu', 'con lai bao nhieu', 'vuot ngan sach'],
  goals: ['muc tieu cua toi', 'tiet kiem duoc bao nhieu', 'con thieu bao nhieu'],
  badges: ['toi co bao nhieu huy hieu', 'huy hieu cua toi'],
};

const matchesAny = (source, keys) => keys.some((k) => source.includes(k));

/** Every lesson frame becomes a searchable snippet. Rebuilt on demand. */
function knowledgeIndex() {
  const rows = all(
    `SELECT f.payload, f.kind, l.id AS lesson_id, l.title AS lesson_title, m.title AS module_title
       FROM frames f
       JOIN lessons l ON l.id = f.lesson_id AND l.is_published = 1
       JOIN modules m ON m.id = l.module_id AND m.is_published = 1
      ORDER BY m.order_index, l.order_index, f.order_index`,
  );

  return rows.map((row) => {
    let payload = {};
    try { payload = JSON.parse(row.payload || '{}'); } catch { /* skip malformed */ }
    const parts = [
      payload.title, payload.body, payload.caption, payload.intro, payload.question,
      ...(payload.hotspots || []).flatMap((h) => [h.label, h.text]),
      ...(payload.options || []).map((o) => o.text),
    ].filter(Boolean);
    return {
      lessonId: row.lesson_id,
      lessonTitle: row.lesson_title,
      moduleTitle: row.module_title,
      title: payload.title || payload.question || row.lesson_title,
      text: parts.join('\n'),
    };
  });
}

function searchLessons(question, limit = 3) {
  const tokens = tokenize(question);
  if (tokens.length < 2) return [];
  return knowledgeIndex()
    .map((doc) => ({ doc, score: similarity(tokens, `${doc.lessonTitle} ${doc.title} ${doc.text}`) }))
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.doc);
}

// --- status answers ------------------------------------------------------
function answerStatus(userId, key) {
  const state = readState(userId);

  if (key === 'streak') {
    const s = streakStatus(userId, dayKey());
    if (s.count === 0) return { text: 'Chuỗi streak của bạn đang là 0. Hoàn thành một bài học, hoặc ghi một khoản chi, lưu ngân sách, hoặc đặt/nạp một mục tiêu hôm nay là bạn có ngay ngày đầu tiên. Chỉ mở màn hình lên xem thì không tính.' };
    if (s.status === 'frozen') {
      return { text: `Chuỗi của bạn đang là **${s.count} ngày** và đang bị đóng băng (${s.frozenDays}/${MAX_FREEZE_DAYS} ngày). Bạn còn **${s.freezeDaysLeft} ngày** để quay lại trước khi mất chuỗi. Học nhanh một bài là cứu được ngay.` };
    }
    if (s.countedToday) return { text: `Chuỗi của bạn là **${s.count} ngày** và hôm nay đã được tính rồi. Kỷ lục của bạn là ${s.best} ngày.` };
    return { text: `Chuỗi của bạn là **${s.count} ngày**, nhưng hôm nay chưa được tính. Làm một việc bất kỳ trong app hôm nay để giữ chuỗi nhé.` };
  }

  if (key === 'level') {
    const p = levelProgress(state.xp);
    if (!p.next) return { text: `Bạn đang ở **${p.level?.name}**, cấp cao nhất, với ${state.xp} XP. Xin chúc mừng.` };
    return { text: `Bạn đang ở **${p.level?.name}** (cấp ${p.level?.order_index}/6) với ${state.xp} XP. Còn **${p.xpToNextLevel} XP** nữa là mở khoá ${p.next.name}.` };
  }

  if (key === 'spending') {
    const month = monthKey();
    const monthTotal = get('SELECT COALESCE(SUM(amount),0) t FROM expenses WHERE user_id = ? AND substr(spent_on,1,7) = ?', userId, month).t;
    const todayTotal = get('SELECT COALESCE(SUM(amount),0) t FROM expenses WHERE user_id = ? AND spent_on = ?', userId, dayKey()).t;
    const top = get(
      `SELECT c.name, SUM(e.amount) t FROM expenses e JOIN categories c ON c.id = e.category_id
        WHERE e.user_id = ? AND substr(e.spent_on,1,7) = ? GROUP BY c.id ORDER BY t DESC LIMIT 1`,
      userId, month,
    );
    if (!monthTotal) return { text: 'Tháng này bạn chưa ghi khoản chi nào. Thử nhắn cho mình "cà phê 35k" để ghi khoản đầu tiên.', action: { type: 'navigate', route: '/app/#/expenses', label: 'Mở sổ chi tiêu' } };
    return {
      text: `Tháng này bạn đã chi **${formatVnd(monthTotal)}**, riêng hôm nay là ${formatVnd(todayTotal)}.${top ? ` Nhóm chi nhiều nhất là **${top.name}** với ${formatVnd(top.t)}.` : ''}`,
      action: { type: 'navigate', route: '/app/#/expenses', label: 'Xem chi tiết' },
    };
  }

  if (key === 'budget') {
    const month = monthKey();
    const budget = get('SELECT * FROM budgets WHERE user_id = ? AND month = ?', userId, month);
    if (!budget) return { text: 'Bạn chưa lập ngân sách cho tháng này. Mở đảo Lập ngân sách, nhập thu nhập và chia cho từng nhóm là xong trong vài phút.', action: { type: 'navigate', route: '/app/#/budget', label: 'Lập ngân sách' } };
    const planned = get('SELECT COALESCE(SUM(planned),0) t FROM budget_items WHERE budget_id = ?', budget.id).t;
    const spent = get('SELECT COALESCE(SUM(amount),0) t FROM expenses WHERE user_id = ? AND substr(spent_on,1,7) = ?', userId, month).t;
    const left = planned - spent;
    return {
      text: left >= 0
        ? `Ngân sách tháng ${month}: bạn đặt **${formatVnd(planned)}**, đã chi ${formatVnd(spent)}, còn lại **${formatVnd(left)}**.`
        : `Ngân sách tháng ${month}: bạn đặt ${formatVnd(planned)} nhưng đã chi ${formatVnd(spent)}, tức **vượt ${formatVnd(-left)}**. Hãy lấy phần bù từ nhóm mong muốn thay vì từ phần tiết kiệm.`,
      action: { type: 'navigate', route: '/app/#/budget', label: 'Mở ngân sách' },
    };
  }

  if (key === 'goals') {
    const goals = all('SELECT * FROM goals WHERE user_id = ? AND status = ? ORDER BY created_at', userId, 'active');
    if (!goals.length) return { text: 'Bạn chưa có mục tiêu tiết kiệm nào đang chạy. Gợi ý: bắt đầu với quỹ khẩn cấp bằng một tháng chi phí thiết yếu.', action: { type: 'navigate', route: '/app/#/goals', label: 'Đặt mục tiêu' } };
    const lines = goals.slice(0, 3).map((g) => {
      const pct = g.target_amount ? Math.round((g.saved_amount / g.target_amount) * 100) : 0;
      return `- **${g.name}**: ${formatVnd(g.saved_amount)} / ${formatVnd(g.target_amount)} (${pct}%)`;
    });
    return { text: `Bạn đang có ${goals.length} mục tiêu:\n${lines.join('\n')}`, action: { type: 'navigate', route: '/app/#/goals', label: 'Mở mục tiêu' } };
  }

  if (key === 'badges') {
    const board = badgeBoard(userId);
    const earned = board.filter((b) => b.earned);
    const nextUp = board.find((b) => !b.earned);
    return {
      text: `Bạn đã có **${earned.length}/${board.length}** huy hiệu.${nextUp ? ` Sắp tới có thể là **${nextUp.name}**: ${nextUp.description}` : ' Bạn đã sưu tầm đủ bộ.'}`,
      action: { type: 'navigate', route: '/app/#/badges', label: 'Xem huy hiệu' },
    };
  }

  return null;
}

// --- Claude fallback (optional) -----------------------------------------
async function askClaude(question, contextText) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.anthropicModel,
      max_tokens: 600,
      system:
        'Bạn là Ekko bot, trợ lý của chương trình Giáo dục tài chính trong app Ekko (nền tảng ứng lương và phúc lợi tài chính cho người lao động Việt Nam). '
        + 'Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, tối đa 4 câu. Chỉ nói về tài chính cá nhân, các bài học trong chương trình, và cách dùng app. '
        + 'Không đưa lời khuyên đầu tư cụ thể cho từng mã, không hứa lợi nhuận. Nếu câu hỏi ngoài phạm vi, hướng người dùng liên hệ bộ phận hỗ trợ Ekko.',
      messages: [{ role: 'user', content: `Ngữ cảnh từ bài học:\n${contextText}\n\nCâu hỏi: ${question}` }],
    }),
  });
  if (!response.ok) throw new Error(`Claude API ${response.status}`);
  const data = await response.json();
  return (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
}

// --- main entry ----------------------------------------------------------
/**
 * @returns {Promise<{text:string, kind:string, action?:object, suggestions?:string[], expense?:object, rewards?:object}>}
 */
export async function respond(userId, rawMessage, { createExpense }) {
  const message = String(rawMessage || '').trim();
  const source = normalize(message);
  if (!message) return { kind: 'empty', text: 'Bạn muốn hỏi mình điều gì?' };

  // 1. Quick expense: only when there is a real money marker.
  const amount = parseAmount(message);
  const looksLikeQuestion = /\?|^(la|tai sao|vi sao|the nao|lam sao|nhu the nao|cai gi|khi nao|bao gio)\b/.test(source)
    || /\b(la gi|nghia la|giai thich|huong dan|tai sao|vi sao)\b/.test(source);

  if (amount && !looksLikeQuestion) {
    const categories = all('SELECT * FROM categories ORDER BY order_index');
    const note = extractNote(message);
    const category = guessCategory(note || message, categories);
    const created = createExpense(userId, {
      amount: amount.amount,
      categoryId: category?.id,
      note: note || category?.name || null,
    }, 'bot');

    // Câu xác nhận dùng chung với thanh ghi nhanh, xem services/botLog.js.
    const reply = expenseLoggedReply({ amount: amount.amount, category, note });
    return {
      ...reply,
      text: reply.text + alertLine(created.alerts),
      expense: created.expense,
      rewards: created.rewards,
      alerts: created.alerts,
    };
  }

  // 2. Questions about the user's own numbers.
  for (const [key, keys] of Object.entries(STATUS_KEYS)) {
    if (!matchesAny(source, keys)) continue;
    const answer = answerStatus(userId, key);
    if (answer) return { kind: `status_${key}`, ...answer };
  }

  // 3. Navigation commands.
  if (/^(mo|vao|di den|chuyen den|toi)\b/.test(source)) {
    const target = NAV.find((n) => matchesAny(source, n.keys));
    if (target) {
      return {
        kind: 'navigate',
        text: `Mình mở **${target.label}** cho bạn.`,
        action: { type: 'navigate', route: target.route, label: target.label },
      };
    }
  }

  // 4. Product FAQ.
  const faqHit = FAQ.find((entry) => entry.q.some((k) => source.includes(k)));
  if (faqHit) {
    return { kind: 'faq', text: faqHit.a, suggestions: ['Streak hoạt động thế nào?', 'Tôi đang ở cấp mấy?'] };
  }

  // 5. Lesson search.
  const hits = searchLessons(message);
  if (hits.length) {
    const top = hits[0];
    const excerpt = top.text.split('\n').filter(Boolean).slice(0, 3).join(' ').slice(0, 420);
    return {
      kind: 'lesson',
      text: `Nội dung này nằm trong bài **${top.lessonTitle}** (mô đun ${top.moduleTitle}):\n\n${excerpt}`,
      action: { type: 'open_lesson', lessonId: top.lessonId, label: `Học bài "${top.lessonTitle}"` },
      suggestions: hits.slice(1).map((h) => h.lessonTitle),
    };
  }

  // 6. Optional Claude fallback, grounded in the closest lesson content.
  if (config.anthropicApiKey) {
    try {
      const context = knowledgeIndex().slice(0, 12).map((d) => `${d.lessonTitle}: ${d.text.slice(0, 300)}`).join('\n---\n');
      const text = await askClaude(message, context);
      if (text) return { kind: 'ai', text };
    } catch {
      // Fall through to the offline answer below rather than surfacing an API error.
    }
  }

  // 7. Never a dead end.
  const state = readState(userId);
  const level = levelProgress(state.xp).level;
  const suggestion = nextLesson(userId, level ? level.order_index : 1);
  return {
    kind: 'fallback',
    text: 'Mình chưa chắc về câu này. Mình giúp được các việc sau: giải thích nội dung bài học, cho biết streak / cấp độ / chi tiêu của bạn, và ghi chi tiêu nhanh khi bạn nhắn kiểu "cà phê 35k".',
    action: suggestion ? { type: 'open_lesson', lessonId: suggestion.id, label: `Học tiếp "${suggestion.title}"` } : undefined,
    suggestions: ['Quỹ khẩn cấp là gì?', 'Quy tắc 50/30/20', 'Streak của tôi thế nào?'],
  };
}

export const botCapabilities = {
  faqTopics: FAQ.map((f) => f.id),
  quickExpenseExamples: ['cà phê 35k', 'ăn trưa 60 nghìn', 'grab về nhà 85k', 'mua sách 250.000đ'],
  aiFallback: Boolean(config.anthropicApiKey),
};
