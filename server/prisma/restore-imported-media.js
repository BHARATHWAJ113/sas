import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { imageVariants } from '../src/image-variants.js';
import { mediaKey } from '../src/storage.js';

// Database migration does not transfer files. Repair source-imported media
// without replacing files, changing publication status or undoing CMS edits.
export async function restoreImportedMedia(source, store, media, existing) {
  if (existing && existing.filename !== media.filename) return 0;
  const target = mediaKey(media.filename);
  let restored = 0;
  if (!await store.stat(target)) {
    await store.put(target, await readFile(join(source, media.filename)), 'image/webp');
    restored++;
  }
  if (!existing || existing.hasVariants) {
    for (const variant of await imageVariants(await store.read(target), media.filename)) {
      const key = mediaKey(variant.filename);
      if (!await store.stat(key)) { await store.put(key, variant.buffer, 'image/webp'); restored++; }
    }
  }
  return restored;
}
