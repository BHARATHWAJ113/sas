import { rateLimit } from 'express-rate-limit';
import { allow, fail } from './auth.js';
import { composeEmailSchema, cleanEmail, emailTemplate } from './email-content.js';
import { consumeRate, digest, requestKey } from './idempotency.js';
import { config } from './config.js';
import { parse } from './validation.js';
import { adminList, listEnvelope } from './admin-list.js';

const summary = {
  id: true, to: true, cc: true, bcc: true, attachmentId: true, subject: true, kind: true, status: true, attempts: true, lastError: true,
  createdAt: true, updatedAt: true, sentAt: true, nextAttemptAt: true, expiresAt: true, accepted: true, rejected: true,
  user: { select: { name: true } },
};

export function mountEmailAdmin(router, db, audit) {
  router.get('/emails', allow('ADMIN'), async (req, res) => {
    const { query, ...args } = adminList('emails', req.query);
    const [items, total] = await Promise.all([
      db.emailMessage.findMany({ ...args, select: summary }),
      db.emailMessage.count({ where: args.where }),
    ]);
    res.json({ ...listEnvelope(items, total, query), configured: config.emailEnabled });
  });

  router.get('/emails/:id', allow('ADMIN'), async (req, res) => {
    const item = await db.emailMessage.findUnique({ where: { id: req.params.id }, select: { ...summary, text: true } });
    if (!item) throw fail(404, 'Email record unavailable.');
    res.json(item);
  });

  router.post('/emails', allow('ADMIN'), rateLimit({
    windowMs: 3600000, limit: 20, keyGenerator: req => req.user.id, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'The hourly email limit has been reached. Try again later.' },
  }), parse(composeEmailSchema), async (req, res) => {
    if (!config.emailEnabled) throw fail(503, 'Email sending is unavailable. Configure the Gmail SMTP settings on the server.');
    const content = cleanEmail(req.validated.html);
    if (req.validated.attachmentId) {
      const attachment = await db.media.findUnique({ where: { id: req.validated.attachmentId } });
      if (!attachment || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(attachment.mimeType) || attachment.size > 8 * 1024 * 1024) throw fail(422, 'Choose a validated image or PDF up to 8 MB from the media library.');
    }
    const payload = { ...req.validated, html: content.html };
    const payloadHash = digest(payload);
    const dedupeKey = requestKey(req, payloadHash, `email:${req.user.id}`, true);
    let item = await db.emailMessage.findUnique({ where: { dedupeKey } });
    if (!item) {
      try {
        item = await db.$transaction(async tx => {
          await consumeRate(tx, ['admin-email', req.user.id], 20);
          const saved = await tx.emailMessage.create({
            data: { ...payload, html: emailTemplate(payload.subject, content.html), text: content.text, kind: 'ADMIN', dedupeKey, payloadHash, userId: req.user.id },
          });
          await audit(tx, req, 'QUEUE_EMAIL', 'email', saved.id);
          return saved;
        });
      } catch (error) {
        if (error.code !== 'P2002') throw error;
        item = await db.emailMessage.findUnique({ where: { dedupeKey } });
        if (!item) throw error;
      }
    }
    if (item.payloadHash !== payloadHash) throw fail(409, 'This send reference was already used for a different email.');
    res.status(202).json({ id: item.id, status: item.status });
  });

  router.post('/emails/:id/retry', allow('ADMIN'), async (req, res) => {
    if (!config.emailEnabled) throw fail(503, 'Email sending is unavailable. Configure Gmail SMTP first.');
    await db.$transaction(async tx => {
      await consumeRate(tx, ['admin-email', req.user.id], 20);
      const changed = await tx.emailMessage.updateMany({
        where: { id: req.params.id, status: 'FAILED', attempts: { lt: 8 }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        data: { status: 'PENDING', nextAttemptAt: new Date(), lastError: null },
      });
      if (!changed.count) throw fail(409, 'Only failed, unexpired messages with remaining attempts can be retried.');
      await audit(tx, req, 'RETRY_EMAIL', 'email', req.params.id);
    });
    res.status(202).json({ status: 'PENDING' });
  });
}
