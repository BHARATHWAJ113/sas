import { createHash } from 'node:crypto';
import { fail } from './auth.js';

export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
let nextCleanup = 0;

export async function consumeRate(tx, scope, limit) {
  if (Date.now() > nextCleanup) {
    await tx.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    nextCleanup = Date.now() + 3600000;
  }
  const hour = Math.floor(Date.now() / 3600000);
  const id = digest([scope, hour]);
  const bucket = await tx.rateLimitBucket.upsert({
    where: { id }, create: { id, expiresAt: new Date((hour + 2) * 3600000) },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > limit) throw fail(429, 'The hourly request limit has been reached. Please try again later.');
}

export function requestKey(req, payloadHash, scope, required = false) {
  const key = req.get('Idempotency-Key');
  if ((!key && required) || (key && !/^[a-zA-Z0-9_-]{16,100}$/.test(key))) {
    throw fail(422, 'A valid Idempotency-Key is required for this request.');
  }
  return digest([scope, key || [new Date().toISOString().slice(0, 10), payloadHash]]);
}
