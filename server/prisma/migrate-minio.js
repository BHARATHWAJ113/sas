import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createDatabase } from '../src/database.js';
import { storage, checksum, mediaKey } from '../src/storage.js';
import { config } from '../src/config.js';
import { mediaMigrationFiles, migrateObject } from './minio-migration.js';
import siteAssets from '../../shared/site-assets.json' with { type: 'json' };

const { values } = parseArgs({ options: { apply: { type: 'boolean', default: false }, uploads: { type: 'string' }, 'site-only': { type: 'boolean', default: false } } });
if (!values.uploads && !values['site-only']) throw new Error('Supply --uploads /absolute/path/to/old/uploads or --site-only.');
const assets = fileURLToPath(new URL('../../assets/site-images/', import.meta.url));
const db = values['site-only'] ? null : createDatabase();
try {
  const media = db ? await db.media.findMany({ select: { filename: true, mimeType: true, hasVariants: true } }) : [];
  const uploads = values.uploads ? resolve(values.uploads) : null;
  // Preflight all originals before uploading anything. Includes DRAFT and ARCHIVED records.
  for (const item of media) { mediaKey(item.filename); await access(join(uploads, item.filename)); }
  for (const asset of siteAssets) {
    if (checksum(await readFile(join(assets, asset.filename))) !== asset.sha256) throw new Error(`Site asset checksum mismatch: ${asset.filename}`);
  }
  await storage.check();
  const counts = { uploaded: 0, verified: 0, missing: 0 };
  for await (const file of mediaMigrationFiles(media, uploads)) counts[await migrateObject(storage, file.key, file.buffer, file.mimeType, values.apply)]++;
  for (const asset of siteAssets) counts[await migrateObject(storage, `assets/images/${asset.filename}`, await readFile(join(assets, asset.filename)), asset.mimeType, values.apply)]++;
  console.log(`${values.apply ? 'Migration' : 'Read-only preview'}: ${config.MINIO_BUCKET}`, counts);
  console.log(values.apply ? 'All transferred objects verified by SHA-256. Local originals and database records were preserved.' : 'No objects changed. Repeat with --apply to upload missing files.');
} catch (error) {
  console.error(`Migration stopped (${error.code || error.name}). ${/^(Different object|Verification failed|Site asset checksum|Use a bucket|Configure MINIO)/.test(error.message) ? error.message : 'Check source files, MinIO credentials, bucket permissions and connectivity; no source files were deleted.'}`);
  process.exitCode = 1;
} finally { await db?.$disconnect(); }
