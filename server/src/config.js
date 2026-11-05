import 'dotenv/config';
import { resolve } from 'node:path';
import { z } from 'zod';
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
  SITE_URL: z.string().url().default('http://127.0.0.1:5173')
}).parse(process.env);
if (env.NODE_ENV === 'production' && (env.DEMO_MODE === 'true' || env.COOKIE_SECURE === 'false')) throw new Error('Production requires DEMO_MODE=false and secure cookies.');
export const config = { ...env, origins: env.CLIENT_ORIGIN.split(',').map(s => s.trim()), demo: env.DEMO_MODE === 'true', secure: env.NODE_ENV === 'production' || env.COOKIE_SECURE === 'true', uploads: resolve(env.UPLOAD_DIR) };
