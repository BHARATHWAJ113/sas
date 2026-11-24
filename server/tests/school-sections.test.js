import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { schoolSchemas } from '../src/school-sections.js';
import { schemas } from '../src/validation.js';
import { schoolResources } from '../../shared/school-sections.js';
import { readFileSync } from 'node:fs';

const origin = 'http://127.0.0.1:5173';
const token = 'a'.repeat(64), csrf = 'b'.repeat(64);
const auth = req => req.set('Cookie', `school_session=${token}`).set('Origin', origin).set('x-csrf-token', csrf);
const fixtures = {
  fees: { title: 'School fee', standard: '1', academicYear: '2026-27', category: 'School fee', amount: 1000.50, frequency: 'Term', installments: 3, status: 'PUBLISHED' },
  honours: { name: 'Test student', title: 'Science award', standard: '10', academicYear: '2026-27', category: 'Science', status: 'PUBLISHED' },
  staff: { name: 'Test teacher', designation: 'Teacher', department: 'Science', category: 'Teaching', status: 'PUBLISHED' },
  toppers: { name: 'Test student', standard: '10', academicYear: '2026-27', category: 'SSLC', marks: 490, maximumMarks: 500, percentage: 98, status: 'PUBLISHED' },
};
function database(role = 'ADMIN') {
  const db = {};
  for (const name of [...Object.values(schoolResources), 'media', 'auditLog', 'session', 'gallery', 'galleryMedia']) {
    db[name] = Object.fromEntries(['findUnique', 'findMany', 'count', 'groupBy', 'create', 'update', 'delete'].map(method => [method, vi.fn().mockResolvedValue(['findMany','groupBy'].includes(method) ? [] : method === 'count' ? 0 : null)]));
    db[name].create.mockImplementation(async ({ data }) => ({ id: 'created', ...data }));
    db[name].update.mockImplementation(async ({ data }) => ({ id: 'created', ...data }));
  }
  db.session.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now()+60000), csrfToken: csrf, user: { id: 'admin', active: true, role: { name: role } } });
  db.$transaction = callback => callback(db);
  return db;
}
describe('dynamic school sections', () => {
  it.each(Object.keys(fixtures))('validates and audits %s create, edit, list and delete', async resource => {
    const db = database(), app = createApp(db, { demo: false }), model = schoolResources[resource];
    await auth(request(app).post(`/api/admin/${resource}`)).send(fixtures[resource]).expect(201);
    expect(db.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ entity: resource, action: 'CREATE' }) }));
    await auth(request(app).put(`/api/admin/${resource}/created`)).send({ ...fixtures[resource], status: 'ARCHIVED' }).expect(200);
    expect(db[model].update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'ARCHIVED' }) }));
    await auth(request(app).get(`/api/admin/${resource}?search=2026&column=${resource === 'staff' ? 'name' : 'academicYear'}&page=2&limit=20`)).expect(200);
    expect(db[model].findMany.mock.calls[0][0]).toMatchObject({ skip: 20, take: 20 });
    await auth(request(app).delete(`/api/admin/${resource}/created`)).expect(204);
  });
  it.each(Object.keys(fixtures))('protects %s mutations with role and CSRF checks', async resource => {
    await request(createApp(database(), { demo: false })).post(`/api/admin/${resource}`).set('Origin', origin).send(fixtures[resource]).expect(401);
    await auth(request(createApp(database('VIEWER'), { demo: false })).post(`/api/admin/${resource}`)).send(fixtures[resource]).expect(403);
    await auth(request(createApp(database('EDITOR'), { demo: false })).delete(`/api/admin/${resource}/one`)).expect(403);
    await request(createApp(database(), { demo: false })).post(`/api/admin/${resource}`).set('Cookie', `school_session=${token}`).set('Origin', origin).send(fixtures[resource]).expect(403);
  });
  it.each(['honours', 'staff', 'toppers'])('filters %s at database level and hides unpublished images', async resource => {
    const db = database(), model = schoolResources[resource];
    db[model].findMany.mockResolvedValue([{ id: 'one', imageId: 'private', image: { id: 'private', status: 'DRAFT' } }]);
    const { body } = await request(createApp(db, { demo: false })).get(`/api/${resource}?page=2&category=Science&search=Test`).expect(200);
    expect(body.items[0].image).toBeNull(); expect(body.items[0].imageId).toBeUndefined();
    expect(db[model].findMany.mock.calls[0][0]).toMatchObject({ where: { status: 'PUBLISHED', category: 'Science' }, skip: 12, take: 12, omit: { sourceRef: true } });
  });
  it('calculates complete fee totals in paise and requires a year and standard', async () => {
    const db = database(), app = createApp(db, { demo: false });
    await request(app).get('/api/fees').expect(200);
    expect(db.fee.findMany).not.toHaveBeenCalled();
    db.fee.findMany.mockResolvedValue([{ amount: '1000.50', installments: 3 }, { amount: '10.25', installments: 1 }]);
    const { body } = await request(app).get('/api/fees?standard=1&academicYear=2026-27&limit=1').expect(200);
    expect(body.annualTotal).toBe(3011.75);
    expect(db.fee.findMany.mock.calls[0][0].take).toBeUndefined();
  });
  it('rejects invalid money, marks, percentages, standards and unknown fields', () => {
    for (const change of [{ amount: -1 }, { amount: 1.001 }, { installments: 0 }, { standard: '13' }, { admin: true }]) expect(schoolSchemas.fees.safeParse({ ...fixtures.fees, ...change }).success).toBe(false);
    for (const change of [{ marks: 501 }, { percentage: 101 }, { percentage: 70 }, { rank: 0 }]) expect(schoolSchemas.toppers.safeParse({ ...fixtures.toppers, ...change }).success).toBe(false);
  });
  it('rejects non-image portraits and protects referenced photos from deletion', async () => {
    const db = database(), app = createApp(db, { demo: false });
    db.media.findUnique.mockResolvedValue({ mimeType: 'application/pdf' });
    await auth(request(app).post('/api/admin/staff')).send({ ...fixtures.staff, imageId: 'pdf' }).expect(400);
    db.staffMember.count.mockResolvedValue(1);
    await auth(request(app).delete('/api/admin/media/photo')).expect(409);
  });
  it('does not substitute demo albums when the real gallery is empty', async () => {
    const { body } = await request(createApp(database(), { demo: false })).get('/api/gallery-media').expect(200);
    expect(body.items).toEqual([]); expect(body.categories).toEqual([]);
  });
  it('keeps prepared data schema-valid with no invented rank or fee breakdown', () => {
    const manifest = JSON.parse(readFileSync(new URL('../../assets/optimized-school/manifest.json', import.meta.url), 'utf8'));
    for (const resource of Object.keys(fixtures)) for (const { id: _id, ...item } of manifest[resource]) expect(schoolSchemas[resource].safeParse(item).success).toBe(true);
    expect(manifest.staff).toHaveLength(60); expect(manifest.fees).toHaveLength(42);
    for (const { id: _id, ...album } of manifest.galleries) expect(schemas.galleries.safeParse(album).success).toBe(true);
    const ranked = manifest.toppers.filter(row => row.rank != null);
    expect(ranked).toHaveLength(5);
    for (const row of ranked) {
      expect(row.academicYear).toBe('2024-25');
      expect(row.sourceRef).toContain('Annual_Report_2025-26_web.pdf');
      expect(row.sourceRef).toContain('explicit 2024-25 rank');
    }
    const sums = [20500,23500,26000,27000,29000];
    for (const [i, standard] of ['LKG','1','6','9','12'].entries()) expect(manifest.fees.filter(row => row.standard === standard).reduce((sum,row) => sum+row.amount,0)).toBe(sums[i]);
  });
});
