import 'dotenv/config';
import { resolve } from 'node:path';
import { z } from 'zod';
import { parseAdminRecipients } from './email-addresses.js';
const env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().default('mysql://school:unconfigured@127.0.0.1:3306/st_antonys'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  SESSION_DAYS: z.coerce.number().min(0.01).max(7).default(1),
  TRUST_PROXY: z.coerce.number().int().min(0).max(2).default(0),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  DEMO_MODE: z.enum(['true', 'false']).default('false'),
  UPLOAD_DIR: z.string().default('./uploads'),
  SITE_URL: z.string().url().default('http://127.0.0.1:5173'),
  EMAIL_ENABLED: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_APP_PASSWORD: z.string().default(''),
  SMTP_PORT: z.coerce.number().pipe(z.union([z.literal(465), z.literal(587)])).default(465),
  SMTP_FROM_NAME: z.string().trim().min(1).max(120).default('St. Antony’s School'),
  SMTP_NOTIFY_TO: z.string().default(''),
  ADMIN_NOTIFICATION_EMAILS: z.string().default(''),
  VISITOR_RETENTION_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  EMAIL_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(8).default(4),
  EMAIL_POLL_MS: z.coerce.number().int().min(1000).max(60000).default(5000),
  CONSENT_VERSION: z.string().min(1).max(40).default('2026-11-08')
}).parse(process.env);
if (env.NODE_ENV === 'production' && (env.DEMO_MODE === 'true' || env.COOKIE_SECURE === 'false')) throw new Error('Production requires DEMO_MODE=false and secure cookies.');
const admins = parseAdminRecipients(env.ADMIN_NOTIFICATION_EMAILS || env.SMTP_NOTIFY_TO);
if (env.EMAIL_ENABLED === 'true' && (!z.email().safeParse(env.SMTP_USER).success || !admins.length || !env.SMTP_APP_PASSWORD.trim())) {
  throw new Error('Enabled email requires SMTP_USER, SMTP_APP_PASSWORD and ADMIN_NOTIFICATION_EMAILS (or SMTP_NOTIFY_TO) in the server environment.');
}
export const config = { ...env, emailEnabled: env.EMAIL_ENABLED === 'true', origins: env.CLIENT_ORIGIN.split(',').map(s => s.trim()), demo: env.DEMO_MODE === 'true', secure: env.NODE_ENV === 'production' || env.COOKIE_SECURE === 'true', uploads: resolve(env.UPLOAD_DIR) };
