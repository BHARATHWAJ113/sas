import 'dotenv/config';
import { parseArgs } from 'node:util';
import { createDatabase } from '../src/database.js';
import { schemas } from '../src/validation.js';
import { schoolPages } from '../../shared/school-profile.js';

const { values } = parseArgs({ options: { apply: { type: 'boolean', default: false } } });
const history = schemas.pages.parse(schoolPages.about);

console.log(`Validated “${history.title}”: ${history.body.split('\n\n').length} English paragraphs with Tamil and Hindi versions.`);
if (!values.apply) {
  console.log('Validation only. Repeat with --apply to update the configured database.');
} else {
  const db = createDatabase();
  try {
    await db.$transaction(async tx => {
      const existing = await tx.page.findUnique({ where: { slug: history.slug }, select: { id: true } });
      const page = existing
        ? await tx.page.update({ where: { slug: history.slug }, data: history })
        : await tx.page.create({ data: history });
      await tx.auditLog.create({ data: { action: existing ? 'OFFICIAL_HISTORY_UPDATE' : 'OFFICIAL_HISTORY_CREATE', entity: 'pages', entityId: page.id } });
    });
    console.log('Official school history updated in English, Tamil and Hindi.');
  } finally {
    await db.$disconnect();
  }
}
