import { z } from 'zod';
import { listQuery } from './validation.js';
import campusPhotos from '../../shared/campus-photos.json' with { type: 'json' };

const query = listQuery.extend({ category: z.string().max(160).default('') });
const published = { status: 'PUBLISHED' };
const photo = { ...published, mimeType: { startsWith: 'image/' } };
const categoryFields = { slug: true, title: true, titleTa: true, isDemo: true };
const starterAlbums = [
  {
    slug: 'school-archive',
    title: 'School archive',
    titleTa: 'பள்ளி ஆவணப் படங்கள்',
    isDemo: false,
    photos: [
      ['fr-e-thomas', 'Rev. Fr. E. Thomas', 'அருட்தந்தை இ. தாமஸ்'],
      ['fr-pascal-raj', 'Rev. Fr. Pascal Raj', 'அருட்தந்தை பாஸ்கல் ராஜ்'],
      ['fr-anandaraj', 'Rev. Fr. Anandaraj', 'அருட்தந்தை ஆனந்தராஜ்'],
      ['fr-m-john-kennedy', 'Rev. Fr. M. John Kennedy', 'அருட்தந்தை எம். ஜான் கென்னடி'],
    ],
  },
  {
    slug: 'campus-life',
    title: 'Campus life',
    titleTa: 'பள்ளி வாழ்க்கை',
    isDemo: false,
    photos: campusPhotos.map(photo => [photo.key, photo.alt, photo.altTa]),
  },
];

export async function galleryMedia(db, input, demo) {
  const { page, limit, category } = query.parse(input);
  const skip = (page - 1) * limit;
  const albums = demo ? [] : await db.gallery.findMany({
    where: { ...published, images: { some: { media: photo } } },
    select: { ...categoryFields, _count: { select: { images: { where: { media: photo } } } } },
    orderBy: [{ createdAt: 'desc' }, { slug: 'asc' }],
  });
  const categories = !demo || albums.length
    ? albums.map(({ _count, ...album }) => ({ ...album, count: _count.images }))
    : starterAlbums.map(({ photos, ...album }) => ({ ...album, count: photos.length }));
  const allCount = categories.reduce((sum, album) => sum + album.count, 0);
  const total = category ? categories.find(album => album.slug === category)?.count ?? 0 : allCount;
  let items = [];

  if (total > skip && albums.length) {
    items = await db.galleryMedia.findMany({
      where: { gallery: { ...published, ...(category && { slug: category }) }, media: photo },
      select: { id: true, gallery: { select: categoryFields }, media: { select: { id: true, alt: true, altTa: true, description: true, descriptionTa: true, eventDate: true, hasVariants: true } } },
      orderBy: [{ gallery: { createdAt: 'desc' } }, { galleryId: 'asc' }, { order: 'asc' }, { id: 'asc' }],
      skip, take: limit,
    });
  } else if (total > skip) {
    items = starterAlbums
      .filter(album => !category || album.slug === category)
      .flatMap(({ photos, ...gallery }) => photos.map(([id, alt, altTa]) => ({
        id, gallery, media: { id, url: `/api/assets/images/${id}.webp`, alt, altTa },
      })))
      .slice(skip, skip + limit);
  }

  return { items, categories, allCount, total, page, pages: Math.ceil(total / limit) };
}
