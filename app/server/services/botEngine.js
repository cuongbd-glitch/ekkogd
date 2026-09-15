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
import { dayKey, formatMonth, formatVnd, monthKey } from '../lib/time.js';
import { extractNote, guessCategory, normalize, parseAmount, similarity, tokenize } from './nlp.js';
import { expenseLoggedReply } from './botLog.js';
import { alertLine } from './spendingAlerts.js';
import { levelProgress } from './progression.js';
import { readState, streakStatus, MAX_FREEZE_DAYS } from './streak.js';
import { badgeBoard, nextLesson } from './world.js';
import { tr } from '../i18n/index.js';

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
  { keys: ['muc tieu', 'tiet kiem', 'goal', 'saving'], route: '/app/#/goals', label: 'Mục tiêu tài chính' },
  { keys: ['ghi chep', 'chi tieu', 'so chi tieu', 'expense', 'spending log'], route: '/app/#/expenses', label: 'Ghi chép chi tiêu' },
  { keys: ['bai hoc', 'kham pha', 'hoc bai', 'mo dun', 'lesson', 'module'], route: '/app/#/explore', label: 'Khám phá' },
  { keys: ['huy hieu', 'badge'], route: '/app/#/badges', label: 'Huy hiệu' },
];

// Từ khoá cả hai thứ tiếng: bản tiếng Anh của app gửi câu hỏi bằng tiếng Anh,
// nên nếu chỉ có từ khoá tiếng Việt thì mọi câu hỏi đều rơi xuống nhánh AI.
const STATUS_KEYS = {
  streak: ['streak', 'chuoi', 'bao nhieu ngay lien tiep', 'my streak', 'days in a row'],
  level: ['cap do cua toi', 'toi cap may', 'level cua toi', 'xp cua toi', 'bao nhieu xp', 'toi dang o cap',
    'my level', 'what level', 'my xp', 'how much xp'],
  spending: ['toi tieu bao nhieu', 'chi tieu thang nay', 'da tieu', 'tieu het bao nhieu', 'hom nay tieu',
    'have i spent', 'spent this month', 'my spending', 'how much did i spend'],
  budget: ['ngan sach cua toi', 'con bao nhieu', 'con lai bao nhieu', 'vuot ngan sach',
    'my budget', 'budget left', 'left in my budget', 'over budget'],
  goals: ['muc tieu cua toi', 'tiet kiem duoc bao nhieu', 'con thieu bao nhieu',
    'my goals', 'how much have i saved'],
  badges: ['toi co bao nhieu huy hieu', 'huy hieu cua toi', 'my badges', 'how many badges'],
};

const matchesAny = (source, keys) => keys.some((k) => source.includes(k));

/**
 * Câu trả lời của bot, hai ngôn ngữ.
 *
 * Mỗi câu là một mẫu có chỗ trống; **giá trị điền vào luôn là dữ liệu thô** (số
 * tiền chưa định dạng, tên nhóm/cấp độ ở dạng tiếng Việt gốc). Kiểu của chỗ
 * trống nói cách in ra:
 *
 *   `{count}`            in thẳng
 *   `{money:spent}`      số tiền, theo cách viết của ngôn ngữ đang chọn
 *   `{name:category}`    tên trong dữ liệu, tra bảng đối chiếu
 *   `{month:month}`      "2026-09" → "Tháng 9/2026" / "September 2026"
 *   `{parts:excerpt}`    một mảng câu, mỗi câu tra bảng rồi nối lại
 *   `{goals:goals}`      danh sách mục tiêu, mỗi dòng một mục
 *
 * Nhờ vậy `meta.say` lưu trong sổ chat dựng lại được nguyên văn ở ngôn ngữ khác
 * mà không phải tính lại số liệu — con số của câu nói tháng trước vẫn là con số
 * của tháng trước.
 */
export const SAY = {
  vi: {
    streakZero: 'Chuỗi streak của bạn đang là 0. Hoàn thành một bài học, hoặc ghi một khoản chi, lưu ngân sách, hoặc đặt/nạp một mục tiêu hôm nay là bạn có ngay ngày đầu tiên. Chỉ mở màn hình lên xem thì không tính.',
    streakFrozen: 'Chuỗi của bạn đang là **{count} ngày** và đang bị đóng băng ({frozen}/{max} ngày). Bạn còn **{left} ngày** để quay lại trước khi mất chuỗi. Học nhanh một bài là cứu được ngay.',
    streakToday: 'Chuỗi của bạn là **{count} ngày** và hôm nay đã được tính rồi. Kỷ lục của bạn là {best} ngày.',
    streakPending: 'Chuỗi của bạn là **{count} ngày**, nhưng hôm nay chưa được tính. Làm một việc bất kỳ trong app hôm nay để giữ chuỗi nhé.',
    levelTop: 'Bạn đang ở **{name:level}**, cấp cao nhất, với {xp} XP. Xin chúc mừng.',
    levelOn: 'Bạn đang ở **{name:level}** (cấp {order}/6) với {xp} XP. Còn **{toNext} XP** nữa là mở khoá {name:next}.',
    spendNone: 'Tháng này bạn chưa ghi khoản chi nào. Thử nhắn cho mình "cà phê 35k" để ghi khoản đầu tiên.',
    spendSome: 'Tháng này bạn đã chi **{money:month}**, riêng hôm nay là {money:today}.',
    spendTop: ' Nhóm chi nhiều nhất là **{name:category}** với {money:total}.',
    budgetNone: 'Bạn chưa lập ngân sách cho tháng này. Mở màn Lập ngân sách, nhập thu nhập và chia cho từng nhóm là xong trong vài phút.',
    budgetLeft: 'Ngân sách {month:month}: bạn đặt **{money:planned}**, đã chi {money:spent}, còn lại **{money:left}**.',
    budgetOver: 'Ngân sách {month:month}: bạn đặt {money:planned} nhưng đã chi {money:spent}, tức **vượt {money:over}**. Hãy lấy phần bù từ nhóm mong muốn thay vì từ phần tiết kiệm.',
    goalsNone: 'Bạn chưa có mục tiêu tiết kiệm nào đang chạy. Gợi ý: bắt đầu với quỹ khẩn cấp bằng một tháng chi phí thiết yếu.',
    goalsSome: 'Bạn đang có {count} mục tiêu:\n{goals:goals}',
    badgesLine: 'Bạn đã có **{got}/{total}** huy hiệu.',
    badgesNext: ' Sắp tới có thể là **{name:badge}**: {name:description}',
    badgesAll: ' Bạn đã sưu tầm đủ bộ.',
    empty: 'Bạn muốn hỏi mình điều gì?',
    opening: 'Mình mở **{name:label}** cho bạn.',
    lessonHit: 'Nội dung này nằm trong bài **{name:lesson}** (mô đun {name:module}):\n\n{parts:excerpt}',
    lessonOpen: 'Học bài "{name:lesson}"',
    lessonNext: 'Học tiếp "{name:lesson}"',
    fallback: 'Mình chưa chắc về câu này. Mình giúp được các việc sau: giải thích nội dung bài học, cho biết streak / cấp độ / chi tiêu của bạn, và ghi chi tiêu nhanh khi bạn nhắn kiểu "cà phê 35k".',
  },
  en: {
    streakZero: 'Your streak is at 0. Finish a lesson, log an expense, save a budget, or set up or top up a goal today and you have day one. Just opening the screen does not count.',
    streakFrozen: 'Your streak is **{count} days** and currently frozen ({frozen}/{max} days). You have **{left} days** to come back before you lose it. One quick lesson saves it.',
    streakToday: 'Your streak is **{count} days** and today is already counted. Your record is {best} days.',
    streakPending: 'Your streak is **{count} days**, but today is not counted yet. Do anything at all in the app today to keep it.',
    levelTop: 'You are at **{name:level}**, the top level, with {xp} XP. Congratulations.',
    levelOn: 'You are at **{name:level}** (level {order} of 6) with {xp} XP. **{toNext} XP** more unlocks {name:next}.',
    spendNone: 'You have not logged any expenses this month. Try messaging me "coffee 35k" to log your first.',
    spendSome: 'You have spent **{money:month}** this month, and {money:today} today.',
    spendTop: ' Your biggest category is **{name:category}** at {money:total}.',
    budgetNone: 'You have not set a budget for this month. Open the Budget screen, enter your income and split it by category — it takes a few minutes.',
    budgetLeft: '{month:month} budget: you set **{money:planned}**, spent {money:spent}, and have **{money:left}** left.',
    budgetOver: '{month:month} budget: you set {money:planned} but spent {money:spent}, which is **{money:over} over**. Cover the gap from your wants rather than from your savings.',
    goalsNone: 'You have no active savings goals. A good start: an emergency fund worth one month of essential costs.',
    goalsSome: 'You have {count} goals:\n{goals:goals}',
    badgesLine: 'You have **{got}/{total}** badges.',
    badgesNext: ' Next up could be **{name:badge}**: {name:description}',
    badgesAll: ' You have collected the full set.',
    empty: 'What would you like to ask me?',
    opening: 'Opening **{name:label}** for you.',
    lessonHit: 'This is covered in **{name:lesson}** (module {name:module}):\n\n{parts:excerpt}',
    lessonOpen: 'Open “{name:lesson}”',
    lessonNext: 'Continue “{name:lesson}”',
    fallback: 'I am not sure about that one. Here is what I can do: explain lesson content, tell you your streak, level or spending, and log an expense when you message me something like "coffee 35k".',
  },
};

const PLACEHOLDER = /\{(?:(money|name|month|parts|goals):)?(\w+)\}/g;

/**
 * Ba dòng đầu của một khung bài, tối đa 420 ký tự. Tách thành hàm riêng vì phần
 * khôi phục câu cũ (`seed/chatReplay.js`) phải cắt y hệt mới so khớp được.
 */
export const excerptOf = (parts) => [].concat(parts).join('\n')
  .split('\n').filter(Boolean).slice(0, 3).join(' ')
  .slice(0, 420);

/** Dựng một câu của bot ở ngôn ngữ `lang` từ mẫu `key` và dữ liệu thô `vars`. */
export function say(lang, key, vars) {
  const template = SAY[lang]?.[key] ?? SAY.vi[key] ?? '';

  return String(template).replace(PLACEHOLDER, (whole, kind, name) => {
    const value = vars?.[name];
    if (value === undefined || value === null) return whole;
    if (kind === 'money') return formatVnd(value, lang);
    if (kind === 'name') return tr(value, lang);
    if (kind === 'month') return formatMonth(value, lang);
    // Đoạn trích: dịch từng câu rồi mới cắt, nên bản tiếng Anh cũng gọn đúng
    // ba dòng chứ không dán cả khung bài vào khung chat.
    if (kind === 'parts') return excerptOf([].concat(value).map((part) => tr(part, lang)));
    if (kind === 'goals') {
      return [].concat(value)
        .map((g) => `- **${tr(g.name, lang)}**: ${formatVnd(g.saved, lang)} / ${formatVnd(g.target, lang)} (${g.percent}%)`)
        .join('\n');
    }
    return String(value);
  })
    // Tiếng Anh chia số ít/số nhiều; mẫu tiếng Việt viết thẳng "ngày" nên hai
    // dòng này không có gì để sửa ở bản tiếng Việt.
    .replace(/\b1 days\b/g, '1 day')
    .replace(/\b1 goals\b/g, '1 goal');
}

/**
 * Một câu của bot kèm "công thức" để nói lại: `text` để hiển thị ngay, `say` để
 * sổ chat dựng lại đúng câu đó ở ngôn ngữ khác.
 */
const speak = (lang, key, vars) => ({ text: say(lang, key, vars), say: { key, vars } });

/**
 * Every lesson frame becomes a searchable snippet. Rebuilt on demand.
 *
 * Bản tiếng Anh tra trên **nội dung đã dịch**: câu hỏi tiếng Anh mà đi so với
 * nội dung tiếng Việt thì không bao giờ khớp, và người dùng sẽ luôn rơi xuống
 * câu trả lời "mình chưa chắc".
 */
function knowledgeIndex(lang = 'vi') {
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
      lessonTitle: tr(row.lesson_title, lang),
      moduleTitle: tr(row.module_title, lang),
      title: tr(payload.title || payload.question || row.lesson_title, lang),
      text: parts.map((part) => tr(part, lang)).join('\n'),
      // Bản gốc tiếng Việt đi kèm: câu trả lời lưu bản gốc để đọc lại được ở
      // ngôn ngữ khác, còn phần dò tìm thì dùng bản đã dịch ở trên.
      source: { lessonTitle: row.lesson_title, moduleTitle: row.module_title, parts },
    };
  });
}

function searchLessons(question, limit = 3, lang = 'vi') {
  const tokens = tokenize(question);
  if (tokens.length < 2) return [];
  return knowledgeIndex(lang)
    .map((doc) => ({ doc, score: similarity(tokens, `${doc.lessonTitle} ${doc.title} ${doc.text}`) }))
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.doc);
}

// --- status answers ------------------------------------------------------
/**
 * Trả lời từ số liệu của chính người dùng.
 *
 * Mỗi câu trả về kèm `say` — mẫu câu và dữ liệu thô đã dùng — nên sổ chat đọc
 * lại được đúng câu đó ở ngôn ngữ khác mà không phải tính lại: con số của hôm
 * nói vẫn là con số của hôm nói.
 */
function answerStatus(userId, key, lang) {
  const state = readState(userId);

  if (key === 'streak') {
    const s = streakStatus(userId, dayKey());
    if (s.count === 0) return speak(lang, 'streakZero');
    if (s.status === 'frozen') {
      return speak(lang, 'streakFrozen',
        { count: s.count, frozen: s.frozenDays, max: MAX_FREEZE_DAYS, left: s.freezeDaysLeft });
    }
    if (s.countedToday) return speak(lang, 'streakToday', { count: s.count, best: s.best });
    return speak(lang, 'streakPending', { count: s.count });
  }

  if (key === 'level') {
    const p = levelProgress(state.xp);
    if (!p.next) return speak(lang, 'levelTop', { level: p.level?.name, xp: state.xp });
    return speak(lang, 'levelOn', {
      level: p.level?.name, order: p.level?.order_index, xp: state.xp,
      toNext: p.xpToNextLevel, next: p.next.name,
    });
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
    if (!monthTotal) {
      return {
        ...speak(lang, 'spendNone'),
        action: { type: 'navigate', route: '/app/#/expenses', label: 'Mở sổ chi tiêu' },
      };
    }
    // Hai mẫu ghép lại: câu tổng, rồi câu nhóm chi nhiều nhất nếu có.
    const vars = { month: monthTotal, today: todayTotal, category: top?.name, total: top?.t };
    return {
      text: say(lang, 'spendSome', vars) + (top ? say(lang, 'spendTop', vars) : ''),
      say: { key: top ? 'spendSome+spendTop' : 'spendSome', vars },
      action: { type: 'navigate', route: '/app/#/expenses', label: 'Xem chi tiết' },
    };
  }

  if (key === 'budget') {
    const month = monthKey();
    const budget = get('SELECT * FROM budgets WHERE user_id = ? AND month = ?', userId, month);
    if (!budget) {
      return {
        ...speak(lang, 'budgetNone'),
        action: { type: 'navigate', route: '/app/#/budget', label: 'Lập ngân sách' },
      };
    }
    const planned = get('SELECT COALESCE(SUM(planned),0) t FROM budget_items WHERE budget_id = ?', budget.id).t;
    const spent = get('SELECT COALESCE(SUM(amount),0) t FROM expenses WHERE user_id = ? AND substr(spent_on,1,7) = ?', userId, month).t;
    const left = planned - spent;
    return {
      ...speak(lang, left >= 0 ? 'budgetLeft' : 'budgetOver',
        { month, planned, spent, left, over: -left }),
      action: { type: 'navigate', route: '/app/#/budget', label: 'Mở ngân sách' },
    };
  }

  if (key === 'goals') {
    const goals = all('SELECT * FROM goals WHERE user_id = ? AND status = ? ORDER BY created_at', userId, 'active');
    if (!goals.length) {
      return {
        ...speak(lang, 'goalsNone'),
        action: { type: 'navigate', route: '/app/#/goals', label: 'Đặt mục tiêu' },
      };
    }
    const list = goals.slice(0, 3).map((g) => ({
      name: g.name,
      saved: g.saved_amount,
      target: g.target_amount,
      percent: g.target_amount ? Math.round((g.saved_amount / g.target_amount) * 100) : 0,
    }));
    return {
      ...speak(lang, 'goalsSome', { count: goals.length, goals: list }),
      action: { type: 'navigate', route: '/app/#/goals', label: 'Mở mục tiêu' },
    };
  }

  if (key === 'badges') {
    const board = badgeBoard(userId);
    const earned = board.filter((b) => b.earned);
    const nextUp = board.find((b) => !b.earned);
    const vars = {
      got: earned.length, total: board.length,
      badge: nextUp?.name, description: nextUp?.description,
    };
    return {
      text: say(lang, 'badgesLine', vars) + say(lang, nextUp ? 'badgesNext' : 'badgesAll', vars),
      say: { key: nextUp ? 'badgesLine+badgesNext' : 'badgesLine+badgesAll', vars },
      action: { type: 'navigate', route: '/app/#/badges', label: 'Xem huy hiệu' },
    };
  }

  return null;
}

/**
 * Dựng lại một câu bot đã nói, ở ngôn ngữ đang chọn.
 *
 * `key` có thể là hai mẫu nối bằng `+` (câu tổng + câu bổ sung) — sổ chat lưu
 * đúng như lúc nói, nên đọc lại không bị mất nửa câu.
 */
export const replaySay = (ref, lang) => (ref?.key
  ? ref.key.split('+').map((key) => say(lang, key, ref.vars)).join('')
  : null);

// --- Claude fallback (optional) -----------------------------------------
async function askClaude(question, contextText, lang) {
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
        // Ngôn ngữ trả lời đi theo ngôn ngữ người dùng đang chọn trong app.
        + (lang === 'en'
          ? 'Answer in English, briefly and warmly, at most 4 sentences. '
          : 'Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, tối đa 4 câu. ')
        + 'Chỉ nói về tài chính cá nhân, các bài học trong chương trình, và cách dùng app. '
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
export async function respond(userId, rawMessage, { createExpense, lang = 'vi' }) {
  const message = String(rawMessage || '').trim();
  const source = normalize(message);
  if (!message) return { kind: 'empty', ...speak(lang, 'empty') };

  // 1. Quick expense: only when there is a real money marker.
  const amount = parseAmount(message);
  const looksLikeQuestion = /\?|^(la|tai sao|vi sao|the nao|lam sao|nhu the nao|cai gi|khi nao|bao gio)\b/.test(source)
    || /\b(la gi|nghia la|giai thich|huong dan|tai sao|vi sao)\b/.test(source);

  if (amount && !looksLikeQuestion) {
    const categories = all('SELECT * FROM categories ORDER BY order_index');
    const note = extractNote(message);
    const category = guessCategory(note || message, categories);
    const created = await createExpense(userId, {
      amount: amount.amount,
      categoryId: category?.id,
      note: note || category?.name || null,
    }, 'bot', lang);

    // Câu xác nhận dùng chung với thanh ghi nhanh, xem services/botLog.js.
    const reply = expenseLoggedReply({ amount: amount.amount, category, note }, lang);
    return {
      ...reply,
      text: reply.text + alertLine(created.alerts, lang),
      expense: created.expense,
      rewards: created.rewards,
      alerts: created.alerts,
    };
  }

  // 2. Questions about the user's own numbers.
  for (const [key, keys] of Object.entries(STATUS_KEYS)) {
    if (!matchesAny(source, keys)) continue;
    const answer = answerStatus(userId, key, lang);
    if (answer) return { kind: `status_${key}`, ...answer };
  }

  // 3. Navigation commands.
  if (/^(mo|vao|di den|chuyen den|toi|open|go to|show|take me to)\b/.test(source)) {
    const target = NAV.find((n) => matchesAny(source, n.keys));
    if (target) {
      return {
        kind: 'navigate',
        ...speak(lang, 'opening', { label: target.label }),
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
  const hits = searchLessons(message, 3, lang);
  if (hits.length) {
    const top = hits[0];
    // Cả khung bài ở dạng gốc; `{parts:...}` dịch từng câu rồi tự cắt gọn.
    const excerpt = top.source.parts;
    return {
      kind: 'lesson',
      ...speak(lang, 'lessonHit', {
        lesson: top.source.lessonTitle, module: top.source.moduleTitle, excerpt,
      }),
      // `labelSay` để nhãn nút cũng đọc lại được ở ngôn ngữ khác, giống phần chữ.
      action: {
        type: 'open_lesson',
        lessonId: top.lessonId,
        label: say(lang, 'lessonOpen', { lesson: top.source.lessonTitle }),
        labelSay: { key: 'lessonOpen', vars: { lesson: top.source.lessonTitle } },
      },
      suggestions: hits.slice(1).map((h) => h.source.lessonTitle),
    };
  }

  // 6. Optional Claude fallback, grounded in the closest lesson content.
  if (config.anthropicApiKey) {
    try {
      const context = knowledgeIndex(lang).slice(0, 12).map((d) => `${d.lessonTitle}: ${d.text.slice(0, 300)}`).join('\n---\n');
      const text = await askClaude(message, context, lang);
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
    ...speak(lang, 'fallback'),
    action: suggestion
      ? {
        type: 'open_lesson',
        lessonId: suggestion.id,
        label: say(lang, 'lessonNext', { lesson: suggestion.title }),
        labelSay: { key: 'lessonNext', vars: { lesson: suggestion.title } },
      }
      : undefined,
    suggestions: ['Quỹ khẩn cấp là gì?', 'Quy tắc 50/30/20', 'Streak của tôi thế nào?'],
  };
}

export const botCapabilities = {
  faqTopics: FAQ.map((f) => f.id),
  quickExpenseExamples: ['cà phê 35k', 'ăn trưa 60 nghìn', 'grab về nhà 85k', 'mua sách 250.000đ'],
  aiFallback: Boolean(config.anthropicApiKey),
};
