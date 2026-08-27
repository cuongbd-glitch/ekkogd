/**
 * Catalogue seed: the six levels, the badge set, the four islands, and the
 * expense categories. Everything here is editable afterwards in the Admin
 * portal - this file only supplies the starting state.
 */

/**
 * Sáu cấp độ của chú heo. `perk` để trống có chủ đích: phúc lợi gắn với mỗi cấp
 * là quyết định của Ekko, quản trị viên tự điền trong Admin portal.
 */
export const LEVELS = [
  { order_index: 1, name: 'Heo Mầm Non',     emoji: '🐷', xp_required: 0,   perk: '' },
  { order_index: 2, name: 'Heo Học Việc',    emoji: '🐖', xp_required: 30,  perk: '' },
  { order_index: 3, name: 'Heo Tích Lũy',    emoji: '🐽', xp_required: 80,  perk: '' },
  { order_index: 4, name: 'Heo No Đủ',       emoji: '🐹', xp_required: 160, perk: '' },
  { order_index: 5, name: 'Heo Đầu Tư',      emoji: '🐗', xp_required: 260, perk: '' },
  { order_index: 6, name: 'Heo Thịnh Vượng', emoji: '👑', xp_required: 350, perk: '' },
].map((level) => ({
  ...level,
  island_image: `/assets/islands/level-${level.order_index}.png`,
  character_image: `/assets/levels/pig-${level.order_index}.png`,
}));

/** Biểu tượng của từng mô đun, khớp thứ tự trong curriculum.js. */
export const MODULE_EMOJI = {
  1: '🔍',
  2: '🧾',
  3: '🎯',
  4: '💳',
  5: '🛡️',
  6: '🧭',
};

export const BADGES = [
  { code: 'first_lesson', name: 'Bài học đầu tiên', description: 'Hoàn thành bài học đầu tiên của bạn.', icon: '📖', rule_type: 'lessons_completed', rule_value: 1, xp_reward: 20, order_index: 1 },
  { code: 'first_module', name: 'Mô đun đầu tiên', description: 'Hoàn thành trọn vẹn một mô đun học tập.', icon: '🎓', rule_type: 'modules_completed', rule_value: 1, xp_reward: 50, order_index: 2 },
  { code: 'streak_7', name: 'Streak 7 ngày', description: 'Học hoặc dùng một chức năng 7 ngày liên tiếp.', icon: '🔥', rule_type: 'streak_days', rule_value: 7, xp_reward: 70, order_index: 3 },
  { code: 'streak_30', name: 'Streak 30 ngày', description: 'Giữ chuỗi 30 ngày liên tiếp. Rất ít người làm được.', icon: '⚡', rule_type: 'streak_days', rule_value: 30, xp_reward: 300, order_index: 4 },
  { code: 'first_budget', name: 'Ngân sách đầu tiên', description: 'Lập ngân sách tháng đầu tiên của bạn.', icon: '🧾', rule_type: 'budgets_created', rule_value: 1, xp_reward: 40, order_index: 5 },
  { code: 'first_goal', name: 'Mục tiêu đầu tiên', description: 'Đặt mục tiêu tiết kiệm đầu tiên.', icon: '🎯', rule_type: 'goals_created', rule_value: 1, xp_reward: 40, order_index: 6 },
  { code: 'goal_done', name: 'Cán đích', description: 'Hoàn thành một mục tiêu tiết kiệm.', icon: '🏆', rule_type: 'goals_completed', rule_value: 1, xp_reward: 120, order_index: 7 },
  { code: 'expense_10', name: 'Người ghi chép', description: 'Ghi 10 khoản chi tiêu.', icon: '✏️', rule_type: 'expenses_logged', rule_value: 10, xp_reward: 50, order_index: 8 },
  { code: 'expense_50', name: 'Sổ tay dày dặn', description: 'Ghi 50 khoản chi tiêu.', icon: '📚', rule_type: 'expenses_logged', rule_value: 50, xp_reward: 150, order_index: 9 },
  { code: 'bot_friend', name: 'Bạn của Ekko bot', description: 'Trò chuyện với Ekko bot 5 lần.', icon: '🤖', rule_type: 'bot_chats', rule_value: 5, xp_reward: 30, order_index: 10 },
  { code: 'level_3', name: 'Nhà Kế Hoạch', description: 'Đạt cấp độ 3.', icon: '🗺️', rule_type: 'level_reached', rule_value: 3, xp_reward: 60, order_index: 11 },
  { code: 'level_6', name: 'Bậc thầy bầu trời', description: 'Đạt cấp độ 6, cấp cao nhất.', icon: '👑', rule_type: 'level_reached', rule_value: 6, xp_reward: 500, order_index: 12 },
];

export const FEATURES = [
  {
    code: 'explore',
    name: 'Khám phá',
    description: 'Các bài học về tài chính cá nhân, mở khoá dần theo cấp độ.',
    island_image: '/assets/islands/feature-explore.png',
    route: '/app/#/explore',
    order_index: 1,
    xp_per_day: 0,
  },
  {
    code: 'budget',
    name: 'Lập ngân sách',
    description: 'Lập và theo dõi ngân sách hằng tháng.',
    island_image: '/assets/islands/feature-budget.png',
    route: '/app/#/budget',
    order_index: 2,
    xp_per_day: 15,
  },
  {
    code: 'goals',
    name: 'Mục tiêu tài chính',
    description: 'Đặt và theo dõi mục tiêu tiết kiệm.',
    island_image: '/assets/islands/feature-goals.png',
    route: '/app/#/goals',
    order_index: 3,
    xp_per_day: 15,
  },
  {
    code: 'expenses',
    name: 'Ghi chép chi tiêu',
    description: 'Ghi nhanh chi tiêu với hỗ trợ AI.',
    island_image: '/assets/islands/feature-expenses.png',
    route: '/app/#/expenses',
    order_index: 4,
    xp_per_day: 15,
  },
];

/** `keywords` powers Ekko bot's quick-expense parser. */
/**
 * `daily_limit` = ngưỡng cảnh báo cho MỘT khoản chi trong nhóm.
 *
 * Chỉ đặt cho các nhóm chi **thường ngày**, nơi một con số lớn gần như luôn là
 * gõ nhầm (thêm một số 0) chứ không phải chi thật. Các nhóm vốn đã lớn theo bản
 * chất — tiền nhà, học phí, gia đình, tiết kiệm — để `null`, cảnh báo ở đó chỉ
 * là tiếng ồn. Mức lấy theo thu nhập phổ thông ở Việt Nam; Admin sửa được.
 */
export const CATEGORIES = [
  { code: 'food', name: 'Ăn uống', icon: '🍜', color: '#EC5962', order_index: 1, daily_limit: 500000, keywords: 'ăn,ăn sáng,ăn trưa,ăn tối,cơm,phở,bún,cà phê,cafe,trà sữa,nước,quán,nhà hàng,đồ ăn,ship đồ ăn,grabfood,shopeefood' },
  { code: 'transport', name: 'Đi lại', icon: '🛵', color: '#3E58F1', order_index: 2, daily_limit: 500000, keywords: 'xăng,grab,xe ôm,taxi,gửi xe,vé xe,xe buýt,bus,tàu,vé máy bay,sửa xe,rửa xe,be,gojek' },
  { code: 'housing', name: 'Nhà ở', icon: '🏠', color: '#4A8D8B', order_index: 3, daily_limit: null, keywords: 'thuê nhà,tiền nhà,tiền trọ,điện,nước,internet,wifi,rác,quản lý,gas' },
  { code: 'shopping', name: 'Mua sắm', icon: '🛍️', color: '#C000BD', order_index: 4, daily_limit: 2000000, keywords: 'mua,quần áo,giày,mỹ phẩm,shopee,lazada,tiki,siêu thị,tạp hoá,đồ dùng' },
  { code: 'health', name: 'Sức khoẻ', icon: '💊', color: '#7CC731', order_index: 5, daily_limit: null, keywords: 'thuốc,khám bệnh,bệnh viện,nha khoa,bảo hiểm y tế,phòng khám,tập gym,gym' },
  { code: 'family', name: 'Gia đình', icon: '👨‍👩‍👧', color: '#FCC902', order_index: 6, daily_limit: null, keywords: 'con,học phí,sữa,bỉm,gửi bố mẹ,biếu,quà,hiếu hỉ,đám cưới,giỗ' },
  { code: 'entertainment', name: 'Giải trí', icon: '🎬', color: '#7B61FF', order_index: 7, daily_limit: 1000000, keywords: 'phim,rạp,game,netflix,spotify,du lịch,nhậu,karaoke,cà phê bạn bè' },
  { code: 'education', name: 'Học tập', icon: '🎓', color: '#1283EB', order_index: 8, daily_limit: null, keywords: 'sách,khoá học,học phí,tiếng anh,lớp học' },
  { code: 'saving', name: 'Tiết kiệm', icon: '🐷', color: '#0F9E9A', order_index: 9, daily_limit: null, keywords: 'tiết kiệm,để dành,gửi tiết kiệm,quỹ' },
  { code: 'other', name: 'Khác', icon: '📦', color: '#7C7C7C', order_index: 10, daily_limit: null, keywords: '' },
];
