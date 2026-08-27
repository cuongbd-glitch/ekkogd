/**
 * Khám phá.
 *
 * Màn này có nhiều "concept" — cùng một lộ trình học, khác cách kể chuyện. Quản
 * trị viên chọn concept trong Admin portal và cả sản phẩm dùng chung một concept
 * tại một thời điểm, nên ở đây chỉ việc gọi đúng bộ vẽ mà server chỉ định.
 *
 * Dữ liệu bản đồ lấy một lần ở đây rồi truyền xuống: mọi concept đều nhận cùng
 * một danh sách chặng, nên đổi concept không đổi tiến độ hay luật mở khoá.
 */
import { api } from '/shared/client.js';
import exploreSky from './explore-sky.js';
import exploreIslands from './explore-islands.js';
import explorePath from './explore-path.js';

const RENDERERS = {
  sky: exploreSky,
  islands: exploreIslands,
  path: explorePath,
};

export default async function exploreView(ctx) {
  const map = await api.get('/api/learn/map');
  const render = RENDERERS[map.concept] || exploreSky;
  return render(ctx, map);
}
