/**
 * Hai ngôn ngữ cho app người dùng: tiếng Việt (bản gốc) và tiếng Anh.
 *
 * Từ điển tra theo CHÍNH CÂU TIẾNG VIỆT, không theo mã khoá. Lý do:
 *
 * 1. Chỗ gọi vẫn đọc được bằng tiếng Việt — người viết nội dung ở Ekko mở file
 *    view ra là hiểu ngay, không phải tra bảng khoá.
 * 2. Thiếu bản dịch thì tự rơi về tiếng Việt, không bao giờ lòi ra "hud.back".
 * 3. Bảng `EN` bên dưới đọc như một bảng đối chiếu song ngữ, dễ soát.
 *
 * Chỗ có số hoặc tên thay đổi thì dùng `{tên}`:
 *     t('Đã ghi {amount}', { amount: vnd(50000) })
 * Số đếm cần chia ít/nhiều thì viết `{n:day|days}` ở bản tiếng Anh:
 *     'còn {n} ngày'  ->  '{n:day|days} left'
 */

import { el, mount } from '/shared/client.js';

const STORE_KEY = 'gdtc.lang';

export const LANGUAGES = [
  { code: 'vi', short: 'VI', label: 'Tiếng Việt' },
  { code: 'en', short: 'EN', label: 'English' },
];

/** Bản dịch tiếng Anh của mọi câu chữ trong giao diện app người dùng. */
const EN = {
  // --- khung app, HUD, thanh ghi nhanh ---------------------------------
  'Về trang chủ': 'Back to home',
  'Xem tiến độ và huy hiệu': 'View progress and badges',
  'Cấp {n}': 'Level {n}',
  '{into}/{need} XP': '{into}/{need} XP',
  '{xp} XP · cấp tối đa': '{xp} XP · top level',
  'Hôm nay đã được tính': 'Counted today',
  'Hôm nay chưa được tính': 'Not counted yet today',
  'Còn {n} ngày trước khi mất chuỗi': '{n:day|days} before the streak is lost',
  'Chuỗi {n} ngày đang đóng băng': 'Your {n}-day streak is frozen',
  'Còn {n} ngày để cứu chuỗi.': '{n:day|days} left to save it.',
  'Chưa tải được màn hình này': 'This screen did not load',
  'Kiểm tra kết nối rồi thử lại nhé.': 'Check your connection and try again.',
  'Thử lại': 'Try again',
  'Hãy mở từ app Ekko': 'Open this from the Ekko app',
  'Tính năng Giáo dục tài chính đăng nhập bằng tài khoản Ekko của bạn.':
    'Financial education signs in with your Ekko account.',
  'Mở bản demo': 'Open the demo',
  'Không khởi động được': 'Could not start',
  'Mở Ekko bot': 'Open Ekko bot',
  'Ghi nhanh: cà phê 35k': 'Quick log: coffee 35k',
  'Ghi nhanh một khoản chi': 'Quickly log an expense',
  'Lưu khoản chi': 'Save expense',
  'Đã ghi {amount}': 'Logged {amount}',
  'Đã ghi vào sổ': 'Added to your ledger',
  Khác: 'Other',

  // --- lớp nổi dùng chung ---------------------------------------------
  Bảng: 'Panel',
  Đóng: 'Close',
  'Tuyệt vời': 'Great',
  'Lên cấp: {name}': 'Level up: {name}',
  'Huy hiệu mới: {name}': 'New badge: {name}',
  'Làm tốt lắm': 'Nicely done',
  'Cứu chuỗi: {n} ngày': 'Streak saved: {n:day|days}',
  '{n} ngày': '{n:day|days}',
  Huỷ: 'Cancel',
  Xoá: 'Delete',

  // --- bản đồ học tập --------------------------------------------------
  'Bản đồ học tập': 'Learning map',
  'Bắt đầu với tiền của bạn': 'Start with your money',
  'Tiếp tục học': 'Keep learning',
  'Bắt đầu học': 'Start learning',
  'Học tiếp: {title}': 'Continue: {title}',
  'Bạn đang ở đây': 'You are here',
  'Hoàn thành bài trước để mở bài này.': 'Finish the previous lesson to unlock this one.',
  'Hoàn thành "{title}" để mở bài này.': 'Finish “{title}” to unlock this lesson.',
  'Cần đạt cấp {n} để mở bài này.': 'Reach level {n} to unlock this lesson.',
  'Học hết bài trong mô đun này để mở phần trắc nghiệm.':
    'Finish every lesson in this module to unlock the quiz.',
  'Trắc nghiệm · Mô-đun {n}': 'Quiz · Module {n}',
  'đã học xong': 'completed',
  'đang học': 'in progress',
  'mở, chưa học': 'unlocked, not started',
  'chưa mở khoá': 'locked',
  'Bài học {title} — {state}': 'Lesson {title} — {state}',
  'Chưa có bài học nào được mở.': 'No lessons are open yet.',
  'Ngân sách': 'Budget',
  'Mục tiêu': 'Goals',
  'Ghi chép': 'Expenses',
  'Ekko bot': 'Ekko bot',

  'Đảo của bạn: {name}, cùng nhân vật chú heo': 'Your island: {name}, with the piggy character',
  'Đảo {name}': '{name} island',
  'Học tiếp': 'Keep going',
  'Bắt đầu hành trình': 'Start the journey',
  'Bạn đã học hết': 'You finished every lesson',
  'Xem bộ sưu tập huy hiệu': 'See your badge collection',
  'Chuỗi {n} ngày': '{n}-day streak',
  'Kỷ lục của bạn: {best} ngày · Đóng băng tối đa {max} ngày':
    'Your record: {best:day|days} · Freeze covers up to {max:day|days}',
  'Tiến độ học': 'Learning progress',
  '{done}/{total} bài học': '{done}/{total} lessons',
  '{earned}/{total} huy hiệu': '{earned}/{total} badges',
  'Còn {xp} XP nữa là mở khoá {name}.': '{xp} XP more unlocks {name}.',
  'Bạn đang ở cấp cao nhất.': 'You are at the top level.',
  'Hoàn thành một bài học, hoặc ghi một khoản chi, lưu ngân sách, hoặc đặt/nạp một mục tiêu hôm nay để bắt đầu chuỗi.':
    'Finish a lesson, log an expense, save a budget, or set up or top up a goal today to start a streak.',
  'Bạn đã nghỉ {off} ngày. Còn {left} ngày để quay lại trước khi mất chuỗi.':
    'You have been away {off:day|days}. {left:day|days} left to come back before the streak breaks.',
  'Hôm nay đã được tính. Hẹn gặp lại bạn ngày mai.': 'Today is counted. See you tomorrow.',
  'Hôm nay chưa được tính. Làm một việc bất kỳ để giữ chuỗi.':
    'Today is not counted yet. Do anything at all to keep the streak.',
  'Tiền của bạn tháng này': 'Your money this month',
  'trên {amount}': 'of {amount}',
  'chưa lập ngân sách': 'no budget set',
  '{count} khoản đã ghi': '{count:entry|entries} logged',

  // --- trình phát bài học ---------------------------------------------
  'Đang mở bài học…': 'Opening the lesson…',
  'Không mở được bài học': 'Could not open the lesson',
  'Bước {i}/{n}': 'Step {i}/{n}',
  'Tiếp tục': 'Continue',
  'Hoàn thành bài học': 'Finish lesson',
  'Kiểm tra': 'Check',
  'Chọn một đáp án đã': 'Pick an answer first',
  'Chính xác!': 'Correct!',
  'Chưa đúng': 'Not quite',
  'Bấm vào từng phần để xem giải thích': 'Tap each part to see the explanation',
  'Đã học xong: {title}': 'Lesson complete: {title}',
  'Thoát bài học': 'Leave the lesson',
  'Bài học': 'Lesson',

  // --- trắc nghiệm mô đun ---------------------------------------------
  'Trắc nghiệm · {title}': 'Quiz · {title}',
  'Trắc nghiệm': 'Quiz',
  'Câu {i} / {n}': 'Question {i} of {n}',
  'Câu hỏi': 'Question',
  'Nộp bài': 'Submit',
  'Câu tiếp': 'Next question',
  'Xem kết quả': 'See results',
  'Đúng {right}/{total} câu': '{right} of {total} correct',
  'Chưa đạt, thử lại nhé': 'Not passing yet — give it another go',
  'Đạt rồi!': 'You passed!',
  'Làm lại': 'Try again',
  'Đóng trắc nghiệm': 'Close the quiz',

  'Bài học này chưa có nội dung': 'This lesson has no content yet',
  'Đóng bài học': 'Close the lesson',
  'Quay lại': 'Back',
  'Không lưu được kết quả': 'Could not save your result',
  'Bạn đã hoàn thành bài này trước đó. Ôn lại luôn tốt.':
    'You finished this lesson before. Reviewing never hurts.',
  'Bạn trả lời đúng {right}/{total} câu hỏi.': 'You answered {right} of {total} questions correctly.',
  'Hoàn thành mô-đun': 'Module complete',
  'Bạn đã học xong "{title}".': 'You finished “{title}”.',
  'Đi tiếp': 'Onwards',
  'Đã xem {seen}/{total} điểm': '{seen}/{total} spots opened',
  'Chính xác.': 'Correct.',
  'Chưa đúng. Đáp án đúng đã được tô sáng.': 'Not quite. The right answer is highlighted.',
  'Mô-đun này mở khoá ở cấp cao hơn.': 'This module unlocks at a higher level.',
  'Học xong bài phía trên đã, rồi bài này mới mở.':
    'Finish the lesson above and this one opens.',
  'Mở khoá ở cấp {n}': 'Unlocks at level {n}',

  // --- trắc nghiệm cuối mô đun -----------------------------------------
  'Trắc nghiệm cuối mô đun': 'End-of-module quiz',
  'Câu tiếp theo': 'Next question',
  'Câu trước': 'Previous question',
  'Không gửi được bài làm': 'Could not submit your answers',
  'Đúng hết!': 'All correct!',
  'Đúng {right}/{total}': '{right}/{total} correct',
  'Bạn đã nắm chắc mô đun này.': 'You have this module down.',
  'Bạn có thể làm lại để cải thiện điểm. Chỉ điểm cao hơn mới được tính thưởng.':
    'You can retake it to improve. Only a higher score earns a reward.',
  '{right}/{total} câu đúng': '{right}/{total} correct',
  Xong: 'Done',
  'Thưởng trắc nghiệm': 'Quiz reward',

  // --- bộ sưu tập ------------------------------------------------------
  '{got}/{total} huy hiệu · cấp {level}/6': '{got}/{total} badges · level {level} of 6',
  'Đã nhận ngày {day}': 'Earned on {day}',
  'Điều kiện: {rule}': 'How to earn: {rule}',
  'Thưởng {xp} XP': 'Reward {xp} XP',
  'Chưa có hoạt động nào được ghi lại.': 'Nothing has been logged yet.',
  'Mỗi cấp độ là một chú heo riêng. Học bài và dùng ba chức năng để lên cấp.':
    'Every level has its own piggy. Take lessons and use the three tools to level up.',
  'Mỗi cấp độ là một hòn đảo và một chú heo riêng. Học bài và dùng ba chức năng để lên cấp.':
    'Every level has its own island and piggy. Take lessons and use the three tools to level up.',
  '🔒 Cần {xp} XP': '🔒 {xp} XP needed',
  'Sáu hòn đảo': 'Six islands',
  'Hoàn thành mô đun': 'Module completed',
  'Dùng chức năng': 'Tool used',
  'Nhận huy hiệu': 'Badge earned',
  'Lên cấp': 'Level up',
  'Mục tiêu tài chính': 'Financial goals',
  'Khám phá': 'Explore',
  'hoàn thành {n} bài học': 'finish {n:lesson|lessons}',
  'hoàn thành {n} mô đun': 'finish {n:module|modules}',
  'giữ chuỗi {n} ngày': 'keep a {n}-day streak',
  'dùng chức năng {name} {n} lần': 'use {name} {n:time|times}',
  'ghi {n} khoản chi tiêu': 'log {n:expense|expenses}',
  'tạo {n} mục tiêu': 'create {n:goal|goals}',
  'hoàn thành {n} mục tiêu': 'complete {n:goal|goals}',
  'lập {n} ngân sách': 'set {n:budget|budgets}',
  'đạt cấp độ {n}': 'reach level {n}',
  'tích luỹ {n} XP': 'collect {n} XP',
  'trò chuyện với Ekko bot {n} lần': 'chat with Ekko bot {n:time|times}',
  'chưa xác định': 'not defined',

  // --- ghi chép chi tiêu ----------------------------------------------
  'Ghi chép chi tiêu': 'Expense log',
  'Hôm nay': 'Today',
  'Tuần này': 'This week',
  'Tháng này': 'This month',
  'hôm nay': 'today',
  'tuần này': 'this week',
  'tháng này': 'this month',
  '{count} khoản': '{count:entry|entries}',
  'Hôm nay: {amount}': 'Today: {amount}',
  'Ghi một khoản chi': 'Log an expense',
  'Chụp hoá đơn': 'Snap a receipt',
  'Chọn ảnh có sẵn': 'Choose a photo',
  'Ảnh hoá đơn': 'Receipt photo',
  'Số tiền': 'Amount',
  'Nhóm chi tiêu': 'Category',
  'Ghi chú': 'Note',
  'Ngày chi': 'Date',
  'VD: 35000': 'e.g. 35000',
  'VD: cà phê sáng': 'e.g. morning coffee',
  'Lưu': 'Save',
  'Nhập số tiền lớn hơn 0': 'Enter an amount greater than 0',
  'Chọn một nhóm chi tiêu': 'Pick a category',
  'Đang đọc hoá đơn…': 'Reading the receipt…',
  'Đã đọc hoá đơn': 'Receipt read',
  'Không đọc được hoá đơn': 'Could not read the receipt',
  'Nhập tay số tiền giúp Ekko nhé.': 'Please type the amount in yourself.',
  'Ảnh quá lớn, chọn ảnh nhẹ hơn nhé.': 'That image is too large — pick a smaller one.',
  'Xoá khoản chi này?': 'Delete this expense?',
  'Khoản chi sẽ bị xoá khỏi sổ, XP đã nhận vẫn giữ nguyên.':
    'The entry leaves your ledger; XP you already earned stays.',
  'Đã xoá khoản chi': 'Expense deleted',
  'Chưa có khoản chi nào {period}': 'No expenses {period}',
  'Ghi khoản đầu tiên để Ekko vẽ biểu đồ cho bạn.':
    'Log your first expense and Ekko will chart it for you.',
  'Xem hoá đơn': 'View receipt',
  'Xoá khoản chi': 'Delete expense',
  'Đã dùng {percent}% ngân sách tháng': '{percent}% of this month’s budget used',
  'Còn {amount}': '{amount} left',
  'Vượt {amount}': '{amount} over',
  '{spent} / {total} ngân sách tháng {month}': '{spent} of {total} · {month} budget',
  'Chưa lập ngân sách tháng này': 'No budget set for this month',
  'Lập ngân sách để Ekko theo giúp bạn.': 'Set a budget and Ekko will track it with you.',
  'Lập ngân sách hằng tháng': 'Set a monthly budget',

  'Lọc theo thời gian': 'Filter by period',
  'Ghi ngay tại thời điểm trả tiền là cách duy nhất giữ được thói quen này.':
    'Logging it the moment you pay is the only way this habit sticks.',
  '{spent} trên ngân sách {planned}': '{spent} of a {planned} budget',
  'thu nhập {amount}': 'income {amount}',
  'Khoản chi': 'Expense',
  'qua Ekko bot': 'via Ekko bot',
  'Xem ảnh hoá đơn': 'View the receipt photo',
  'Xoá {amount} - {what}?': 'Delete {amount} — {what}?',
  'Không xoá được': 'Could not delete it',
  'Đã xoá': 'Deleted',
  'Không đọc được tệp ảnh': 'Could not read the image file',
  'Tệp này không phải ảnh': 'That file is not an image',
  'Không đọc được ảnh': 'Could not read the image',
  'Chưa đọc được hoá đơn, bạn nhập tay nhé': 'Could not read the receipt — please type it in',
  'Đọc được {amount}': 'Read {amount}',
  'Hoá đơn đề ngày {day} — mình để ngày hôm nay cho bạn thấy được trong sổ. Sửa lại ở ô Ngày chi nếu cần.':
    'The receipt is dated {day}. I used today’s date so the entry shows up in your log — change the Date field if you want the original.',
  'Đọc được {amount}. Kiểm lại rồi bấm Lưu nhé.': 'Read {amount}. Check it and hit Save.',
  'Đọc được {amount} nhưng chưa chắc lắm — bạn xem lại giúp.':
    'Read {amount}, but I am not sure — please double-check.',
  'Bỏ ảnh này': 'Remove this photo',
  'Không ghi được khoản chi': 'Could not log the expense',

  // --- ngân sách -------------------------------------------------------
  'Lập ngân sách': 'Set a budget',
  'Chỉnh sửa ngân sách': 'Edit budget',
  'Lưu ngân sách': 'Save budget',
  'Ngân sách {month}': '{month} budget',
  'Tháng trước': 'Previous month',
  'Tháng sau': 'Next month',
  'Thu nhập thực nhận trong tháng': 'Take-home income this month',
  'Thu nhập {amount}': 'Income {amount}',
  '/ {amount} đã đặt': '/ {amount} allocated',
  'Còn lại {amount}': '{amount} unallocated',
  'Theo nhóm': 'By category',
  '{n} nhóm': '{n:category|categories}',
  'Gợi ý: đặt phần tiết kiệm trước, phần còn lại mới chia cho các nhóm khác.':
    'Tip: set aside savings first, then split what is left between the categories.',
  'Đã phân bổ {used} trên thu nhập {income} (còn {left}).':
    'Allocated {used} of {income} in income ({left} left).',
  'Đã lưu ngân sách': 'Budget saved',
  'Nhập thu nhập lớn hơn 0': 'Enter an income greater than 0',
  'Chưa có ngân sách cho tháng này': 'No budget for this month yet',
  '{spent} / {planned}': '{spent} / {planned}',
  '{spent} / {planned} · vượt {over}': '{spent} / {planned} · {over} over',
  'Chưa đặt': 'Not set',

  'Chưa nhập thu nhập': 'No income entered',
  'Nhập thu nhập rồi chia cho từng nhóm. Quy tắc gợi ý: 50% thiết yếu, 30% mong muốn, 20% cho tương lai.':
    'Enter your income, then split it by category. A good rule: 50% needs, 30% wants, 20% future.',
  'Chưa phân bổ {amount}': '{amount} unassigned',
  'Phân bổ vượt thu nhập {amount}': '{amount} over your income',
  'Vượt {amount}. Hãy bù từ nhóm mong muốn, đừng lấy từ phần tiết kiệm.':
    '{amount} over. Cover it from your wants, not from savings.',
  'VD: 12000000': 'e.g. 12000000',
  'Đã phân bổ {used}.': '{used} allocated.',
  'Hãy đặt hạn mức cho ít nhất một nhóm': 'Set a limit for at least one category',
  'Không lưu được ngân sách': 'Could not save the budget',
  'Ngân sách đã sẵn sàng': 'Your budget is ready',

  // --- mục tiêu --------------------------------------------------------
  'Mục tiêu của bạn': 'Your goals',
  'Đặt thêm mục tiêu': 'Add a goal',
  'Chọn một gợi ý Ekko dành sẵn để đặt số tiền và thời hạn cho bạn.':
    'Pick one of Ekko’s suggestions and it will set the amount and deadline for you.',
  'Tên mục tiêu': 'Goal name',
  'Số tiền mục tiêu (VNĐ)': 'Target amount (VND)',
  'Thời hạn hoàn thành': 'Target date',
  'Kỳ tiết kiệm': 'Saving rhythm',
  'Mỗi tháng': 'Monthly',
  'Mỗi tuần': 'Weekly',
  'Ekko tính giúp bạn': 'Ekko did the maths',
  'Cần tiết kiệm {amount} mỗi tháng': 'Save {amount} a month',
  'Cần tiết kiệm {amount} mỗi tuần': 'Save {amount} a week',
  'trong {n} tháng để đạt {total}': 'for {n:month|months} to reach {total}',
  'trong {n} tuần để đạt {total}': 'for {n:week|weeks} to reach {total}',
  'Tạo mục tiêu': 'Create goal',
  'Đã tạo mục tiêu': 'Goal created',
  'Nhập tên mục tiêu': 'Enter a goal name',
  'Nhập số tiền lớn hơn 0 và thời hạn sau hôm nay': 'Enter an amount above 0 and a future date',
  'Chưa có mục tiêu nào': 'No goals yet',
  'Đặt một mục tiêu để Ekko chia nhỏ ra từng tháng cho bạn.':
    'Set a goal and Ekko will break it into monthly steps.',
  'Nạp tiền': 'Add money',
  'Nạp vào {name}': 'Add to {name}',
  'Số tiền nạp': 'Amount to add',
  'Đã nạp {amount}': 'Added {amount}',
  'Xong mục tiêu rồi!': 'Goal reached!',
  'Xoá mục tiêu này?': 'Delete this goal?',
  'Mục tiêu và các lần nạp sẽ bị xoá.': 'The goal and every deposit are deleted.',
  'Đã xoá mục tiêu': 'Goal deleted',
  'Xoá mục tiêu': 'Delete goal',
  'Còn {n} tháng': '{n:month|months} left',
  'Quá hạn {n} ngày': '{n:day|days} overdue',
  'Đến hạn hôm nay': 'Due today',
  'đã đạt {percent}%': '{percent}% saved',
  '{saved} / {target}': '{saved} / {target}',
  'Cần {amount} mỗi tháng': '{amount} a month',
  'Cần {amount} mỗi tuần': '{amount} a week',

  'Mục tiêu đầu tiên nên là một tháng chi phí thiết yếu. Đạt mốc đó rồi mới nâng dần lên ba tháng.':
    'Your first goal should be one month of essential costs. Reach that, then work up to three months.',
  'Xem mục tiêu gợi ý': 'See suggested goals',
  'Đã tích luỹ {saved} / {target}': '{saved} saved of {target}',
  'Bạn đang chạy nhiều mục tiêu cùng lúc. Ba mục tiêu là tối đa nếu muốn thực sự về đích.':
    'You are running several goals at once. Three is the most you can realistically finish.',
  'Chọn một gợi ý, Ekko điền sẵn số tiền và thời hạn cho bạn.':
    'Pick a suggestion and Ekko fills in the amount and the deadline for you.',
  'mục tiêu {amount}': 'target {amount}',
  'Đã cán đích': 'Reached',
  'Còn thiếu {amount}': '{amount} to go',
  'Hạn {day}': 'Due {day}',
  'Để kịp hạn, cần để dành khoảng {amount} {every}.':
    'To make the deadline, set aside about {amount} {every}.',
  'Số khác': 'Other amount',
  'Sửa': 'Edit',
  'VD: Học tiếng Anh': 'e.g. Learn English',
  'Hãy đặt tên cho mục tiêu': 'Give the goal a name',
  'Nhập số tiền mục tiêu': 'Enter a target amount',
  'Không lưu được': 'Could not save it',
  'Không tạo được mục tiêu': 'Could not create the goal',
  'Đã lưu mục tiêu': 'Goal saved',
  'Mục tiêu đã được đặt': 'Your goal is set',
  'Mục tiêu của riêng bạn': 'A goal of your own',
  'Lưu thay đổi': 'Save changes',
  'Lưu mục tiêu': 'Save goal',
  'Không nạp được': 'Could not add the money',
  'Cán đích!': 'Goal reached!',
  'Bạn đã hoàn thành mục tiêu "{name}".': 'You completed the goal “{name}”.',
  'vào "{name}"': 'to “{name}”',
  'VD: 350.000': 'e.g. 350,000',
  'VD: 30.000.000': 'e.g. 30,000,000',
  'Nạp vào "{name}"': 'Add to “{name}”',
  'Nạp': 'Add',
  'Xoá "{name}"? Lịch sử nạp tiền của mục tiêu này cũng sẽ mất.':
    'Delete “{name}”? Its deposit history goes too.',
  'mỗi tuần': 'a week',
  'mỗi tháng': 'a month',
  'tuần': 'weeks',
  'tháng': 'months',
  'Nhập số tiền mục tiêu để Ekko tính giúp bạn.': 'Enter a target amount and Ekko does the maths.',
  'Chọn thời hạn để Ekko chia số tiền theo từng kỳ.':
    'Pick a deadline and Ekko splits the amount across periods.',
  'Thời hạn đã qua. Chọn một mốc trong tương lai để Ekko tính lại.':
    'That deadline has passed. Pick a future date and Ekko will recalculate.',
  'Cần tiết kiệm': 'Set aside',
  'trong {n} {unit} để bù {amount} còn thiếu': 'for {n} {unit} to cover the {amount} still missing',
  'trong {n} {unit} để đạt {amount}': 'for {n} {unit} to reach {amount}',

  // --- huy hiệu và cấp độ ---------------------------------------------
  'Bộ sưu tập của bạn': 'Your collection',
  'Huy hiệu': 'Badges',
  '{got}/{total} huy hiệu · cấp {level}': '{got}/{total} badges · level {level}',
  'Sáu cấp độ': 'Six levels',
  'Xem tất cả': 'See all',
  'Đang ở đây': 'You are here',
  'Cần {xp} XP': '{xp} XP needed',
  'Hoạt động gần đây': 'Recent activity',
  'Chưa có hoạt động nào': 'No activity yet',
  'Chưa mở': 'Locked',
  'Đã mở': 'Unlocked',

  // --- các concept khác của màn Khám phá --------------------------------
  'Đảo của bạn': 'Your island',
  'Khám phá · Bản đồ học tập': 'Explore · Learning map',
  'Khám phá · Quần đảo': 'Explore · Archipelago',
  'Trắc nghiệm kiến thức · Mô-đun {n}': 'Knowledge quiz · Module {n}',
  'Chưa mở khoá': 'Locked',
  'Bắt đầu': 'Start',

  // --- Ekko bot --------------------------------------------------------
  'Hỏi mình, hoặc ghi "cà phê 35k"': 'Ask me something, or log “coffee 35k”',
  'Tin nhắn': 'Message',
  Gửi: 'Send',
  'ghi nhanh': 'quick log',
  'Ekko bot chưa trả lời được': 'Ekko bot could not answer',
  'Không tải được lịch sử trò chuyện': 'Could not load the chat history',
  'Chào bạn, mình là **Ekko bot**. Mình giải thích các bài học, cho bạn biết streak và chi tiêu của mình, và ghi chi tiêu giúp bạn chỉ bằng một câu nhắn.':
    'Hi, I’m **Ekko bot**. I explain the lessons, tell you where your streak and spending stand, and log an expense for you from a single message.',
  'Streak của tôi thế nào?': 'How is my streak?',
  'Quy tắc 50/30/20 là gì?': 'What is the 50/30/20 rule?',
  'Tháng này tôi tiêu bao nhiêu?': 'How much have I spent this month?',
  'Quỹ khẩn cấp cần bao nhiêu?': 'How big should an emergency fund be?',
};

const DICTS = { vi: null, en: EN };

const read = () => {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    return LANGUAGES.some((l) => l.code === saved) ? saved : 'vi';
  } catch { return 'vi'; }
};

let lang = read();
const listeners = new Set();

export const getLang = () => lang;

/** `?lang=en` để chụp ảnh hoặc gửi link demo mà không cần bấm. */
const fromQuery = new URLSearchParams(location.search).get('lang');
if (LANGUAGES.some((l) => l.code === fromQuery)) lang = fromQuery;

/**
 * `{tên}` thay bằng giá trị; `{n:day|days}` in ra số kèm dạng ít/nhiều — chỉ
 * bản tiếng Anh cần, tiếng Việt không chia số.
 */
function fill(template, vars) {
  if (!vars) return template;
  return String(template).replace(/\{(\w+)(?::([^}|]*)\|([^}]*))?\}/g,
    (whole, key, one, many) => {
      const value = vars[key];
      if (value === undefined) return whole;
      if (one === undefined) return String(value);
      return `${value} ${Number(value) === 1 ? one : many}`;
    });
}

/** Câu tiếng Việt là khoá; thiếu bản dịch thì dùng luôn câu gốc. */
export function t(source, vars) {
  const dict = DICTS[lang];
  return fill(dict?.[source] ?? source, vars);
}

export const onLangChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function setLang(next) {
  if (!LANGUAGES.some((l) => l.code === next) || next === lang) return;
  lang = next;
  try { localStorage.setItem(STORE_KEY, next); } catch { /* chế độ riêng tư */ }
  document.documentElement.lang = next;
  for (const fn of [...listeners]) fn(next);
}

document.documentElement.lang = lang;

/**
 * Nút chuyển ngôn ngữ. Đặt NGOÀI khung điện thoại — nó là công cụ của bản
 * demo, không phải một phần giao diện app, nên không chiếm chỗ trong màn hình
 * 402pt. Khung máy chỉ hiện ở cửa sổ đủ rộng (xem `.device__chassis`), nên ở
 * cửa sổ hẹp nút thu về một viên nhỏ ở góc trên phải, vẫn nằm ngoài phần app
 * cuộn được.
 */
export function languageSwitch() {
  const group = el('div.langswitch', { role: 'group', 'aria-label': 'Ngôn ngữ · Language' });

  const paint = () => mount(group, LANGUAGES.map((item) => el('button.langswitch__btn', {
    type: 'button',
    'aria-pressed': String(item.code === lang),
    title: item.label,
    onclick: () => setLang(item.code),
  }, item.short)));

  paint();
  onLangChange(paint);
  return group;
}
