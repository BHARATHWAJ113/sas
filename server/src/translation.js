import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { allow, fail } from './auth.js';

export const translationInput = z.object({ text: z.string().trim().min(1).max(5000) }).strict();

// MyMemory accepts at most 500 UTF-8 bytes per segment. Prefer whole words.
export function translationChunks(text) {
  const chunks = [];
  let chunk = '';
  for (const character of text) {
    if (Buffer.byteLength(chunk + character, 'utf8') > 450) {
      const boundary = chunk.lastIndexOf(' ');
      if (boundary > chunk.length / 2) {
        chunks.push(chunk.slice(0, boundary));
        chunk = chunk.slice(boundary + 1);
      } else { chunks.push(chunk); chunk = ''; }
    }
    chunk += character;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

export function createTranslator(fetcher = fetch) {
  const cache = new Map();
  return async function translate(text) {
    const cached = cache.get(text);
    if (cached?.expires > Date.now()) return cached.value;
    const signal = AbortSignal.timeout(55000);
    try {
      const results = await Promise.all(['ta', 'hi'].map(async target => {
        const paragraphs = [];
        for (const paragraph of text.split('\n')) {
          const parts = [];
          for (const chunk of translationChunks(paragraph)) {
            if (!chunk.trim()) { parts.push(chunk); continue; }
            const url = new URL('https://api.mymemory.translated.net/get');
            url.search = new URLSearchParams({ q: chunk, langpair: `en|${target}` }).toString();
            const response = await fetcher(url, { signal, headers: { Accept: 'application/json' } });
            if (!response.ok) throw fail(503, 'The free translation service is unavailable. Retry later or enter translations manually.');
            const data = await response.json();
            if (data.quotaFinished || Number(data.responseStatus) === 429 || /USED ALL AVAILABLE FREE/i.test(data.responseData?.translatedText || '')) throw fail(429, 'The free translation daily limit has been reached. Retry tomorrow or enter translations manually.');
            const value = data.responseData?.translatedText;
            if (Number(data.responseStatus) !== 200 || typeof value !== 'string' || !value.trim() || value.length > 10000) throw fail(502, 'Translation could not be completed. Retry or enter translations manually.');
            parts.push(value);
          }
          paragraphs.push(parts.join(' '));
        }
        return [target, paragraphs.join('\n')];
      }));
      const value = Object.fromEntries(results);
      if (cache.size >= 200) cache.delete(cache.keys().next().value);
      cache.set(text, { value, expires: Date.now() + 3600000 });
      return value;
    } catch (error) {
      if (error.status) throw error;
      throw fail(503, 'The free translation service did not respond. Retry later or enter translations manually.');
    }
  };
}

export function mountTranslation(router, translate = createTranslator()) {
  router.post('/translate', allow('ADMIN', 'EDITOR'), rateLimit({
    windowMs: 60000, limit: 20, keyGenerator: req => req.user.id,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Please wait a minute before translating more text.' },
  }), async (req, res) => {
    const { text } = translationInput.parse(req.body);
    res.json(await translate(text));
  });
}
