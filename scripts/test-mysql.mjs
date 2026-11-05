import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
if (!process.env.TEST_DATABASE_URL?.startsWith('mysql://')) {
  console.error('Set TEST_DATABASE_URL to a dedicated migrated MySQL test database before running this test. No database will be reset.');
  process.exit(1);
}
const child = spawn(process.execPath, [resolve('node_modules/vitest/vitest.mjs'), 'run', 'server/tests/mysql.integration.test.js'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test', MYSQL_INTEGRATION: 'true', UPLOAD_DIR: resolve('artifacts/integration-uploads') } });
child.on('error', () => { console.error('Could not start Vitest. Run npm ci first.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
