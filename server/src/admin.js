import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { allow, csrf, fail, safeUser } from './auth.js';
import { listQuery, schemas, parse, userSchema } from './validation.js';
import { mountUploads } from './uploads.js';
const resources = { pages: 'page', events: 'event', activities: 'activity', 'activity-categories': 'activityCategory', announcements: 'announcement', translations: 'translation', galleries: 'gallery', settings: 'siteSetting', media: 'media' };
const relations = {
  events: { images: { orderBy: { order: 'asc' }, include: { media: true } }, attachment: true },
  activities: { category: { select: { title: true, status: true } }, image: { select: { id: true, alt: true, status: true } } },
  galleries: { images: { orderBy: { order: 'asc' }, include: { media: true } } },
};
const audit = (tx, req, action, entity, entityId) => tx.auditLog.create({ data: { userId: req.user.id, action, entity, entityId } });
export function adminRouter(db, auth) {
  const router = Router();
  router.use(auth, csrf);
  router.get('/dashboard', async (_req, res) => {
    const [events, pages, enquiries, media, recent] = await Promise.all([db.event.count(), db.page.count(), db.admissionEnquiry.count({ where: { status: 'NEW' } }), db.media.count(), db.auditLog.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } })]);
    res.json({ events, pages, enquiries, media, recent });
  });
  router.get('/roles', allow('ADMIN'), async (_req, res) => res.json({ items: await db.role.findMany() }));
  router.get('/activity-category-options', allow('ADMIN', 'EDITOR'), async (_req, res) => {
    const items = await db.activityCategory.findMany({ select: { id: true, title: true, status: true }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
    res.json({ items });
  });
  router.get('/users', allow('ADMIN'), async (_req, res) => res.json({ items: (await db.user.findMany({ include: { role: true }, take: 100, orderBy: { createdAt: 'desc' } })).map(safeUser) }));
  router.post('/users', allow('ADMIN'), parse(userSchema.refine(v => !!v.password, { message: 'A password is required.', path: ['password'] })), async (req, res) => {
    const { password, ...data } = req.validated;
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.$transaction(async tx => {
      const user = await tx.user.create({ data: { ...data, passwordHash }, include: { role: true } });
      await audit(tx, req, 'CREATE', 'user', user.id);
      return user;
    });
    res.status(201).json(safeUser(result));
  });
  router.put('/users/:id', allow('ADMIN'), parse(userSchema), async (req, res) => {
    if (req.params.id === req.user.id && (!req.validated.active || req.validated.roleId !== req.user.roleId)) throw fail(400, 'You cannot disable your own account or change your own role.');
    const { password, ...data } = req.validated;
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
    const result = await db.$transaction(async tx => {
      const user = await tx.user.update({ where: { id: req.params.id }, data: { ...data, ...(passwordHash ? { passwordHash } : {}) }, include: { role: true } });
      // Revoke sessions after every account or role change.
      await tx.session.deleteMany({ where: { userId: user.id } });
      await audit(tx, req, 'UPDATE', 'user', user.id);
      return user;
    });
    res.json(safeUser(result));
  });
  router.delete('/users/:id', allow('ADMIN'), async (req, res) => {
    if (req.params.id === req.user.id) throw fail(400, 'You cannot delete your own account.');
    await db.$transaction(async tx => { await tx.user.delete({ where: { id: req.params.id } }); await audit(tx, req, 'DELETE', 'user', req.params.id); });
    res.status(204).end();
  });
  router.get('/audit-logs', allow('ADMIN'), async (req, res) => {
    const { page, limit } = listQuery.parse(req.query);
    const [items, total] = await Promise.all([db.auditLog.findMany({ take: limit, skip: (page - 1) * limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }), db.auditLog.count()]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  });
  router.get('/enquiries', allow('ADMIN', 'EDITOR'), async (req, res) => {
    const { page, limit } = listQuery.parse(req.query);
    const [items, total] = await Promise.all([db.admissionEnquiry.findMany({ take: limit, skip: (page - 1) * limit, orderBy: { createdAt: 'desc' } }), db.admissionEnquiry.count()]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  });
  router.patch('/enquiries/:id', allow('ADMIN', 'EDITOR'), parse(z.object({ status: z.enum(['NEW', 'CONTACTED', 'CLOSED']) }).strict()), async (req, res) => {
    const item = await db.$transaction(async tx => { const item = await tx.admissionEnquiry.update({ where: { id: req.params.id }, data: req.validated }); await audit(tx, req, 'UPDATE', 'enquiry', item.id); return item; });
    res.json(item);
  });
  router.delete('/enquiries/:id', allow('ADMIN'), async (req, res) => {
    await db.$transaction(async tx => { await tx.admissionEnquiry.delete({ where: { id: req.params.id } }); await audit(tx, req, 'DELETE', 'enquiry', req.params.id); });
    res.status(204).end();
  });
  mountUploads(router, db, audit);
  for (const [resource, model] of Object.entries(resources)) {
    const privilege = ['settings'].includes(resource) ? ['ADMIN'] : ['ADMIN', 'EDITOR'];
    router.get(`/${resource}`, async (req, res) => {
      const { page, limit } = listQuery.parse(req.query);
      const [items, total] = await Promise.all([db[model].findMany({ take: limit, skip: (page - 1) * limit, orderBy: { updatedAt: 'desc' }, ...(relations[resource] ? { include: relations[resource] } : {}) }), db[model].count()]);
      res.json({ items, total, page, pages: Math.ceil(total / limit) });
    });
    if (resource !== 'media') router.post(`/${resource}`, allow(...privilege), parse(schemas[resource]), async (req, res) => {
      const result = await saveResource(db, req, resource, model, audit, false);
      res.status(201).json(result);
    });
    router.put(`/${resource}/:id`, allow(...privilege), parse(schemas[resource]), async (req, res) => res.json(await saveResource(db, req, resource, model, audit, true)));
    router.delete(`/${resource}/:id`, allow('ADMIN'), async (req, res) => {
      if (resource === 'media') {
        const refs = await db.media.findUnique({ where: { id: req.params.id }, include: { _count: { select: { eventImages: true, attachments: true, galleryMedia: true, activities: true } } } });
        if (refs && Object.values(refs._count).some(Boolean)) throw fail(409, 'Remove this media from events, galleries and activities before deleting it.');
        const covers = await db.event.count({ where: { cover: `/api/media/${req.params.id}` } });
        if (covers) throw fail(409, 'This image is used as an event cover. Remove that reference first.');
      }
      await db.$transaction(async tx => { await tx[model].delete({ where: { id: req.params.id } }); await audit(tx, req, 'DELETE', resource, req.params.id); });
      // Deleted media is immediately inaccessible. Unreferenced disk files are retained for backup and can be purged offline.
      res.status(204).end();
    });
  }
  return router;
}
async function saveResource(db, req, resource, model, audit, update) {
  const { imageIds, ...data } = req.validated;
  return db.$transaction(async tx => {
    if (data.imageId) {
      const image = await tx.media.findUnique({ where: { id: data.imageId } });
      if (!image?.mimeType.startsWith('image/')) throw fail(400, 'Choose an image from the media library for the activity.');
    }
    if (imageIds?.length) {
      const count = await tx.media.count({ where: { id: { in: [...new Set(imageIds)] }, mimeType: { startsWith: 'image/' } } });
      if (count !== imageIds.length) throw fail(400, 'Select unique image files from the media library.');
    }
    if (data.attachmentId) {
      const attachment = await tx.media.findUnique({ where: { id: data.attachmentId } });
      if (!attachment || attachment.mimeType !== 'application/pdf') throw fail(400, 'Attachments must be PDF files from the media library.');
    }
    if (data.cover?.startsWith('/api/media/')) {
      const cover = await tx.media.findUnique({ where: { id: data.cover.split('/').pop() } });
      if (!cover?.mimeType.startsWith('image/')) throw fail(400, 'Choose an image from the media library for the cover.');
    }
    if (imageIds) data.images = { ...(update ? { deleteMany: {} } : {}), create: imageIds.map((mediaId, order) => ({ mediaId, order })) };
    const item = update ? await tx[model].update({ where: { id: req.params.id }, data }) : await tx[model].create({ data });
    await audit(tx, req, update ? 'UPDATE' : 'CREATE', resource, item.id);
    return item;
  });
}
