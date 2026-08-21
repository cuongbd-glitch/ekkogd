/**
 * End-to-end smoke test. Boots the real server on a scratch database, then
 * exercises SSO, learning, the three tools, Ekko bot and the admin API over
 * HTTP. Run with `npm run smoke`.
 *
 * The streak rules are also checked directly against the service, because the
 * freeze window spans days and cannot be driven through the HTTP surface.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = mkdtempSync(join(tmpdir(), 'gdtc-smoke-'));
const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const section = (title) => console.log(`\n${title}`);

// --- a cookie-aware fetch ------------------------------------------------
const jars = new Map();

async function call(jar, method, path, body) {
  const headers = {};
  const cookie = jars.get(jar);
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers['content-type'] = 'application/json';

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });

  const setCookie = response.headers.getSetCookie?.() || [];
  for (const raw of setCookie) {
    const pair = raw.split(';')[0];
    jars.set(jar, pair);
  }

  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* redirect bodies are empty */ }
  return { status: response.status, json, headers: response.headers };
}

const get = (jar, path) => call(jar, 'GET', path);
const post = (jar, path, body = {}) => call(jar, 'POST', path, body);
const patch = (jar, path, body = {}) => call(jar, 'PATCH', path, body);
const put = (jar, path, body = {}) => call(jar, 'PUT', path, body);
const del = (jar, path) => call(jar, 'DELETE', path);

// --- server lifecycle ----------------------------------------------------
function startServer() {
  const child = spawn(process.execPath, [join(ROOT, 'server', 'index.js')], {
    env: { ...process.env, PORT: String(PORT), EKKO_DATA_DIR: DATA_DIR, NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  return child;
}

async function waitForServer(attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${BASE}/healthz`);
      if (response.ok) return await response.json();
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('Máy chủ không khởi động kịp');
}

// --- streak rules, tested directly against the service -------------------
async function testStreakRules() {
  section('Quy tắc streak (đóng băng tối đa 3 ngày)');

  process.env.EKKO_DATA_DIR = DATA_DIR;
  const { touchStreak, streakStatus, readState } = await import('../server/services/streak.js');
  const { db, run, get: dbGet } = await import('../server/db.js');

  const now = new Date().toISOString();
  run('INSERT INTO users (ekko_user_id, name, role, created_at) VALUES (?,?,?,?)', 'streak-test', 'Streak Test', 'member', now);
  const userId = dbGet('SELECT id FROM users WHERE ekko_user_id = ?', 'streak-test').id;
  run('INSERT INTO user_state (user_id, updated_at) VALUES (?, ?)', userId, now);

  const reset = (count, lastDay) => run(
    'UPDATE user_state SET streak_count = ?, streak_best = ?, last_active_day = ?, updated_at = ? WHERE user_id = ?',
    count, count, lastDay, now, userId,
  );

  // gap 1: a normal consecutive day
  reset(5, '2026-03-01');
  check('Ngày liên tiếp (cách 1 ngày) → +1', touchStreak(userId, '2026-03-02').count === 6);

  // gap 0: already counted today
  reset(6, '2026-03-02');
  const same = touchStreak(userId, '2026-03-02');
  check('Cùng ngày → không cộng thêm', same.count === 6 && same.outcome === 'already_counted');

  // gap 2..4: inside the freeze window
  for (const [gap, day] of [[2, '2026-03-03'], [3, '2026-03-04'], [4, '2026-03-05']]) {
    reset(6, '2026-03-01');
    const result = touchStreak(userId, day);
    check(`Cách ${gap} ngày (đóng băng ${gap - 1}/3) → chuỗi sống, +1`, result.count === 7 && result.outcome === 'recovered');
  }

  // gap 5: past the freeze window
  reset(6, '2026-03-01');
  const lost = touchStreak(userId, '2026-03-06');
  check('Cách 5 ngày (quá 3 ngày đóng băng) → mất chuỗi, về 1', lost.count === 1 && lost.outcome === 'reset');

  // read-only status reporting
  reset(9, '2026-03-01');
  const frozen = streakStatus(userId, '2026-03-04');
  check('Trạng thái đóng băng báo đúng số ngày còn lại',
    frozen.status === 'frozen' && frozen.frozenDays === 2 && frozen.freezeDaysLeft === 1,
    JSON.stringify(frozen));

  const dead = streakStatus(userId, '2026-03-20');
  check('Trạng thái mất chuỗi hiển thị 0', dead.status === 'lost' && dead.count === 0);

  check('Kỷ lục streak được giữ lại', readState(userId).streak_best >= 9);

  db.close();
}

// --- main ---------------------------------------------------------------
async function main() {
  const server = startServer();
  try {
    const health = await waitForServer();

    section('Nội dung khởi tạo');
    check('6 cấp độ', health.content.levels === 6, String(health.content.levels));
    check('12 huy hiệu', health.content.badges === 12, String(health.content.badges));
    check('6 mô đun, 18 bài học', health.content.modules === 6 && health.content.lessons === 18);
    check('Có frame nội dung', health.content.frames > 40, String(health.content.frames));

    section('Cổng vào preview');
    const landing = await fetch(`${BASE}/`, { redirect: 'manual' });
    const landingHtml = await landing.text();
    check('Trang gốc trả về cổng preview', landing.status === 200 && landingHtml.includes('preview.js'));
    check('Cổng preview nhúng cả hai giao diện',
      landingHtml.includes('preview.css') && (await (await fetch(`${BASE}/preview.js`)).text()).includes("'/admin/'"));
    check('Hai giao diện gốc vẫn mở trực tiếp được',
      (await fetch(`${BASE}/app/`)).status === 200 && (await fetch(`${BASE}/admin/`)).status === 200);

    section('Đăng nhập SSO');
    const anon = await get('anon', '/api/me');
    check('Chưa đăng nhập thì bị chặn', anon.status === 401);

    const badToken = await get('anon', '/sso?token=khong-hop-le');
    check('Token SSO sai bị từ chối', badToken.status === 401);

    const login = await get('member', '/dev/login');
    check('Đăng nhập demo chuyển hướng', login.status === 302);
    const ssoUrl = login.headers.get('location');
    const ssoResponse = await get('member', ssoUrl);
    check('SSO đặt phiên và chuyển vào app', ssoResponse.status === 302 && ssoResponse.headers.get('location') === '/app/');

    const me = await get('member', '/api/me');
    check('Đọc được hồ sơ', me.status === 200 && me.json.user.name.length > 0);
    const ladder = me.json.world.levels;
    const expectedRank = ladder.filter((l) => me.json.world.progress.xp >= l.xp_required).pop();
    check('Cấp độ luôn khớp với XP đang có',
      me.json.world.level.order_index === expectedRank.order_index,
      `${me.json.world.progress.xp} XP → cấp ${me.json.world.level.order_index}, chờ ${expectedRank.order_index}`);
    check('Có 4 đảo chức năng', me.json.world.features.length === 4);
    check('Có bài học tiếp theo', Boolean(me.json.world.learning.next));

    section('Học tập');
    const lessonId = me.json.world.learning.next.id;
    const lesson = await get('member', `/api/learn/lessons/${lessonId}`);
    check('Mở được bài học đầu tiên', lesson.status === 200 && lesson.json.frames.length > 0);
    check('Frame có payload đã giải mã', typeof lesson.json.frames[0].payload === 'object');

    const locked = await get('member', '/api/learn/modules');
    const currentRank = me.json.world.level.order_index;
    const above = locked.json.filter((m) => m.unlock_level > currentRank);
    const below = locked.json.filter((m) => m.unlock_level <= currentRank);
    check('Mô đun trên cấp hiện tại bị khoá',
      above.every((m) => m.locked === true),
      above.map((m) => `${m.unlock_level}:${m.locked}`).join(' '));
    check('Mô đun trong cấp hiện tại được mở',
      below.length > 0 && below.every((m) => m.locked === false));

    section('Bản đồ học tập');
    const map = await get('member', '/api/learn/map');
    const kinds = map.json.entries.map((e) => e.type);
    check('Bản đồ trả về lộ trình phẳng theo thứ tự học',
      kinds[0] === 'module' && kinds.includes('lesson') && kinds.includes('quiz'),
      kinds.slice(0, 5).join(','));
    check('Chỉ một chặng được đánh dấu đang ở đây',
      map.json.entries.filter((e) => e.current).length === 1);
    check('Chặng đang ở đây chưa hoàn thành và không bị khoá',
      (() => { const c = map.json.entries.find((e) => e.current); return c && !c.completed && !c.locked; })());
    check('Mô đun trên cấp hiện tại bị khoá trên bản đồ',
      map.json.entries.filter((e) => e.type === 'module' && e.unlock_level > map.json.levelOrder)
        .every((e) => e.locked));
    check('Trắc nghiệm khoá khi chưa học hết mô đun',
      map.json.entries.filter((e) => e.type === 'quiz').every((e) => e.locked === true));
    check('Mỗi mô đun trên bản đồ có emoji để làm mốc',
      map.json.entries.filter((e) => e.type === 'module').every((e) => e.emoji));

    section('Trắc nghiệm cuối mô đun');
    const firstModule = locked.json[0];
    const beforeAll = await get('member', `/api/learn/modules/${firstModule.slug}`);
    check('Câu hỏi thuộc mô đun, không nằm trong bài học',
      beforeAll.json.quiz.total > 0
      && beforeAll.json.lessons.length > 0,
      `quiz=${beforeAll.json.quiz.total}`);
    check('Đáp án đúng không bị gửi ra client',
      !JSON.stringify(beforeAll.json.quiz.questions).includes('correct'));
    check('Chưa học hết thì trắc nghiệm còn khoá', beforeAll.json.quiz.unlocked === false);

    for (const l of beforeAll.json.lessons) {
      await post('member', `/api/learn/lessons/${l.id}/complete`, {});
    }
    const afterAll = await get('member', `/api/learn/modules/${firstModule.slug}`);
    check('Học hết bài thì trắc nghiệm mở', afterAll.json.quiz.unlocked === true);

    const mapAfter = await get('member', '/api/learn/map');
    const quizStop = mapAfter.json.entries.find((e) => e.type === 'quiz' && e.moduleSlug === firstModule.slug);
    check('Chặng trắc nghiệm trên bản đồ cũng mở theo', quizStop.locked === false);

    const wrong = await post('member', `/api/learn/modules/${firstModule.slug}/quiz`, { answers: {} });
    check('Bỏ trống thì được 0 điểm', wrong.json.correct === 0 && wrong.json.total === afterAll.json.quiz.total);
    check('Kết quả trả về phần giải thích cho từng câu',
      wrong.json.review.length === wrong.json.total && wrong.json.review.every((r) => 'correctIndex' in r));

    const perfect = {};
    wrong.json.review.forEach((r) => { perfect[r.id] = r.correctIndex; });
    const right = await post('member', `/api/learn/modules/${firstModule.slug}/quiz`, { answers: perfect });
    check('Trả lời đúng hết được điểm tối đa', right.json.correct === right.json.total);
    check('Điểm cao hơn thì được thưởng', right.json.improved === true && right.json.rewards?.xp > 0);

    const again = await post('member', `/api/learn/modules/${firstModule.slug}/quiz`, { answers: {} });
    check('Làm lại tệ hơn thì không thưởng thêm', again.json.improved === false && again.json.rewards === null);

    const kept = await get('member', `/api/learn/modules/${firstModule.slug}`);
    check('Chỉ giữ điểm tốt nhất', kept.json.quiz.result.correct === right.json.total, JSON.stringify(kept.json.quiz.result));

    section('Học tập (tiếp)');
    const complete = await post('member', `/api/learn/lessons/${lessonId}/complete`, { quizCorrect: 1, quizTotal: 1 });
    check('Học lại không thưởng lần hai', complete.json.replay === true && complete.json.rewards === null);

    const world = await get('member', '/api/me/world');
    check('Đã cộng XP và streak sau khi học', world.json.progress.xp > 0 && world.json.streak.count === 1);
    check('Trao huy hiệu "Bài học đầu tiên"',
      (await get('member', '/api/me/badges')).json.all.find((b) => b.code === 'first_lesson')?.earned === true);
    check('Trao huy hiệu "Mô đun đầu tiên" khi xong cả mô đun',
      (await get('member', '/api/me/badges')).json.all.find((b) => b.code === 'first_module')?.earned === true);

    section('Mở chức năng thì không được gì');
    const beforeOpen = (await get('member', '/api/me/world')).json;
    for (const path of ['/api/budget', '/api/goals', '/api/expenses']) {
      await get('member', path);
      await get('member', path);   // mở lại lần nữa cũng vậy
    }
    const afterOpen = (await get('member', '/api/me/world')).json;

    check('Mở chức năng không cộng XP', afterOpen.progress.xp === beforeOpen.progress.xp,
      `${beforeOpen.progress.xp} → ${afterOpen.progress.xp}`);
    check('Mở chức năng không đụng tới streak',
      afterOpen.streak.count === beforeOpen.streak.count && afterOpen.streak.countedToday === beforeOpen.streak.countedToday);
    check('Mở chức năng không ghi vào nhật ký hoạt động',
      (await get('member', '/api/me/activity?limit=50')).json.every((a) => a.kind !== 'feature_used'));
    check('Đọc dữ liệu không trả về phần thưởng nào',
      (await get('member', '/api/budget')).json.rewards === undefined
      && (await get('member', '/api/goals')).json.rewards === undefined
      && (await get('member', '/api/expenses')).json.rewards === undefined);
    check('Đảo chưa có dấu tích khi mới chỉ mở lên xem',
      afterOpen.features.find((f) => f.code === 'budget')?.usedToday === false);

    section('Ba chức năng');
    const budget = await put('member', '/api/budget', {
      month: new Date().toISOString().slice(0, 7),
      income: 12000000,
      items: [{ categoryCode: 'food', planned: 3000000 }, { categoryCode: 'saving', planned: 2000000 }],
    });
    check('Lưu được ngân sách', budget.status === 200 && budget.json.totals.planned === 5000000);
    check('Làm một việc thật thì mới được thưởng', budget.json.rewards?.xp > 0, JSON.stringify(budget.json.rewards?.xp));
    check('Lúc đó đảo mới có dấu tích',
      (await get('member', '/api/me/world')).json.features.find((f) => f.code === 'budget')?.usedToday === true);
    check('Ngân sách đối chiếu với chi tiêu thực tế', budget.json.totals.spent >= 0);

    const goal = await post('member', '/api/goals', { name: 'Mua xe máy', targetAmount: 20000000, icon: '🛵' });
    check('Tạo được mục tiêu', goal.status === 200 && goal.json.goal.target_amount === 20000000);

    const deposit = await post('member', `/api/goals/${goal.json.goal.id}/deposit`, { amount: 20000000 });
    check('Nạp đủ thì mục tiêu hoàn thành', deposit.json.justCompleted === true);
    check('Trao huy hiệu "Cán đích"',
      (deposit.json.rewards?.badges || []).some((b) => b.code === 'goal_done')
      || (await get('member', '/api/me/badges')).json.all.find((b) => b.code === 'goal_done')?.earned === true);

    section('Mục tiêu gợi ý');
    const goalsHome = await get('member', '/api/goals');
    check('Trả về bộ mục tiêu gợi ý theo nhóm',
      goalsHome.json.templates.length === 4 && goalsHome.json.templates.every((g) => g.templates.length > 0));
    check('Mỗi gợi ý có sẵn số tiền và số tháng',
      goalsHome.json.templates.flatMap((g) => g.templates)
        .every((t) => t.code && t.emoji && typeof t.amount === 'number' && t.months > 0));
    check('Có ngày hôm nay để tính thời hạn theo giờ Việt Nam', /^\d{4}-\d{2}-\d{2}$/.test(goalsHome.json.today));
    check('Chỉ có hai kỳ tiết kiệm: tháng và tuần',
      Object.keys(goalsHome.json.periods).join(',') === 'month,week');

    const fromTemplate = await post('member', '/api/goals', {
      template: 'motorbike', name: 'Mua xe máy', targetAmount: 30000000, deadline: '2028-02-11', period: 'week',
    });
    check('Mục tiêu tạo từ gợi ý giữ mã gợi ý và kỳ tiết kiệm',
      fromTemplate.json.goal.template === 'motorbike' && fromTemplate.json.goal.period === 'week');
    check('Mục tiêu lấy biểu tượng của gợi ý khi không truyền icon', fromTemplate.json.goal.icon === '🛵');
    check('App biết mục tiêu thuộc nhóm nào',
      fromTemplate.json.goals.find((g) => g.id === fromTemplate.json.goal.id)?.group === 'Mua sắm tài sản');

    const badPeriod = await patch('member', `/api/goals/${fromTemplate.json.goal.id}`, { period: 'quý' });
    check('Kỳ tiết kiệm không hợp lệ bị bỏ qua, giữ giá trị cũ',
      badPeriod.json.goals.find((g) => g.id === fromTemplate.json.goal.id)?.period === 'week');

    const badTemplate = await post('member', '/api/goals', { template: 'du-thuyen', name: 'Mua du thuyền', targetAmount: 1000000 });
    check('Mã gợi ý lạ không được ghi vào mục tiêu', badTemplate.json.goal.template === null);
    await del('member', `/api/goals/${badTemplate.json.goal.id}`);

    section('Ba chức năng (tiếp)');
    const badAmount = await post('member', '/api/expenses', { amount: -5000 });
    check('Số tiền âm bị từ chối', badAmount.status === 400);

    const expense = await post('member', '/api/expenses', { amount: 45000, categoryCode: 'food', note: 'Cà phê' });
    check('Ghi được khoản chi', expense.status === 200 && expense.json.expense.amount === 45000);

    const bar = await post('member', '/api/expenses/quick', { text: 'đổ xăng 120 nghìn' });
    check('Thanh ghi nhanh đọc đúng số tiền', bar.status === 200 && bar.json.expense.amount === 120000, String(bar.json?.expense?.amount));
    check('Thanh ghi nhanh đoán đúng nhóm', bar.json.category?.code === 'transport', bar.json.category?.code);
    check('Thanh ghi nhanh tách được ghi chú', bar.json.expense.note === 'đổ xăng', bar.json.expense.note);

    const barNoMoney = await post('member', '/api/expenses/quick', { text: 'hôm nay trời đẹp' });
    check('Câu không có số tiền bị từ chối kèm gợi ý', barNoMoney.status === 400 && /35k/.test(barNoMoney.json.error));

    // A back-dated entry so the three ranges cannot accidentally agree.
    const lastMonth = new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10);
    await post('member', '/api/expenses', { amount: 777000, categoryCode: 'other', note: 'cũ', spentOn: lastMonth });

    const ranges = {};
    for (const key of ['today', 'week', 'month']) {
      ranges[key] = (await get('member', `/api/expenses?range=${key}`)).json;
    }
    check('Lọc "Hôm nay" chỉ lấy đúng một ngày', ranges.today.from === ranges.today.to);
    check('Lọc "Tuần này" trải đúng 7 ngày',
      Math.round((Date.parse(ranges.week.to) - Date.parse(ranges.week.from)) / 86400000) === 6,
      `${ranges.week.from} → ${ranges.week.to}`);
    check('Lọc "Tháng này" bắt đầu từ ngày 1', ranges.month.from.endsWith('-01'), ranges.month.from);
    check('Khoảng rộng hơn thì không ít khoản hơn',
      ranges.month.totals.count >= ranges.week.totals.count
      && ranges.week.totals.count >= ranges.today.totals.count,
      [ranges.today.totals.count, ranges.week.totals.count, ranges.month.totals.count].join(' / '));
    check('Mọi khoản trả về đều nằm trong khoảng',
      ranges.week.expenses.every((e) => e.spent_on >= ranges.week.from && e.spent_on <= ranges.week.to));
    check('Nhãn khoảng thời gian đi kèm dữ liệu', ranges.today.label === 'Hôm nay' && ranges.month.label === 'Tháng này');

    const badRange = await get('member', '/api/expenses?range=quy');
    check('Khoảng thời gian lạ bị từ chối', badRange.status === 400);

    section('Cảnh báo chi tiêu bất thường');
    const normalMeal = await post('member', '/api/expenses', { amount: 45000, categoryCode: 'food', note: 'cơm trưa' });
    check('Khoản chi bình thường thì không cảnh báo', normalMeal.json.alerts.length === 0,
      JSON.stringify(normalMeal.json.alerts));

    const hugeMeal = await post('member', '/api/expenses', { amount: 2000000, categoryCode: 'food', note: 'ăn tối' });
    check('Khoản ăn uống 2 triệu bị cảnh báo',
      hugeMeal.json.alerts.some((a) => a.code === 'daily_large'), JSON.stringify(hugeMeal.json.alerts.map((a) => a.code)));
    check('Cảnh báo vẫn ghi khoản chi vào sổ', hugeMeal.json.expense.amount === 2000000);
    check('Cảnh báo nói rõ số tiền và cách sửa',
      /2\.000\.000đ/.test(hugeMeal.json.alerts[0].title) && /sổ chi tiêu/.test(hugeMeal.json.alerts[0].text));
    await del('member', `/api/expenses/${hugeMeal.json.expense.id}`);

    const bigHousing = await post('member', '/api/expenses', { amount: 4000000, categoryCode: 'housing', note: 'tiền nhà' });
    check('Nhóm không đặt ngưỡng thì không cảnh báo theo ngưỡng',
      bigHousing.json.alerts.every((a) => a.code !== 'daily_large'),
      JSON.stringify(bigHousing.json.alerts.map((a) => a.code)));
    await del('member', `/api/expenses/${bigHousing.json.expense.id}`);

    // Ngân sách Ăn uống tháng này là 3.000.000 (đặt ở phần trên).
    const halfBudget = await post('member', '/api/expenses', { amount: 1500000, categoryCode: 'food', note: 'tiệc cơ quan' });
    check('Một khoản bằng nửa hạn mức nhóm thì được nhắc',
      halfBudget.json.alerts.some((a) => a.code === 'budget_share'),
      JSON.stringify(halfBudget.json.alerts.map((a) => a.code)));
    await del('member', `/api/expenses/${halfBudget.json.expense.id}`);

    // Mức thường của người này ở nhóm Ăn uống đang là vài chục nghìn, nên 300k
    // là bất thường dù chưa tới ngưỡng 500k của nhóm.
    const spike = await post('member', '/api/expenses', { amount: 300000, categoryCode: 'food', note: 'nhà hàng' });
    check('Gấp nhiều lần mức thường của chính người dùng thì được nhắc',
      spike.json.alerts.some((a) => a.code === 'personal_spike'),
      JSON.stringify(spike.json.alerts.map((a) => a.code)));
    await del('member', `/api/expenses/${spike.json.expense.id}`);

    // Ngưỡng của nhóm chỉ là phỏng đoán mặc định: khi phần lớn khoản chi gần đây
    // của chính người dùng đều ở mức đó thì nó phải im lặng.
    const bigSpender = [];
    for (let i = 0; i < 6; i += 1) {
      const row = await post('member', '/api/expenses', { amount: 1200000, categoryCode: 'entertainment', note: `nhậu ${i}` });
      bigSpender.push(row.json.expense.id);
    }
    const habitual = await post('member', '/api/expenses', { amount: 1200000, categoryCode: 'entertainment', note: 'nhậu nữa' });
    check('Mức cao nhưng là bình thường với người này thì không cảnh báo',
      habitual.json.alerts.every((a) => a.code !== 'daily_large'),
      JSON.stringify(habitual.json.alerts.map((a) => a.code)));
    for (const id of [...bigSpender, habitual.json.expense.id]) await del('member', `/api/expenses/${id}`);

    const alertViaBot = await post('member', '/api/bot/message', { text: 'ăn trưa 3 triệu' });
    check('Ekko bot cũng cảnh báo ngay trong câu trả lời',
      /⚠️/.test(alertViaBot.json.reply.text) && alertViaBot.json.reply.alerts.length > 0,
      alertViaBot.json.reply.text?.slice(0, 80));
    await del('member', `/api/expenses/${alertViaBot.json.reply.expense.id}`);

    section('Ghi nhanh đồng bộ vào khung chat');
    const chatBefore = (await get('member', '/api/bot/history?limit=100')).json.messages.length;
    await post('member', '/api/expenses/quick', { text: 'cà phê 33k' });
    const synced = (await get('member', '/api/bot/history?limit=100')).json.messages.slice(chatBefore);

    check('Một lần ghi nhanh thêm đúng hai tin nhắn',
      synced.length === 2 && synced[0].role === 'user' && synced[1].role === 'bot',
      synced.map((m) => m.role).join(','));
    check('Tin nhắn giữ nguyên câu người dùng đã gõ', synced[0]?.text === 'cà phê 33k', synced[0]?.text);
    check('Ekko bot xác nhận đúng số tiền trong khung chat', /33\.000/.test(synced[1]?.text || ''), synced[1]?.text);
    check('Hai tin nhắn được đánh dấu nguồn "quick"',
      synced.every((m) => m.source === 'quick'), synced.map((m) => m.source).join(','));
    check('Tin nhắn xác nhận có nút mở sổ chi tiêu',
      synced[1]?.meta?.action?.route === '/app/#/expenses', JSON.stringify(synced[1]?.meta?.action));
    check('Không hiện lại phần thưởng đã trao ở thanh ghi nhanh', synced[1]?.meta?.rewards === null);

    // Huy hiệu "Bạn của Ekko bot" cần 5 lần trò chuyện. Ghi nhanh nhiều hơn thế
    // vẫn không được tính, vì đó không phải là trò chuyện.
    for (const line of ['bún bò 40k', 'trà sữa 30k', 'gửi xe 5k', 'bánh mì 20k']) {
      await post('member', '/api/expenses/quick', { text: line });
    }
    check('Ghi nhanh không tính là trò chuyện với Ekko bot',
      (await get('member', '/api/me/badges')).json.all.find((b) => b.code === 'bot_friend')?.earned === false);

    section('Ekko bot');
    const quick = await post('member', '/api/bot/message', { text: 'ăn trưa 65 nghìn' });
    check('Ghi nhanh chi tiêu từ câu nói', quick.json.reply.kind === 'expense_logged');
    check('Đọc đúng số tiền 65.000', quick.json.reply.expense.amount === 65000, String(quick.json.reply.expense?.amount));

    const notMoney = await post('member', '/api/bot/message', { text: 'quy tắc 50/30/20 là gì?' });
    check('Câu hỏi có số nhưng không phải tiền thì không bị ghi sổ',
      notMoney.json.reply.kind !== 'expense_logged', notMoney.json.reply.kind);

    const streakQuestion = await post('member', '/api/bot/message', { text: 'streak của tôi thế nào?' });
    check('Trả lời được câu hỏi về streak', streakQuestion.json.reply.kind === 'status_streak');

    const lessonQuestion = await post('member', '/api/bot/message', { text: 'quỹ khẩn cấp cần bao nhiêu tháng?' });
    check('Tìm được nội dung trong bài học',
      lessonQuestion.json.reply.kind === 'lesson' && lessonQuestion.json.reply.action?.type === 'open_lesson',
      lessonQuestion.json.reply.kind);

    const spending = await post('member', '/api/bot/message', { text: 'tháng này tôi tiêu bao nhiêu?' });
    check('Trả lời được câu hỏi về chi tiêu', spending.json.reply.kind === 'status_spending');

    const history = await get('member', '/api/bot/history');
    check('Lưu lịch sử trò chuyện', history.json.messages.length >= 10);
    check('Khung chat có cả tin ghi nhanh và tin trò chuyện',
      new Set(history.json.messages.map((m) => m.source)).size === 2,
      [...new Set(history.json.messages.map((m) => m.source))].join(','));
    check('Trò chuyện thật thì được huy hiệu "Bạn của Ekko bot"',
      (await get('member', '/api/me/badges')).json.all.find((b) => b.code === 'bot_friend')?.earned === true);

    section('Phân quyền');
    const memberOnAdmin = await get('member', '/api/admin/levels');
    check('Người học không vào được API quản trị', memberOnAdmin.status === 403);

    const adminLogin = await get('admin', '/dev/login?role=admin');
    await get('admin', adminLogin.headers.get('location'));
    const who = await get('admin', '/api/session/whoami');
    check('Đăng nhập được với vai trò quản trị', who.json.role === 'admin');

    section('Admin portal');
    const levels = await get('admin', '/api/admin/levels');
    check('Đọc được danh sách cấp độ', levels.json.length === 6);
    check('Cấp độ có emoji và ngưỡng XP tăng dần',
      levels.json.every((l) => l.emoji)
      && levels.json.every((l, i) => i === 0 || l.xp_required > levels.json[i - 1].xp_required),
      levels.json.map((l) => `${l.emoji}${l.xp_required}`).join(' '));

    const perked = await patch('admin', `/api/admin/levels/${levels.json[0].id}`, { perk: 'Ưu đãi thử nghiệm', emoji: '🐷' });
    check('Sửa được phúc lợi của cấp độ', perked.json.perk === 'Ưu đãi thử nghiệm' && perked.json.emoji === '🐷');

    const created = await post('admin', '/api/admin/badges', {
      code: 'smoke_test_badge', name: 'Huy hiệu kiểm thử',
      rule_type: 'lessons_completed', rule_value: 99, xp_reward: 5, order_index: 99,
    });
    check('Tạo được huy hiệu mới', created.status === 200 && created.json.code === 'smoke_test_badge');

    const badRule = await post('admin', '/api/admin/badges', {
      code: 'smoke_bad_rule', name: 'Sai điều kiện', rule_type: 'khong-ton-tai', rule_value: 1,
    });
    check('Điều kiện huy hiệu không hợp lệ bị chặn', badRule.status === 400);

    const updated = await patch('admin', `/api/admin/badges/${created.json.id}`, { name: 'Đã đổi tên' });
    check('Sửa được huy hiệu', updated.json.name === 'Đã đổi tên');
    check('Xoá được huy hiệu', (await del('admin', `/api/admin/badges/${created.json.id}`)).status === 200);

    const tree = await get('admin', '/api/admin/content/tree');
    check('Cây nội dung mang emoji, kiểu nội dung và câu hỏi',
      tree.json.every((m) => m.emoji)
      && tree.json.every((m) => Array.isArray(m.questions))
      && tree.json.every((m) => m.lessons.every((l) => ['text', 'slides'].includes(l.content_type))));

    const question = await post('admin', '/api/admin/questions', {
      module_id: tree.json[0].id,
      order_index: 99,
      question: 'Câu hỏi kiểm thử?',
      options: [{ text: 'Sai', correct: false }, { text: 'Đúng', correct: true }],
    });
    check('Tạo được câu hỏi cuối mô đun', question.status === 200 && question.json.options.length === 2);
    check('Câu hỏi trả về options đã giải mã', Array.isArray(question.json.options));

    const noCorrect = await post('admin', '/api/admin/questions', {
      module_id: tree.json[0].id, question: 'Thiếu đáp án đúng?',
      options: [{ text: 'A' }, { text: 'B' }],
    });
    check('Câu hỏi không có đáp án đúng bị chặn', noCorrect.status === 400);

    const oneOption = await post('admin', '/api/admin/questions', {
      module_id: tree.json[0].id, question: 'Chỉ một lựa chọn?',
      options: [{ text: 'A', correct: true }],
    });
    check('Câu hỏi dưới hai lựa chọn bị chặn', oneOption.status === 400);
    await del('admin', `/api/admin/questions/${question.json.id}`);

    const badType = await patch('admin', `/api/admin/lessons/${tree.json[0].lessons[0].id}`, { content_type: 'video' });
    check('Kiểu nội dung không hợp lệ bị chặn', badType.status === 400);

    // The list toggles PATCH a single flag, so that path has to work on its own.
    const flip = async (entity, id, field, value) => (await patch('admin', `/api/admin/${entity}/${id}`, { [field]: value })).json;
    const lessonId2 = tree.json[0].lessons[0].id;
    check('Tắt nhanh bài học', (await flip('lessons', lessonId2, 'is_published', 0)).is_published === 0);
    check('Bật lại bài học', (await flip('lessons', lessonId2, 'is_published', 1)).is_published === 1);
    check('Tắt nhanh mô đun', (await flip('modules', tree.json[0].id, 'is_published', 0)).is_published === 0);
    check('Bài học của mô đun đã tắt biến mất khỏi app người học',
      !(await get('member', '/api/learn/modules')).json.some((m) => m.id === tree.json[0].id));
    await flip('modules', tree.json[0].id, 'is_published', 1);

    const featureRows = await get('admin', '/api/admin/features');
    check('Tắt nhanh đảo chức năng', (await flip('features', featureRows.json[1].id, 'is_enabled', 0)).is_enabled === 0);
    check('Đảo đã tắt không còn trong thế giới người học',
      !(await get('member', '/api/me/world')).json.features.some((f) => f.id === featureRows.json[1].id));
    await flip('features', featureRows.json[1].id, 'is_enabled', 1);

    // Nhóm chi tiêu is now edited inside the expense feature's dialog, but the
    // API path it uses is the same, and the bot must pick changes up at once.
    const cats = await get('admin', '/api/admin/categories');
    const food = cats.json.find((c) => c.code === 'food');
    const widened = await patch('admin', `/api/admin/categories/${food.id}`, { keywords: `${food.keywords},bánh mì kiểm thử` });
    check('Sửa được từ khoá nhóm chi tiêu', widened.json.keywords.endsWith('bánh mì kiểm thử'));

    const classified = await post('member', '/api/expenses/quick', { text: 'bánh mì kiểm thử 20k' });
    check('Ekko bot dùng ngay từ khoá vừa thêm',
      classified.json.category?.code === 'food', classified.json.category?.code);
    await patch('admin', `/api/admin/categories/${food.id}`, { keywords: food.keywords });

    const badgeRows = await get('admin', '/api/admin/badges');
    check('Tắt nhanh huy hiệu', (await flip('badges', badgeRows.json[0].id, 'is_active', 0)).is_active === 0);
    await flip('badges', badgeRows.json[0].id, 'is_active', 1);

    const newFrame = await post('admin', '/api/admin/frames', {
      lesson_id: lessonId, order_index: 99, kind: 'slide',
      payload: { image: '/assets/islands/module.png', caption: 'Slide kiểm thử' },
    });
    check('Tạo được frame slide', newFrame.status === 200 && newFrame.json.payload.caption === 'Slide kiểm thử');

    const editedSlide = await patch('admin', `/api/admin/frames/${newFrame.json.id}`, {
      kind: 'slide',
      payload: { image: '/assets/islands/lesson.png', caption: 'Đã sửa', alt: 'Ảnh minh hoạ' },
    });
    check('Sửa được một slide mà vẫn giữ đúng loại frame',
      editedSlide.json.kind === 'slide' && editedSlide.json.payload.caption === 'Đã sửa'
      && editedSlide.json.payload.alt === 'Ảnh minh hoạ',
      JSON.stringify(editedSlide.json.payload));

    const badKind = await post('admin', '/api/admin/frames', { lesson_id: lessonId, kind: 'khong-hop-le' });
    check('Loại frame không hợp lệ bị chặn', badKind.status === 400);

    const framesNow = await get('admin', `/api/admin/frames?lesson_id=${lessonId}`);
    check('Frame mới xuất hiện trong bài học', framesNow.json.some((f) => f.id === newFrame.json.id));
    await del('admin', `/api/admin/frames/${newFrame.json.id}`);

    const injection = await patch('admin', `/api/admin/levels/${levels.json[0].id}`, {
      name: 'Đảo Khởi Hành', id: 999, some_unknown_column: 'x',
    });
    check('Trường lạ bị bỏ qua, không lọt vào SQL', injection.status === 200 && injection.json.id === levels.json[0].id);

    const stats = await get('admin', '/api/admin/stats/overview');
    check('Bảng điều khiển có số liệu', stats.json.users.total >= 2 && stats.json.engagement.lessonsCompleted >= 1);

    const users = await get('admin', '/api/admin/stats/users');
    check('Danh sách người học không lộ dữ liệu chi tiêu',
      users.json.length >= 2 && !('expenses' in users.json[0]) && !('budget' in users.json[0]));

    section('Concept màn Khám phá');
    const conceptsBefore = await get('admin', '/api/admin/concepts');
    check('Có hai concept', conceptsBefore.json.length === 2, String(conceptsBefore.json.length));
    check('Chỉ một concept được bật',
      conceptsBefore.json.filter((c) => c.active).length === 1,
      JSON.stringify(conceptsBefore.json.map((c) => `${c.code}:${c.active}`)));
    check('Mặc định là concept đảo trên trời',
      conceptsBefore.json.find((c) => c.active)?.code === 'sky');
    check('Bản đồ học tập nói rõ concept đang dùng',
      (await get('member', '/api/learn/map')).json.concept === 'sky');

    const conceptMapBefore = (await get('member', '/api/learn/map')).json;
    const switched = await put('admin', '/api/admin/concepts/active', { code: 'islands' });
    check('Đổi được sang concept quần đảo',
      switched.json.find((c) => c.active)?.code === 'islands'
      && switched.json.filter((c) => c.active).length === 1);
    const conceptMapAfter = (await get('member', '/api/learn/map')).json;
    check('App người học nhận concept mới', conceptMapAfter.concept === 'islands');
    check('Đổi concept không đụng tới lộ trình học',
      JSON.stringify(conceptMapBefore.entries) === JSON.stringify(conceptMapAfter.entries)
      && conceptMapBefore.levelOrder === conceptMapAfter.levelOrder);

    const badConcept = await put('admin', '/api/admin/concepts/active', { code: 'khong-co-that' });
    check('Mã concept lạ bị từ chối', badConcept.status === 400);
    check('Concept đang bật không đổi vì một request hỏng',
      (await get('admin', '/api/admin/concepts')).json.find((c) => c.active)?.code === 'islands');

    await put('admin', '/api/admin/concepts/active', { code: 'sky' });
    check('Đổi ngược về concept 1 được', (await get('member', '/api/learn/map')).json.concept === 'sky');

    check('Người học không đổi được concept',
      (await put('member', '/api/admin/concepts/active', { code: 'islands' })).status === 403);

    section('Bảo mật');
    const traversal = await fetch(`${BASE}/assets/../../server/config.js`);
    check('Chặn truy cập ngoài thư mục public', traversal.status !== 200 || !(await traversal.text()).includes('ssoSecret'));

    const openRedirect = await get('anon', `/dev/login?redirect=${encodeURIComponent('https://evil.example.com')}`);
    const redirectTarget = new URL(openRedirect.headers.get('location'), BASE).searchParams.get('redirect');
    check('Chặn chuyển hướng ra ngoài miền', redirectTarget === '/app/', String(redirectTarget));
  } finally {
    server.kill();
  }

  await testStreakRules();

  console.log(`\n${passed} đạt, ${failed} lỗi`);
  rmSync(DATA_DIR, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  rmSync(DATA_DIR, { recursive: true, force: true });
  process.exit(1);
});
