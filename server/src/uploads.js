import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { config } from './config.js';
import { allow, fail } from './auth.js';
import { writeVariants, removeVariants } from './image-variants.js';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 4, fieldSize: 2048 } });
export function mountUploads(router, db, audit) {
  router.post('/media/upload', allow('ADMIN', 'EDITOR'), upload.single('file'), async (req, res) => {
    if (!req.file) throw fail(400, 'Choose a JPEG, PNG, WebP image or PDF, up to 8 MB.');
    const { alt, altTa } = z.object({ alt: z.string().trim().min(1).max(255), altTa: z.string().trim().min(1).max(255) }).parse(req.body);
    const type = await fileTypeFromBuffer(req.file.buffer);
    if (!type || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(type.mime)) throw fail(400, 'The file contents are not a supported image or PDF.');
    let buffer = req.file.buffer;
    let mimeType = type.mime;
    let extension = 'pdf';
    if (mimeType.startsWith('image/')) {
      try { buffer = await sharp(buffer, { limitInputPixels: 25000000 }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(); }
      catch { throw fail(400, 'This image could not be decoded. Choose a valid image under 25 megapixels.'); }
      mimeType = 'image/webp'; extension = 'webp';
    }
    const filename = `${randomUUID()}.${extension}`;
    await mkdir(config.uploads, { recursive: true });
    const target = join(config.uploads, filename);
    await writeFile(target, buffer, { flag: 'wx' });
    try {
      if (mimeType === 'image/webp') await writeVariants(buffer, config.uploads, filename);
      const item = await db.$transaction(async tx => {
        const item = await tx.media.create({ data: { filename, originalName: req.file.originalname.replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 255), mimeType, size: buffer.length, alt, altTa, status: 'DRAFT', hasVariants: mimeType === 'image/webp' } });
        await audit(tx, req, 'UPLOAD', 'media', item.id);
        return item;
      });
      res.status(201).json(item);
    } catch (error) { await unlink(target).catch(() => {}); await removeVariants(config.uploads, filename); throw error; }
  });
}
