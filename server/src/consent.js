import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { config } from './config.js';
import { hashToken } from './auth.js';
import { parse } from './validation.js';

const cookieName = 'school_consent';
const lifetime = 180 * 86400000;
const cookie = { httpOnly: true, secure: config.secure, sameSite: 'strict', path: '/api', maxAge: lifetime };
const publicConsent = item => ({
  choice: item.choice, maps: item.maps ?? item.choice === 'ACCEPTED', analytics: item.analytics ?? false, version: item.version, timestamp: item.updatedAt, expiresAt: item.expiresAt,
});

export function mountConsent(app, db, databaseOnly, demo) {
  app.get('/api/consent', async (req, res) => {
    const raw = req.cookies[cookieName];
    if (demo || !raw || !/^[a-f0-9]{64}$/.test(raw)) return res.json({ choice: null, version: config.CONSENT_VERSION });
    const item = await db.cookieConsent.findUnique({ where: { id: hashToken(raw) } });
    if (!item || item.expiresAt <= new Date() || item.version !== config.CONSENT_VERSION) {
      return res.json({ choice: null, version: config.CONSENT_VERSION });
    }
    res.json(publicConsent(item));
  });

  app.post('/api/consent', databaseOnly, rateLimit({
    windowMs: 3600000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many preference changes. Please try again later.' },
  }), parse(z.object({ action: z.enum(['accept', 'reject', 'withdraw', 'customize']), maps: z.boolean().optional(), analytics: z.boolean().optional() }).strict()), async (req, res) => {
    const existing = req.cookies[cookieName];
    const raw = existing && /^[a-f0-9]{64}$/.test(existing) ? existing : randomBytes(32).toString('hex');
    const maps = req.validated.action === 'accept' || req.validated.action === 'customize' && !!req.validated.maps;
    const analytics = req.validated.action === 'accept' || req.validated.action === 'customize' && !!req.validated.analytics;
    const choice = maps || analytics ? 'ACCEPTED' : 'REJECTED';
    const data = { choice, maps, analytics, version: config.CONSENT_VERSION, expiresAt: new Date(Date.now() + lifetime) };
    const event = { action: req.validated.action, choice, maps, analytics, version: config.CONSENT_VERSION };
    const item = await db.cookieConsent.upsert({
      where: { id: hashToken(raw) },
      create: { id: hashToken(raw), ...data, events: { create: event } },
      update: { ...data, events: { create: event } },
    });
    res.cookie(cookieName, raw, cookie).json(publicConsent(item));
  });
}
