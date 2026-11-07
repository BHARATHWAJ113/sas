import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { hashToken, fail } from './auth.js';
import { config } from './config.js';
import { metadataSchema, submissionMetadata, metadataExpiry } from './metadata.js';
import { digest } from './idempotency.js';
import { parse } from './validation.js';

export function mountVisitors(app, db, databaseOnly) {
  app.post('/api/visits', databaseOnly, rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }), parse(z.object({ path: z.string().regex(/^\/(?!\/)[a-zA-Z0-9/_-]*$/).max(300), requestId: z.uuid(), metadata: metadataSchema }).strict()), async (req, res) => {
    const raw = req.cookies.school_consent;
    if (!raw || !/^[a-f0-9]{64}$/.test(raw)) throw fail(403, 'Analytics consent is required.');
    const consent = await db.cookieConsent.findUnique({ where: { id: hashToken(raw) } });
    if (!consent?.analytics || consent.expiresAt <= new Date() || consent.version !== config.CONSENT_VERSION) throw fail(403, 'Analytics consent is required.');
    // Location is never collected for page analytics.
    const { location: _location, ...metadata } = req.validated.metadata;
    const data = { path: req.validated.path, requestKey: digest([consent.id, req.validated.requestId]), consentId: consent.id, metadata: submissionMetadata(req, metadata, 'visitor-analytics'), expiresAt: metadataExpiry() };
    await db.visitorRecord.upsert({ where: { requestKey: data.requestKey }, create: data, update: {} });
    res.status(204).end();
  });
}
