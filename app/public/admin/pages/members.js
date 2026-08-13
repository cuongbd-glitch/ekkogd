/**
 * Người học. Progress and engagement only. Personal budget, goal and expense
 * records are never exposed here.
 */
import { el, formatDay } from '/shared/client.js';
import { badge, table } from '../ui.js';

export default async function members(ctx) {
  const rows = await ctx.api.get('/api/admin/stats/users');
  const search = el('input', { type: 'search', placeholder: 'Tìm theo tên, email hoặc công ty' });
  const listHost = el('div');

  const draw = () => {
    const query = search.value.trim().toLowerCase();
    const filtered = query
      ? rows.filter((r) => [r.name, r.email, r.employer].filter(Boolean).some((v) => v.toLowerCase().includes(query)))
      : rows;

    listHost.replaceChildren(table(
      [{ label: 'Người học' }, { label: 'Công ty' }, { label: 'Cấp độ' }, { label: 'XP', align: 'right' }, { label: 'Streak', align: 'right' }, { label: 'Bài học', align: 'right' }, { label: 'Huy hiệu', align: 'right' }, { label: 'Hoạt động gần nhất' }],
      filtered,
      (row) => el('tr', {}, [
        el('td', {}, [
          el('strong', {}, row.name),
          el('span.cellmeta', {}, row.email || '—'),
        ]),
        el('td', {}, row.employer || '—'),
        el('td', {}, [
          row.level_name || '—',
          row.role === 'admin' ? badge('Quản trị', 'brand') : null,
        ]),
        el('td.num', {}, String(row.xp ?? 0)),
        el('td.num', {}, [
          String(row.streak_count ?? 0),
          el('span.cellmeta', {}, `kỷ lục ${row.streak_best ?? 0}`),
        ]),
        el('td.num', {}, String(row.lessons_done ?? 0)),
        el('td.num', {}, String(row.badges ?? 0)),
        el('td', {}, row.last_active_day ? formatDay(row.last_active_day) : 'Chưa có'),
      ]),
    ));
  };

  search.addEventListener('input', draw);
  draw();

  return el('div', {}, [
    el('div.page-head', {}, [
      el('div', {}, [
        el('h1', {}, 'Người học'),
        el('p', {}, 'Tiến độ học tập và mức độ tham gia. Ngân sách, mục tiêu và chi tiêu của từng người là dữ liệu riêng tư và không hiển thị ở đây.'),
      ]),
    ]),

    el('div.toolbar', {}, [
      el('span.ekko-input.ekko-input--md', {}, [search]),
      el('span.hint', {}, `${rows.length} người học`),
    ]),

    listHost,
  ]);
}
