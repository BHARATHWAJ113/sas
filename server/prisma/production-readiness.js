import { createDatabase } from '../src/database.js';
import { config } from '../src/config.js';
import { access, constants } from 'node:fs/promises';
const db = createDatabase();
const archive = process.argv.includes('--archive-demo');
try {
  if (archive) {
    await db.$transaction(async tx => {
      for (const model of ['event', 'page', 'announcement', 'gallery', 'activity']) {
        const result = await tx[model].updateMany({ where: { isDemo: true, status: 'PUBLISHED' }, data: { status: 'ARCHIVED' } });
        if (result.count) await tx.auditLog.create({ data: { action: 'PRODUCTION_ARCHIVE_DEMO', entity: model } });
        console.log(`Archived ${result.count} labelled sample ${model} records.`);
      }
    });
  }
  const failures = [];
  const admins = await db.user.count({ where: { active: true, role: { name: 'ADMIN' } } });
  if (!admins) failures.push('Create an active administrator before launch.');
  for (const model of ['event', 'page', 'announcement', 'gallery', 'activity']) {
    const count = await db[model].count({ where: { isDemo: true, status: 'PUBLISHED' } });
    if (count) failures.push(`${count} published sample ${model} records remain. Review in CMS, or explicitly run with --archive-demo.`);
  }
  try { await access(config.uploads, constants.R_OK | constants.W_OK); } catch { failures.push('The configured uploads directory must be readable and writable.'); }
  const media = await db.media.findMany({ where: { status: 'PUBLISHED' }, select: { filename: true } });
  let missing = 0;
  for (const item of media) { try { await access(`${config.uploads}/${item.filename}`, constants.R_OK); } catch { missing++; } }
  if (missing) failures.push(`${missing} published media files are missing from storage.`);
  console.log(`Content checks: ${admins} active administrator(s), ${media.length} published media files. Email: ${config.emailEnabled ? 'enabled' : 'disabled (enquiries are still saved; enable before promising email confirmations)'}.`);
  if (failures.length) { failures.forEach(message => console.error(`BLOCKER: ${message}`)); process.exitCode = 1; }
  else console.log('PASS: database content and uploaded files are ready. HTTPS, backups, server configuration and live login still require deployment verification.');
} catch { console.error('Readiness check failed. Verify the database, applied migrations and storage access.'); process.exitCode = 1; }
finally { await db.$disconnect(); }
