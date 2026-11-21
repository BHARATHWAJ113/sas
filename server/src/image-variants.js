import sharp from 'sharp';
export const variantWidths = [640, 1200];
export function variantFilename(filename, width) { return filename.replace(/\.webp$/, `-${width}.webp`); }
export const mediaFilenames = media => [media.filename, ...(media.hasVariants ? variantWidths.map(width => variantFilename(media.filename, width)) : [])];
export async function imageVariants(buffer, filename) {
  return Promise.all(variantWidths.map(async width => ({ filename: variantFilename(filename, width), buffer: await sharp(buffer).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer() })));
}
