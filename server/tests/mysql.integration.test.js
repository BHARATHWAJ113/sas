import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
describe.skipIf(process.env.MYSQL_INTEGRATION !== 'true')('real MySQL integration (explicit opt-in)', () => {
  const prefix = `test-${randomUUID().slice(0, 8)}`;
  const email = `${prefix}@example.test`;
  const password = randomUUID() + '-test';
  let db; let app; let config; let role; let createdRole = false; let mediaId; let filename;
  beforeAll(async () => {
    const { createDatabase } = await import('../src/database.js');
    ({ config } = await import('../src/config.js'));
    const { createApp } = await import('../src/app.js');
    db = createDatabase(process.env.TEST_DATABASE_URL);
    await db.$queryRaw`SELECT 1`;
    role = await db.role.findUnique({ where: { name: 'ADMIN' } });
    if (!role) { role = await db.role.create({ data: { name: 'ADMIN' } }); createdRole = true; }
    await db.user.create({ data: { name: 'Integration test staff', email, passwordHash: await bcrypt.hash(password, 12), roleId: role.id } });
    app = createApp(db, { demo: false });
  }, 30000);
  afterAll(async () => {
    if (!db) return;
    try {
      const user = await db.user.findUnique({ where: { email } });
      if (user) await db.emailMessage.deleteMany({ where: { userId: user.id } });
      await db.announcement.deleteMany({ where: { slug: prefix + '-popup' } });
      await db.event.deleteMany({ where: { slug: prefix } });
      for (const model of ['fee', 'honour', 'staffMember', 'topper']) await db[model].deleteMany({ where: { sourceRef: prefix } });
      await db.gallery.deleteMany({ where: { slug: prefix + '-gallery' } });
      await db.admissionEnquiry.deleteMany({ where: { email } });
      if (mediaId) await db.media.deleteMany({ where: { id: mediaId } });
      if (filename) await unlink(join(config.uploads, filename)).catch(() => {});
      if (filename) { const { removeVariants } = await import('../src/image-variants.js'); await removeVariants(config.uploads, filename); }
      if (user) { await db.emailMessage.deleteMany({ where: { userId: user.id } }); await db.auditLog.deleteMany({ where: { userId: user.id } }); await db.user.delete({ where: { id: user.id } }); }
      if (createdRole && await db.user.count({ where: { roleId: role.id } }) === 0) await db.role.delete({ where: { id: role.id } });
    } finally { await db.$disconnect(); }
  });
  it('persists staff authentication, publication lifecycle, uploads, an enquiry and audit writes', async () => {
    const origin = 'http://127.0.0.1:5173';
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').set('Origin', origin).send({ email, password }).expect(200);
    const csrf = login.body.csrfToken;
    const { demoEvents } = await import('../src/demo.js');
    const { id: _id, images: _images, attachment: _attachment, ...source } = demoEvents[0];
    const content = { ...source, slug: prefix, status: 'DRAFT', imageIds: [], cover: null };
    const created = await agent.post('/api/admin/events').set('Origin', origin).set('x-csrf-token', csrf).send(content).expect(201);
    await request(app).get(`/api/events/${prefix}`).expect(404);
    const image = await readFile(new URL('../../client/public/images/logo.webp', import.meta.url));
    const upload = await agent.post('/api/admin/media/upload').set('Origin', origin).set('x-csrf-token', csrf).field('alt', 'Integration test image').field('altTa', 'மாதிரி படம்').attach('file', image, { filename: 'test.webp', contentType: 'image/webp' }).expect(201);
    mediaId = upload.body.id; filename = upload.body.filename;
    expect(upload.body.status).toBe('DRAFT');
    await request(app).get(`/api/media/${mediaId}`).expect(404);
    await agent.put(`/api/admin/media/${mediaId}`).set('Origin', origin).set('x-csrf-token', csrf).send({ alt: 'Integration test image', altTa: 'மாதிரி படம்', status: 'PUBLISHED' }).expect(200);
    const published = { ...content, status: 'PUBLISHED', imageIds: [mediaId], cover: `/api/media/${mediaId}` };
    await agent.put(`/api/admin/events/${created.body.id}`).set('Origin', origin).set('x-csrf-token', csrf).send(published).expect(200);
    const event = await request(app).get(`/api/events/${prefix}`).expect(200);
    expect(event.body.images).toHaveLength(1);
    expect(event.body.titleTa).toBe(content.titleTa);
    await request(app).get(`/api/media/${mediaId}`).expect('Content-Type', /image\/webp/).expect(200);
    const enquiryData = { parentName: 'Test parent', studentName: 'Test student', email, phone: '9876543210', grade: 'LKG', locale: 'ta', consent: true, message: 'Integration test only.', metadataConsent: true, metadata: { language: 'ta-IN', timezone: 'Asia/Calcutta', location: { permission: 'denied' } } };
    const key = randomUUID();
    const enquiry = await request(app).post('/api/enquiries').set('Origin', origin).set('Idempotency-Key', key).send(enquiryData).expect(201);
    const stored = await db.admissionEnquiry.findUnique({ where: { id: enquiry.body.id } });
    expect(stored.email).toBe(email); expect(stored.locale).toBe('ta'); expect(stored.consentAt).toBeInstanceOf(Date);
    expect(stored.metadata.location.permission).toBe('denied'); expect(stored.metadata.device.language).toBe('ta-IN'); expect(stored.metadataExpiresAt).toBeInstanceOf(Date);
    const repeated = await request(app).post('/api/enquiries').set('Origin', origin).set('Idempotency-Key', key).send(enquiryData).expect(201);
    expect(repeated.body.id).toBe(stored.id);
    const refreshed = await request(app).post('/api/enquiries').set('Origin', origin).set('Idempotency-Key', randomUUID()).send(enquiryData).expect(201);
    expect(refreshed.body.id).toBe(stored.id);
    const queued = await db.emailMessage.findMany({ where: { enquiryId: stored.id } });
    expect(queued.map(item => item.kind).sort()).toEqual(['ENQUIRY_CONFIRMATION', 'ENQUIRY_NOTIFICATION']);
    expect(queued.every(item => item.status === 'PENDING')).toBe(true);
    await agent.patch(`/api/admin/enquiries/${stored.id}`).set('Origin', origin).set('x-csrf-token', csrf).send({ status: 'CONTACTED' }).expect(200);
    await agent.put(`/api/admin/events/${created.body.id}`).set('Origin', origin).set('x-csrf-token', csrf).send({ ...published, status: 'ARCHIVED' }).expect(200);
    await request(app).get(`/api/events/${prefix}`).expect(404);
    await agent.delete(`/api/admin/events/${created.body.id}`).set('Origin', origin).set('x-csrf-token', csrf).expect(204);
    const audit = await db.auditLog.findMany({ where: { userId: login.body.user.id } });
    expect(audit.map(x => x.action)).toEqual(expect.arrayContaining(['LOGIN', 'CREATE', 'UPLOAD', 'UPDATE', 'DELETE']));
    await agent.post('/api/auth/logout').set('Origin', origin).set('x-csrf-token', csrf).expect(204);
    await agent.get('/api/auth/me').expect(401);
  }, 30000);
  it('persists all four school sections, photo metadata, ordering, variants and publication changes', async () => {
    const origin = 'http://127.0.0.1:5173';
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').set('Origin', origin).send({ email, password }).expect(200);
    const mutate = (method, path, body) => agent[method]('/api/admin/' + path).set('Origin', origin).set('x-csrf-token', login.body.csrfToken).send(body);
    const records = {
      fees: { title: prefix, category: 'School fee', standard: 'LKG', academicYear: '2099-00', amount: 25.50, frequency: 'Term', installments: 3 },
      honours: { name: prefix, title: 'Test award', standard: '10', academicYear: '2099-00', category: 'Academic', imageId: mediaId },
      staff: { name: prefix, designation: 'Teacher', department: 'Science', category: 'Teaching', imageId: mediaId },
      toppers: { name: prefix, standard: '10', academicYear: '2099-00', category: 'SSLC', marks: 490, maximumMarks: 500, percentage: 98, imageId: mediaId },
    };
    for (const [resource, values] of Object.entries(records)) {
      const body = { ...values, sourceRef: prefix, status: 'DRAFT' };
      const created = await mutate('post', resource, body).expect(201);
      const url = `/api/${resource}?search=${prefix}&standard=${values.standard || ''}&academicYear=${values.academicYear || ''}`;
      expect((await request(app).get(url).expect(200)).body.items).toHaveLength(0);
      await mutate('put', resource + '/' + created.body.id, { ...body, status: 'PUBLISHED' }).expect(200);
      const visible = (await request(app).get(url).expect(200)).body;
      expect(visible.items).toHaveLength(1);
      expect(visible.items[0].sourceRef).toBeUndefined();
      if (resource === 'fees') expect(visible.annualTotal).toBe(76.50);
      else expect(visible.items[0].image.id).toBe(mediaId);
      if (resource !== 'fees') await mutate('delete', 'media/' + mediaId).expect(409);
      await mutate('put', resource + '/' + created.body.id, { ...body, status: 'ARCHIVED' }).expect(200);
      expect((await request(app).get(url).expect(200)).body.items).toHaveLength(0);
      await mutate('delete', resource + '/' + created.body.id).expect(204);
    }
    await mutate('put', 'media/' + mediaId, { alt: prefix, altTa: prefix, status: 'PUBLISHED', description: 'Gallery caption', descriptionTa: '', eventDate: '2026-11-01T00:00:00.000Z' }).expect(200);
    const album = { title: prefix, titleTa: prefix, slug: prefix + '-gallery', summary: 'Test gallery', summaryTa: 'Test gallery', imageIds: [mediaId], status: 'PUBLISHED', isDemo: true };
    const saved = await mutate('post', 'galleries', album).expect(201);
    const gallery = await request(app).get('/api/gallery-media?category=' + album.slug).expect(200);
    expect(gallery.body.items[0].media).toMatchObject({ description: 'Gallery caption', hasVariants: true });
    await request(app).get('/api/media/' + mediaId + '?width=640').expect(200).expect('Content-Type', /image\/webp/);
    await request(app).get('/api/media/' + mediaId + '?width=99999').expect(422);
    await mutate('put', 'galleries/' + saved.body.id, { ...album, imageIds: [], status: 'ARCHIVED' }).expect(200);
    expect((await request(app).get('/api/gallery-media?category=' + album.slug).expect(200)).body.items).toHaveLength(0);
    await mutate('delete', 'galleries/' + saved.body.id).expect(204);
  }, 30000);
  it('sends idempotent admin outbox jobs with concurrent worker claims', async () => {
    const origin = 'http://127.0.0.1:5173';
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').set('Origin', origin).send({ email, password }).expect(200);
    const original = { emailEnabled: config.emailEnabled, SMTP_USER: config.SMTP_USER, SMTP_NOTIFY_TO: config.SMTP_NOTIFY_TO };
    Object.assign(config, { emailEnabled: true, SMTP_USER: 'test-sender@example.test', SMTP_NOTIFY_TO: 'test-office@example.test' });
    try {
      const key = randomUUID();
      const payload = { to: email, cc: [`copy-${email}`], bcc: [`blind-${email}`], attachmentId: mediaId, subject: 'Integration test correspondence', html: '<p>School <strong>test</strong> message.</p>' };
      const send = () => agent.post('/api/admin/emails').set('Origin', origin).set('x-csrf-token', login.body.csrfToken).set('Idempotency-Key', key).send(payload);
      const queued = await send().expect(202);
      expect((await send().expect(202)).body.id).toBe(queued.body.id);
      const { emailWorker } = await import('../src/email-worker.js');
      const emailIds = (await db.emailMessage.findMany({
        where: { OR: [{ userId: login.body.user.id }, { enquiry: { email } }] }, select: { id: true },
      })).map(item => item.id);
      // Scope test workers to this run's records, even when an existing local database is used.
      const scopedDb = {
        media: db.media,
        rateLimitBucket: { deleteMany: async () => ({ count: 0 }) },
        emailMessage: {
          findFirst: args => db.emailMessage.findFirst({ ...args, where: { AND: [args.where, { id: { in: emailIds } }] } }),
          updateMany: args => db.emailMessage.updateMany({ ...args, where: { AND: [args.where, { id: { in: emailIds } }] } }),
        },
      };
      const attempts = [];
      const delivered = [];
      const transport = { sendMail: async message => { attempts.push(message.messageId); delivered.push(message); return { accepted: [message.to, ...(message.cc || []), ...(message.bcc || [])], rejected: [], messageId: message.messageId }; } };
      const workerA = emailWorker(scopedDb, transport);
      const workerB = emailWorker(scopedDb, transport);
      for (let index = 0; index < 4; index++) await Promise.all([workerA.runOnce(), workerB.runOnce()]);
      expect(new Set(attempts).size).toBe(attempts.length);
      const stored = await db.emailMessage.findUnique({ where: { id: queued.body.id } });
      expect(stored.status).toBe('SENT');
      expect(stored.attempts).toBe(1);
      expect(stored.accepted).toEqual([email, `copy-${email}`, `blind-${email}`]);
      expect(delivered.find(item => item.subject === payload.subject).attachments).toHaveLength(1);
      const history = await agent.get('/api/admin/emails?status=SENT').expect(200);
      expect(history.body.items.some(item => item.id === stored.id)).toBe(true);
      expect(history.body.items[0].html).toBeUndefined();
    } finally { Object.assign(config, original); }
  }, 30000);
  it('publishes scheduled popups, paginates admin lists and expires optional enquiry metadata', async () => {
    const origin = 'http://127.0.0.1:5173';
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').set('Origin', origin).send({ email, password }).expect(200);
    const payload = { title: prefix, titleTa: prefix, slug: prefix + '-popup', summary: 'Integration demo', summaryTa: 'Integration demo', body: 'Integration test only', bodyTa: 'Integration test only', status: 'PUBLISHED', isDemo: true, kind: 'ANNOUNCEMENT', showPopup: true, priority: 777, publishedAt: new Date(Date.now() - 60000).toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), imageId: mediaId, wishes: 'Test message' };
    const saved = await agent.post('/api/admin/announcements').set('Origin', origin).set('x-csrf-token', login.body.csrfToken).send(payload).expect(201);
    expect((await request(app).get('/api/home-announcements')).body.items.some(item => item.id === saved.body.id)).toBe(true);
    for (const limit of [20, 50, 100, 200]) {
      const result = await agent.get(`/api/admin/announcements?limit=${limit}&search=${prefix}&sort=title&direction=asc`).expect(200);
      expect(result.body).toMatchObject({ limit, total: 1 });
      expect(result.body.items[0].body).toBeUndefined();
    }
    const details = await agent.get(`/api/admin/announcements/${saved.body.id}`).expect(200);
    expect(details.body.body).toBe(payload.body);
    await agent.put(`/api/admin/announcements/${saved.body.id}`).set('Origin', origin).set('x-csrf-token', login.body.csrfToken).send({ ...payload, publishedAt: new Date(Date.now() + 60000).toISOString() }).expect(200);
    expect((await request(app).get('/api/home-announcements')).body.items.some(item => item.id === saved.body.id)).toBe(false);
    const enquiry = await db.admissionEnquiry.findFirst({ where: { email } });
    await db.admissionEnquiry.update({ where: { id: enquiry.id }, data: { metadataExpiresAt: new Date(Date.now() - 1000) } });
    expect((await agent.get(`/api/admin/enquiries/${enquiry.id}`).expect(200)).body.metadata).toBeNull();
    const { cleanPrivateMetadata } = await import('../src/metadata.js');
    await cleanPrivateMetadata({
      visitorRecord: { deleteMany: async () => ({ count: 0 }) },
      admissionEnquiry: { updateMany: args => db.admissionEnquiry.updateMany({ ...args, where: { ...args.where, email } }) },
    });
    expect((await db.admissionEnquiry.findUnique({ where: { id: enquiry.id } })).metadata).toBeNull();
  }, 30000);
});
