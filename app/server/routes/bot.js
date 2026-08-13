import { all, run } from '../db.js';
import { bad, Router } from '../lib/http.js';
import { botCapabilities, respond } from '../services/botEngine.js';
import { appendMessages } from '../services/botLog.js';
import { evaluateBadges } from '../services/progression.js';
import { createExpense } from './features.js';

export const botRouter = new Router();

botRouter.get('/api/bot/history', ({ user, url }) => {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 40));
  const rows = all(
    'SELECT id, role, text, meta, source, created_at FROM bot_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?',
    user.id, limit,
  ).reverse();
  return {
    messages: rows.map((r) => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : null })),
    capabilities: botCapabilities,
  };
});

botRouter.post('/api/bot/message', async ({ user, body }) => {
  const text = String(body.text || '').trim();
  if (!text) throw bad('Bạn chưa nhập nội dung');
  if (text.length > 1000) throw bad('Tin nhắn quá dài');

  appendMessages(user.id, [{ role: 'user', text }], 'chat');

  const reply = await respond(user.id, text, { createExpense });

  const meta = {
    kind: reply.kind,
    action: reply.action ?? null,
    suggestions: reply.suggestions ?? null,
    rewards: reply.rewards ?? null,
  };
  appendMessages(user.id, [{ role: 'bot', text: reply.text, meta }], 'chat');

  // "Bạn của Ekko bot" and friends are counted on message volume.
  const badges = evaluateBadges(user.id);

  return { reply: { ...reply, meta }, badges };
});

botRouter.delete('/api/bot/history', ({ user }) => {
  run('DELETE FROM bot_messages WHERE user_id = ?', user.id);
  return { ok: true };
});
