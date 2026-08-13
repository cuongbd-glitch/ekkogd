/**
 * Ekko bot chat sheet.
 *
 * The bot answers questions about the programme, the lessons and the member's
 * own numbers, and logs an expense straight from a message like "cà phê 35k".
 */
import { api, el, guard, mount, renderText } from '/shared/client.js';
import { celebrateRewards, closeSheet, sheet } from './ui.js';

const OPENERS = [
  'Streak của tôi thế nào?',
  'Quy tắc 50/30/20 là gì?',
  'Tháng này tôi tiêu bao nhiêu?',
  'Quỹ khẩn cấp cần bao nhiêu?',
];

export async function openBot(ctx) {
  const chat = el('div.chat');
  const input = el('input.input', { placeholder: 'Hỏi mình, hoặc ghi "cà phê 35k"', 'aria-label': 'Tin nhắn' });
  const sendButton = el('button.btn', { style: { width: '52px', padding: '0' }, 'aria-label': 'Gửi' }, '↑');

  const scroller = el('div.sheet__body', { style: { flex: '1' } }, [chat]);
  const toBottom = () => { scroller.scrollTop = scroller.scrollHeight; };

  /**
   * `source === 'quick'` là câu gõ ở thanh ghi nhanh dưới đáy màn hình, không
   * phải gõ trong khung này. Có nhãn để người dùng hiểu vì sao tin nhắn đó ở đây.
   */
  function push(role, text, meta, source = 'chat') {
    const node = el(`div.msg.msg--${role}`, { html: renderText(text) });
    if (source === 'quick' && role === 'user') {
      node.classList.add('msg--quick');
      node.append(el('span.msg__tag', {}, '⚡ ghi nhanh'));
    }
    chat.append(node);

    if (meta?.action) chat.append(actionButton(meta.action, ctx));
    if (meta?.suggestions?.length) chat.append(suggestionRow(meta.suggestions, send));

    toBottom();
    return node;
  }

  async function send(text) {
    const message = String(text ?? input.value).trim();
    if (!message) return;

    input.value = '';
    push('user', message);

    const typing = el('div.msg.msg--bot', {}, [el('span.typing', {}, [el('i'), el('i'), el('i')])]);
    chat.append(typing);
    toBottom();

    const result = await guard(() => api.post('/api/bot/message', { text: message }), 'Ekko bot chưa trả lời được');
    typing.remove();
    if (!result) return;

    push('bot', result.reply.text, result.reply.meta);

    // Logging an expense through chat still earns the daily reward.
    if (result.reply.rewards) {
      await ctx.refreshWorld();
      await celebrateRewards(result.reply.rewards, { title: 'Đã ghi vào sổ' });
    }
  }

  sendButton.addEventListener('click', () => send());
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); send(); }
  });

  const panel = sheet({
    title: 'Ekko bot',
    body: [],
  });

  // Replace the default body with a scroll area plus a fixed composer.
  const head = panel.querySelector('.sheet__head');
  head.prepend(el('img', { src: '/assets/mascot/ekko-bot.png', alt: '', width: 32, height: 32 }));
  panel.style.height = '82%';   // của màn hình điện thoại, không phải của viewport
  mount(panel, head, scroller, el('div.chat__composer', {}, [input, sendButton]));

  const history = await guard(() => api.get('/api/bot/history?limit=30'), 'Không tải được lịch sử trò chuyện');

  if (!history?.messages?.length) {
    push('bot', 'Chào bạn, mình là **Ekko bot**. Mình giải thích các bài học, cho bạn biết streak và chi tiêu của mình, và ghi chi tiêu giúp bạn chỉ bằng một câu nhắn.');
    chat.append(suggestionRow(OPENERS, send));
  } else {
    for (const message of history.messages) {
      push(message.role, message.text, message.meta, message.source);
    }
  }

  toBottom();
  input.focus({ preventScroll: true });
}

function actionButton(action, ctx) {
  const run = () => {
    closeSheet();
    if (action.type === 'navigate') ctx.navigate(action.route.replace('/app/#', ''));
    else if (action.type === 'open_lesson') ctx.openLesson(action.lessonId);
  };
  return el('button.btn.btn--sm.btn--ghost', { style: { alignSelf: 'flex-start' }, onclick: run }, action.label);
}

function suggestionRow(suggestions, send) {
  return el('div.chips', { style: { marginTop: '4px' } },
    suggestions.slice(0, 3).map((text) => el('button.chip', { onclick: () => send(text) }, text)));
}
