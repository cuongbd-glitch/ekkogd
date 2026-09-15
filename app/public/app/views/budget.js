/** Lập ngân sách: plan the month, then watch each category fill up. */
import { api, el, guard, mount, spriteIcon, toast, vnd, vndShort } from '/shared/client.js';
import { bar, celebrateRewards, closeSheet, sheet } from '../ui.js';
import { getLang, t } from '../i18n.js';

/**
 * Tên tháng: tiếng Việt gọi tháng bằng số ("Tháng 9/2026"), tiếng Anh gọi bằng
 * tên ("September 2026") — dịch từng chữ thì ra "Month 9/2026", nên chỗ này
 * tách hẳn theo ngôn ngữ.
 */
const monthLabel = (month) => {
  const [y, m] = month.split('-');
  if (getLang() === 'en') {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(Number(y), Number(m) - 1, 1)));
  }
  return `Tháng ${Number(m)}/${y}`;
};

const shiftMonth = (month, delta) => {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
};

export default async function budgetView(ctx, month = ctx.world.today.slice(0, 7)) {
  const data = await api.get(`/api/budget?month=${month}`);

  const container = el('div');
  const rerender = async (nextMonth = month) => {
    mount(container, await budgetBody(ctx, nextMonth, rerender));
  };
  mount(container, await budgetBody(ctx, month, rerender, data));
  return container;
}

async function budgetBody(ctx, month, rerender, preloaded) {
  const data = preloaded || await api.get(`/api/budget?month=${month}`);
  const { totals, items } = data;

  const header = el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' } }, [
    el('button.iconbtn', { onclick: () => rerender(shiftMonth(month, -1)), 'aria-label': t('Tháng trước') }, [spriteIcon('chevron-left-01-stroke', 20)]),
    el('div', { style: { flex: '1', textAlign: 'center' } }, [
      el('div', { style: { fontSize: '17px', fontWeight: '600' } }, monthLabel(month)),
      el('div.muted', {}, totals.income ? t('Thu nhập {amount}', { amount: vnd(totals.income) }) : t('Chưa nhập thu nhập')),
    ]),
    el('button.iconbtn', { onclick: () => rerender(shiftMonth(month, 1)), 'aria-label': t('Tháng sau') }, [spriteIcon('chevron-right-01-stroke', 20)]),
  ]);

  if (!data.exists) {
    return el('div', {}, [
      header,
      el('div.empty', {}, [
        el('img', { src: '/assets/lessons/ban-ngan-sach-dau-tien.svg', alt: '' }),
        el('h3', {}, t('Chưa có ngân sách cho tháng này')),
        el('p.muted', {}, t('Nhập thu nhập rồi chia cho từng nhóm. Quy tắc gợi ý: 50% thiết yếu, 30% mong muốn, 20% cho tương lai.')),
        el('button.btn', { style: { marginTop: '16px' }, onclick: () => openEditor(ctx, data, month, rerender) }, t('Lập ngân sách')),
      ]),
    ]);
  }

  const percent = totals.planned ? Math.round((totals.spent / totals.planned) * 100) : 0;
  const tone = percent > 100 ? 'over' : percent > 80 ? 'warn' : '';

  const summary = el('div.card', {}, [
    el('div.stat-row', {}, [
      el('span.stat-big', {}, vnd(totals.spent)),
      el('small', {}, t('/ {amount} đã đặt', { amount: vnd(totals.planned) })),
    ]),
    el('div', { style: { marginTop: '10px' } }, [bar(percent, tone)]),
    el('div.stat-row', { style: { marginTop: '12px' } }, [
      el('small', {}, totals.remaining >= 0
        ? t('Còn lại {amount}', { amount: vnd(totals.remaining) })
        : t('Vượt {amount}', { amount: vnd(-totals.remaining) })),
      el('small', {}, totals.unallocated !== 0 && totals.income
        ? (totals.unallocated > 0
          ? t('Chưa phân bổ {amount}', { amount: vnd(totals.unallocated) })
          : t('Phân bổ vượt thu nhập {amount}', { amount: vnd(-totals.unallocated) }))
        : ''),
    ]),
    el('button.btn.btn--ghost.btn--block', { style: { marginTop: '14px' }, onclick: () => openEditor(ctx, data, month, rerender) }, t('Chỉnh sửa ngân sách')),
  ]);

  const rows = items.map((item) => {
    const itemTone = item.percent > 100 ? 'over' : item.percent > 80 ? 'warn' : '';
    return el('div', { style: { padding: '12px 0', borderTop: '1px solid var(--border-secondary)' } }, [
      el('div.stat-row', {}, [
        el('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' } }, [
          el('span', {}, item.icon || '📦'),
          item.name,
        ]),
        el('small', {}, `${vndShort(item.spent)} / ${vndShort(item.planned)}`),
      ]),
      el('div', { style: { marginTop: '8px' } }, [bar(item.percent, itemTone)]),
      item.percent > 100
        ? el('div', { style: { fontSize: '12px', color: 'var(--text-error)', marginTop: '6px' } },
          t('Vượt {amount}. Hãy bù từ nhóm mong muốn, đừng lấy từ phần tiết kiệm.', { amount: vnd(-item.remaining) }))
        : null,
    ]);
  });

  return el('div', {}, [
    header,
    summary,
    el('div.section-title', {}, [t('Theo nhóm'), el('span', {}, t('{n} nhóm', { n: items.length }))]),
    el('div.card', { style: { paddingTop: '0' } }, rows),
  ]);
}

function openEditor(ctx, data, month, rerender) {
  const planned = new Map(data.items.map((i) => [i.category_id, i.planned]));
  const incomeInput = el('input.input', {
    type: 'number', inputmode: 'numeric', min: '0', step: '100000',
    value: String(data.totals.income || ''), placeholder: t('VD: 12000000'),
  });

  const totalNode = el('div.muted', { style: { marginBottom: '12px' } });
  const updateTotal = () => {
    const sum = [...planned.values()].reduce((a, b) => a + b, 0);
    const income = Number(incomeInput.value) || 0;
    totalNode.textContent = income
      ? t('Đã phân bổ {used} trên thu nhập {income} (còn {left}).',
        { used: vnd(sum), income: vnd(income), left: vnd(income - sum) })
      : t('Đã phân bổ {used}.', { used: vnd(sum) });
  };

  const categoryRows = data.categories.map((category) => {
    const input = el('input.input', {
      type: 'number', inputmode: 'numeric', min: '0', step: '50000',
      value: String(planned.get(category.id) || ''),
      placeholder: '0',
      style: { width: '140px', textAlign: 'right' },
      oninput: (event) => {
        planned.set(category.id, Math.max(0, Number(event.target.value) || 0));
        updateTotal();
      },
    });
    return el('div.row', {}, [
      el('span.row__icon', {}, category.icon || '📦'),
      el('div.row__main', {}, [el('div.row__title', {}, category.name)]),
      input,
    ]);
  });

  incomeInput.addEventListener('input', updateTotal);
  updateTotal();

  const save = async () => {
    const items = [...planned.entries()]
      .filter(([, value]) => value > 0)
      .map(([categoryId, value]) => ({ categoryId, planned: value }));

    if (!items.length) return toast(t('Hãy đặt hạn mức cho ít nhất một nhóm'), 'error');

    const result = await guard(() => api.put('/api/budget', {
      month, income: Number(incomeInput.value) || 0, items,
    }), t('Không lưu được ngân sách'));
    if (!result) return;

    closeSheet();
    toast(t('Đã lưu ngân sách'), 'success');
    await celebrateRewards(result.rewards, { title: t('Ngân sách đã sẵn sàng') });
    await ctx.refreshWorld();
    rerender(month);
  };

  sheet({
    title: t('Ngân sách {month}', { month: monthLabel(month) }),
    body: [
      el('label.field', {}, [el('span', {}, t('Thu nhập thực nhận trong tháng')), incomeInput]),
      el('p.muted', { style: { marginTop: '0' } }, t('Gợi ý: đặt phần tiết kiệm trước, phần còn lại mới chia cho các nhóm khác.')),
      totalNode,
      el('div.card', { style: { paddingTop: '0' } }, categoryRows),
      el('button.btn.btn--block', { style: { marginTop: '16px' }, onclick: save }, t('Lưu ngân sách')),
    ],
  });
}
