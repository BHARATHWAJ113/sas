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
      await db.event.deleteMany({ where: { slug: prefix } });
      await db.admissionEnquiry.deleteMany({ where: { email } });
      if (mediaId) await db.media.deleteMany({ where: { id: mediaId } });
      if (filename) await unlink(join(config.uploads, filename)).catch(() => {});
      if (user) { await db.auditLog.deleteMany({ where: { userId: user.id } }); await db.user.delete({ where: { id: user.id } }); }
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
    const enquiry = await request(app).post('/api/enquiries').set('Origin', origin).send({ parentName: 'Test parent', studentName: 'Test student', email, phone: '9876543210', grade: 'LKG', locale: 'ta', consent: true, message: 'Integration test only.' }).expect(201);
    const stored = await db.admissionEnquiry.findUnique({ where: { id: enquiry.body.id } });
    expect(stored.email).toBe(email); expect(stored.locale).toBe('ta'); expect(stored.consentAt).toBeInstanceOf(Date);
    await agent.patch(`/api/admin/enquiries/${stored.id}`).set('Origin', origin).set('x-csrf-token', csrf).send({ status: 'CONTACTED' }).expect(200);
    await agent.put(`/api/admin/events/${created.body.id}`).set('Origin', origin).set('x-csrf-token', csrf).send({ ...published, status: 'ARCHIVED' }).expect(200);
    await request(app).get(`/api/events/${prefix}`).expect(404);
    await agent.delete(`/api/admin/events/${created.body.id}`).set('Origin', origin).set('x-csrf-token', csrf).expect(204);
    const audit = await db.auditLog.findMany({ where: { userId: login.body.user.id } });
    expect(audit.map(x => x.action)).toEqual(expect.arrayContaining(['LOGIN', 'CREATE', 'UPLOAD', 'UPDATE', 'DELETE']));
    await agent.post('/api/auth/logout').set('Origin', origin).set('x-csrf-token', csrf).expect(204);
    await agent.get('/api/auth/me').expect(401);
  }, 30000);
});
