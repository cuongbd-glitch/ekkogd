/**
 * Concept giao diện của màn Khám phá.
 *
 * Mỗi concept là một cách kể chuyện khác nhau cho cùng một lộ trình học: cùng
 * thứ tự bài, cùng luật mở khoá, cùng tiến độ — chỉ đổi hình hài. Vì vậy concept
 * là **một lựa chọn duy nhất cho cả sản phẩm**, không phải tuỳ chọn của từng
 * người học: hai người cùng công ty mở app phải thấy cùng một thế giới.
 *
 * Bản thân cách vẽ nằm ở code (`public/app/views/explore-*.js`), nên danh sách ở
 * đây chỉ mô tả và đánh dấu cái nào đang bật.
 */
import { getSetting, setSetting } from '../db.js';

const SETTING_KEY = 'explore_concept';

export const CONCEPTS = [
  {
    code: 'sky',
    order_index: 1,
    name: 'Đảo trên trời',
    tagline: 'Con đường uốn lượn giữa mây',
    description: 'Các đảo bài học nổi trên nền trời, nối với nhau bằng một đường nét đứt đi từ dưới lên. Đảo của người học nằm ở chân trang, mốc mô-đun đứng cạnh đường như biển chỉ dẫn.',
    highlights: ['Nền trời chuyển sắc', 'Đường đi uốn lượn đo theo vị trí thật', 'Chú heo đứng ở chặng đang học'],
  },
  {
    code: 'islands',
    order_index: 2,
    name: 'Quần đảo so le',
    tagline: 'Đảo bay xếp so le hai bên lối mòn',
    description: 'Mỗi bài học là một hòn đảo bay, xếp so le trái – phải với nhãn bài nằm ở nửa còn lại của hàng, nên đọc xuống thấy một lối mòn lượn qua lượn lại. Hình đảo cắt từ bộ artwork Đảo.svg của Ekko.',
    highlights: ['Sáu kiểu đảo xoay vòng', 'Đảo so le trái – phải, nhãn nằm bên đối diện', 'Đi từ dưới lên, đảo của bạn ở chân trang'],
  },
  {
    code: 'path',
    order_index: 3,
    name: 'Lối học nút tròn',
    tagline: 'Chuỗi nút tròn, mô-đun là tấm biển ở đầu chặng',
    description: 'Không còn hình đảo: mỗi bài học là một nút tròn mang icon, xếp thành lối đi lượn từ trên xuống. Mô-đun là tấm biển đặt ở đầu nhóm nút của nó. Các tính năng (ghi chép, ngân sách, mục tiêu) chen vào lối đi như một chặng bình thường, nên người học gặp chúng đúng lúc vừa học xong phần lý thuyết liên quan.',
    highlights: ['Nút tròn mang icon, không dùng hình đảo', 'Mô-đun là tấm biển ở đầu nhóm', 'Tính năng nằm ngay trên lối đi', 'Chú heo đứng cạnh nút đang học'],
  },
];

export const DEFAULT_CONCEPT = CONCEPTS[0].code;

export const conceptByCode = (code) => CONCEPTS.find((c) => c.code === code) || null;

/** Mã cũ đã lưu trong settings, giữ lại để không mất lựa chọn của quản trị viên. */
const LEGACY = { hex: 'islands' };

/** Concept đang bật. Giá trị lạ trong settings sẽ lùi về mặc định. */
export function activeConcept() {
  const stored = getSetting(SETTING_KEY, DEFAULT_CONCEPT);
  const code = LEGACY[stored] || stored;
  return conceptByCode(code) ? code : DEFAULT_CONCEPT;
}

/** @returns {string} mã concept sau khi đổi. */
export function setActiveConcept(code) {
  if (!conceptByCode(code)) return activeConcept();
  setSetting(SETTING_KEY, code);
  return code;
}

/** Danh sách kèm cờ `active`, dùng cho Admin portal. */
export const conceptBoard = () => {
  const active = activeConcept();
  return CONCEPTS.map((concept) => ({ ...concept, active: concept.code === active }));
};
