/** Ghi chép chi tiêu: fast manual entry, plus the same log Ekko bot writes to. */
import { api, el, formatDay, guard, mount, relativeDay, singleFlight, toast, vnd, vndShort } from '/shared/client.js';
import { bar, closeSheet, confirmSheet, sheet } from '../ui.js';
import { t } from '../i18n.js';

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
  const { expenses, byCategory, totals, categories, label, monthBudget } = data;

  const tabs = el('div.segmented', { role: 'group', 'aria-label': t('Lọc theo thời gian') },
    RANGES.map(([key, text]) => el('button', {
      'aria-pressed': String(key === range),
      // Month is the default, so it gets the bare URL rather than ?range=month.
      onclick: () => ctx.navigate(key === 'month' ? '/expenses' : `/expenses?range=${key}`),
    }, t(text))));

  const summary = el('div.card', { style: { marginTop: '12px' } }, [
    el('div.stat-row', {}, [
      el('span.stat-big', {}, vnd(totals.total)),
      el('small', {}, t(label).toLowerCase()),
    ]),
    el('div.stat-row', { style: { marginTop: '10px' } }, [
      el('small', {}, range === 'today' ? '' : t('Hôm nay: {amount}', { amount: vnd(totals.today) })),
      el('small', {}, t('{count} khoản', { count: totals.count })),
    ]),
    byCategory.length ? categoryStack(byCategory) : null,
    budgetGauge(monthBudget, ctx),
  ]);

  const quickAdd = el('button.btn.btn--block', { style: { marginTop: '16px' }, onclick: () => openAdd(ctx, categories, rerender) },
    `+ ${t('Ghi một khoản chi')}`);

  // Chụp trước rồi mới điền: đứng ở quầy thì chụp cái hoá đơn nhanh hơn là gõ số.
  const byReceipt = el('div.receipt__entry', {}, [
    receiptPicker((dataUrl) => scanThenAdd(ctx, categories, rerender, dataUrl)),
  ]);

  const grouped = groupByDay(expenses);

  return el('div', {}, [
    el('div', { style: { fontSize: '17px', fontWeight: '600', marginBottom: '16px' } }, t('Ghi chép chi tiêu')),
    tabs,
    summary,
    quickAdd,
    byReceipt,

    expenses.length
      ? el('div', {}, grouped.map(([day, list]) => el('div', {}, [
        el('div.section-title', {}, [
          relativeDay(day, ctx.world.today),
          el('span', {}, vnd(list.reduce((sum, e) => sum + e.amount, 0))),
        ]),
        el('div.card', { style: { paddingTop: '0' } }, list.map((expense) => expenseRow(expense, rerender))),
      ])))
      : el('div.empty', {}, [
        el('img', { src: '/assets/lessons/ghi-chep-3-phut.svg', alt: '' }),
        el('h3', {}, t('Chưa có khoản chi nào {period}', { period: t(label).toLowerCase() })),
        el('p.muted', {}, t('Ghi ngay tại thời điểm trả tiền là cách duy nhất giữ được thói quen này.')),
      ]),
  ]);
}

/**
 * Ngân sách tháng, đồng bộ với màn Lập ngân sách: cùng con số, cùng cách chia
 * mức, cùng chữ. Số liệu do server lấy thẳng từ hàm dựng màn ngân sách nên hai
 * nơi không thể lệch nhau.
 *
 * Luôn tính theo **cả tháng**, kể cả khi đang xem tab Hôm nay hay Tuần này —
 * "còn tiêu được bao nhiêu" là câu hỏi của cả tháng.
 */
function budgetGauge(month, ctx) {
  if (!month) return null;

  if (!month.exists) {
    return el('div.gauge', {}, [
      el('div.gauge__row', {}, [
        el('span.gauge__label', {}, t('Chưa lập ngân sách tháng này')),
        el('button.linkbtn', { onclick: () => ctx.navigate('/budget') }, t('Lập ngân sách')),
      ]),
    ]);
  }

  const vuot = month.percent > 100;
  const tone = toneFor(month.percent);
  return el('div.gauge', {}, [
    el('div.gauge__row', {}, [
      el('span.gauge__label', {}, t('Đã dùng {percent}% ngân sách tháng', { percent: month.percent })),
      el('span.gauge__value', { dataset: { tone: tone || 'ok' } }, vuot
        ? t('Vượt {amount}', { amount: vnd(-month.remaining) })
        : t('Còn {amount}', { amount: vnd(month.remaining) })),
    ]),
    bar(month.percent, tone),
    el('div.gauge__foot', {}, [
      t('{spent} trên ngân sách {planned}', { spent: vnd(month.spent), planned: vnd(month.planned) }),
      month.income ? ` · ${t('thu nhập {amount}', { amount: vnd(month.income) })}` : '',
    ].join('')),
  ]);
}

/** Cùng ngưỡng màu với màn Lập ngân sách: quá 80% là vàng, quá 100% là đỏ. */
const toneFor = (percent) => (percent > 100 ? 'over' : percent > 80 ? 'warn' : '');

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
      el('div.row__title', {}, expense.note || expense.category_name || t('Khoản chi')),
      el('div.row__sub', {}, [
        expense.category_name || t('Khác'),
        expense.source === 'bot' ? ` · ${t('qua Ekko bot')}` : '',
      ].join('')),
    ]),
    expense.receipt_url
      ? el('button.row__receipt', {
        'aria-label': t('Xem ảnh hoá đơn'),
        onclick: () => sheet({
          title: t('Ảnh hoá đơn'),
          body: [el('img.receipt__img', { src: expense.receipt_url, alt: t('Ảnh hoá đơn') })],
        }),
      }, [el('img', { src: expense.receipt_url, alt: '', loading: 'lazy' })])
      : null,
    el('span.row__value', {}, vnd(expense.amount)),
    el('button.iconbtn', {
      style: { width: '32px', height: '32px', background: 'transparent', color: 'var(--text-tertiary)' },
      'aria-label': t('Xoá khoản chi'),
      onclick: async () => {
        const ok = await confirmSheet({
          title: t('Xoá khoản chi'),
          message: t('Xoá {amount} - {what}?', {
            amount: vnd(expense.amount),
            what: expense.note || expense.category_name || '',
          }),
        });
        if (!ok) return;
        await guard(() => api.delete(`/api/expenses/${expense.id}`), t('Không xoá được'));
        toast(t('Đã xoá'));
        rerender();
      },
    }, '✕'),
  ]);
}

/**
 * Thu nhỏ ảnh ngay trên máy trước khi gửi: ảnh máy ảnh điện thoại thường 3–8 MB,
 * gửi thẳng thì vừa chậm vừa vượt trần body của server. 1280px là đủ đọc chữ trên
 * hoá đơn.
 */
function shrinkImage(file, max = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(t('Không đọc được tệp ảnh')));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(t('Tệp này không phải ảnh')));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = el('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Ô chọn ảnh hoá đơn: **chụp mới** hoặc **lấy ảnh có sẵn trong máy**.
 *
 * Hai ô `input[type=file]` riêng chứ không phải một: chỉ ô có `capture` mới mở
 * thẳng máy ảnh trên điện thoại, còn ô không có `capture` mới cho vào thư viện.
 * Gộp làm một thì trên một số máy người dùng không vào được thư viện.
 */
function receiptPicker(onPick) {
  const chup = el('input', { type: 'file', accept: 'image/*', capture: 'environment', style: { display: 'none' } });
  const chon = el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });

  const handle = async (input) => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      onPick(await shrinkImage(file));
    } catch (err) {
      toast(err.message || t('Không đọc được ảnh'), 'error');
    }
  };
  chup.addEventListener('change', () => handle(chup));
  chon.addEventListener('change', () => handle(chon));

  return el('div.receipt__pick', {}, [
    el('button.btn.btn--ghost', { onclick: () => chup.click() }, [`📷 ${t('Chụp hoá đơn')}`]),
    el('button.btn.btn--ghost', { onclick: () => chon.click() }, [`🖼️ ${t('Chọn ảnh có sẵn')}`]),
    chup,
    chon,
  ]);
}

/**
 * Gửi ảnh cho máy chủ đọc rồi mở form đã điền sẵn. Đọc được hay không thì form
 * vẫn mở — hỏng phần đọc tự động không được làm người dùng mất luôn đường ghi tay.
 */
/**
 * Ngày để điền vào form từ ngày đọc được trên hoá đơn.
 *
 * Chỉ nhận ngày **trong tháng đang xem**. Sổ chi tiêu chỉ có ba khoảng Hôm nay /
 * Tuần này / Tháng này, nên một tờ hoá đơn cũ (ảnh chụp lại hoá đơn năm 2022) mà
 * ghi đúng ngày của nó thì khoản chi biến mất khỏi mọi khoảng xem — người dùng
 * tưởng app nuốt mất. Ngoài tháng này thì để ngày hôm nay và nói rõ ngày trên hoá
 * đơn là ngày nào; ô ngày vẫn sửa được nếu họ thật sự muốn ghi lùi.
 *
 * @returns {{date: string, receiptDate: string|null}} receiptDate khác null nghĩa là đã phải đổi
 */
function dateFromReceipt(read, today) {
  const found = read?.spentOn;
  if (!found) return { date: today, receiptDate: null };
  if (found.slice(0, 7) === today.slice(0, 7) && found <= today) return { date: found, receiptDate: null };
  return { date: today, receiptDate: found };
}

async function scanThenAdd(ctx, categories, rerender, dataUrl) {
  const dismiss = toast(t('Đang đọc hoá đơn…'), 'info');
  let read = null;
  try {
    read = await api.post('/api/expenses/scan', { receipt: dataUrl });
  } catch (err) {
    toast(err.message || t('Chưa đọc được hoá đơn, bạn nhập tay nhé'), 'warning');
  } finally {
    dismiss?.();
  }

  openAdd(ctx, categories, rerender, dataUrl, read);
  if (!read?.amount) return;

  const { receiptDate } = dateFromReceipt(read, ctx.world.today);
  if (receiptDate) {
    toast({
      title: t('Đọc được {amount}', { amount: vnd(read.amount) }),
      body: t('Hoá đơn đề ngày {day} — mình để ngày hôm nay cho bạn thấy được trong sổ. Sửa lại ở ô Ngày chi nếu cần.',
        { day: formatDay(receiptDate) }),
    }, 'warning');
    return;
  }
  toast(read.confidence === 'cao'
    ? t('Đọc được {amount}. Kiểm lại rồi bấm Lưu nhé.', { amount: vnd(read.amount) })
    : t('Đọc được {amount} nhưng chưa chắc lắm — bạn xem lại giúp.', { amount: vnd(read.amount) }),
  read.confidence === 'cao' ? 'success' : 'warning');
}

function openAdd(ctx, categories, rerender, receipt = null, read = null) {
  const amountInput = el('input.input', {
    type: 'number', inputmode: 'numeric', min: '1000', step: '1000',
    placeholder: t('VD: 35000'), autofocus: true,
  });
  const noteInput = el('input.input', { placeholder: t('VD: cà phê sáng'), maxlength: '120' });
  const dateInput = el('input.input', { type: 'date', value: dateFromReceipt(read, ctx.world.today).date });

  if (read?.amount) amountInput.value = String(read.amount);
  if (read?.note) noteInput.value = read.note;

  let picked = read?.categoryId || categories[0]?.id;
  const chips = el('div.chips', {}, categories.map((category) => el('button.chip', {
    'aria-pressed': String(category.id === picked),
    onclick: (event) => {
      picked = category.id;
      [...chips.children].forEach((child) => child.setAttribute('aria-pressed', 'false'));
      event.currentTarget.setAttribute('aria-pressed', 'true');
    },
  }, [category.icon || '📦', category.name])));

  let anh = receipt;
  const preview = el('div.receipt');
  const drawReceipt = () => {
    mount(preview, anh
      ? [
        el('img.receipt__img', { src: anh, alt: t('Ảnh hoá đơn') }),
        el('button.btn.btn--ghost.btn--sm', { onclick: () => { anh = null; drawReceipt(); } }, t('Bỏ ảnh này')),
      ]
      : [receiptPicker((dataUrl) => { anh = dataUrl; drawReceipt(); })]);
  };
  drawReceipt();

  // singleFlight: bấm "Lưu" hai lần liên tiếp không được ghi thành hai khoản.
  const save = singleFlight(async () => {
    const amount = Number(amountInput.value);
    if (!amount || amount <= 0) return toast(t('Nhập số tiền lớn hơn 0'), 'error');

    const result = await guard(() => api.post('/api/expenses', {
      amount, categoryId: picked, note: noteInput.value.trim() || null, spentOn: dateInput.value,
      receipt: anh,
    }), t('Không ghi được khoản chi'));
    if (!result) return;

    closeSheet();
    if (result.alerts?.length) {
      toast({ title: result.alerts[0].title, body: result.alerts[0].text }, 'warning');
    } else {
      toast(t('Đã ghi {amount}', { amount: vnd(amount) }), 'success');
    }
    await ctx.refreshWorld();
    rerender();
  });

  sheet({
    title: t('Ghi một khoản chi'),
    body: [
      el('label.field', {}, [el('span', {}, t('Số tiền')), amountInput]),
      el('div.field', {}, [el('span', {}, t('Nhóm chi tiêu')), chips]),
      el('label.field', {}, [el('span', {}, t('Ghi chú')), noteInput]),
      el('label.field', {}, [el('span', {}, t('Ngày chi')), dateInput]),
      el('div.field', {}, [el('span', {}, t('Ảnh hoá đơn')), preview]),
      el('button.btn.btn--block', { onclick: save }, t('Lưu')),
    ],
  });
}
