import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, invalidatePublicCache, readPublic } from '../../client/src/api.js';

beforeEach(() => { invalidatePublicCache(); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const response = data => ({ ok: true, status: 200, json: async () => data });

describe('public request coalescing and timeouts', () => {
  it('shares simultaneous reads and reuses only fresh data', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ items: [] }));
    vi.stubGlobal('fetch', fetch);
    await Promise.all([readPublic('/events?limit=3'), readPublic('/events?limit=3')]);
    await readPublic('/events?limit=3');
    expect(fetch).toHaveBeenCalledOnce();
    await readPublic('/events?limit=3', true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('clears public cache after a successful mutation including 204', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ items: [] }));
    vi.stubGlobal('fetch', fetch);
    await readPublic('/events');
    fetch.mockResolvedValueOnce({ status: 204 });
    await api('/admin/events/a', { method: 'DELETE' });
    await readPublic('/events');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('aborts a stalled request with an actionable timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason)))));
    const pending = api('/site', { timeoutMs: 100 });
    const check = expect(pending).rejects.toMatchObject({ status: 504 });
    await vi.advanceTimersByTimeAsync(101);
    await check;
  });
  it('does not report success when a write response is unreadable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError(); } }));
    await expect(api('/enquiries', { method: 'POST', body: '{}' })).rejects.toMatchObject({ status: 502 });
  });
  it('preserves cancellation while a response body is being read', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { controller.abort(); throw new DOMException('Cancelled', 'AbortError'); } }));
    await expect(api('/admin/emails', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
