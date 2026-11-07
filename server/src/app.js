import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { resolve, sep } from 'node:path';
import { config } from './config.js';
import { fail, hashToken, mountAuth, originGuard } from './auth.js';
import { adminRouter } from './admin.js';
import { enquirySchema, listQuery, parse } from './validation.js';
import { galleryMedia } from './gallery.js';
import { saveEnquiry } from './enquiries.js';
import { mountConsent } from './consent.js';
import { publicCache } from './public-cache.js';
import { mountVisitors } from './visitors.js';
import { demoEvents, demoAnnouncements, demoPages, demoSettings } from './demo.js';
import { schoolPages } from '../../shared/school-profile.js';
import { schoolActivities, schoolActivityCategories } from '../../shared/school-activities.js';
const published = { status: 'PUBLISHED' };
const publicMedia = { where: { media: published }, orderBy: { order: 'asc' }, include: { media: { select: { id: true, alt: true, altTa: true, mimeType: true } } } };
const envelope = (items, total, page, limit, extra = {}) => ({ items, total, page, pages: Math.ceil(total / limit), ...extra });
export function createApp(db, options = {}) {
  const demo = options.demo ?? config.demo;
  const app = express();
  const cache = publicCache();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);
  app.use(helmet(), cors({ origin: config.origins, credentials: true }), cookieParser());
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests. Please try again shortly.' } }));
  app.use(express.json({ limit: '512kb' }), originGuard);
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const databaseOnly = (_req, _res, next) => demo ? next(fail(503, 'This preview uses read-only demo content. Authentication and enquiry submission require a configured MySQL database.')) : next();
  mountConsent(app, db, databaseOnly, demo);
  mountVisitors(app, db, databaseOnly);
  app.use(cache.middleware);
  app.get('/api/health', async (_req, res) => {
    if (demo) return res.json({ status: 'demo', database: 'unavailable', readOnly: true });
    try { await db.$queryRaw`SELECT 1`; res.json({ status: 'ok', database: 'connected', readOnly: false }); }
    catch { res.status(503).json({ status: 'unavailable', database: 'unavailable', readOnly: true, error: 'Database unavailable. Please try again later.' }); }
  });
  app.get('/api/site', async (_req, res) => {
    const settings = demo ? demoSettings : Object.fromEntries((await db.siteSetting.findMany({ where: { public: true } })).map(x => [x.key, x.value]));
    const translations = demo ? [] : await db.translation.findMany({ where: published });
    res.json({ settings, translations, demo, privacyRetentionDays: config.VISITOR_RETENTION_DAYS });
  });
  app.get('/api/sitemap.xml', async (_req, res) => {
    const routes = ['', 'about', 'academics', 'admissions', 'infrastructure', 'student-life', 'gallery', 'news', 'events', 'notices', 'contact', 'privacy', 'cookie-policy'];
    const events = demo ? [] : await db.event.findMany({ where: published, select: { slug: true } });
    const base = config.SITE_URL.replace(/\/$/, '');
    const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
    const urls = [...routes, ...events.map(event => `events/${event.slug}`)].map(route => `<url><loc>${escape(`${base}/${route}`)}</loc></url>`).join('');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });
  app.get('/api/pages/:slug', async (req, res) => {
    const { slug } = req.params;
    const item = demo
      ? (Object.hasOwn(schoolPages, slug) ? schoolPages[slug] : demoPages.find(page => page.slug === slug))
      : await db.page.findFirst({ where: { slug, ...published } });
    if (!item) throw fail(404, 'This page has not been published.');
    res.json(item);
  });
  app.get('/api/events', async (req, res) => {
    const { page, limit, search, category, period } = listQuery.parse(req.query);
    const now = new Date();
    if (demo) {
      const filtered = demoEvents.filter(x => (!search || `${x.title} ${x.titleTa} ${x.summary}`.toLowerCase().includes(search.toLowerCase())) && (!category || x.category === category) && (period === 'all' || (period === 'upcoming' ? new Date(x.date) >= now : new Date(x.date) < now))).sort((a, b) => period === 'past' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
      return res.json(envelope(filtered.slice((page - 1) * limit, page * limit), filtered.length, page, limit, { categories: [...new Set(demoEvents.map(x => x.category))], demo: true }));
    }
    const where = { ...published, ...(search ? { OR: ['title', 'titleTa', 'summary', 'summaryTa'].map(key => ({ [key]: { contains: search } })) } : {}), ...(category ? { category } : {}), ...(period === 'all' ? {} : { date: period === 'upcoming' ? { gte: now } : { lt: now } }) };
    const [items, total, categories] = await Promise.all([db.event.findMany({ where, take: limit, skip: (page - 1) * limit, orderBy: { date: period === 'past' ? 'desc' : 'asc' } }), db.event.count({ where }), db.event.findMany({ where: published, distinct: ['category'], select: { category: true, categoryTa: true } })]);
    res.json(envelope(items, total, page, limit, { categories: categories.map(x => x.category), categoryTranslations: Object.fromEntries(categories.map(x => [x.category, x.categoryTa])) }));
  });
  app.get('/api/events/:slug', async (req, res) => {
    const item = demo ? demoEvents.find(x => x.slug === req.params.slug) : await db.event.findFirst({ where: { slug: req.params.slug, ...published }, include: { images: publicMedia, attachment: { select: { id: true, originalName: true, status: true } } } });
    if (!item) throw fail(404, 'This event is unavailable or has not been published.');
    if (item.attachment?.status !== 'PUBLISHED') item.attachment = null;
    res.json(item);
  });
  app.get('/api/activities', async (req, res) => {
    const { page, limit, category } = listQuery.parse(req.query);
    const skip = (page - 1) * limit;
    if (demo) {
      const categories = schoolActivityCategories;
      const filtered = schoolActivities.filter(activity => !category || activity.categorySlug === category);
      const items = filtered.slice(skip, skip + limit).map(({ categorySlug, ...activity }) => ({
        ...activity, id: activity.slug, category: categories.find(item => item.slug === categorySlug), image: null, isDemo: false,
      }));
      return res.json(envelope(items, filtered.length, page, limit, { categories, demo: true }));
    }
    const categoryFields = { slug: true, title: true, titleTa: true, icon: true };
    const where = { ...published, category: { ...published, ...(category && { slug: category }) } };
    const [rows, total, categories] = await Promise.all([
      db.activity.findMany({
        where, take: limit, skip, orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        select: {
          id: true, slug: true, title: true, titleTa: true, summary: true, summaryTa: true, isDemo: true,
          category: { select: categoryFields },
          image: { select: { id: true, alt: true, altTa: true, status: true, mimeType: true } },
        },
      }),
      db.activity.count({ where }),
      db.activityCategory.findMany({
        where: { ...published, activities: { some: published } },
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }], select: categoryFields,
      }),
    ]);
    const items = rows.map(({ image, ...activity }) => ({
      ...activity,
      image: image?.status === 'PUBLISHED' && image.mimeType.startsWith('image/') ? { id: image.id, alt: image.alt, altTa: image.altTa } : null,
    }));
    res.json(envelope(items, total, page, limit, { categories }));
  });
  app.get('/api/home-announcements', async (_req, res) => {
    const now = new Date();
    const items = demo ? demoAnnouncements.filter(item => item.showPopup && new Date(item.publishedAt) <= now && (!item.expiresAt || new Date(item.expiresAt) > now)) : await db.announcement.findMany({ where: { ...published, showPopup: true, publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, include: { image: { select: { id: true, alt: true, altTa: true, status: true } } }, orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }, { id: 'asc' }], take: 50 });
    res.json({ items: items.map(({ image, ...item }) => ({ ...item, image: image?.status === 'PUBLISHED' ? image : null })) });
  });
  app.get('/api/announcements', async (req, res) => {
    const { page, limit } = listQuery.parse(req.query);
    const kind = z.enum(['ANNOUNCEMENT', 'NOTICE', 'NEWS', 'NOTICE_BOARD']).optional().parse(req.query.kind);
    const now = new Date();
    if (demo) { const items = demoAnnouncements.filter(x => !kind || (kind === 'NOTICE_BOARD' ? x.kind !== 'NEWS' : x.kind === kind)); return res.json(envelope(items.slice((page - 1) * limit, page * limit).map(({ body: _body, bodyTa: _bodyTa, ...item }) => item), items.length, page, limit, { demo: true })); }
    const where = { ...published, ...(kind ? { kind: kind === 'NOTICE_BOARD' ? { in: ['ANNOUNCEMENT', 'NOTICE'] } : kind } : {}), publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
    const [items, total] = await Promise.all([db.announcement.findMany({ where, take: limit, skip: (page - 1) * limit, omit: { body: true, bodyTa: true }, orderBy: { publishedAt: 'desc' } }), db.announcement.count({ where })]);
    res.json(envelope(items, total, page, limit));
  });
  app.get('/api/announcements/:slug', async (req, res) => {
    const now = new Date();
    const item = demo ? demoAnnouncements.find(x => x.slug === req.params.slug) : await db.announcement.findFirst({ where: { slug: req.params.slug, ...published, publishedAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } });
    if (!item) throw fail(404, 'This announcement is unavailable or has not been published.');
    res.json(item);
  });
  app.get('/api/galleries', async (req, res) => {
    const { page, limit } = listQuery.parse(req.query);
    if (demo) return res.json(envelope([{ id: 'demo-gallery', title: 'A glimpse of school life · Illustrative images', titleTa: 'பள்ளி வாழ்க்கை · மாதிரி படங்கள்', summary: 'AI-created illustrations, not actual campus photographs.', summaryTa: 'இவை செயற்கை நுண்ணறிவால் உருவாக்கப்பட்ட மாதிரி படங்கள்.', isDemo: true, images: ['hero', 'discovery', 'sports'].map((key, i) => ({ id: key, media: { id: `demo-${i}`, url: `/images/${key}.webp`, alt: `Illustrative ${key} scene`, altTa: 'மாதிரி பள்ளிக் காட்சி' } })) }], 1, page, limit, { demo: true }));
    const [items, total] = await Promise.all([db.gallery.findMany({ where: published, take: limit, skip: (page - 1) * limit, include: { images: publicMedia }, orderBy: { createdAt: 'desc' } }), db.gallery.count({ where: published })]);
    res.json(envelope(items, total, page, limit));
  });
  app.get('/api/gallery-media', async (req, res) => res.json(await galleryMedia(db, req.query, demo)));
  app.get('/api/media/:id', databaseOnly, async (req, res) => {
    const media = await db.media.findUnique({ where: { id: req.params.id } });
    if (!media) throw fail(404, 'File not found.');
    if (media.status !== 'PUBLISHED') {
      const session = req.cookies.school_session ? await db.session.findUnique({ where: { id: hashToken(req.cookies.school_session) }, include: { user: true } }) : null;
      if (!session || session.expiresAt <= new Date() || !session.user.active) throw fail(404, 'File not found.');
    }
    if (!/^[a-f0-9-]+\.(webp|pdf)$/.test(media.filename)) throw fail(404, 'File not found.');
    const path = resolve(config.uploads, media.filename);
    if (!path.startsWith(`${config.uploads}${sep}`)) throw fail(404, 'File not found.');
    res.type(media.mimeType).set('X-Content-Type-Options', 'nosniff').set('Cross-Origin-Resource-Policy', 'same-site');
    if (media.mimeType === 'application/pdf') res.attachment(media.originalName || 'attachment.pdf').set('Content-Security-Policy', "sandbox; default-src 'none'");
    res.sendFile(path, err => { if (err && !res.headersSent) res.status(404).json({ error: 'File unavailable.' }); });
  });
  app.post('/api/enquiries', databaseOnly, rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Enquiry limit reached. Please try again later.' } }), parse(enquirySchema), async (req, res) => {
    res.status(201).json(await saveEnquiry(db, req));
  });
  const auth = mountAuth(app, db, databaseOnly);
  app.use('/api/admin', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) res.once('finish', () => { if (res.statusCode < 400) cache.clear(); });
    next();
  }, databaseOnly, adminRouter(db, auth));
  app.use((_req, _res, next) => next(fail(404, 'Endpoint not found.')));
  app.use((error, _req, res, _next) => {
    if (error instanceof z.ZodError) return res.status(422).json({ error: 'Please check the highlighted information.', fields: Object.fromEntries(error.issues.map(i => [i.path.join('.'), i.message])) });
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File must be 8 MB or smaller.' });
    if (error.name === 'MulterError') return res.status(400).json({ error: 'Upload rejected. Choose one file up to 8 MB.' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'This slug, email or translation key already exists.' });
    if (error.code === 'P2025') return res.status(404).json({ error: 'This record no longer exists.' });
    if (error.code === 'P2003') return res.status(409).json({ error: 'The selected related record is unavailable or still in use.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Invalid JSON request.' });
    const adapterCause = error.meta?.driverAdapterError?.cause || error.cause;
    const unavailable = /^P10\d\d$/.test(error.code || '') || ['P2024', 'P2037', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error.code) || ['ConnectionRefused', 'SocketTimeout', 'ConnectionClosed', 'PoolTimeout'].includes(adapterCause?.kind) || error.name === 'PrismaClientInitializationError';
    const status = unavailable ? 503 : error.status || 500;
    if (status >= 500 && config.NODE_ENV !== 'test') console.error(`[API] ${error.code || error.name}: ${status}`);
    res.status(status).json({ error: status === 503 ? (unavailable ? 'The database is temporarily unavailable. Your information has not been saved. Please try again later.' : error.message) : status === 500 ? 'Something went wrong. Please try again.' : error.message });
  });
  return app;
}
