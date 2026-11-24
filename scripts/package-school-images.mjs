// Offline transfer only: no credentials, network access, or database changes.
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { imageVariants } from '../server/src/image-variants.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const archive = resolve(root, 'artifacts/minio-school-images-2026-11-24.zip');
await mkdir(join(root, 'artifacts'), { recursive: true });
const directory = await mkdtemp(join(root, 'artifacts/minio-package-'));
const manifest = JSON.parse(await readFile(join(root, 'assets/optimized-school/manifest.json'), 'utf8'));
const siteAssets = JSON.parse(await readFile(join(root, 'shared/site-assets.json'), 'utf8'));
const objects = [];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function add(key, buffer) {
  const path = join(directory, key);
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path, buffer);
  objects.push({ key, bytes: buffer.length, sha256: digest(buffer) });
}
for (const media of manifest.media) {
  if (!/^[a-f0-9]{32}\.webp$/.test(media.filename)) throw new Error('Invalid source filename');
  const buffer = await readFile(join(root, 'assets/optimized-school', media.filename));
  await add(`media/${media.filename}`, buffer);
  for (const variant of await imageVariants(buffer, media.filename)) await add(`media/${variant.filename}`, variant.buffer);
}
for (const asset of siteAssets) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(asset.filename)) throw new Error('Invalid site filename');
  const buffer = await readFile(join(root, 'assets/site-images', asset.filename));
  if (digest(buffer) !== asset.sha256) throw new Error(`Site asset checksum mismatch: ${asset.filename}`);
  await add(`assets/images/${asset.filename}`, buffer);
}
await writeFile(join(directory, 'OBJECTS.json'), JSON.stringify({ bucket: 'stantonys', objects }, null, 2));
await writeFile(join(directory, 'README.txt'), `St. Antony's school image transfer — 24 November 2026
${objects.length} objects: ${manifest.media.length} CMS originals, ${manifest.media.length * 2} responsive variants, ${siteAssets.length} site assets.
Upload media/ contents under stantonys/media/ and assets/images/ contents under stantonys/assets/images/.
Keep the bucket private. Do not upload the ZIP, README.txt or OBJECTS.json into the bucket.
Do not rename files, flatten folders, or add an extra stantonys/ prefix.
Uploading images does NOT create database records. Use the updated application maintenance checkout:
npm run assets:import -- --refresh-source
npm run assets:import -- --apply --refresh-source
npm run storage:migrate -- --site-only --apply
npm run production:check
Existing CMS edits are preserved; inspect the refresh summary for skipped records.
Includes source-imported images only; back up later school uploads separately.
No passwords, MinIO keys, database dumps or environment files are included.
`);
const python = process.env.PYTHON || 'python';
const zipped = spawnSync(python, ['-c', 'import pathlib,sys,zipfile; root=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED); [z.write(p,p.relative_to(root).as_posix()) for p in sorted(root.rglob("*")) if p.is_file()]; z.close()', directory, archive], { stdio: 'inherit' });
if (zipped.error || zipped.status !== 0) throw new Error('ZIP creation failed; install Python 3 or set PYTHON to its executable path. Prepared objects remain in ' + directory);
console.log(JSON.stringify({ archive, objects: objects.length, bytes: objects.reduce((sum, object) => sum + object.bytes, 0), directory }, null, 2));
