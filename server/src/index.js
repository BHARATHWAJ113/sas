import { createDatabase } from './database.js';
import { createApp } from './app.js';
import { config } from './config.js';
import { emailWorker, gmailTransport } from './email-worker.js';
import { cleanPrivateMetadata } from './metadata.js';
import { cleanStorage } from './storage-cleanup.js';
import { minioOptions } from './storage.js';
if (!config.demo) minioOptions(config);
const db = createDatabase(config.DATABASE_URL);
const worker = config.emailEnabled && !config.demo ? emailWorker(db, gmailTransport()) : null;
worker?.start();
const clean = () => cleanPrivateMetadata(db).catch(() => console.error(JSON.stringify({ event: 'privacy.cleanup_unavailable' })));
if (!config.demo) clean();
const retentionTimer = !config.demo ? setInterval(clean, 3600000) : null;
retentionTimer?.unref();
let cleaning = false;
const cleanImages = async () => {
  if (cleaning) return;
  cleaning = true;
  try { const result = await cleanStorage(db); if (result.failed) console.error('MinIO cleanup pending; will retry.'); }
  catch { console.error('MinIO cleanup unavailable; will retry.'); }
  finally { cleaning = false; }
};
if (!config.demo) cleanImages();
const storageTimer = !config.demo ? setInterval(cleanImages, 60000) : null;
storageTimer?.unref();
const server = createApp(db).listen(config.PORT, '127.0.0.1', () => console.log(`School API: http://127.0.0.1:${config.PORT}${config.demo ? ' (READ-ONLY DEMO; MySQL writes disabled)' : ''}`));
async function stop() {
  clearInterval(retentionTimer);
  clearInterval(storageTimer);
  server.close(async () => { await worker?.stop(); await db.$disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 65000).unref();
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
