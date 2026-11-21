import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, resolve, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { memoryStorage } from './memory-storage.js';
import { mediaKey } from '../src/storage.js';
import { restoreImportedMedia } from '../prisma/restore-imported-media.js';
const temporary = [];
afterEach(async () => {
  for (const path of temporary.splice(0)) {
    const target = resolve(path);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('school-import-repair-')) throw new Error('Unexpected test cleanup directory.');
    await rm(target, { recursive: true, force: true });
  }
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'school-import-repair-'));
  temporary.push(root);
  const source = join(root, 'source'); const uploads = memoryStorage();
  await mkdir(source);
  const media = { filename: '1234567890abcdef1234567890abcdef.webp' };
  const buffer = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'red' } }).webp().toBuffer();
  await writeFile(join(source, media.filename), buffer);
  return { source, uploads, media, buffer };
}
describe('source media repair after database migration', () => {
  it('restores originals and variants for an existing database row, then becomes a no-op', async () => {
    const { source, uploads, media, buffer } = await fixture();
    const existing = { ...media, hasVariants: true, status: 'DRAFT', alt: 'School-edited caption' };
    expect(await restoreImportedMedia(source, uploads, media, existing)).toBe(3);
    expect(await uploads.read(mediaKey(media.filename))).toEqual(buffer);
    expect([...uploads.objects.keys()]).toHaveLength(3);
    expect(await restoreImportedMedia(source, uploads, media, existing)).toBe(0);
    expect(existing).toEqual({ ...media, hasVariants: true, status: 'DRAFT', alt: 'School-edited caption' });
  });
  it('preserves stored originals and existing variants while creating the missing size', async () => {
    const { source, uploads, media } = await fixture();
    const edited = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'blue' } }).webp().toBuffer();
    await uploads.put(mediaKey(media.filename), edited);
    const small = media.filename.replace('.webp', '-640.webp');
    await uploads.put(mediaKey(small), edited);
    expect(await restoreImportedMedia(source, uploads, media, { ...media, hasVariants: true })).toBe(1);
    expect(await uploads.read(mediaKey(media.filename))).toEqual(edited);
    expect(await uploads.read(mediaKey(small))).toEqual(edited);
    const large = await sharp(await uploads.read(mediaKey(media.filename.replace('.webp', '-1200.webp')))).metadata();
    expect(large.width).toBe(8);
  });
  it('does not restore a source file over a CMS replacement or add unused variants', async () => {
    const { source, uploads, media } = await fixture();
    expect(await restoreImportedMedia(source, uploads, media, { filename: 'replacement.webp', hasVariants: true })).toBe(0);
    expect([...uploads.objects.keys()]).toEqual([]);
    expect(await restoreImportedMedia(source, uploads, media, { ...media, hasVariants: false })).toBe(1);
    expect([...uploads.objects.keys()]).toEqual([mediaKey(media.filename)]);
  });
});
