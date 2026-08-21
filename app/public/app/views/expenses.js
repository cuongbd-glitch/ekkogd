/** Ghi chép chi tiêu: fast manual entry, plus the same log Ekko bot writes to. */
import { api, el, guard, mount, relativeDay, singleFlight, toast, vnd, vndShort } from '/shared/client.js';
import { closeSheet, confirmSheet, sheet } from '../ui.js';

const RANGES = [
  ['today', 'Hôm nay'],
  ['week', 'Tuần này'],
  ['month', 'Tháng này'],
];

/** The chosen range lives in the hash, so a re-render (or a shared link) keeps it. */
const currentRange = () => {
  const asked = new URLSearchParams(location.hash.split('?')[1] || '').get('range');
  return RANGES.some(([key]) => key === asked) ? asked : 'month';
};

export default async function expensesView(ctx) {
  const container = el('div');
  const range = currentRange();
  const rerender = async () => mount(container, await body(ctx, rerender, null, range));

  const data = await api.get(`/api/expenses?range=${range}`);
  mount(container, await body(ctx, rerender, data, range));
  return container;
}

async function body(ctx, rerender, preloaded, range) {
  const data = preloaded || await api.get(`/api/expenses?range=${range}`);
  const { expenses, byCategory, totals, categories, label } = data;

  const tabs = el('div.segmented', { role: 'group', 'aria-label': 'Lọc theo thời gian' },
    RANGES.map(([key, text]) => el('button', {
      'aria-pressed': String(key === range),
      // Month is the default, so it gets the bare URL rather than ?range=month.
      onclick: () => ctx.navigate(key === 'month' ? '/expenses' : `/expenses?range=${key}`),
    }, text)));

  const summary = el('div.card', { style: { marginTop: '12px' } }, [
    el('div.stat-row', {}, [
      el('span.stat-big', {}, vnd(totals.total)),
      el('small', {}, label.toLowerCase()),
    ]),
    el('div.stat-row', { style: { marginTop: '10px' } }, [
      el('small', {}, range === 'today' ? '' : `Hôm nay: ${vnd(totals.today)}`),
      el('small', {}, `${totals.count} khoản`),
    ]),
    byCategory.length ? categoryStack(byCategory) : null,
  ]);

  const quickAdd = el('button.btn.btn--block', { style: { marginTop: '16px' }, onclick: () => openAdd(ctx, categories, rerender) },
    '+ Ghi một khoản chi');

  const grouped = groupByDay(expenses);

  return el('div', {}, [
    el('div', { style: { fontSize: '17px', fontWeight: '600', marginBottom: '16px' } }, 'Ghi chép chi tiêu'),
    tabs,
    summary,
    quickAdd,

    expenses.length
      ? el('div', {}, grouped.map(([day, list]) => el('div', {}, [
        el('div.section-title', {}, [
          relativeDay(day, ctx.world.today),
          el('span', {}, vnd(list.reduce((sum, e) => sum + e.amount, 0))),
        ]),
        el('div.card', { style: { paddingTop: '0' } }, list.map((expense) => expenseRow(expense, rerender))),
      ])))
      : el('div.empty', {}, [
        el('img', { src: '/assets/islands/feature-expenses.png', alt: '' }),
        el('h3', {}, `Chưa có khoản chi nào ${label.toLowerCase()}`),
        el('p.muted', {}, 'Ghi ngay tại thời điểm trả tiền là cách duy nhất giữ được thói quen này.'),
      ]),
  ]);
}

function categoryStack(byCategory) {
  const top = byCategory.slice(0, 6);
  return el('div', { style: { marginTop: '16px' } }, [
    el('div', {
      style: {
        display: 'flex', height: '10px', borderRadius: '999px', overflow: 'hidden',
        background: 'var(--bg-grey-200)',
      },
    }, top.map((c) => el('span', {
      style: { width: `${c.percent}%`, background: c.color || 'var(--bg-brand-500)' },
      title: `${c.name}: ${vnd(c.total)}`,
    }))),
    el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' } },
      top.map((c) => el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)' } }, [
        el('i', { style: { width: '8px', height: '8px', borderRadius: '50%', background: c.color || 'var(--bg-brand-500)', display: 'inline-block' } }),
        `${c.name} ${vndShort(c.total)}`,
      ]))),
  ]);
}

function groupByDay(expenses) {
  const map = new Map();
  for (const expense of expenses) {
    if (!map.has(expense.spent_on)) map.set(expense.spent_on, []);
    map.get(expense.spent_on).push(expense);
  }
  return [...map.entries()];
}

function expenseRow(expense, rerender) {
  return el('div.row', {}, [
    // Màu nhóm do Admin đặt (dữ liệu), pha loãng 10% bằng color-mix; thiếu màu
    // thì lùi về token thương hiệu.
    el('span.row__icon', {
      style: { background: `color-mix(in srgb, ${expense.category_color || 'var(--bg-brand-500)'} 10%, transparent)` },
    }, expense.category_icon || '📦'),
    el('div.row__main', {}, [
      el('div.row__title', {}, expense.note || expense.category_name || 'Khoản chi'),
      el('div.row__sub', {}, [
        expense.category_name || 'Khác',
        expense.source === 'bot' ? ' · qua Ekko bot' : '',
      ].join('')),
    ]),
    el('span.row__value', {}, vnd(expense.amount)),
    el('button.iconbtn', {
      style: { width: '32px', height: '32px', background: 'transparent', color: 'var(--text-tertiary)' },
      'aria-label': 'Xoá khoản chi',
      onclick: async () => {
        const ok = await confirmSheet({
          title: 'Xoá khoản chi',
          message: `Xoá ${vnd(expense.amount)} - ${expense.note || expense.category_name || ''}?`,
        });
        if (!ok) return;
        await guard(() => api.delete(`/api/expenses/${expense.id}`), 'Không xoá được');
        toast('Đã xoá');
        rerender();
      },
    }, '✕'),
  ]);
}

function openAdd(ctx, categories, rerender) {
  const amountInput = el('input.input', {
    type: 'number', inputmode: 'numeric', min: '1000', step: '1000',
    placeholder: 'VD: 35000', autofocus: true,
  });
  const noteInput = el('input.input', { placeholder: 'VD: cà phê sáng', maxlength: '120' });
  const dateInput = el('input.input', { type: 'date', value: ctx.world.today });

  let picked = categories[0]?.id;
  const chips = el('div.chips', {}, categories.map((category) => el('button.chip', {
    'aria-pressed': String(category.id === picked),
    onclick: (event) => {
      picked = category.id;
      [...chips.children].forEach((child) => child.setAttribute('aria-pressed', 'false'));
      event.currentTarget.setAttribute('aria-pressed', 'true');
    },
  }, [category.icon || '📦', category.name])));

  // singleFlight: bấm "Lưu" hai lần liên tiếp không được ghi thành hai khoản.
  const save = singleFlight(async () => {
    const amount = Number(amountInput.value);
    if (!amount || amount <= 0) return toast('Nhập số tiền lớn hơn 0', 'error');

    const result = await guard(() => api.post('/api/expenses', {
      amount, categoryId: picked, note: noteInput.value.trim() || null, spentOn: dateInput.value,
    }), 'Không ghi được khoản chi');
    if (!result) return;

    closeSheet();
    if (result.alerts?.length) {
      toast({ title: result.alerts[0].title, body: result.alerts[0].text }, 'warning');
    } else {
      toast(`Đã ghi ${vnd(amount)}`, 'success');
    }
    await ctx.refreshWorld();
    rerender();
  });

  sheet({
    title: 'Ghi một khoản chi',
    body: [
      el('label.field', {}, [el('span', {}, 'Số tiền'), amountInput]),
      el('div.field', {}, [el('span', {}, 'Nhóm chi tiêu'), chips]),
      el('label.field', {}, [el('span', {}, 'Ghi chú'), noteInput]),
      el('label.field', {}, [el('span', {}, 'Ngày chi'), dateInput]),
      el('button.btn.btn--block', { onclick: save }, 'Lưu'),
    ],
  });
}
