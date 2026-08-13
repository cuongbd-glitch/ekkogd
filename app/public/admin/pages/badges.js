/** Huy hiệu: milestone rules evaluated after every rewarding action. */
import { el } from '/shared/client.js';
import { confirmAction, drawer, numberField, selectField, statusToggle, table, textAreaField, textField } from '../ui.js';

const TARGET_HINT = 'Chỉ dùng với điều kiện "feature_used": nhập mã chức năng (budget / goals / expenses / explore).';

export default async function badges(ctx) {
  const rows = await ctx.api.get('/api/admin/badges');
  const rules = ctx.meta.badgeRules;

  return el('div', {}, [
    el('div.page-head', {}, [
      el('div', {}, [
        el('h1', {}, 'Huy hiệu'),
        el('p', {}, 'Huy hiệu được xét lại sau mỗi hành động có thưởng. Khi người học đạt ngưỡng, huy hiệu được trao ngay và không bao giờ bị thu hồi.'),
      ]),
      el('div.page-head__actions', {}, [
        el('button.ekko-btn.ekko-btn--primary.ekko-btn--md', { onclick: () => edit(ctx, null, rows) }, '+ Thêm huy hiệu'),
      ]),
    ]),

    table(
      [{ label: '' }, { label: 'Huy hiệu' }, { label: 'Mã' }, { label: 'Điều kiện' }, { label: 'Ngưỡng', align: 'right' }, { label: 'Thưởng XP', align: 'right' }, { label: 'Trạng thái' }, { label: '' }],
      rows,
      (row) => el('tr', {}, [
        el('td', { style: { fontSize: '22px' } }, row.icon || '🏅'),
        el('td', {}, [
          el('strong', {}, row.name),
          row.description ? el('span.cellmeta', {}, row.description) : null,
        ]),
        el('td', {}, [el('code', { style: { fontSize: '12px' } }, row.code)]),
        el('td', {}, [
          rules[row.rule_type] || row.rule_type,
          row.rule_target ? el('span.cellmeta', {}, `Phạm vi: ${row.rule_target}`) : null,
        ]),
        el('td.num', {}, String(row.rule_value)),
        el('td.num', {}, String(row.xp_reward)),
        el('td', {}, [statusToggle(ctx, { entity: 'badges', id: row.id, field: 'is_active', value: row.is_active, name: row.name })]),
        el('td', {}, [el('div.actions', {}, [
          el('button.ekko-btn.ekko-btn--secondary.ekko-btn--sm', { onclick: () => edit(ctx, row, rows) }, 'Sửa'),
          el('button.ekko-btn.ekko-btn--tertiary.ekko-btn--sm', { onclick: () => remove(ctx, row) }, 'Xoá'),
        ])]),
      ]),
    ),

    el('div.panel', { style: { marginTop: '16px' } }, [
      el('div.panel__head', {}, [el('h2', {}, 'Các loại điều kiện')]),
      el('div.bars', {}, Object.entries(rules).map(([key, label]) => el('div', { style: { display: 'flex', gap: '12px', fontSize: '13px' } }, [
        el('code', { style: { minWidth: '170px' } }, key),
        el('span.hint', {}, label),
      ]))),
    ]),
  ]);
}

function edit(ctx, row, rows) {
  const isNew = !row;
  const fields = {
    code: textField({ label: 'Mã huy hiệu', value: row?.code, placeholder: 'vd: streak_14', required: true, hint: 'Không dấu, không khoảng trắng. Dùng để tham chiếu trong hệ thống.' }),
    name: textField({ label: 'Tên hiển thị', value: row?.name, placeholder: 'VD: Streak 14 ngày', required: true }),
    description: textAreaField({ label: 'Mô tả', value: row?.description, rows: 2, placeholder: 'Người học thấy dòng này khi mở huy hiệu.' }),
    icon: textField({ label: 'Biểu tượng', value: row?.icon || '🏅', hint: 'Một emoji, hoặc đường dẫn ảnh bắt đầu bằng /assets/.' }),
    rule_type: selectField({
      label: 'Điều kiện', value: row?.rule_type || 'lessons_completed',
      options: Object.entries(ctx.meta.badgeRules).map(([key, label]) => [key, `${key} — ${label}`]),
    }),
    rule_value: numberField({ label: 'Ngưỡng', value: row?.rule_value ?? 1, required: true }),
    rule_target: textField({ label: 'Phạm vi (tuỳ chọn)', value: row?.rule_target, hint: TARGET_HINT }),
    xp_reward: numberField({ label: 'Thưởng XP khi nhận', value: row?.xp_reward ?? 0 }),
    order_index: numberField({ label: 'Thứ tự hiển thị', value: row?.order_index ?? (Math.max(0, ...rows.map((r) => r.order_index)) + 1) }),
  };

  drawer({
    title: isNew ? 'Thêm huy hiệu' : `Sửa: ${row.name}`,
    fields: Object.values(fields),
    onSave: async () => {
      const body = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.get()]));
      if (!/^[a-z0-9_]+$/.test(String(body.code || ''))) {
        ctx.notify('Mã huy hiệu chỉ gồm chữ thường, số và dấu gạch dưới', 'error');
        return false;
      }
      try {
        if (isNew) await ctx.api.post('/api/admin/badges', body);
        else await ctx.api.patch(`/api/admin/badges/${row.id}`, body);
        ctx.notify('Đã lưu huy hiệu', 'success');
        await ctx.reload();
      } catch (err) {
        ctx.notify(err.message, 'error');
        return false;
      }
      return true;
    },
  });
}

async function remove(ctx, row) {
  if (!await confirmAction(`Xoá huy hiệu "${row.name}"? Những người đã nhận sẽ mất huy hiệu này khỏi bộ sưu tập.`)) return;
  try {
    await ctx.api.delete(`/api/admin/badges/${row.id}`);
    ctx.notify('Đã xoá huy hiệu');
    await ctx.reload();
  } catch (err) {
    ctx.notify(err.message, 'error');
  }
}
