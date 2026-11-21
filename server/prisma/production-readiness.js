import { createDatabase } from '../src/database.js';
import { config } from '../src/config.js';
import { storage, mediaKey } from '../src/storage.js';
import siteAssets from '../../shared/site-assets.json' with { type: 'json' };
import { variantFilename, variantWidths } from '../src/image-variants.js';
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
  await storage.check();
  const media = await db.media.findMany({ where: { status: 'PUBLISHED' }, select: { filename: true, hasVariants: true, size: true } });
  let missing = 0;
  for (const item of media) {
    const files = [item.filename, ...(item.hasVariants ? variantWidths.map(width => variantFilename(item.filename, width)) : [])];
    for (const filename of files) {
      const object = await storage.stat(mediaKey(filename));
      if (!object || (filename === item.filename && object.size !== item.size)) missing++;
    }
  }
  for (const asset of siteAssets) {
    const object = await storage.stat(`assets/images/${asset.filename}`);
    if (!object || object.size !== asset.size || (object.sha256 && object.sha256 !== asset.sha256)) missing++;
  }
  if (missing) failures.push(`${missing} MinIO objects are missing or have unexpected sizes. Run storage:migrate; see deployment/MINIO.md.`);
  const pending = await db.storageDeletion.count({ where: { notBefore: { lte: new Date() } } });
  if (pending) failures.push(`${pending} media deletion tasks are pending. Check DeleteObject permission and run storage:cleanup.`);
  if (media.length) {
    const response = await fetch(`${config.MINIO_URL.replace(/\/$/, '')}/${mediaKey(media[0].filename)}`, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    await response.body?.cancel();
    if (![403, 404].includes(response.status)) failures.push('MinIO must deny anonymous object reads (403/404). Keep the bucket private; the school API serves published photos.');
  }
  console.log(`MinIO storage: ${config.MINIO_ENDPOINT} / ${config.MINIO_BUCKET}`);
  console.log(`Content checks: ${admins} active administrator(s), ${media.length} published media files. Email: ${config.emailEnabled ? 'enabled' : 'disabled (enquiries are still saved; enable before promising email confirmations)'}.`);
  if (failures.length) { failures.forEach(message => console.error(`BLOCKER: ${message}`)); process.exitCode = 1; }
  else console.log('PASS: database content and uploaded files are ready. HTTPS, backups, server configuration and live login still require deployment verification.');
} catch { console.error('Readiness check failed. Verify the database, applied migrations and storage access.'); process.exitCode = 1; }
finally { await db.$disconnect(); }
