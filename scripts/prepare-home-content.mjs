import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'assets', 'schl_doc', 'update-23112026');
const schoolDocs = join(root, 'assets', 'schl_doc');
const output = join(root, 'assets', 'site-images');
const manifestPath = join(root, 'shared', 'site-assets.json');
await mkdir(output, { recursive: true });

async function webp(input, filename, width, rotate = null) {
  let pipeline = sharp(input, { failOn: 'warning' });
  pipeline = rotate === null ? pipeline.rotate() : pipeline.rotate(rotate);
  await pipeline.resize({ width, withoutEnlargement: true }).webp({ quality: 86, effort: 5 }).toFile(join(output, filename));
}

const imageSets = [
  { source: 'ST. ANTONY.jpg.jpeg', name: 'st-antony-home', width: 1800 },
  { source: 'fr-m-john-kennedy.webp', name: 'fr-m-john-kennedy', width: 1600 },
  { source: 'school anthem.jpeg', name: 'school-anthem', width: 1400, rotate: 90 },
  { source: join('..', 'school chimes', 'IMG_1181.PNG'), name: 'school-chimes', width: 1800 },
];
for (const image of imageSets) {
  const input = image.source.startsWith('..') ? join(schoolDocs, image.source.slice(3)) : join(source, image.source);
  await webp(input, `${image.name}.webp`, image.width, image.rotate);
  await webp(input, `${image.name}-1200.webp`, 1200, image.rotate);
  await webp(input, `${image.name}-640.webp`, 640, image.rotate);
}
const documents = [
  [join(source, 'Annual_Report_2025-26_web.pdf'), 'annual-report-2025-26.pdf'],
  [join(schoolDocs, 'history', 'HISTORY OF THE SCHOOL rename.pdf'), 'school-history.pdf'],
  ...['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((edition, index) => [join(schoolDocs, 'e-magazine', `EDITION - ${edition}.pdf`), `e-magazine-edition-${String(index + 1).padStart(2, '0')}.pdf`]),
  [join(schoolDocs, 'homepage-video.mp4'), 'home-campus-video.mp4'],
];
for (const [input, filename] of documents) await copyFile(input, join(output, filename));

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const filenames = [...imageSets.flatMap(image => [`${image.name}.webp`, `${image.name}-1200.webp`, `${image.name}-640.webp`]), ...documents.map(([, filename]) => filename)];
for (const filename of filenames) {
  const buffer = await readFile(join(output, filename));
  const details = await stat(join(output, filename));
  const mimeType = filename.endsWith('.pdf') ? 'application/pdf' : filename.endsWith('.mp4') ? 'video/mp4' : 'image/webp';
  const entry = { filename, mimeType, size: details.size, sha256: createHash('sha256').update(buffer).digest('hex') };
  const index = manifest.findIndex(item => item.filename === filename);
  if (index === -1) manifest.push(entry); else manifest[index] = entry;
}
manifest.sort((a, b) => a.filename.localeCompare(b.filename));
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${filenames.length} allowlisted school assets.`);
