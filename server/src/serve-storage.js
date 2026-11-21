import { pipeline } from 'node:stream/promises';
import { missingObject } from './storage.js';
import { fail } from './auth.js';

export async function serveObject(store, key, res) {
  let stream;
  try { stream = await store.stream(key); }
  catch (error) { throw fail(missingObject(error) ? 404 : 503, missingObject(error) ? 'File unavailable.' : 'Image storage is temporarily unavailable.'); }
  try { await pipeline(stream, res); }
  catch { if (!res.destroyed) res.destroy(); }
}
