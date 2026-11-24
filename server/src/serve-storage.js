import { pipeline } from 'node:stream/promises';
import { missingObject } from './storage.js';
import { fail } from './auth.js';

export async function serveObject(store, key, req, res) {
  const range = req.headers.range;
  let input = {};
  if (range) {
    const details = await store.stat(key);
    if (!details) throw fail(404, 'File unavailable.');
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
      res.set('Content-Range', `bytes */${details.size}`);
      throw fail(416, 'Requested media range is invalid.');
    }
    let start;
    let end;
    if (!match[1]) {
      const suffix = Number(match[2]);
      if (!Number.isSafeInteger(suffix) || suffix <= 0) {
        res.set('Content-Range', `bytes */${details.size}`);
        throw fail(416, 'Requested media range is invalid.');
      }
      start = Math.max(0, details.size - suffix);
      end = details.size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : details.size - 1;
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= details.size || end < start) {
      res.set('Content-Range', `bytes */${details.size}`);
      throw fail(416, 'Requested media range is invalid.');
    }
    end = Math.min(end, details.size - 1);
    input = { Range: `bytes=${start}-${end}` };
    res.status(206).set({
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${details.size}`,
      'Content-Length': String(end - start + 1),
    });
  } else res.set('Accept-Ranges', 'bytes');
  let stream;
  try { stream = await store.stream(key, input); }
  catch (error) { throw fail(missingObject(error) ? 404 : 503, missingObject(error) ? 'File unavailable.' : 'Image storage is temporarily unavailable.'); }
  try { await pipeline(stream, res); }
  catch { if (!res.destroyed) res.destroy(); }
}
