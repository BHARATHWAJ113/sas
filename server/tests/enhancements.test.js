import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { parseAdminRecipients } from '../src/email-addresses.js';
import { composeEmailSchema, enquiryEmails } from '../src/email-content.js';
import { emailWorker } from '../src/email-worker.js';
import { adminList } from '../src/admin-list.js';
import { metadataSchema, submissionMetadata } from '../src/metadata.js';
import { isPopupEligible, rememberPopup, popupPreferences, POPUP_INTERVAL } from '../../client/src/popup-policy.js';
import { schemas } from '../src/validation.js';
import { requestVisitLocation } from '../../client/src/visitor-metadata.js';

const origin = 'http://127.0.0.1:5173';
const token = 'a'.repeat(64); const csrf = 'b'.repeat(64);
const auth = query => query.set('Cookie', `school_session=${token}`).set('Origin', origin).set('x-csrf-token', csrf);
function database(role = 'ADMIN') {
  const db = {};
  for (const name of ['session', 'announcement', 'visitorRecord', 'cookieConsent', 'emailMessage', 'admissionEnquiry', 'auditLog', 'media', 'rateLimitBucket']) {
    db[name] = Object.fromEntries(['findUnique', 'findFirst', 'findMany', 'create', 'createMany', 'updateMany', 'upsert', 'deleteMany', 'count'].map(method => [method, vi.fn().mockResolvedValue(method === 'findMany' ? [] : method === 'count' ? 0 : null)]));
  }
  db.session.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() + 60000), csrfToken: csrf, user: { id: 'test-admin', active: true, role: { name: role } } });
  db.$transaction = callback => callback(db);
  db.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });
  return db;
}
afterEach(() => vi.restoreAllMocks());

describe('per-message popup reminders', () => {
  const now = Date.parse('2026-11-08T00:00:00Z');
  const item = { id: 'a', updatedAt: 'revision-one', showPopup: true, status: 'PUBLISHED', publishedAt: '2026-11-01T00:00:00Z', expiresAt: null };
  const storage = () => { const values = new Map(); return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }; };
  it('defaults to every refresh without persisting an ordinary close', () => {
    const store = storage(); rememberPopup(store, item, 'refresh', now);
    expect(isPopupEligible(item, popupPreferences(store), now)).toBe(true);
    expect(POPUP_INTERVAL).toBe(20000);
  });
  it.each(['5', '10', '30'])('suppresses only the selected announcement for %s minutes', minutes => {
    const store = storage(); rememberPopup(store, item, minutes, now);
    const preferences = popupPreferences(store);
    expect(isPopupEligible(item, preferences, now + Number(minutes) * 60000 - 1)).toBe(false);
    expect(isPopupEligible(item, preferences, now + Number(minutes) * 60000)).toBe(true);
    expect(isPopupEligible({ ...item, id: 'different' }, preferences, now)).toBe(true);
  });
  it('keeps never specific to a message revision, including across reloads', () => {
    const store = storage(); rememberPopup(store, item, 'never', now);
    expect(isPopupEligible(item, popupPreferences(store), now + 86400000)).toBe(false);
    expect(isPopupEligible({ ...item, updatedAt: 'revision-two' }, popupPreferences(store), now)).toBe(true);
  });
  it('excludes unpublished, future, expired and popup-disabled records', () => {
    for (const invalid of [{ status: 'DRAFT' }, { showPopup: false }, { publishedAt: '2027-01-01' }, { expiresAt: '2026-11-07' }]) expect(isPopupEligible({ ...item, ...invalid }, {}, now)).toBe(false);
  });
  it('handles corrupted or blocked browser storage without crashing', () => {
    expect(popupPreferences({ getItem: () => '[' })).toEqual({});
    expect(rememberPopup({ getItem: () => '{}', setItem: () => { throw new Error(); } }, item, '10', now)).toBe(false);
  });
});

describe('admin query and announcement boundaries', () => {
  it.each([20, 50, 100, 200])('paginates %i records with stable, filtered database queries', limit => {
    const parsed = adminList('enquiries', { page: 2, limit, search: 'Parent', column: 'parentName', status: 'NEW', from: '2026-11-01', to: '2026-11-08', sort: 'email', direction: 'asc' });
    expect(parsed).toMatchObject({ take: limit, skip: limit, where: { status: 'NEW', OR: [{ parentName: { contains: 'Parent' } }] }, orderBy: [{ email: 'asc' }, { id: 'asc' }] });
    expect(parsed.where.createdAt.gte.toISOString()).toBe('2026-10-31T18:30:00.000Z');
  });
  it('rejects unbounded limits, unknown sort fields and reversed dates', () => {
    expect(() => adminList('enquiries', { limit: 201 })).toThrow();
    expect(() => adminList('users', { sort: 'passwordHash' })).toThrow();
    expect(() => adminList('enquiries', { from: '2026-11-08', to: '2026-11-01' })).toThrow();
  });
  it('restricts automatic popups to active published records and hides draft images', async () => {
    const db = database(); db.announcement.findMany.mockResolvedValue([{ id: 'a', image: { id: 'private', status: 'DRAFT' } }]);
    const { body } = await request(createApp(db, { demo: false })).get('/api/home-announcements').expect(200);
    expect(body.items[0].image).toBeNull();
    expect(db.announcement.findMany.mock.calls[0][0]).toMatchObject({ take: 50, where: { status: 'PUBLISHED', showPopup: true }, orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }, { id: 'asc' }] });
  });
  it('requires safe CTA paths and sensible schedules', () => {
    const payload = { title: 'Hello', titleTa: 'Hello', summary: 'Summary', summaryTa: 'Summary', body: 'Message', bodyTa: 'Message', slug: 'hello', kind: 'ANNOUNCEMENT', status: 'PUBLISHED', publishedAt: '2026-11-01T00:00:00Z', showPopup: true };
    expect(schemas.announcements.safeParse({ ...payload, ctaPath: '//evil.example', ctaLabel: 'Go' }).success).toBe(false);
    expect(schemas.announcements.safeParse({ ...payload, expiresAt: '2026-10-01T00:00:00Z' }).success).toBe(false);
    expect(schemas.announcements.safeParse(payload).success).toBe(true);
  });
  it('keeps visitor and enquiry metadata restricted to administrators', async () => {
    for (const role of ['EDITOR', 'VIEWER']) for (const path of ['/api/admin/visitors', '/api/admin/visitors/one', '/api/admin/enquiries/one']) await auth(request(createApp(database(role), { demo: false })).get(path)).expect(403);
    const db = database(); await auth(request(createApp(db, { demo: false })).get('/api/admin/enquiries')).expect(200);
    expect(db.admissionEnquiry.findMany.mock.calls[0][0].select.metadata).toBeUndefined();
  });
});

describe('permission-aware metadata and SMTP recipients', () => {
  it.each([[1, 'denied'], [2, 'unavailable'], [3, 'timeout']])('handles browser location error %i without rejecting the form', async (code, permission) => {
    const result = await requestVisitLocation({ getCurrentPosition: (_success, failure) => failure({ code }) });
    expect(result).toEqual({ permission });
    expect(result.latitude).toBeUndefined();
  });
  it('records only the coordinates actually returned after permission', async () => {
    const coords = { latitude: 11.6, longitude: 79.5, accuracy: 60 };
    await expect(requestVisitLocation({ getCurrentPosition: success => success({ coords }) })).resolves.toEqual({ permission: 'granted', ...coords });
    await expect(requestVisitLocation(null)).resolves.toEqual({ permission: 'unavailable' });
    await expect(requestVisitLocation({ getCurrentPosition: () => { throw new Error('Policy blocked'); } })).resolves.toEqual({ permission: 'unavailable' });
  });
  it('normalizes configured recipients and rejects invalid addresses', () => {
    expect(parseAdminRecipients(' One@Example.test, two@example.test,one@example.test, ')).toEqual(['one@example.test', 'two@example.test']);
    expect(() => parseAdminRecipients('valid@example.test,not-an-email')).toThrow();
    expect(composeEmailSchema.safeParse({ to: 'one@example.test', cc: [], bcc: ['one@example.test'], subject: 'Hello', html: '<p>Body</p>' }).success).toBe(false);
  });
  it('sends office notifications to multiple recipients without exposing BCC in headers', async () => {
    const previous = config.ADMIN_NOTIFICATION_EMAILS;
    config.ADMIN_NOTIFICATION_EMAILS = 'first@example.test,second@example.test,FIRST@example.test';
    try {
      const message = enquiryEmails({ id: 'test', email: 'parent@example.test', locale: 'en' })[1];
      expect(message).toMatchObject({ to: 'first@example.test', bcc: ['second@example.test'] });
      const db = database(); db.emailMessage.findFirst.mockResolvedValue({ ...message, id: 'job', attempts: 0 }); db.emailMessage.updateMany.mockResolvedValue({ count: 1 });
      const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: ['first@example.test', 'second@example.test'], rejected: [] }) };
      await emailWorker(db, transport).runOnce();
      expect(transport.sendMail.mock.calls[0][0]).toMatchObject({ to: 'first@example.test', bcc: ['second@example.test'] });
    } finally { config.ADMIN_NOTIFICATION_EMAILS = previous; }
  });
  it('never accepts client-supplied IPs or coordinates without granted permission', () => {
    expect(metadataSchema.safeParse({ network: { ipAddress: 'fake' } }).success).toBe(false);
    expect(metadataSchema.safeParse({ location: { permission: 'denied', latitude: 10, longitude: 10 } }).success).toBe(false);
    expect(submissionMetadata({ get: () => '', ip: '127.0.0.1' })).toMatchObject({ device: { browser: null, model: null }, network: { ipAddress: '127.0.0.1' }, location: { permission: 'not-requested' } });
  });
  it('rejects analytics without stored current consent and discards location from analytics', async () => {
    const db = database(); const app = createApp(db, { demo: false });
    const payload = { path: '/', requestId: '123e4567-e89b-42d3-a456-426614174000', metadata: { location: { permission: 'granted', latitude: 10, longitude: 20 } } };
    await request(app).post('/api/visits').set('Origin', origin).send(payload).expect(403);
    db.cookieConsent.findUnique.mockResolvedValue({ id: 'consent', analytics: false, version: config.CONSENT_VERSION, expiresAt: new Date(Date.now() + 60000) });
    await request(app).post('/api/visits').set('Origin', origin).set('Cookie', `school_consent=${token}`).send(payload).expect(403);
    db.cookieConsent.findUnique.mockResolvedValue({ id: 'consent', analytics: true, version: config.CONSENT_VERSION, expiresAt: new Date(Date.now() + 60000) });
    await request(app).post('/api/visits').set('Origin', origin).set('Cookie', `school_consent=${token}`).send(payload).expect(204);
    expect(db.visitorRecord.upsert.mock.calls[0][0].create.metadata.location).toEqual({ permission: 'not-requested' });
  });
  it('saves independently selected consent categories in the audit event', async () => {
    const db = database(); db.cookieConsent.upsert.mockImplementation(({ create }) => ({ ...create, updatedAt: new Date() }));
    const { body } = await request(createApp(db, { demo: false })).post('/api/consent').set('Origin', origin).send({ action: 'customize', maps: true, analytics: false }).expect(200);
    expect(body).toMatchObject({ maps: true, analytics: false });
    expect(db.cookieConsent.upsert.mock.calls[0][0].create.events.create).toMatchObject({ action: 'customize', maps: true, analytics: false });
  });
});
