import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checksum } from '../src/storage.js';
import { mediaFilenames, imageVariants } from '../src/image-variants.js';
import { mediaKey } from '../src/storage.js';

export async function migrateObject(store, key, buffer, mimeType, apply) {
  const previous = await store.stat(key);
  if (previous) {
    if (previous.size !== buffer.length || checksum(await store.read(key)) !== checksum(buffer)) throw new Error(`Different object already exists: ${key}. Resolve it manually; migration never overwrites objects.`);
    return 'verified';
  }
  if (!apply) return 'missing';
  try { await store.put(key, buffer, mimeType); }
  catch (error) { if (error.name !== 'PreconditionFailed') throw error; }
  if (checksum(await store.read(key)) !== checksum(buffer)) throw new Error(`Verification failed: ${key}`);
  return 'uploaded';
}

// These are migration inputs, never runtime image storage. No database content is modified.
export async function* mediaMigrationFiles(media, uploads) {
  for (const item of media) {
    mediaKey(item.filename);
    const filenames = mediaFilenames(item);
    let generated;
    const original = await readFile(join(uploads, item.filename));
    for (const filename of filenames) {
      let buffer;
      try { buffer = filename === item.filename ? original : await readFile(join(uploads, filename)); }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        generated ||= await imageVariants(original, item.filename);
        buffer = generated.find(file => file.filename === filename).buffer;
      }
      yield { key: mediaKey(filename), buffer, mimeType: item.mimeType };
    }
  }
}
