/** Bốn chức năng người học dùng hằng ngày, ngoài phần bài học. */
import { el } from '/shared/client.js';
import { assetField, modal, numberField, statusToggle, table, tabbed, textAreaField, textField } from '../ui.js';
import { categoriesPanel } from './categories.js';

export default async function features(ctx) {
  const rows = await ctx.api.get('/api/admin/features');

  return el('div', {}, [
    el('div.page-head', {}, [
      el('div', {}, [
        el('h1', {}, 'Chức năng'),
        el('p', {}, 'Bốn chức năng người học dùng hằng ngày. Mã chức năng gắn với logic trong app nên không nên đổi; tên, mô tả, ảnh và điểm thưởng thì sửa thoải mái.'),
      ]),
    ]),

    table(
      [{ label: 'Ảnh' }, { label: 'Chức năng' }, { label: 'Mã' }, { label: 'Đường dẫn' }, { label: 'XP mỗi ngày', align: 'right' }, { label: 'Trạng thái' }, { label: '' }],
      rows,
      (row) => el('tr', {}, [
        el('td', {}, [row.island_image ? el('img.thumb', { src: row.island_image, alt: '' }) : '—']),
        el('td', {}, [
          el('strong', {}, row.name),
          row.description ? el('span.cellmeta', {}, row.description) : null,
          row.code === 'expenses' ? el('span.cellmeta', {}, 'Sửa để quản lý Nhóm chi tiêu') : null,
        ]),
        el('td', {}, [el('code', { style: { fontSize: '12px' } }, row.code)]),
        el('td', {}, [el('span.cellmeta', {}, row.route)]),
        el('td.num', {}, String(row.xp_per_day)),
        el('td', {}, [statusToggle(ctx, { entity: 'features', id: row.id, field: 'is_enabled', value: row.is_enabled, on: 'Hiện trong app', off: 'Đã ẩn', name: row.name })]),
        el('td', {}, [el('div.actions', {}, [
          el('button.ekko-btn.ekko-btn--secondary.ekko-btn--sm', { onclick: () => edit(ctx, row) }, 'Sửa'),
        ])]),
      ]),
    ),

    el('div.panel', { style: { marginTop: '16px' } }, [
      el('div.panel__head', {}, [el('h2', {}, 'Cách tính streak')]),
      el('p.hint', {}, 'Mở một chức năng lên xem thì KHÔNG được gì. Chỉ khi người học thực sự làm một việc — lưu ngân sách, đặt hoặc nạp mục tiêu, ghi một khoản chi — lần đầu trong ngày mới cộng +1 streak và trả số XP ở cột "XP mỗi ngày". Các lần sau trong cùng ngày không cộng thêm. Nghỉ một ngày thì chuỗi bị đóng băng, tối đa 3 ngày; quá 3 ngày thì mất chuỗi và bắt đầu lại từ 1.'),
    ]),
  ]);
}

function edit(ctx, row) {
  const fields = {
    name: textField({ label: 'Tên chức năng', value: row.name, required: true }),
    order_index: numberField({ label: 'Thứ tự trên bản đồ', value: row.order_index, hint: '1 = trên trái, 2 = trên phải, 3 = dưới trái, 4 = dưới phải.' }),
    description: textAreaField({ label: 'Mô tả', value: row.description, rows: 2 }),
    island_image: assetField({ label: 'Ảnh minh hoạ', value: row.island_image, uploader: ctx.uploader }),
    route: textField({ label: 'Đường dẫn trong app', value: row.route, hint: 'Ví dụ: /app/#/budget' }),
    xp_per_day: numberField({ label: 'XP cho lần dùng đầu tiên mỗi ngày', value: row.xp_per_day }),
  };

  const settings = el('div', { style: { display: 'grid', gap: '16px' } }, [
    el('div.formrow.formrow--2', {}, [fields.name.node, fields.order_index.node]),
    fields.description.node,
    el('div.formrow.formrow--2', {}, [fields.route.node, fields.xp_per_day.node]),
    fields.island_image.node,
  ]);

  // Only the expense ledger has groups, so only it gets the second tab.
  const groups = row.code === 'expenses' ? categoriesPanel(ctx) : null;

  modal({
    title: `Sửa: ${row.name}`,
    width: 880,
    rows: [[tabbed([['Chức năng', settings], ['Nhóm chi tiêu', groups]])]],
    onSave: async () => {
      const body = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.get()]));
      try {
        await ctx.api.patch(`/api/admin/features/${row.id}`, body);
        ctx.notify('Đã lưu chức năng', 'success');
        await ctx.reload();
      } catch (err) { ctx.notify(err.message, 'error'); return false; }
      return true;
    },
  });
}
