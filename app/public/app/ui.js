/** App-specific UI primitives: bottom sheets, the reward celebration, HUD bits. */
import { el, getOverlayRoot, lockScroll, unlockScroll } from '/shared/client.js';

// --- bottom sheet --------------------------------------------------------
let openSheet = null;

export function sheet({ title, body, footer, onClose }) {
  closeSheet();

  const backdrop = el('div.sheet-backdrop', { onclick: () => closeSheet() });
  const panel = el('div.sheet', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Bảng' }, [
    el('div.sheet__head', {}, [
      el('h2', {}, title || ''),
      el('button.iconbtn', { onclick: () => closeSheet(), 'aria-label': 'Đóng' }, '✕'),
    ]),
    el('div.sheet__body', {}, [].concat(body)),
    footer || null,
  ]);

  getOverlayRoot().append(backdrop, panel);
  lockScroll();
  document.body.classList.add('is-sheet');
  openSheet = { backdrop, panel, onClose };

  // Focus the first control so keyboard and screen-reader users land inside.
  panel.querySelector('input, textarea, button:not(.iconbtn)')?.focus({ preventScroll: true });
  return panel;
}

export function closeSheet() {
  if (!openSheet) return;
  const { backdrop, panel, onClose } = openSheet;
  openSheet = null;
  backdrop.remove();
  panel.remove();
  unlockScroll();
  document.body.classList.remove('is-sheet');
  onClose?.();
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSheet();
});

// --- reward celebration --------------------------------------------------
const MASCOT_CHEER = ['/assets/mascot/bot-1.png', '/assets/mascot/bot-2.png', '/assets/mascot/bot-3.png'];

/**
 * One screen for every "you earned something" moment: lesson finished, module
 * finished, level up, badges. Resolves when the user dismisses it.
 */
export function celebrate({ title, subtitle, image, stats = [], badges = [], levelUp = null, actionLabel = 'Tuyệt vời' }) {
  return new Promise((resolve) => {
    const overlay = el('div.reward', { role: 'dialog', 'aria-modal': 'true' });

    const close = () => {
      overlay.remove();
      unlockScroll();
      document.body.classList.remove('is-modal');
      resolve();
    };

    const card = el('div.reward__card', {}, [
      el('img', { src: image || MASCOT_CHEER[Math.floor(Math.random() * MASCOT_CHEER.length)], alt: '' }),
      el('h2', {}, title),
      subtitle ? el('p.muted', {}, subtitle) : null,
      stats.length ? el('div.reward__stats', {}, stats.map((s) => el('span.pill', {}, s))) : null,
      levelUp
        ? el('div.reward__badge', {}, [
          el('span', {}, levelUp.emoji || '🎉'),
          el('div', {}, [el('b', {}, `Lên cấp: ${levelUp.name}`), el('small', {}, levelUp.perk || '')]),
        ])
        : null,
      ...badges.map((b) => el('div.reward__badge', {}, [
        el('span', {}, b.icon || '🏅'),
        el('div', {}, [el('b', {}, `Huy hiệu mới: ${b.name}`), el('small', {}, b.description || '')]),
      ])),
      el('button.btn.btn--block', { onclick: close, style: { marginTop: '8px' } }, actionLabel),
    ]);

    overlay.append(card);
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
    getOverlayRoot().append(overlay);
    lockScroll();
    document.body.classList.add('is-modal');
    card.querySelector('.btn')?.focus({ preventScroll: true });
  });
}

/** Turns a rewards envelope from the API into a celebration, if worth showing. */
export async function celebrateRewards(rewards, { title, subtitle, image } = {}) {
  if (!rewards) return;
  const stats = [];
  if (rewards.xp) stats.push(`+${rewards.xp} XP`);
  if (rewards.streak?.changed) {
    stats.push(rewards.streak.outcome === 'recovered'
      ? `🔥 Cứu chuỗi: ${rewards.streak.count} ngày`
      : `🔥 ${rewards.streak.count} ngày`);
  }
  if (!stats.length && !rewards.badges?.length && !rewards.levelUp) return;

  await celebrate({
    title: title || 'Làm tốt lắm',
    subtitle,
    image,
    stats,
    badges: rewards.badges || [],
    levelUp: rewards.levelUp || null,
  });
}

// --- small building blocks ----------------------------------------------
export const bar = (percent, tone = '') => el('div.bar', {}, [
  el(`div.bar__fill${tone ? `.bar__fill--${tone}` : ''}`, { style: { width: `${Math.max(0, Math.min(100, percent))}%` } }),
]);

export function confirmSheet({ title, message, confirmLabel = 'Xoá', tone = 'danger' }) {
  return new Promise((resolve) => {
    let settled = false;
    const answer = (value) => { settled = true; closeSheet(); resolve(value); };

    sheet({
      title,
      body: [el('p.muted', {}, message)],
      footer: el('div.sheet__body', { style: { display: 'flex', gap: '12px', borderTop: '1px solid var(--border-secondary)' } }, [
        el('button.btn.btn--ghost', { style: { flex: '1' }, onclick: () => answer(false) }, 'Huỷ'),
        el(`button.btn.btn--${tone}`, { style: { flex: '1' }, onclick: () => answer(true) }, confirmLabel),
      ]),
      onClose: () => { if (!settled) resolve(false); },
    });
  });
}

// The lesson and quiz players mount themselves, so they need these directly.
export { getOverlayRoot, lockScroll, unlockScroll } from '/shared/client.js';
