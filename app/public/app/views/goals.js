/**
 * Mục tiêu tài chính.
 *
 * Người dùng không bắt đầu từ một form trống: màn đầu là bộ mục tiêu gợi ý xếp
 * theo nhóm (An toàn, Mua sắm tài sản, Gia đình, Tự do). Chọn một cái là sang
 * màn thiết lập với tên, số tiền và thời hạn đã điền trước — chỉ cần sửa cho
 * khớp hoàn cảnh của mình.
 *
 * Toàn bộ phép tính thời hạn neo theo `today` do server trả về (ngày ở Việt
 * Nam), không theo đồng hồ của thiết bị.
 */
import { api, el, formatDay, getScrollRoot, guard, mount, singleFlight, spriteIcon, toast, vnd } from '/shared/client.js';
import { bar, celebrate, celebrateRewards, closeSheet, confirmSheet, sheet } from '../ui.js';
import { getLang, t } from '../i18n.js';

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];

export default async function goalsView(ctx) {
  const board = el('div.skyboard');
  let data = await api.get('/api/goals');

  const toTop = () => getScrollRoot().scrollTo({ top: 0 });

  // Người chưa có mục tiêu nào thì mở thẳng vào bộ gợi ý: tab rỗng không có gì để xem.
  let tab = data.goals.length ? 'mine' : 'new';

  const TABS = [
    { key: 'mine', label: 'Mục tiêu của bạn' },
    { key: 'new', label: 'Đặt thêm mục tiêu' },
  ];

  const head = () => el('div.skytabs', {}, [
    el('div.skytabs__track', { role: 'tablist' }, TABS.map((item) => el('button', {
      role: 'tab',
      type: 'button',
      'aria-selected': String(item.key === tab),
      onclick: () => {
        tab = item.key;
        showList();
        toTop();
      },
    }, t(item.label)))),
  ]);

  const reload = async () => { data = await api.get('/api/goals'); };

  const showList = () => mount(board, head(), ...(tab === 'mine' ? mineBody() : catalogueBody()));
  const showForm = (spec) => { mount(board, head(), ...formBody(spec)); toTop(); };

  const back = async () => { await reload(); showList(); toTop(); };

  function mineBody() {
    const { goals, totals } = data;

    if (!goals.length) {
      return [el('div.empty', {}, [
        el('img', { src: '/assets/lessons/muc-tieu-tiet-kiem.svg', alt: '' }),
        el('h3', {}, t('Chưa có mục tiêu nào')),
        el('p.muted', {}, t('Mục tiêu đầu tiên nên là một tháng chi phí thiết yếu. Đạt mốc đó rồi mới nâng dần lên ba tháng.')),
        el('button.btn', {
          style: { marginTop: '16px' },
          onclick: () => { tab = 'new'; showList(); toTop(); },
        }, t('Xem mục tiêu gợi ý')),
      ])];
    }

    return [
      el('p.skynote', {}, t('Đã tích luỹ {saved} / {target}', { saved: vnd(totals.saved), target: vnd(totals.target) })),
      ...goals.map((goal) => goalCard(goal)),
      goals.length > 3
        ? el('p.skynote', {}, t('Bạn đang chạy nhiều mục tiêu cùng lúc. Ba mục tiêu là tối đa nếu muốn thực sự về đích.'))
        : null,
    ];
  }

  function catalogueBody() {
    const nodes = [el('p.skynote', {}, t('Chọn một gợi ý, Ekko điền sẵn số tiền và thời hạn cho bạn.'))];

    for (const group of data.templates) {
      nodes.push(el('div.goalgroup', {}, [spriteIcon(group.icon, 20), el('span', {}, group.label)]));
      nodes.push(el('div.goalgrid', {}, group.templates.map((template) => el('button.tplcard', {
        type: 'button',
        'aria-label': `${template.name} · ${template.hint}`,
        onclick: () => showForm({ template: { ...template, group: group.label } }),
      }, [
        el('span.tplcard__emoji', {}, template.emoji),
        el('span.tplcard__name', {}, template.name),
        el('span.tplcard__hint', {}, template.hint),
      ]))));
    }

    return nodes;
  }

  // --------------------------------------------------------------- goal card
  function goalCard(goal) {
    const done = goal.status === 'done';
    const plan = savingPlan({ ...goal, target: goal.target_amount, saved: goal.saved_amount, today: data.today });

    return el('div.card', {}, [
      el('div.card__head', {}, [
        el('span', { style: { fontSize: '24px' } }, goal.icon || '🎯'),
        el('h3', {}, goal.name),
        done ? el('span.pill.pill--done', {}, `✓ ${t('Xong')}`) : null,
      ]),
      el('div.stat-row', {}, [
        el('b', {}, vnd(goal.saved_amount)),
        el('small', {}, t('mục tiêu {amount}', { amount: vnd(goal.target_amount) })),
      ]),
      el('div', { style: { marginTop: '8px' } }, [bar(goal.percent, done ? 'good' : '')]),
      el('div.stat-row', { style: { marginTop: '10px' } }, [
        el('small', {}, done ? t('Đã cán đích') : t('Còn thiếu {amount}', { amount: vnd(goal.remaining) })),
        el('small', {}, goal.deadline ? t('Hạn {day}', { day: formatDay(goal.deadline) }) : ''),
      ]),
      !done && plan && !plan.expired
        ? el('p.muted', { style: { marginTop: '8px', fontSize: '12px' } },
          t('Để kịp hạn, cần để dành khoảng {amount} {every}.', { amount: vnd(plan.perPeriod), every: periodEvery(goal.period) }))
        : null,

      done ? null : el('div', { style: { display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' } }, [
        ...QUICK_AMOUNTS.map((amount) => el('button.chip', {
          onclick: () => deposit(goal, amount),
        }, `+${amount >= 1000000 ? `${amount / 1000000}tr` : `${amount / 1000}k`}`)),
        el('button.chip', { onclick: () => openDeposit(goal) }, t('Số khác')),
      ]),

      el('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } }, [
        el('button.btn.btn--sm.btn--ghost', { onclick: () => showForm({ goal }) }, t('Sửa')),
        el('button.btn.btn--sm.btn--danger', { onclick: () => remove(goal) }, t('Xoá')),
      ]),
    ]);
  }

  // --------------------------------------------------------------- setup form
  function formBody({ template = null, goal = null }) {
    const editing = Boolean(goal);
    const emoji = goal?.icon || template?.emoji || '🎯';
    const groupLabel = editing ? (goal.group || t('Mục tiêu của bạn')) : template.group;
    // Mục tiêu tự do cố tình để trống tên và số tiền: đó là phần người dùng tự đặt.
    const blank = template?.code === 'custom';

    const nameInput = el('input.input', {
      value: editing ? goal.name : (blank ? '' : template.name),
      placeholder: t('VD: Học tiếng Anh'),
      maxlength: '120',
    });
    const amountInput = moneyInput(editing ? goal.target_amount : (blank ? 0 : template.amount));
    const deadlineInput = el('input.input', {
      type: 'date',
      min: data.today,
      value: editing ? (goal.deadline || '') : addMonths(data.today, template.months),
    });

    let period = editing ? (goal.period || 'month') : 'month';
    const periodPick = el('div.periodpick', {}, Object.entries(data.periods).map(([code, label]) => el('button', {
      type: 'button',
      'aria-pressed': String(code === period),
      onclick: (event) => {
        period = code;
        [...periodPick.children].forEach((child) => child.setAttribute('aria-pressed', String(child === event.currentTarget)));
        refresh();
      },
    }, t(label))));

    const calcBody = el('div.ekkocalc__body');
    const read = () => ({
      name: nameInput.value.trim(),
      targetAmount: readMoney(amountInput),
      deadline: deadlineInput.value || null,
      period,
    });

    const refresh = () => {
      const draft = read();
      mount(calcBody, ...calcLines({
        target: draft.targetAmount,
        saved: goal?.saved_amount ?? 0,
        deadline: draft.deadline,
        period,
        today: data.today,
      }));
    };
    amountInput.addEventListener('input', refresh);
    deadlineInput.addEventListener('change', refresh);
    refresh();

    // singleFlight: một lần bấm "Lưu mục tiêu" không được tạo thành hai mục tiêu.
    const save = singleFlight(async () => {
      const draft = read();
      if (!draft.name) return toast(t('Hãy đặt tên cho mục tiêu'), 'error');
      if (!draft.targetAmount) return toast(t('Nhập số tiền mục tiêu'), 'error');

      const result = editing
        ? await guard(() => api.patch(`/api/goals/${goal.id}`, draft), t('Không lưu được'))
        : await guard(() => api.post('/api/goals', { ...draft, template: template.code, icon: emoji }), t('Không tạo được mục tiêu'));
      if (!result) return;

      toast(editing ? t('Đã lưu mục tiêu') : t('Đã tạo mục tiêu'), 'success');
      if (!editing) await celebrateRewards(result.rewards, { title: t('Mục tiêu đã được đặt') });
      await ctx.refreshWorld();
      // Lưu xong thì về tab có mục tiêu vừa đặt, không phải về lại bộ gợi ý.
      tab = 'mine';
      await back();
    });

    return [
      el('div.goalhero', {}, [
        el('span.goalhero__emoji', {}, emoji),
        el('span.goalhero__meta', {}, [
          el('span.goalhero__group', {}, groupLabel),
          el('span.goalhero__name', {}, editing ? goal.name : (blank ? t('Mục tiêu của riêng bạn') : template.name)),
        ]),
      ]),

      el('div.card.goalform', {}, [
        el('label.field', {}, [el('span', {}, t('Tên mục tiêu')), nameInput]),
        el('label.field', {}, [el('span', {}, t('Số tiền mục tiêu (VNĐ)')), amountInput]),
        el('label.field', {}, [el('span', {}, t('Thời hạn hoàn thành')), deadlineInput]),
        el('div.field', { style: { marginBottom: '0' } }, [el('span', {}, t('Kỳ tiết kiệm')), periodPick]),
      ]),

      el('div.ekkocalc', {}, [
        el('div.ekkocalc__head', {}, [spriteIcon('star-stroke', 20), el('span', {}, t('Ekko tính giúp bạn'))]),
        calcBody,
      ]),

      el('div.formactions', {}, [
        el('button.btn.btn--pill.btn--white', { onclick: () => { showList(); toTop(); } }, t('Huỷ')),
        el('button.btn.btn--pill', { onclick: save }, editing ? t('Lưu thay đổi') : t('Lưu mục tiêu')),
      ]),
    ];
  }

  // ------------------------------------------------------------------ actions
  /** singleFlight: bấm nhanh hai lần vào "+500k" không được nạp thành hai lần. */
  const deposit = singleFlight(async (goal, amount) => {
    const result = await guard(() => api.post(`/api/goals/${goal.id}/deposit`, { amount }), t('Không nạp được'));
    if (!result) return;

    if (result.justCompleted) {
      await celebrate({
        title: t('Cán đích!'),
        subtitle: t('Bạn đã hoàn thành mục tiêu "{name}".', { name: goal.name }),
        image: '/assets/mascot/bot-1.png',
        stats: [vnd(goal.target_amount)],
      });
    } else {
      toast({
        title: t('Đã nạp {amount}', { amount: vnd(amount) }),
        body: t('vào "{name}"', { name: goal.name }),
      }, 'success');
    }
    await ctx.refreshWorld();
    await reload();
    showList();
  });

  function openDeposit(goal) {
    const input = moneyInput(0, t('VD: 350.000'));
    sheet({
      title: t('Nạp vào "{name}"', { name: goal.name }),
      body: [
        el('label.field', {}, [el('span', {}, t('Số tiền')), input]),
        el('button.btn.btn--block', {
          onclick: async () => {
            const amount = readMoney(input);
            if (!amount) return toast(t('Nhập số tiền lớn hơn 0'), 'error');
            closeSheet();
            await deposit(goal, amount);
          },
        }, t('Nạp')),
      ],
    });
  }

  async function remove(goal) {
    const ok = await confirmSheet({
      title: t('Xoá mục tiêu'),
      message: t('Xoá "{name}"? Lịch sử nạp tiền của mục tiêu này cũng sẽ mất.', { name: goal.name }),
    });
    if (!ok) return;
    await guard(() => api.delete(`/api/goals/${goal.id}`), t('Không xoá được'));
    toast(t('Đã xoá mục tiêu'));
    await reload();
    showList();
  }

  showList();
  return el('div.screen__body.screen__body--sky', {}, [board]);
}

// ------------------------------------------------------------------ helpers
/**
 * Ô nhập tiền: người dùng gõ số, dấu phân cách nghìn được thêm ngay khi gõ nên
 * "ba mươi triệu" đọc được thành 30.000.000 chứ không phải một dãy tám chữ số.
 */
function moneyInput(value = 0, placeholder = t('VD: 30.000.000')) {
  const grouping = () => (getLang() === 'en' ? 'en-US' : 'vi-VN');
  const input = el('input.input.input--money', {
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    placeholder,
    value: value ? Number(value).toLocaleString(grouping()) : '',
  });
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 12);
    input.value = digits ? Number(digits).toLocaleString(grouping()) : '';
  });
  return input;
}

const readMoney = (input) => Number(input.value.replace(/\D/g, '')) || 0;

const periodEvery = (period) => (period === 'week' ? t('mỗi tuần') : t('mỗi tháng'));
const periodUnit = (period) => (period === 'week' ? t('tuần') : t('tháng'));

/**
 * Số tiền phải để dành mỗi kỳ để kịp hạn.
 *
 * Đếm theo tháng/tuần dương lịch giữa hôm nay và thời hạn, nên "18 tháng" nghĩa
 * là 18 lần để dành thật, không phải 18 × 30 ngày.
 */
function savingPlan({ target, saved = 0, deadline, period = 'month', today }) {
  if (!target || !deadline || !today) return null;
  const remaining = Math.max(0, Number(target) - Number(saved));
  if (deadline < today) return { expired: true, remaining, period };

  const periods = Math.max(1, period === 'week'
    ? Math.floor(daysBetween(today, deadline) / 7)
    : monthsBetween(today, deadline));

  return { periods, perPeriod: Math.round(remaining / periods), remaining, period };
}

function calcLines({ target, saved, deadline, period, today }) {
  if (!target) return [el('p.ekkocalc__hint', {}, t('Nhập số tiền mục tiêu để Ekko tính giúp bạn.'))];
  if (!deadline) return [el('p.ekkocalc__hint', {}, t('Chọn thời hạn để Ekko chia số tiền theo từng kỳ.'))];

  const plan = savingPlan({ target, saved, deadline, period, today });
  if (plan.expired) return [el('p.ekkocalc__hint', {}, t('Thời hạn đã qua. Chọn một mốc trong tương lai để Ekko tính lại.'))];

  return [
    el('p.ekkocalc__line', {}, [
      `${t('Cần tiết kiệm')} `,
      el('b', {}, vnd(plan.perPeriod)),
      ` ${periodEvery(period)}`,
    ]),
    el('p.ekkocalc__sub', {}, saved > 0
      ? t('trong {n} {unit} để bù {amount} còn thiếu',
        { n: plan.periods, unit: periodUnit(period), amount: vnd(plan.remaining) })
      : t('trong {n} {unit} để đạt {amount}',
        { n: plan.periods, unit: periodUnit(period), amount: vnd(target) })),
  ];
}

// --- lịch: tính trên chuỗi YYYY-MM-DD để không lệ thuộc múi giờ thiết bị ---
const parseDay = (key) => key.split('-').map(Number);

const daysBetween = (from, to) => Math.round(
  (Date.UTC(...shiftMonth(parseDay(to))) - Date.UTC(...shiftMonth(parseDay(from)))) / 86400000,
);

/** [y, m, d] của lịch sang [y, mIndex, d] của Date.UTC. */
const shiftMonth = ([y, m, d]) => [y, m - 1, d];

function monthsBetween(from, to) {
  const [fy, fm, fd] = parseDay(from);
  const [ty, tm, td] = parseDay(to);
  return (ty - fy) * 12 + (tm - fm) - (td < fd ? 1 : 0);
}

/** Cộng tháng và giữ ngày trong tháng, kẹp lại nếu tháng đích ngắn hơn. */
function addMonths(key, months) {
  const [y, m, d] = parseDay(key);
  const lastDay = new Date(Date.UTC(y, m + months, 0)).getUTCDate();
  const date = new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay)));
  return date.toISOString().slice(0, 10);
}
