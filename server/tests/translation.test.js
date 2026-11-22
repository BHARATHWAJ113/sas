import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createTranslator, translationChunks, translationInput } from '../src/translation.js';

describe('free automatic translation', () => {
  it('splits Unicode text within the provider byte limit without breaking characters', () => {
    const chunks = translationChunks('A school 🎓 ' .repeat(200));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(chunk => Buffer.byteLength(chunk, 'utf8') <= 450)).toBe(true);
    expect(chunks.join(' ')).not.toContain('\ufffd');
    expect(translationInput.safeParse({ text: 'x'.repeat(5001) }).success).toBe(false);
  });
  it('requests both target languages, preserves paragraphs and caches repeat text', async () => {
    const fetcher = vi.fn(async url => ({ ok: true, json: async () => ({ responseStatus: 200, responseData: { translatedText: url.searchParams.get('langpair') === 'en|ta' ? 'பள்ளி' : 'विद्यालय' } }) }));
    const translate = createTranslator(fetcher);
    expect(await translate('School\n\nWelcome')).toEqual({ ta: 'பள்ளி\n\nபள்ளி', hi: 'विद्यालय\n\nविद्यालय' });
    await translate('School\n\nWelcome');
    expect(fetcher).toHaveBeenCalledTimes(4);
    for (const [url] of fetcher.mock.calls) expect(url.origin).toBe('https://api.mymemory.translated.net');
  });
  it('reports quota failures and never returns the provider error as translated content', async () => {
    const translate = createTranslator(async () => ({ ok: true, json: async () => ({ quotaFinished: true, responseStatus: 200, responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS' } }) }));
    await expect(translate('School')).rejects.toMatchObject({ status: 429 });
  });
  it('handles malformed and unavailable responses without leaking provider details', async () => {
    await expect(createTranslator(async () => ({ ok: true, json: async () => ({ responseStatus: 200 }) }))('School')).rejects.toMatchObject({ status: 502 });
    await expect(createTranslator(async () => { throw new Error('private network details'); })('School')).rejects.toThrow('free translation service did not respond');
  });
});

describe('default appearance', () => {
  const script = readFileSync(new URL('../../client/public/theme-init.js', import.meta.url), 'utf8');
  it.each([null, 'invalid', 'light', 'dark'])('defaults to light, retaining an explicit preference (%s)', saved => {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(script, { document, localStorage: { getItem: () => saved }, matchMedia: () => ({ matches: true }) });
    expect(document.documentElement.dataset.theme).toBe(saved === 'dark' ? 'dark' : 'light');
  });
});
