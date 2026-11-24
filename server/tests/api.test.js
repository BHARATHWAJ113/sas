import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { hashToken } from '../src/auth.js';
import { demoEvents } from '../src/demo.js';
import { schoolActivities } from '../../shared/school-activities.js';
import { enquirySchema, eventSchema } from '../src/validation.js';
const origin = 'http://127.0.0.1:5173';
const token = 'a'.repeat(64); const csrfToken = 'b'.repeat(64);
function database(role = 'ADMIN') {
  const db = {};
  for (const model of ['session', 'user', 'role', 'event', 'activity', 'activityCategory', 'page', 'media', 'gallery', 'galleryMedia', 'siteSetting', 'translation', 'announcement', 'admissionEnquiry', 'auditLog', 'emailMessage', 'rateLimitBucket']) db[model] = Object.fromEntries(['findMany', 'findFirst', 'findUnique', 'count', 'create', 'createMany', 'upsert', 'update', 'updateMany', 'delete', 'deleteMany'].map(key => [key, vi.fn()]));
  db.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });
  db.emailMessage.createMany.mockResolvedValue({ count: 2 });
  db.session.findUnique.mockResolvedValue({ id: hashToken(token), csrfToken, expiresAt: new Date(Date.now() + 60000), user: { id: 'staff-1', name: 'Test staff', email: 'staff@example.test', roleId: 'role-1', active: true, role: { id: 'role-1', name: role } } });
  db.$transaction = vi.fn(callback => callback(db));
  return db;
}
const auth = req => req.set('Cookie', `school_session=${token}`).set('Origin', origin).set('x-csrf-token', csrfToken);
describe('read-only preview API', () => {
  const app = createApp({}, { demo: true });
  it('reports read-only status honestly', async () => { const { body } = await request(app).get('/api/health').expect(200); expect(body).toMatchObject({ status: 'demo', database: 'unavailable', readOnly: true }); });
  it('serves marked demo events through the API', async () => { const { body } = await request(app).get('/api/events?limit=2').expect(200); expect(body.items).toHaveLength(2); expect(body.items.every(x => x.isDemo)).toBe(true); expect(body.pages).toBe(4); });
  it('serves real campus photos and keeps counts for all categories when filtering', async () => {
    const { body } = await request(app).get('/api/gallery-media?category=campus-life&limit=2&page=7').expect(200);
    expect(body).toMatchObject({ allCount: 17, total: 13, page: 7, pages: 7 });
    expect(body.categories).toEqual(expect.arrayContaining([expect.objectContaining({ slug: 'school-archive', count: 4 })]));
    expect(body.items).toEqual([expect.objectContaining({ gallery: expect.objectContaining({ slug: 'campus-life', isDemo: false }), media: expect.objectContaining({ url: '/api/assets/images/campus-table-tennis.webp' }) })]);
  });
  it('supports event search, category filters and pagination', async () => { const { body } = await request(app).get('/api/events?search=play&category=Sports').expect(200); expect(body.total).toBe(1); expect(body.items[0].slug).toBe('demo-sports-meet'); });
  it('paginates the sourced activity catalog while retaining the category filters', async () => {
    const { body } = await request(app).get('/api/activities?category=sports&limit=1&page=2').expect(200);
    expect(body).toMatchObject({ demo: true, total: 2, pages: 2 });
    expect(body.categories.map(category => category.slug)).toContain('arts');
    expect(body.items).toEqual([expect.objectContaining({ slug: 'silambam', category: expect.objectContaining({ slug: 'sports' }) })]);
  });
  it('keeps unknown and unpublished events unavailable', async () => { await request(app).get('/api/events/does-not-exist').expect(404); });
  it('rejects invalid query values', async () => { await request(app).get('/api/events?limit=999&page=-1&period=invalid').expect(422); });
  it('never pretends to save an enquiry in demo mode', async () => { const { body } = await request(app).post('/api/enquiries').set('Origin', origin).send({}).expect(503); expect(body.id).toBeUndefined(); });
  it('never offers a demo administrator login', async () => { await request(app).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.test', password: 'bad' }).expect(503); });
  it('sets security headers', async () => { const res = await request(app).get('/api/events'); expect(res.headers['x-content-type-options']).toBe('nosniff'); expect(res.headers['x-powered-by']).toBeUndefined(); expect(res.headers['cache-control']).toBe('no-store'); });
  it('does not consume the write quota for public reads', async () => {
    const read = await request(app).get('/api/events').expect(200);
    expect(read.headers.ratelimit).toBeUndefined();
    const write = await request(app).post('/api/not-an-endpoint').set('Origin', origin).send({}).expect(404);
    expect(write.headers.ratelimit).toContain('500-in-15min');
  });
});
describe('public database boundaries', () => {
  let db; let app;
  beforeEach(() => { db = database(); app = createApp(db, { demo: false }); });
  it('queries only published events', async () => { db.event.findMany.mockResolvedValue([]); db.event.count.mockResolvedValue(0); await request(app).get('/api/events').expect(200); for (const call of db.event.findMany.mock.calls) expect(call[0].where.status).toBe('PUBLISHED'); });
  it('restricts gallery counts and results to published albums and published images', async () => {
    const album = { slug: 'approved', title: 'Approved album', isDemo: false };
    db.gallery.findMany.mockResolvedValue([{ ...album, _count: { images: 3 } }]);
    db.galleryMedia.findMany.mockResolvedValue([{ id: 'link-3', gallery: album, media: { id: 'photo-3', alt: 'School photo' } }]);
    const { body } = await request(app).get('/api/gallery-media?category=approved&limit=2&page=2').expect(200);
    const photo = { status: 'PUBLISHED', mimeType: { startsWith: 'image/' } };
    expect(db.gallery.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED', images: { some: { media: photo } } },
      select: expect.objectContaining({ _count: { select: { images: { where: { media: photo } } } } }),
    }));
    expect(db.galleryMedia.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { gallery: { status: 'PUBLISHED', slug: 'approved' }, media: photo }, skip: 2, take: 2,
    }));
    expect(body).toMatchObject({ allCount: 3, total: 3, categories: [{ ...album, count: 3 }], items: [{ id: 'link-3' }] });
  });
  it('requires published activities and categories and omits draft media', async () => {
    const activity = { id: 'activity-1', slug: 'test', image: { id: 'private-image', status: 'DRAFT', mimeType: 'image/webp' } };
    db.activity.findMany.mockResolvedValue([activity]);
    db.activity.count.mockResolvedValue(1);
    db.activityCategory.findMany.mockResolvedValue([]);
    const { body } = await request(app).get('/api/activities?category=sports').expect(200);
    const where = { status: 'PUBLISHED', category: { status: 'PUBLISHED', slug: 'sports' } };
    expect(db.activity.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(db.activity.count).toHaveBeenCalledWith({ where });
    expect(db.activityCategory.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'PUBLISHED', activities: { some: { status: 'PUBLISHED' } } } }));
    expect(body.items).toEqual([{ id: 'activity-1', slug: 'test', image: null }]);
  });
  it('does not expose a draft page', async () => { db.page.findFirst.mockResolvedValue(null); await request(app).get('/api/pages/draft').expect(404); expect(db.page.findFirst.mock.calls[0][0].where).toMatchObject({ slug: 'draft', status: 'PUBLISHED' }); });
  it('limits announcements to their publication and expiry window', async () => { db.announcement.findMany.mockResolvedValue([]); db.announcement.count.mockResolvedValue(0); await request(app).get('/api/announcements?kind=NOTICE').expect(200); expect(db.announcement.findMany.mock.calls[0][0].where).toMatchObject({ status: 'PUBLISHED', kind: 'NOTICE', publishedAt: { lte: expect.any(Date) }, OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }] }); });
  it('does not expose draft media to anonymous users', async () => { db.media.findUnique.mockResolvedValue({ status: 'DRAFT' }); await request(app).get('/api/media/private').expect(404); });
  const validEnquiry = { parentName: 'Test parent', studentName: 'Test student', email: 'parent@example.test', phone: '9876543210', grade: '5', message: 'Class availability?', consent: true, locale: 'en' };
  it('stores the enquiry and both emails in one transaction before returning a reference', async () => {
    db.admissionEnquiry.create.mockImplementation(({ data }) => ({ id: 'saved-reference', ...data }));
    const { body } = await request(app).post('/api/enquiries').set('Origin', origin).send(validEnquiry).expect(201);
    expect(body.id).toBe('saved-reference');
    expect(db.admissionEnquiry.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      parentName: 'Test parent', email: 'parent@example.test', requestKey: expect.any(String), payloadHash: expect.any(String),
    }) });
    expect(db.emailMessage.createMany.mock.calls[0][0].data.map(item => item.kind)).toEqual(['ENQUIRY_CONFIRMATION', 'ENQUIRY_NOTIFICATION']);
  });
  it('returns unavailable when persistence fails', async () => { db.admissionEnquiry.create.mockRejectedValue(Object.assign(new Error('private connection details'), { code: 'P1001' })); const { body } = await request(app).post('/api/enquiries').set('Origin', origin).send(validEnquiry).expect(503); expect(body.id).toBeUndefined(); expect(body.error).not.toContain('private connection'); });
  it('requires consent and rejects unknown fields', async () => { await request(app).post('/api/enquiries').set('Origin', origin).send({ ...validEnquiry, consent: false, status: 'CLOSED' }).expect(422); expect(db.admissionEnquiry.create).not.toHaveBeenCalled(); });
  it('rejects unexpected cross-origin writes', async () => { await request(app).post('/api/enquiries').set('Origin', 'https://evil.example').send(validEnquiry).expect(403); expect(db.admissionEnquiry.create).not.toHaveBeenCalled(); });
  it('validates phone numbers and honeypot input', () => { expect(enquirySchema.safeParse({ ...validEnquiry, phone: '123', website: 'bot' }).success).toBe(false); });
});
describe('CMS security and content operations', () => {
  let db; let app;
  beforeEach(() => { db = database(); app = createApp(db, { demo: false }); });
  it.each(['VIEWER', 'EDITOR'])('keeps dashboard audit history private for %s', async role => {
    const roleDb = database(role);
    for (const model of ['event', 'page', 'media', 'admissionEnquiry']) roleDb[model].count.mockResolvedValue(3);
    const { body } = await auth(request(createApp(roleDb, { demo: false })).get('/api/admin/dashboard')).expect(200);
    expect(body.recent).toEqual([]);
    expect(roleDb.auditLog.findMany).not.toHaveBeenCalled();
    expect(body.enquiries).toBe(role === 'VIEWER' ? null : 3);
    if (role === 'VIEWER') expect(roleDb.admissionEnquiry.count).not.toHaveBeenCalled();
  });
  it('requires a session for admin reads', async () => { await request(app).get('/api/admin/events').expect(401); expect(db.event.findMany).not.toHaveBeenCalled(); });
  it('rejects expired sessions', async () => { const session = await db.session.findUnique(); db.session.findUnique.mockResolvedValue({ ...session, expiresAt: new Date(0) }); await auth(request(app).get('/api/admin/events')).expect(401); });
  it('requires a valid CSRF token, including valid byte encoding', async () => { await request(app).post('/api/admin/events').set('Cookie', `school_session=${token}`).set('Origin', origin).send({}).expect(403); await request(app).post('/api/admin/events').set('Cookie', `school_session=${token}`).set('Origin', origin).set('x-csrf-token', 'é'.repeat(64)).send({}).expect(403); });
  it('prevents viewer writes and access to private enquiries', async () => { const viewer = createApp(database('VIEWER'), { demo: false }); await auth(request(viewer).post('/api/admin/events')).send({}).expect(403); await auth(request(viewer).get('/api/admin/enquiries')).expect(403); });
  it('prevents editors from managing users or deleting content', async () => { const editor = createApp(database('EDITOR'), { demo: false }); await auth(request(editor).get('/api/admin/users')).expect(403); await auth(request(editor).delete('/api/admin/events/x')).expect(403); });
  it('creates events and audit logs in the same transaction', async () => { const { id: _id, images: _images, attachment: _attachment, ...event } = demoEvents[0]; db.event.create.mockResolvedValue({ id: 'created' }); const { body } = await auth(request(app).post('/api/admin/events')).send({ ...event, imageIds: [] }).expect(201); expect(body.id).toBe('created'); expect(db.$transaction).toHaveBeenCalled(); expect(db.auditLog.create.mock.calls[0][0].data).toMatchObject({ userId: 'staff-1', action: 'CREATE', entity: 'events', entityId: 'created' }); });
  it('lets an editor create bilingual categories and activities and audits both writes', async () => {
    const editorDb = database('EDITOR');
    const editor = createApp(editorDb, { demo: false });
    const category = { slug: 'science', title: 'Science', titleTa: 'அறிவியல்', icon: 'science', status: 'PUBLISHED', sortOrder: 10 };
    editorDb.activityCategory.create.mockResolvedValue({ id: 'category-1', ...category });
    editorDb.activity.create.mockResolvedValue({ id: 'activity-1' });
    await auth(request(editor).post('/api/admin/activity-categories')).send(category).expect(201);
    const { categorySlug: _categorySlug, ...seed } = schoolActivities.at(-1);
    const activity = { ...seed, categoryId: 'category-1', imageId: null, status: 'PUBLISHED', isDemo: false };
    await auth(request(editor).post('/api/admin/activities')).send(activity).expect(201);
    expect(editorDb.activityCategory.create).toHaveBeenCalledWith({ data: category });
    expect(editorDb.activity.create).toHaveBeenCalledWith({ data: activity });
    expect(editorDb.auditLog.create.mock.calls.map(([call]) => call.data.entity)).toEqual(['activity-categories', 'activities']);
  });
  it('rejects non-image activity media and protects in-use categories', async () => {
    const { categorySlug: _categorySlug, ...seed } = schoolActivities[0];
    db.media.findUnique.mockResolvedValue({ mimeType: 'application/pdf' });
    await auth(request(app).post('/api/admin/activities')).send({ ...seed, categoryId: 'category-1', imageId: 'pdf-1', status: 'DRAFT' }).expect(400);
    expect(db.activity.create).not.toHaveBeenCalled();
    db.activityCategory.delete.mockRejectedValue({ code: 'P2003' });
    await auth(request(app).delete('/api/admin/activity-categories/category-1')).expect(409);
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it('rejects scripts as covers and reversed event dates', () => { const event = { ...demoEvents[0], imageIds: [] }; delete event.id; delete event.images; delete event.attachment; expect(eventSchema.safeParse({ ...event, cover: 'javascript:alert(1)' }).success).toBe(false); expect(eventSchema.safeParse({ ...event, endDate: '2020-01-01T00:00:00.000Z' }).success).toBe(false); });
  it('rejects files with invalid magic bytes despite a trusted MIME header', async () => { const res = await auth(request(app).post('/api/admin/media/upload')).field('alt', 'Test').field('altTa', 'மாதிரி').attach('file', Buffer.from('<script>evil</script>'), { filename: 'fake.jpg', contentType: 'image/jpeg' }); expect(res.status).toBe(400); expect(db.media.create).not.toHaveBeenCalled(); });
  it('protects users against deleting their own account', async () => { await auth(request(app).delete('/api/admin/users/staff-1')).expect(400); expect(db.user.delete).not.toHaveBeenCalled(); });
  it('returns validation conflicts without leaking database details', async () => { db.page.delete.mockRejectedValue({ code: 'P2003', meta: { private: 'secret' } }); const res = await auth(request(app).delete('/api/admin/pages/used')).expect(409); expect(res.body.meta).toBeUndefined(); });
  it('issues an opaque HttpOnly session cookie after password verification', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'staff-1', name: 'Staff', email: 'staff@example.test', roleId: 'role-1', active: true, passwordHash: await bcrypt.hash('a-long-test-password', 12), role: { name: 'ADMIN' } });
    const res = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: 'staff@example.test', password: 'a-long-test-password' }).expect(200);
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly'); expect(res.headers['set-cookie'][0]).toContain('SameSite=Strict'); expect(res.body.csrfToken).toMatch(/^[a-f0-9]{64}$/); expect(res.body.user.passwordHash).toBeUndefined();
    const cookieToken = res.headers['set-cookie'][0].match(/school_session=([a-f0-9]+)/)[1]; expect(db.session.create.mock.calls[0][0].data.id).toBe(hashToken(cookieToken));
  });
});

describe('translation endpoint access', () => {
  it('requires an authenticated session', async () => {
    const db = database(); db.session.findUnique.mockResolvedValue(null);
    await request(createApp(db, { demo: false })).post('/api/admin/translate').set('Origin', origin).send({ text: 'School' }).expect(401);
  });
  it('denies viewers and rejects missing CSRF tokens', async () => {
    await auth(request(createApp(database('VIEWER'), { demo: false })).post('/api/admin/translate')).send({ text: 'School' }).expect(403);
    await request(createApp(database(), { demo: false })).post('/api/admin/translate').set('Cookie', `school_session=${token}`).set('Origin', origin).send({ text: 'School' }).expect(403);
  });
  it('validates input before contacting the provider', async () => {
    await auth(request(createApp(database(), { demo: false })).post('/api/admin/translate')).send({ text: 'x'.repeat(5001) }).expect(422);
  });
});
