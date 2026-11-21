import { createDatabase } from '../src/database.js';
import { cleanStorage } from '../src/storage-cleanup.js';
const db = createDatabase();
try {
  const result = await cleanStorage(db);
  console.log('MinIO deletion queue:', result);
  if (result.failed) process.exitCode = 1;
} catch { console.error('Cleanup failed. Check migrations, database and MinIO credentials.'); process.exitCode = 1; }
finally { await db.$disconnect(); }
