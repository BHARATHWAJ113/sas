import { createDatabase } from './database.js';
import { createApp } from './app.js';
import { config } from './config.js';
const db = createDatabase(config.DATABASE_URL);
const server = createApp(db).listen(config.PORT, '127.0.0.1', () => console.log(`School API: http://127.0.0.1:${config.PORT}${config.demo ? ' (READ-ONLY DEMO; MySQL writes disabled)' : ''}`));
async function stop() { server.close(async () => { await db.$disconnect(); process.exit(0); }); setTimeout(() => process.exit(1), 10000).unref(); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
