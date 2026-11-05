import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { config } from './config.js';
import { loginSchema, parse } from './validation.js';
export const hashToken = value => createHash('sha256').update(value).digest('hex');
export const fail = (status, message) => Object.assign(new Error(message), { status });
export const safeUser = user => ({ id: user.id, name: user.name, email: user.email, roleId: user.roleId, role: user.role.name, active: user.active });
const cookie = { httpOnly: true, secure: config.secure, sameSite: 'strict', path: '/api' };
const dummyHash = bcrypt.hashSync('constant-time-nonexistent-account', 12);
export function authMiddleware(db) {
  return async (req, _res, next) => {
    const raw = req.cookies.school_session;
    if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return next(fail(401, 'Please sign in to continue.'));
    const session = await db.session.findUnique({ where: { id: hashToken(raw) }, include: { user: { include: { role: true } } } });
    if (!session || session.expiresAt <= new Date() || !session.user.active) return next(fail(401, 'Your session has expired. Please sign in again.'));
    req.session = session;
    req.user = session.user;
    next();
  };
}
export const allow = (...roles) => (req, _res, next) => roles.includes(req.user?.role.name) ? next() : next(fail(403, 'Your role does not have permission for this action.'));
export function csrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const token = req.get('x-csrf-token') || '';
  const expected = req.session?.csrfToken || '';
  if (!expected || !/^[a-f0-9]{64}$/.test(token) || token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return next(fail(403, 'Security token expired. Refresh the page and try again.'));
  next();
}
export function originGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!config.origins.includes(req.get('origin'))) return next(fail(403, 'Request origin is not allowed.'));
  next();
}
export function mountAuth(app, db, databaseOnly) {
  const auth = authMiddleware(db);
  app.post('/api/auth/login', databaseOnly, rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' } }), parse(loginSchema), async (req, res) => {
    const user = await db.user.findUnique({ where: { email: req.validated.email }, include: { role: true } });
    const valid = await bcrypt.compare(req.validated.password, user?.passwordHash || dummyHash);
    if (!valid || !user?.active) throw fail(401, 'Email or password is incorrect.');
    const token = randomBytes(32).toString('hex');
    const csrfToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.SESSION_DAYS * 86400000);
    await db.$transaction(async tx => {
      await tx.session.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { userId: user.id }] } });
      await tx.session.create({ data: { id: hashToken(token), userId: user.id, csrfToken, expiresAt } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'LOGIN', entity: 'session' } });
    });
    res.cookie('school_session', token, { ...cookie, maxAge: config.SESSION_DAYS * 86400000 }).json({ user: safeUser(user), csrfToken });
  });
  app.get('/api/auth/me', databaseOnly, auth, (req, res) => res.json({ user: safeUser(req.user), csrfToken: req.session.csrfToken }));
  app.post('/api/auth/logout', databaseOnly, auth, csrf, async (req, res) => {
    await db.$transaction(async tx => {
      await tx.session.delete({ where: { id: req.session.id } });
      await tx.auditLog.create({ data: { userId: req.user.id, action: 'LOGOUT', entity: 'session' } });
    });
    res.clearCookie('school_session', cookie).status(204).end();
  });
  return auth;
}
