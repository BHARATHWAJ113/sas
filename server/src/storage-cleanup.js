import { storage, mediaKey } from './storage.js';
import { mediaFilenames } from './image-variants.js';

// Durable outbox: a failed object deletion is retried after restarts.
export async function queueMediaDeletion(tx, media, notBefore = new Date()) {
  await tx.storageDeletion.upsert({ where: { filename: media.filename }, create: { filename: media.filename, hasVariants: media.hasVariants, notBefore }, update: { hasVariants: media.hasVariants, notBefore } });
}
export async function cleanStorage(db, store = storage, filename) {
  const jobs = await db.storageDeletion.findMany({ where: { notBefore: { lte: new Date() }, ...(filename ? { filename } : {}) }, take: 100, orderBy: { createdAt: 'asc' } });
  let failed = 0;
  for (const job of jobs) {
    try {
      if (!await db.media.count({ where: { filename: job.filename } })) {
        for (const filename of mediaFilenames(job)) await store.remove(mediaKey(filename));
      }
      await db.storageDeletion.deleteMany({ where: { filename: job.filename } });
    } catch { failed++; }
  }
  return { processed: jobs.length, failed };
}
