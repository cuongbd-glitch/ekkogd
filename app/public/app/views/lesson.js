/**
 * Full-screen lesson player.
 *
 * Frame kinds map to four renderers. Two of them gate the "Tiếp tục" button:
 * an interactive frame needs every hotspot opened, a quiz needs an answer.
 * That is what makes a completion mean something.
 */
import { api, el, getOverlayRoot, guard, lockScroll, mount, renderText, spriteIcon, toast, unlockScroll } from '/shared/client.js';
import { celebrate, celebrateRewards } from '../ui.js';
import { t } from '../i18n.js';

export async function openLesson(lessonId, ctx) {
  const data = await guard(() => api.get(`/api/learn/lessons/${lessonId}`), t('Không mở được bài học'));
  if (!data) return;

  const { lesson, frames } = data;
  if (!frames.length) {
    toast(t('Bài học này chưa có nội dung'), 'error');
    return;
  }

  let index = Math.min(data.progress?.frame_index ?? 0, frames.length - 1);
  let quizCorrect = 0;
  let quizAnswered = 0;

  const stage = el('div.player__stage');
  const foot = el('div.player__foot');
  const segments = el('div.player__bar');

  const player = el('div.player', { role: 'dialog', 'aria-modal': 'true', 'aria-label': lesson.title }, [
    segments,
    el('div.player__head', {}, [
      el('button.iconbtn', { onclick: close, 'aria-label': t('Đóng bài học') }, '✕'),
      el('strong', {}, `${lesson.module_title} · ${lesson.title}`),
    ]),
    stage,
    foot,
  ]);

  function close() {
    player.remove();
    unlockScroll();
  }

  function renderSegments() {
    mount(segments, frames.map((_, i) => el(
      `div.player__seg${i < index ? '.player__seg--done' : i === index ? '.player__seg--current' : ''}`,
      {}, [el('i')],
    )));
  }

  function goTo(next) {
    index = next;
    renderSegments();
    renderFrame();
    stage.scrollTo({ top: 0 });
    api.post(`/api/learn/lessons/${lesson.id}/progress`, { frameIndex: index }).catch(() => { /* progress is best-effort */ });
  }

  function renderFrame() {
    const frame = frames[index];
    const isLast = index === frames.length - 1;

    const advance = () => (isLast ? finish() : goTo(index + 1));

    const nextButton = el('button.btn.btn--block', { onclick: advance }, isLast ? t('Hoàn thành bài học') : t('Tiếp tục'));
    const setReady = (ready) => { nextButton.disabled = !ready; };

    mount(stage, renderer(frame, { setReady, onQuizAnswer: recordQuiz }));

    mount(foot, el('div', { style: { display: 'flex', gap: '10px' } }, [
      index > 0 ? el('button.btn.btn--ghost', { onclick: () => goTo(index - 1), 'aria-label': t('Quay lại') }, [spriteIcon('chevron-left-01-stroke', 20)]) : null,
      nextButton,
    ]));
  }

  function recordQuiz(correct) {
    quizAnswered += 1;
    if (correct) quizCorrect += 1;
  }

  async function finish() {
    const result = await guard(
      () => api.post(`/api/learn/lessons/${lesson.id}/complete`, { quizCorrect, quizTotal: quizAnswered }),
      t('Không lưu được kết quả'),
    );
    if (!result) return;

    close();

    if (result.replay) {
      toast(t('Bạn đã hoàn thành bài này trước đó. Ôn lại luôn tốt.'), 'success');
    } else {
      await celebrateRewards(result.rewards, {
        title: t('Hoàn thành bài học'),
        subtitle: quizAnswered
          ? t('Bạn trả lời đúng {right}/{total} câu hỏi.', { right: quizCorrect, total: quizAnswered })
          : lesson.title,
      });

      if (result.moduleCompleted) {
        await celebrate({
          title: t('Hoàn thành mô-đun'),
          subtitle: t('Bạn đã học xong "{title}".', { title: result.moduleTitle }),
          image: '/assets/lessons/ke-hoach-12-thang.svg',
          stats: [`+${result.moduleRewards?.xp ?? 0} XP`],
          badges: result.moduleRewards?.badges || [],
          levelUp: result.moduleRewards?.levelUp || null,
          actionLabel: t('Đi tiếp'),
        });
      }
    }

    await ctx.refreshWorld();

    // Land back on the island rather than pushing straight into the next
    // lesson. The home CTA already offers "Học tiếp", so continuing stays the
    // member's choice.
    ctx.navigate('/');
  }

  getOverlayRoot().append(player);
  lockScroll();
  renderSegments();
  renderFrame();
}

// --- frame renderers -----------------------------------------------------
function renderer(frame, hooks) {
  switch (frame.kind) {
    case 'slide': return slideFrame(frame.payload, hooks);
    case 'interactive': return interactiveFrame(frame.payload, hooks);
    case 'quiz': return quizFrame(frame.payload, hooks);
    default: return textFrame(frame.payload, hooks);
  }
}

function textFrame(payload, { setReady }) {
  setReady(true);
  return el('div.frame', {}, [
    payload.title ? el('h2', {}, payload.title) : null,
    payload.image ? el('img.frame__image', { src: payload.image, alt: payload.imageAlt || '', loading: 'lazy' }) : null,
    payload.caption ? el('p.frame__caption', {}, payload.caption) : null,
    el('div', { html: renderText(payload.body) }),
  ]);
}

/** Slides keep the authored 1 : 1.371 aspect ratio, letterboxed if needed. */
function slideFrame(payload, { setReady }) {
  setReady(true);
  return el('div.frame', {}, [
    el('div.slide-frame', {}, [el('img', { src: payload.image, alt: payload.alt || '' })]),
    payload.caption ? el('p.frame__caption', {}, payload.caption) : null,
  ]);
}

function interactiveFrame(payload, { setReady }) {
  const hotspots = payload.hotspots || [];
  const seen = new Set();
  setReady(hotspots.length === 0);

  const note = el('div.hotspot-note', { hidden: true });
  const counter = el('p.frame__caption', {}, t('Đã xem {seen}/{total} điểm', { seen: 0, total: hotspots.length }));

  const wrap = el('div.hotspot-wrap', {}, [
    el('img', { src: payload.image, alt: payload.alt || '', loading: 'lazy' }),
    ...hotspots.map((spot, i) => el('button.hotspot', {
      style: { left: `${spot.x}%`, top: `${spot.y}%` },
      dataset: { seen: 'false' },
      'aria-label': spot.label,
      onclick: (event) => {
        seen.add(i);
        event.currentTarget.dataset.seen = 'true';
        note.hidden = false;
        mount(note, el('strong', {}, spot.label), el('p', {}, spot.text));
        counter.textContent = t('Đã xem {seen}/{total} điểm', { seen: seen.size, total: hotspots.length });
        if (seen.size === hotspots.length) setReady(true);
      },
    }, String(i + 1))),
  ]);

  return el('div.frame', {}, [
    payload.title ? el('h2', {}, payload.title) : null,
    payload.intro ? el('p', {}, payload.intro) : null,
    wrap,
    counter,
    note,
  ]);
}

function quizFrame(payload, { setReady, onQuizAnswer }) {
  setReady(false);
  const options = payload.options || [];
  let answered = false;

  const explain = el('div.quiz-explain', { hidden: true });

  const buttons = options.map((option, i) => el('button.quiz-option', {
    onclick: (event) => {
      if (answered) return;
      answered = true;
      onQuizAnswer(Boolean(option.correct));

      buttons.forEach((btn, j) => {
        if (options[j].correct) btn.dataset.state = 'correct';
        else if (j === i) btn.dataset.state = 'wrong';
        btn.disabled = true;
      });

      explain.hidden = false;
      explain.textContent = option.explain
        || (option.correct ? t('Chính xác.') : t('Chưa đúng. Đáp án đúng đã được tô sáng.'));
      setReady(true);
      event.currentTarget.scrollIntoView({ block: 'nearest' });
    },
  }, [
    el('i', {}, String.fromCharCode(65 + i)),
    el('span', {}, option.text),
  ]));

  return el('div.frame', {}, [
    el('h2', {}, payload.question),
    ...buttons,
    explain,
  ]);
}
