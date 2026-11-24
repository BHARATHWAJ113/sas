import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { Readable } from 'node:stream';
import { createStorage, minioOptions, mediaKey } from '../src/storage.js';
import { mountUploads } from '../src/uploads.js';
import { cleanStorage } from '../src/storage-cleanup.js';
import { createApp } from '../src/app.js';
import { migrateObject, replaceSiteObject } from '../prisma/minio-migration.js';
import { memoryStorage } from './memory-storage.js';

function fixture(role = 'EDITOR') {
  const records = new Map(); const jobs = new Map(); const store = memoryStorage();
  const db = {
    media: {
      findUnique: vi.fn(async ({ where }) => records.get(where.id) || null),
      count: vi.fn(async ({ where }) => [...records.values()].filter(x => x.filename === where.filename).length),
      create: vi.fn(async ({ data }) => { const item = { ...data, id: 'image-id' }; records.set(item.id, item); return item; }),
      updateMany: vi.fn(async ({ where, data }) => { const old = records.get(where.id); if (!old || old.filename !== where.filename) return { count: 0 }; records.set(old.id, { ...old, ...data }); return { count: 1 }; }),
    },
    storageDeletion: {
      upsert: vi.fn(async ({ where, create, update }) => jobs.set(where.filename, jobs.has(where.filename) ? { ...jobs.get(where.filename), ...update } : create)),
      delete: vi.fn(async ({ where }) => jobs.delete(where.filename)),
      deleteMany: vi.fn(async ({ where }) => jobs.delete(where.filename)),
      findMany: vi.fn(async ({ where }) => [...jobs.values()].filter(x => x.notBefore <= where.notBefore.lte && (!where.filename || where.filename === x.filename))),
    },
    $transaction: async fn => {
      const before = structuredClone(records); const queued = structuredClone(jobs);
      try { return await fn(db); } catch (error) { records.clear(); jobs.clear(); for (const [k,v] of before) records.set(k,v); for (const [k,v] of queued) jobs.set(k,v); throw error; }
    },
  };
  const app = express();
  app.use((req, _res, next) => { req.user = { id: 'staff', role: { name: role } }; next(); });
  mountUploads(app, db, vi.fn(), store);
  app.use((error, _req, res, _next) => res.status(error.status || (error.name === 'ZodError' ? 422 : 500)).json({ error: error.message }));
  return { app, db, store, records, jobs };
}
const png = () => sharp({ create: { width: 2500, height: 100, channels: 3, background: '#243546' } }).png().withMetadata().toBuffer();
async function oldPhoto(f) {
  const item = { id: 'stable-id', filename: 'abcdef.webp', mimeType: 'image/webp', hasVariants: true, alt: 'Existing caption', status: 'PUBLISHED' };
  f.records.set(item.id, item);
  for (const name of ['abcdef.webp', 'abcdef-640.webp', 'abcdef-1200.webp']) await f.store.put(mediaKey(name), Buffer.from('old'));
  return item;
}

describe('MinIO media lifecycle', () => {
  it('compresses in memory, strips metadata and stores the original and two responsive sizes', async () => {
    const f = fixture(); const input = await png();
    const response = await request(f.app).post('/media/upload').field('alt', 'Classroom').field('altTa', 'வகுப்பறை').attach('file', input, 'school.png').expect(201);
    expect(response.body).toMatchObject({ status: 'DRAFT', mimeType: 'image/webp', hasVariants: true });
    expect(f.store.objects.size).toBe(3); expect(f.jobs.size).toBe(0);
    const metadata = await sharp(await f.store.read(mediaKey(response.body.filename))).metadata();
    expect(metadata.width).toBe(2400); expect(metadata.exif).toBeUndefined();
    expect((await sharp(await f.store.read(mediaKey(response.body.filename.replace('.webp', '-640.webp')))).metadata()).width).toBe(640);
  });
  it('replaces the bytes and deletes old thumbnails while keeping the media ID and publication', async () => {
    const f = fixture(); const old = await oldPhoto(f);
    const response = await request(f.app).put(`/media/${old.id}/file`).attach('file', await png(), 'new.png').expect(200);
    expect(response.body).toMatchObject({ id: old.id, status: 'PUBLISHED', alt: old.alt });
    expect(response.body.filename).not.toBe(old.filename);
    expect(f.store.objects.size).toBe(3); expect(await f.store.stat(mediaKey(old.filename))).toBeNull();
  });
  it('retries deletion after an outage without losing the successful replacement', async () => {
    const f = fixture(); const old = await oldPhoto(f); const remove = f.store.remove;
    f.store.remove = vi.fn().mockRejectedValue(new Error('offline'));
    const response = await request(f.app).put(`/media/${old.id}/file`).attach('file', await png(), 'new.png').expect(200);
    expect(response.body.cleanupPending).toBe(true); expect(f.jobs.size).toBe(1);
    f.store.remove = remove; expect((await cleanStorage(f.db, f.store)).failed).toBe(0);
    expect(f.jobs.size).toBe(0); expect(f.store.objects.size).toBe(3);
  });
  it('does not change the current photo when uploading the new image fails halfway', async () => {
    const f = fixture(); const old = await oldPhoto(f); const put = f.store.put; let uploads = 0;
    f.store.put = async (...args) => { if (++uploads === 2) throw new Error('offline'); await put(...args); };
    await request(f.app).put(`/media/${old.id}/file`).attach('file', await png(), 'new.png').expect(503);
    expect(f.records.get(old.id).filename).toBe(old.filename);
    for (const job of f.jobs.values()) job.notBefore = new Date(0);
    await cleanStorage(f.db, f.store); expect(f.store.objects.size).toBe(3);
  });
  it('rejects a concurrent replacement and removes its abandoned upload later', async () => {
    const f = fixture(); const old = await oldPhoto(f); f.db.media.updateMany.mockResolvedValue({ count: 0 });
    await request(f.app).put(`/media/${old.id}/file`).attach('file', await png(), 'new.png').expect(409);
    expect(f.records.get(old.id).filename).toBe(old.filename);
    for (const job of f.jobs.values()) job.notBefore = new Date(0);
    await cleanStorage(f.db, f.store); expect(f.store.objects.size).toBe(3);
  });
  it('retains committed media after a lost transaction acknowledgement', async () => {
    const f = fixture(); const transaction = f.db.$transaction;
    f.db.$transaction = async fn => { await transaction(fn); throw new Error('lost connection'); };
    await request(f.app).post('/media/upload').field('alt', 'Photo').field('altTa', 'Photo').attach('file', await png(), 'new.png').expect(503);
    await cleanStorage(f.db, f.store);
    expect(f.records.size).toBe(1); expect(f.store.objects.size).toBe(3);
  });
  it('rejects PDF replacements for images and blocks viewers from uploading', async () => {
    const f = fixture(); const old = await oldPhoto(f);
    await request(f.app).put(`/media/${old.id}/file`).attach('file', Buffer.from('%PDF-1.7\n'), 'file.pdf').expect(400);
    await request(fixture('VIEWER').app).post('/media/upload').attach('file', await png(), 'new.png').expect(403);
    expect(f.jobs.size).toBe(0);
  });
  it('keeps draft images private and only serves allowlisted site assets', async () => {
    const store = memoryStorage(); const db = { media: { findUnique: vi.fn(async () => ({ filename: 'abc.webp', status: 'DRAFT' })) } };
    const app = createApp(db, { storage: store });
    await request(app).get('/api/media/private-id').expect(404);
    await request(app).get('/api/assets/images/abc.webp').expect(404);
    await store.put('assets/images/campus-chess.webp', Buffer.from('school image'));
    await request(app).get('/api/assets/images/campus-chess.webp').expect(200);
    db.media.findUnique.mockResolvedValue({ filename: 'abc.webp', status: 'PUBLISHED', mimeType: 'image/webp' });
    await request(app).get('/api/media/public-id').expect(404);
    await store.put('media/abc.webp', Buffer.from('photo'));
    await request(app).get('/api/media/public-id').expect(200);
  });
});

describe('MinIO migration and S3 adapter', () => {
  it('dry-runs, verifies uploads, resumes safely and refuses conflicting objects', async () => {
    const store = memoryStorage(); const bytes = Buffer.from('photo');
    expect(await migrateObject(store, 'media/abc.webp', bytes, 'image/webp', false)).toBe('missing'); expect(store.objects.size).toBe(0);
    expect(await migrateObject(store, 'media/abc.webp', bytes, 'image/webp', true)).toBe('uploaded');
    expect(await migrateObject(store, 'media/abc.webp', bytes, 'image/webp', true)).toBe('verified');
    await expect(migrateObject(store, 'media/abc.webp', Buffer.from('other'), 'image/webp', true)).rejects.toThrow('Different object');
  });
  it('replaces only an explicitly selected site object and verifies its bytes', async () => {
    const store = memoryStorage(); store.replace = async (key, buffer) => store.objects.set(key, Buffer.from(buffer));
    await store.put('assets/images/principal.webp', Buffer.from('old'));
    expect(await replaceSiteObject(store, 'assets/images/principal.webp', Buffer.from('new'), 'image/webp', false)).toBe('different');
    expect((await store.read('assets/images/principal.webp')).toString()).toBe('old');
    expect(await replaceSiteObject(store, 'assets/images/principal.webp', Buffer.from('new'), 'image/webp', true)).toBe('replaced');
    expect((await store.read('assets/images/principal.webp')).toString()).toBe('new');
  });
  it('uses private path-style S3 operations with conditional writes and bounded reads', async () => {
    const env = { MINIO_ENDPOINT: 'https://minio.example', MINIO_BUCKET: 'school', MINIO_REGION: 'us-east-1', MINIO_ACCESS_KEY: 'test', MINIO_SECRET_KEY: 'test' };
    expect(minioOptions(env)).toMatchObject({ endpoint: env.MINIO_ENDPOINT, forcePathStyle: true });
    expect(() => minioOptions({ ...env, MINIO_ENDPOINT: 'https://minio.example/console' })).toThrow();
    const client = { send: vi.fn(async () => ({})) }; const store = createStorage(env, client);
    await store.put('media/abc.webp', Buffer.from('bytes'), 'image/webp');
    expect(client.send.mock.calls[0][0].input).toMatchObject({ Bucket: 'school', Key: 'media/abc.webp', IfNoneMatch: '*', ContentType: 'image/webp' });
    client.send.mockResolvedValue({ Body: Readable.from(Buffer.alloc(10)) });
    await expect(store.read('media/abc.webp', 5)).rejects.toThrow('size limit');
    client.send.mockRejectedValue(Object.assign(new Error(), { name: 'AccessDenied' }));
    await expect(store.stat('media/abc.webp')).rejects.toThrow();
    client.send.mockRejectedValue(Object.assign(new Error(), { name: 'NotFound' }));
    expect(await store.stat('media/abc.webp')).toBeNull();
  });
});
