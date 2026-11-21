import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { composeEmailSchema, cleanEmail, enquiryEmails } from '../src/email-content.js';
import { emailWorker, smtpFailure } from '../src/email-worker.js';
import { digest } from '../src/idempotency.js';
import nodemailer from 'nodemailer';
import { SMTPServer } from 'smtp-server';
import { memoryStorage } from './memory-storage.js';

const origin = 'http://127.0.0.1:5173';
const raw = 'a'.repeat(64);
const csrf = 'b'.repeat(64);
const originalEnabled = config.emailEnabled;
const originalNotify = config.SMTP_NOTIFY_TO;
const originalSender = config.SMTP_USER;
const enquiry = { parentName: 'Parent', studentName: 'Student', email: 'parent@example.test', phone: '9876543210', grade: '5', message: '<script>unsafe</script>', consent: true, locale: 'en' };

function database(role = 'ADMIN') {
  const db = {};
  for (const name of ['session', 'emailMessage', 'admissionEnquiry', 'auditLog', 'rateLimitBucket', 'event']) {
    db[name] = Object.fromEntries(['findUnique', 'findFirst', 'findMany', 'count', 'create', 'createMany', 'updateMany', 'upsert', 'deleteMany'].map(method => [method, vi.fn()]));
  }
  db.session.findUnique.mockResolvedValue({
    expiresAt: new Date(Date.now() + 60000), csrfToken: csrf,
    user: { id: 'admin-1', active: true, role: { name: role } },
  });
  db.rateLimitBucket.upsert.mockResolvedValue({ count: 1 });
  db.emailMessage.updateMany.mockResolvedValue({ count: 1 });
  db.emailMessage.createMany.mockResolvedValue({ count: 2 });
  db.$transaction = vi.fn(work => work(db));
  return db;
}

const authorized = req => req.set('Cookie', `school_session=${raw}`).set('Origin', origin).set('x-csrf-token', csrf);
beforeEach(() => { config.emailEnabled = false; config.SMTP_NOTIFY_TO = 'office@example.test'; config.SMTP_USER = 'sender@example.test'; });
afterEach(() => { config.emailEnabled = originalEnabled; config.SMTP_NOTIFY_TO = originalNotify; config.SMTP_USER = originalSender; vi.restoreAllMocks(); });

describe('email content and enquiry outbox', () => {
  it('strips scripts, event handlers, remote images and unsafe links', () => {
    const result = cleanEmail('<p onclick="bad()">Hello <strong>family</strong></p><script>bad()</script><img src="file:///secret"><a href="javascript:bad()">Link</a>');
    expect(result.html).toBe('<p>Hello <strong>family</strong></p><a>Link</a>');
    expect(result.text).toContain('Hello family');
    expect(() => cleanEmail('<p><br></p>')).toThrow();
  });
  it('validates recipients, duplicate CC and header injection', () => {
    const body = { to: 'parent@example.test', subject: 'Hello', html: '<p>Hello</p>' };
    expect(composeEmailSchema.safeParse({ ...body, cc: ['bad'] }).success).toBe(false);
    expect(composeEmailSchema.safeParse({ ...body, cc: [body.to] }).success).toBe(false);
    expect(composeEmailSchema.safeParse({ ...body, subject: 'Hello\r\nBcc: attacker@example.test' }).success).toBe(false);
  });
  it('escapes submitted details in the office email and keeps them out of the acknowledgement', () => {
    const messages = enquiryEmails({ ...enquiry, id: 'reference-1' });
    expect(messages[0].html).not.toContain(enquiry.message);
    expect(messages[1].html).toContain('&lt;script&gt;unsafe&lt;/script&gt;');
    expect(messages[1]).toMatchObject({ to: 'office@example.test', replyTo: enquiry.email });
  });
  it('returns the existing receipt for a retried submission without adding email jobs', async () => {
    const db = database();
    const { consent: _consent, ...data } = enquiry;
    db.admissionEnquiry.findUnique.mockResolvedValue({ id: 'same-reference', payloadHash: digest(data) });
    const app = createApp(db, { demo: false });
    const result = await request(app).post('/api/enquiries').set('Origin', origin).set('Idempotency-Key', 'stable-request-reference-123').send(enquiry).expect(201);
    expect(result.body.id).toBe('same-reference');
    expect(db.admissionEnquiry.create).not.toHaveBeenCalled();
    expect(db.emailMessage.createMany).not.toHaveBeenCalled();
  });
  it('rejects reuse of a request key with changed data', async () => {
    const db = database();
    db.admissionEnquiry.findUnique.mockResolvedValue({ id: 'same-reference', payloadHash: 'different' });
    await request(createApp(db, { demo: false })).post('/api/enquiries').set('Origin', origin).send(enquiry).expect(409);
  });
  it('reports failure when the transaction cannot enqueue email', async () => {
    const db = database();
    db.admissionEnquiry.create.mockImplementation(({ data }) => ({ id: 'new', ...data }));
    db.emailMessage.createMany.mockRejectedValue({ code: 'P1001' });
    const result = await request(createApp(db, { demo: false })).post('/api/enquiries').set('Origin', origin).send(enquiry).expect(503);
    expect(result.body.id).toBeUndefined();
    expect(db.$transaction).toHaveBeenCalledOnce();
  });
});

describe('SMTP retry and claim safety', () => {
  const job = { id: 'email-1', to: 'parent@example.test', cc: [], subject: 'Hello', html: '<p>Hello</p>', text: 'Hello', attempts: 0, kind: 'ADMIN' };
  it('reads attachments from private object storage without filesystem access', async () => {
    const db = database(); const store = memoryStorage();
    db.emailMessage.findFirst.mockResolvedValue({ ...job, attachmentId: 'photo' });
    db.media = { findUnique: vi.fn(async () => ({ filename: 'abcdef.webp', originalName: 'school.webp', mimeType: 'image/webp', size: 5 })) };
    await store.put('media/abcdef.webp', Buffer.from('photo'));
    const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: [job.to], rejected: [] }) };
    await emailWorker(db, transport, { storage: store }).runOnce();
    expect(transport.sendMail.mock.calls[0][0].attachments[0]).toMatchObject({ filename: 'school.webp', content: Buffer.from('photo') });
  });
  it('does not send email if its MinIO attachment is unavailable', async () => {
    const db = database();
    db.emailMessage.findFirst.mockResolvedValue({ ...job, attachmentId: 'photo' });
    db.media = { findUnique: vi.fn(async () => ({ filename: 'abcdef.webp', originalName: 'school.webp', mimeType: 'image/webp', size: 5 })) };
    const transport = { sendMail: vi.fn() };
    await emailWorker(db, transport, { storage: memoryStorage() }).runOnce();
    expect(transport.sendMail).not.toHaveBeenCalled();
    expect(db.emailMessage.updateMany.mock.calls.at(-1)[0].data.status).toBe('FAILED');
  });
  it('records SMTP acceptance after an atomic claim', async () => {
    const db = database();
    db.emailMessage.findFirst.mockResolvedValue(job);
    const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: [job.to], rejected: [], messageId: 'message-1' }) };
    await emailWorker(db, transport).runOnce();
    expect(db.emailMessage.updateMany.mock.calls[1][0]).toMatchObject({ where: { id: job.id, status: 'PENDING' }, data: { status: 'SENDING', attempts: { increment: 1 } } });
    expect(db.emailMessage.updateMany.mock.calls.at(-1)[0]).toMatchObject({ data: { status: 'SENT', accepted: [job.to] } });
  });
  it('does not send when another worker has already claimed the message', async () => {
    const db = database();
    db.emailMessage.findFirst.mockResolvedValue(job);
    db.emailMessage.updateMany.mockResolvedValue({ count: 0 });
    const transport = { sendMail: vi.fn() };
    await emailWorker(db, transport).runOnce();
    expect(transport.sendMail).not.toHaveBeenCalled();
  });
  it('schedules transient rejections with backoff and stops at the attempt limit', async () => {
    const db = database();
    db.emailMessage.findFirst.mockResolvedValue(job);
    const transport = { sendMail: vi.fn().mockRejectedValue({ responseCode: 421 }) };
    await emailWorker(db, transport).runOnce();
    expect(db.emailMessage.updateMany.mock.calls.at(-1)[0].data).toMatchObject({ status: 'PENDING', nextAttemptAt: expect.any(Date) });
    db.emailMessage.findFirst.mockResolvedValue({ ...job, attempts: 3 });
    await emailWorker(db, transport).runOnce();
    expect(db.emailMessage.updateMany.mock.calls.at(-1)[0].data.status).toBe('FAILED');
  });
  it('keeps ambiguous sends and partial recipient acceptance out of automatic retries', async () => {
    expect(smtpFailure({ code: 'ESOCKET', command: 'DATA' }).status).toBe('UNKNOWN');
    expect(smtpFailure({ responseCode: 550 }).status).toBe('FAILED');
    const db = database();
    db.emailMessage.findFirst.mockResolvedValue(job);
    await emailWorker(db, { sendMail: vi.fn().mockResolvedValue({ accepted: [job.to], rejected: ['cc@example.test'] }) }).runOnce();
    expect(db.emailMessage.updateMany.mock.calls.at(-1)[0].data.status).toBe('PARTIAL');
  });
  it('leaves accepted emails for review if the final database write fails', async () => {
    const db = database();
    db.emailMessage.findFirst.mockResolvedValue(job);
    db.emailMessage.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 }).mockRejectedValueOnce(new Error('Database lost'));
    const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: [job.to], rejected: [] }) };
    await expect(emailWorker(db, transport).runOnce()).rejects.toThrow('Database lost');
    expect(transport.sendMail).toHaveBeenCalledOnce();
  });
  it('sends a multipart message through a loopback SMTP server and records acceptance', async () => {
    let received = '';
    const recipients = [];
    const server = new SMTPServer({
      authOptional: true,
      disabledCommands: ['STARTTLS'],
      onRcptTo(address, _session, callback) { recipients.push(address.address); callback(); },
      onData(stream, _session, callback) {
        stream.on('data', chunk => { received += chunk.toString(); });
        stream.on('end', callback);
      },
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const transport = nodemailer.createTransport({ host: '127.0.0.1', port: server.server.address().port, secure: false, ignoreTLS: true });
    try {
      const db = database();
      db.emailMessage.findFirst.mockResolvedValue({ ...job, cc: ['copy@example.test'], bcc: ['blind@example.test'] });
      await emailWorker(db, transport).runOnce();
      expect(received).toContain('multipart/alternative');
      expect(received).toContain('parent@example.test');
      expect(received).toContain('copy@example.test');
      expect(received).not.toContain('blind@example.test');
      expect(recipients).toEqual(expect.arrayContaining(['parent@example.test', 'copy@example.test', 'blind@example.test']));
      expect(db.emailMessage.updateMany.mock.calls.at(-1)[0].data.status).toBe('SENT');
    } finally {
      transport.close();
      await new Promise(resolve => server.close(resolve));
    }
  }, 10000);
});

describe('admin email authorization', () => {
  it('rejects viewers, editors, unauthenticated sends and invalid CSRF', async () => {
    await request(createApp(database(), { demo: false })).post('/api/admin/emails').set('Origin', origin).send({}).expect(401);
    for (const role of ['EDITOR', 'VIEWER']) await authorized(request(createApp(database(role), { demo: false })).get('/api/admin/emails')).expect(403);
    await request(createApp(database(), { demo: false })).post('/api/admin/emails').set('Origin', origin).set('Cookie', `school_session=${raw}`).send({}).expect(403);
  });
  it('queues a sanitized manual message and audit event and preserves idempotency', async () => {
    config.emailEnabled = true;
    const db = database();
    db.emailMessage.create.mockImplementation(({ data }) => ({ id: 'manual-1', ...data, status: 'PENDING' }));
    const app = createApp(db, { demo: false });
    const payload = { to: 'parent@example.test', cc: [], subject: 'School news', html: '<p>Hello</p><script>bad()</script>' };
    const result = await authorized(request(app).post('/api/admin/emails')).set('Idempotency-Key', 'manual-send-reference-123').send(payload).expect(202);
    expect(result.body.status).toBe('PENDING');
    expect(db.emailMessage.create.mock.calls[0][0].data.html).not.toContain('<script>');
    expect(db.auditLog.create.mock.calls[0][0].data.action).toBe('QUEUE_EMAIL');
    db.emailMessage.findUnique.mockResolvedValue({ id: 'manual-1', payloadHash: db.emailMessage.create.mock.calls[0][0].data.payloadHash, status: 'PENDING' });
    await authorized(request(app).post('/api/admin/emails')).set('Idempotency-Key', 'manual-send-reference-123').send(payload).expect(202);
    expect(db.emailMessage.create).toHaveBeenCalledOnce();
  });
});
