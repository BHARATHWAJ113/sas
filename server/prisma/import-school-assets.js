import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { createDatabase } from '../src/database.js';
import { config } from '../src/config.js';
import { schoolResources } from '../../shared/school-sections.js';
import { schoolSchemas } from '../src/school-sections.js';
import { schemas } from '../src/validation.js';
import { writeVariants } from '../src/image-variants.js';
import { schoolSocialSettings } from '../../shared/social-links.js';

const directory = fileURLToPath(new URL('../../assets/optimized-school/', import.meta.url));
const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
// Validate the entire batch before connecting or writing. Imported records have stable IDs.
for (const [resource, schema] of Object.entries(schoolSchemas)) {
  for (const { id: _id, ...record } of manifest[resource]) schema.parse(record);
}
for (const media of manifest.media) {
  if (!/^[a-f0-9]{32}\.webp$/.test(media.filename)) throw new Error('Invalid source filename.');
  await readFile(join(directory, media.filename));
}
for (const { id: _id, ...album } of manifest.galleries) schemas.galleries.parse(album);
console.log('Source records:', Object.fromEntries(Object.entries(manifest).map(([key, value]) => [key, value.length])));
if (!process.argv.includes('--apply')) {
  console.log('Validation only. Use --apply to import missing records into the configured database.');
} else {
  const db = createDatabase();
  const created = {};
  try {
    await mkdir(config.uploads, { recursive: true });
    for (const [key, value] of Object.entries(schoolSocialSettings)) {
      schemas.settings.parse({ key, value, public: true });
      if (await db.siteSetting.findUnique({ where: { key } })) continue;
      await db.$transaction(async tx => {
        const record = await tx.siteSetting.create({ data: { key, value, public: true } });
        await tx.auditLog.create({ data: { action: 'SOURCE_IMPORT', entity: 'settings', entityId: record.id } });
      });
      created.settings = (created.settings || 0) + 1;
    }
    for (const media of manifest.media) {
      if (await db.media.findUnique({ where: { id: media.id } })) continue;
      const buffer = await readFile(join(directory, media.filename));
      await writeFile(resolve(config.uploads, media.filename), buffer);
      await writeVariants(buffer, config.uploads, media.filename);
      const draft = manifest.toppers.some(row => row.imageId === media.id && row.status === 'DRAFT');
      await db.$transaction(async tx => {
        await tx.media.create({ data: { id: media.id, filename: media.filename, originalName: media.originalName, mimeType: 'image/webp', size: buffer.length, alt: media.alt, altTa: media.altTa, hasVariants: true, status: draft ? 'DRAFT' : 'PUBLISHED' } });
        await tx.auditLog.create({ data: { action: 'SOURCE_IMPORT', entity: 'media', entityId: media.id } });
      });
      created.media = (created.media || 0) + 1;
    }
    for (const [resource, model] of Object.entries(schoolResources)) {
      for (const record of manifest[resource]) {
        if (await db[model].findUnique({ where: { id: record.id } })) continue;
        await db.$transaction(async tx => {
          await tx[model].create({ data: record });
          await tx.auditLog.create({ data: { action: 'SOURCE_IMPORT', entity: resource, entityId: record.id } });
        });
        created[resource] = (created[resource] || 0) + 1;
      }
    }
    for (const { imageIds, ...record } of manifest.galleries) {
      if (await db.gallery.findUnique({ where: { id: record.id } })) continue;
      await db.$transaction(async tx => {
        await tx.gallery.create({ data: { ...record, images: { create: imageIds.map((mediaId, order) => ({ mediaId, order })) } } });
        await tx.auditLog.create({ data: { action: 'SOURCE_IMPORT', entity: 'galleries', entityId: record.id } });
      });
      created.galleries = (created.galleries || 0) + 1;
    }
    if (created.galleries) await db.$transaction(async tx => {
      const changed = await tx.gallery.updateMany({ where: { isDemo: true, status: 'PUBLISHED' }, data: { status: 'ARCHIVED' } });
      if (changed.count) await tx.auditLog.create({ data: { action: 'ARCHIVE_REPLACED_DEMO_ALBUMS', entity: 'galleries' } });
    });
    console.log('Created:', created, 'Existing records and admin edits were preserved.');
  } finally { await db.$disconnect(); }
}
