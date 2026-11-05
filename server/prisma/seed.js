import 'dotenv/config';
import { createDatabase } from '../src/database.js';
import bcrypt from 'bcryptjs';
import { demoEvents, demoAnnouncements, demoPages, demoSettings } from '../src/demo.js';
import { passwordSchema } from '../src/validation.js';
import { z } from 'zod';
import { schoolPages } from '../../shared/school-profile.js';
import { schoolActivities, schoolActivityCategories } from '../../shared/school-activities.js';
const db = createDatabase();
try {
  for (const name of ['ADMIN', 'EDITOR', 'VIEWER']) await db.role.upsert({ where: { name }, update: {}, create: { name } });
  if (process.env.SEED_ADMIN_EMAIL || process.env.SEED_ADMIN_PASSWORD) {
    const email = z.string().email().parse(process.env.SEED_ADMIN_EMAIL).toLowerCase();
    const password = passwordSchema.parse(process.env.SEED_ADMIN_PASSWORD);
    const role = await db.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
    await db.user.upsert({ where: { email }, update: {}, create: { email, name: 'School administrator', passwordHash: await bcrypt.hash(password, 12), roleId: role.id } });
    console.log('Administrator ensured. Existing account passwords and roles were preserved.');
  }
  for (const [key, value] of Object.entries(demoSettings)) await db.siteSetting.upsert({ where: { key }, update: {}, create: { key, value, public: true } });
  for (const page of Object.values(schoolPages)) {
    await db.page.upsert({ where: { slug: page.slug }, update: {}, create: page });
  }
  await db.$transaction(async tx => {
    const categoryIds = new Map();
    for (const category of schoolActivityCategories) {
      const { id } = await tx.activityCategory.upsert({
        where: { slug: category.slug }, update: {}, create: { ...category, status: 'PUBLISHED' },
      });
      categoryIds.set(category.slug, id);
    }
    for (const { categorySlug, ...activity } of schoolActivities) {
      await tx.activity.upsert({
        where: { slug: activity.slug }, update: {},
        create: { ...activity, categoryId: categoryIds.get(categorySlug), status: 'PUBLISHED' },
      });
    }
  });
  if (process.env.SEED_DEMO === 'true') {
    for (const event of demoEvents) {
      const { id: _id, images: _images, attachment: _attachment, ...data } = event;
      await db.event.upsert({ where: { slug: data.slug }, update: {}, create: data });
    }
    for (const item of demoAnnouncements) { const { id: _id, ...data } = item; await db.announcement.upsert({ where: { slug: data.slug }, update: {}, create: data }); }
    for (const page of demoPages) await db.page.upsert({ where: { slug: page.slug }, update: {}, create: page });
    await db.gallery.upsert({ where: { slug: 'demo-school-life' }, update: {}, create: { slug: 'demo-school-life', title: 'Demo gallery · Add school-approved photographs', titleTa: 'மாதிரி படத்தொகுப்பு · அங்கீகரிக்கப்பட்ட படங்களைச் சேர்க்கவும்', summary: 'Demo album. Upload approved images in the CMS.', summaryTa: 'மாதிரித் தொகுப்பு. நிர்வாகப் பகுதியில் படங்களைப் பதிவேற்றவும்.', status: 'PUBLISHED', isDemo: true } });
    console.log('Labeled demo content ensured; existing edits preserved.');
  }
  console.log('Seed complete. No default credentials were created.');
} catch (error) { console.error(error instanceof z.ZodError ? 'Seed rejected: supply a valid administrator email and password of 12+ characters (max 72 UTF-8 bytes).' : 'Seed failed. Check the MySQL connection and apply migrations first.'); process.exitCode = 1; }
finally { await db.$disconnect(); }
