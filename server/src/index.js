import { createDatabase } from './database.js';
import { createApp } from './app.js';
import { config } from './config.js';
import { emailWorker, gmailTransport } from './email-worker.js';
import { cleanPrivateMetadata } from './metadata.js';
const db = createDatabase(config.DATABASE_URL);
const worker = config.emailEnabled && !config.demo ? emailWorker(db, gmailTransport()) : null;
worker?.start();
const clean = () => cleanPrivateMetadata(db).catch(() => console.error(JSON.stringify({ event: 'privacy.cleanup_unavailable' })));
if (!config.demo) clean();
const retentionTimer = !config.demo ? setInterval(clean, 3600000) : null;
retentionTimer?.unref();
const server = createApp(db).listen(config.PORT, '127.0.0.1', () => console.log(`School API: http://127.0.0.1:${config.PORT}${config.demo ? ' (READ-ONLY DEMO; MySQL writes disabled)' : ''}`));
async function stop() {
  clearInterval(retentionTimer);
  server.close(async () => { await worker?.stop(); await db.$disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 65000).unref();
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
