/**
 * Small Vietnamese text helpers used by Ekko bot: diacritic-insensitive
 * matching, and parsing amounts out of everyday phrasing like
 * "cà phê 35k", "ăn trưa 60 nghìn", "grab 1,2 triệu", "mua sách 250.000đ".
 */

/** Lowercase and strip diacritics so "cà phê" matches "ca phe". */
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd') // đ has no combining form, handle it separately
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'la', 'va', 'cua', 'cho', 'nhu', 'the', 'nao', 'gi', 'co', 'khong', 'thi', 'de', 'duoc',
  'toi', 'minh', 'ban', 'em', 'anh', 'chi', 'mot', 'nhung', 'nay', 'do', 'voi', 've',
  'trong', 'tren', 'duoi', 'ra', 'vao', 'khi', 'ma', 'hay', 'hoac', 'neu', 'se', 'da',
  'bi', 'boi', 'tu', 'den', 'sau', 'truoc', 'lam', 'sao', 'muon', 'can', 'phai', 'rat',
]);

export function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * A bare number only counts as money when it carries a unit or thousand
 * separators, so "quy tắc 50/30/20" is not mistaken for a 50 đồng expense.
 * Order matters: millions before thousands before separated digits.
 */
const MILLION = /(\d+(?:[.,]\d+)?)\s*(?:tr|trieu|cu)\b/;
const THOUSAND = /(\d+(?:[.,]\d+)?)\s*(?:k|nghin|ngan)\b/;
const SEPARATED = /(\d{1,3}(?:[.,]\d{3})+)/;
const PLAIN_WITH_UNIT = /(\d{3,})\s*(?:d|dong|vnd)\b/;
const PLAIN_LARGE = /\b(\d{4,9})\b/;

/** "1,5" and "1.5" are decimals here; thousand separators handled separately. */
const decimal = (raw) => Number(raw.replace(',', '.'));

/**
 * @returns {{ amount:number, matched:string }|null} `matched` is in normalized form.
 */
export function parseAmount(text) {
  const source = normalize(text);

  let m = MILLION.exec(source);
  if (m) return { amount: Math.round(decimal(m[1]) * 1_000_000), matched: m[0] };

  m = THOUSAND.exec(source);
  if (m) return { amount: Math.round(decimal(m[1]) * 1_000), matched: m[0] };

  m = SEPARATED.exec(source);
  if (m) return { amount: Number(m[1].replace(/[.,]/g, '')), matched: m[0] };

  m = PLAIN_WITH_UNIT.exec(source);
  if (m) return { amount: Number(m[1]), matched: m[0] };

  m = PLAIN_LARGE.exec(source);
  if (m) return { amount: Number(m[1]), matched: m[0] };

  return null;
}

/** Picks the category whose longest matching keyword wins ("cà phê" beats "cà"). */
export function guessCategory(text, categories) {
  const source = normalize(text);
  let best = null;
  let bestLength = 0;

  for (const category of categories) {
    for (const keyword of String(category.keywords || '').split(',')) {
      const needle = normalize(keyword);
      if (!needle || needle.length <= bestLength) continue;
      if (source.includes(needle)) {
        best = category;
        bestLength = needle.length;
      }
    }
  }
  return best || categories.find((c) => c.code === 'other') || null;
}

// Longest unit first, otherwise "tr" would eat the start of "triệu".
const AMOUNT_ANYWHERE = /\d+(?:[.,]\d+)*\s*(?:nghìn|ngàn|nghin|ngan|triệu|trieu|đồng|dong|vnđ|vnd|tr|cu|k|đ|d)?/gi;
const LEADING_VERB = /^\s*(?:ghi(?:\s*chép|\s*chep)?|tiêu|tieu|chi|mua|trả|tra|thanh\s*toán|thanh\s*toan|hôm\s*nay|hom\s*nay|vừa|vua|mới|moi|cho)\s+/i;

/** Drops the amount and filler verbs, leaving something usable as a note. */
export function extractNote(text) {
  let note = String(text || '').replace(AMOUNT_ANYWHERE, ' ');
  // Phrases stack ("ghi chi tiêu ăn sáng"), so peel them one at a time.
  for (let i = 0; i < 3 && LEADING_VERB.test(note); i += 1) {
    note = note.replace(LEADING_VERB, '');
  }
  return note.replace(/\s+/g, ' ').trim().slice(0, 120);
}

/** Fraction of query tokens present in the document, 0..1. */
export function similarity(queryTokens, documentText) {
  if (!queryTokens.length) return 0;
  const doc = normalize(documentText);
  let hits = 0;
  for (const token of queryTokens) if (doc.includes(token)) hits += 1;
  return hits / queryTokens.length;
}
