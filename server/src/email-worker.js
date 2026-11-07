import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { parseAdminRecipients } from './email-addresses.js';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

export function gmailTransport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    requireTLS: true,
    auth: { user: config.SMTP_USER, pass: config.SMTP_APP_PASSWORD.replace(/\s/g, '') },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 45000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
}

export function smtpFailure(error) {
  const response = Number(error.responseCode);
  if (response >= 500 || error.code === 'EAUTH' || error.code === 'EENVELOPE') {
    return { status: 'FAILED', reason: 'SMTP rejected the message. Check authentication and recipient details.' };
  }
  if ((response >= 400 && response < 500) || ['CONN', 'EHLO', 'HELO', 'STARTTLS', 'AUTH', 'MAIL FROM', 'RCPT TO'].includes(error.command)) {
    return { status: 'PENDING', reason: 'Temporary SMTP failure. A retry is scheduled.' };
  }
  return { status: 'UNKNOWN', reason: 'SMTP acceptance could not be confirmed. Check the sender’s Sent folder before sending again.' };
}

const log = (event, job, status) => console.info(JSON.stringify({ event, emailId: job.id, attempt: job.attempts, status }));

export function emailWorker(db, transport, options = {}) {
  const maxAttempts = options.maxAttempts ?? config.EMAIL_MAX_ATTEMPTS;
  let stopped = false;
  let active;
  let timer;
  let lastCleanup = 0;

  async function runOnce() {
    const now = new Date();
    if (now - lastCleanup > 3600000) {
      await db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } });
      lastCleanup = now.getTime();
    }
    await db.emailMessage.updateMany({
      where: { status: 'SENDING', lockedAt: { lt: new Date(now - 180000) } },
      data: { status: 'UNKNOWN', lockToken: null, lockedAt: null, lastError: 'The worker stopped during sending. Check Gmail before sending again.' },
    });
    const candidate = await db.emailMessage.findFirst({
      where: { status: 'PENDING', nextAttemptAt: { lte: now } }, orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    });
    if (!candidate) return false;
    const lockToken = randomUUID();
    const claimed = await db.emailMessage.updateMany({
      where: { id: candidate.id, status: 'PENDING' },
      data: { status: 'SENDING', lockedAt: now, lockToken, attempts: { increment: 1 } },
    });
    if (!claimed.count) return true;
    const job = { ...candidate, attempts: candidate.attempts + 1 };
    const finish = data => db.emailMessage.updateMany({
      where: { id: job.id, status: 'SENDING', lockToken },
      data: { ...data, lockedAt: null, lockToken: null },
    });
    if (job.expiresAt && job.expiresAt <= now) {
      await finish({ status: 'FAILED', lastError: 'This queued enquiry email expired before it could be sent.' });
      return true;
    }
    // Messages queued during setup use the configured office address once SMTP is enabled.
    const admins = job.kind === 'ENQUIRY_NOTIFICATION' ? parseAdminRecipients(config.ADMIN_NOTIFICATION_EMAILS || config.SMTP_NOTIFY_TO) : [];
    const to = job.kind === 'ENQUIRY_NOTIFICATION' ? admins[0] : job.to;
    const bcc = job.kind === 'ENQUIRY_NOTIFICATION' ? admins.slice(1) : job.bcc || [];
    const attachments = [];
    if (job.attachmentId) {
      try {
        const media = await db.media.findUnique({ where: { id: job.attachmentId } });
        if (!media || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(media.mimeType) || media.size > 8 * 1024 * 1024) throw new Error();
        const path = resolve(config.uploads, media.filename);
        if (!path.startsWith(config.uploads + sep)) throw new Error();
        const content = await readFile(path);
        if (content.length > 8 * 1024 * 1024) throw new Error();
        attachments.push({ filename: media.originalName.replace(/[\r\n\\/]/g, '_'), content, contentType: media.mimeType });
      } catch {
        await finish({ status: 'FAILED', lastError: 'The attachment is unavailable or invalid. Restore it before retrying.' });
        return true;
      }
    }
    let result;
    try {
      result = await transport.sendMail({
        from: { name: config.SMTP_FROM_NAME, address: config.SMTP_USER },
        to, cc: job.cc, bcc, attachments, replyTo: job.replyTo || undefined,
        subject: job.subject, html: job.html, text: job.text,
        messageId: `<${job.id}@${config.SMTP_USER.split('@')[1] || 'localhost'}>`,
        disableFileAccess: true, disableUrlAccess: true,
      });
    } catch (error) {
      const failure = smtpFailure(error);
      const retry = failure.status === 'PENDING' && job.attempts < maxAttempts;
      const status = failure.status === 'PENDING' && !retry ? 'FAILED' : failure.status;
      await finish({
        status, lastError: retry ? failure.reason : status === 'FAILED' ? 'Email sending failed. Review the configuration and recipients before retrying.' : failure.reason,
        nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** (job.attempts - 1))),
      });
      log('email.attempt', job, status);
      return true;
    }
    const accepted = (result.accepted || []).map(String);
    const rejected = (result.rejected || []).map(String);
    const status = accepted.length ? rejected.length ? 'PARTIAL' : 'SENT' : 'FAILED';
    // A database failure here leaves the lease for manual review instead of resending an accepted email.
    await finish({ to, bcc, status, accepted, rejected, messageId: result.messageId, sentAt: accepted.length ? new Date() : null, lastError: rejected.length ? 'Some recipients were rejected by SMTP. Review the accepted and rejected addresses.' : null });
    log('email.accepted', job, status);
    return true;
  }

  async function poll() {
    if (stopped) return;
    try {
      for (let index = 0; index < 3 && !stopped; index++) if (!await runOnce()) break;
    } catch {
      console.error(JSON.stringify({ event: 'email.worker_unavailable' }));
    } finally {
      if (!stopped) timer = setTimeout(() => { active = poll(); }, config.EMAIL_POLL_MS);
    }
  }

  return {
    runOnce,
    start() { active ||= poll(); },
    async stop() {
      stopped = true;
      clearTimeout(timer);
      await active;
      transport.close?.();
    },
  };
}
