import 'dotenv/config';
import { parseArgs } from 'node:util';
import { createDatabase } from '../src/database.js';
import { schemas } from '../src/validation.js';
import { schoolPages } from '../../shared/school-profile.js';

const { values } = parseArgs({ options: { apply: { type: 'boolean', default: false } } });
const slugs = ['about', 'library', 'laboratories', 'smart-class', 'transport', 'school-anthem', 'e-communication', 'e-magazine', 'school-chimes'];
const pages = slugs.map(slug => schemas.pages.parse(schoolPages[slug]));

console.log(`Validated ${pages.length} official school pages in English, Tamil and Hindi.`);
if (!values.apply) {
  console.log('Validation only. Repeat with --apply to update the configured database.');
} else {
  const db = createDatabase();
  try {
    await db.$transaction(async tx => {
      for (const page of pages) {
        const existing = await tx.page.findUnique({ where: { slug: page.slug }, select: { id: true } });
        const saved = existing
          ? await tx.page.update({ where: { slug: page.slug }, data: page })
          : await tx.page.create({ data: page });
        await tx.auditLog.create({ data: { action: existing ? 'OFFICIAL_PAGE_UPDATE' : 'OFFICIAL_PAGE_CREATE', entity: 'pages', entityId: saved.id } });
      }
    });
    console.log('Official school pages updated. Existing unrelated CMS pages were preserved.');
  } finally {
    await db.$disconnect();
  }
}
