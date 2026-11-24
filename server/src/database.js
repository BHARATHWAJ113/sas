import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/client/index.js';
export function databaseOptions(connection, env = process.env) {
  const url = new URL(connection);
  if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql://.');
  const publicKey = env.DATABASE_RSA_PUBLIC_KEY ? readFileSync(env.DATABASE_RSA_PUBLIC_KEY, 'utf8') : null;
  return { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)), connectionLimit: 5, connectTimeout: 5000, acquireTimeout: 5000,
    ...(publicKey ? { cachingRsaPublicKey: publicKey, rsaPublicKey: publicKey } : {}),
    ...(env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: true, ...(env.DATABASE_SSL_CA ? { ca: readFileSync(env.DATABASE_SSL_CA, 'utf8') } : {}) } } : {}) };
}
export function createDatabase(connection = process.env.DATABASE_URL || 'mysql://school:unconfigured@127.0.0.1:3306/st_antonys') {
  const adapter = new PrismaMariaDb(databaseOptions(connection));
  return new PrismaClient({ adapter });
}
