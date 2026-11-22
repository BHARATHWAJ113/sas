import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { allow, fail } from './auth.js';
import { imageVariants } from './image-variants.js';
import { storage, mediaKey } from './storage.js';
import { cleanStorage, queueMediaDeletion } from './storage-cleanup.js';
import { schemas } from './validation.js';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 4, fieldSize: 32768 } });
export function mountUploads(router, db, audit, store = storage) {
  const save = replacing => async (req, res) => {
    if (!req.file) throw fail(400, 'Choose a JPEG, PNG, WebP image or PDF, up to 8 MB.');
    const existing = replacing ? await db.media.findUnique({ where: { id: req.params.id } }) : null;
    if (replacing && !existing) throw fail(404, 'Media unavailable.');
    let metadata;
    try { metadata = req.body.metadata ? JSON.parse(req.body.metadata) : null; } catch { throw fail(400, 'Invalid image details.'); }
    const captions = replacing ? (metadata ? schemas.media.parse(metadata) : {}) : z.object({ alt: z.string().trim().min(1).max(255), altTa: z.string().trim().min(1).max(255), altHi: z.string().trim().max(255).optional() }).parse(req.body);
    const type = await fileTypeFromBuffer(req.file.buffer);
    if (!type || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(type.mime)) throw fail(400, 'The file contents are not a supported image or PDF.');
    if (existing && existing.mimeType.startsWith('image/') !== type.mime.startsWith('image/')) throw fail(400, 'Replace an image with an image, or a PDF with a PDF, to preserve existing references.');
    let buffer = req.file.buffer;
    let mimeType = type.mime;
    let extension = 'pdf';
    if (mimeType.startsWith('image/')) {
      try { buffer = await sharp(buffer, { limitInputPixels: 25000000 }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(); }
      catch { throw fail(400, 'This image could not be decoded. Choose a valid image under 25 megapixels.'); }
      mimeType = 'image/webp'; extension = 'webp';
    }
    const filename = `${randomUUID()}.${extension}`;
    const data = { filename, originalName: req.file.originalname.replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 255), mimeType, size: buffer.length, hasVariants: mimeType === 'image/webp' };
    const files = [{ filename, buffer }, ...(data.hasVariants ? await imageVariants(buffer, filename) : [])];
    // A crash during upload leaves a durable cleanup task, delayed beyond request lifetime.
    await queueMediaDeletion(db, data, new Date(Date.now() + 86400000));
    let item;
    try {
      for (const file of files) await store.put(mediaKey(file.filename), file.buffer, mimeType);
      item = await db.$transaction(async tx => {
        let result;
        if (existing) {
          const changed = await tx.media.updateMany({ where: { id: existing.id, filename: existing.filename }, data: { ...data, ...captions } });
          if (changed.count !== 1) throw fail(409, 'This photo was changed by another editor. Reload before replacing it.');
          await queueMediaDeletion(tx, existing);
          result = await tx.media.findUnique({ where: { id: existing.id } });
        } else result = await tx.media.create({ data: { ...data, ...captions, status: 'DRAFT' } });
        await tx.storageDeletion.delete({ where: { filename } });
        await audit(tx, req, existing ? 'REPLACE_FILE' : 'UPLOAD', 'media', result.id);
        return result;
      });
    } catch (error) {
      // Never eagerly delete here: a lost commit acknowledgement may still have saved the row.
      // The outbox checks DB references before removing abandoned upload objects.
      if (error.status || error.code?.startsWith('P')) throw error;
      throw fail(503, 'Image storage is temporarily unavailable. Please reload the media library before retrying.');
    }
    const cleanup = existing ? await cleanStorage(db, store, existing.filename).catch(() => ({ failed: 1 })) : { failed: 0 };
    res.status(existing ? 200 : 201).json({ ...item, cleanupPending: cleanup.failed > 0 });
  };
  router.post('/media/upload', allow('ADMIN', 'EDITOR'), upload.single('file'), save(false));
  router.put('/media/:id/file', allow('ADMIN', 'EDITOR'), upload.single('file'), save(true));
}
