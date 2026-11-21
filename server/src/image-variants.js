import sharp from 'sharp';
import { join } from 'node:path';
import { writeFile, unlink } from 'node:fs/promises';
export const variantWidths = [640, 1200];
export function variantFilename(filename, width) { return filename.replace(/\.webp$/, `-${width}.webp`); }
export async function writeVariants(buffer, directory, filename) {
  for (const width of variantWidths) {
    const output = await sharp(buffer).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    await writeFile(join(directory, variantFilename(filename, width)), output);
  }
}
export async function removeVariants(directory, filename) {
  await Promise.all(variantWidths.map(width => unlink(join(directory, variantFilename(filename, width))).catch(() => {})));
}
