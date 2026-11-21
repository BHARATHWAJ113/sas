import { z } from 'zod';
import { activityIcons } from '../../shared/school-activities.js';
import { metadataSchema } from './metadata.js';
import { schoolSchemas } from './school-sections.js';
import { socialPlatforms, validSocialUrl } from '../../shared/social-links.js';
const text = (n = 255) => z.string().trim().min(1).max(n);
const optionalText = (n) => z.string().trim().max(n).nullable().optional();
const status = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);
const date = z.string().datetime({ offset: true });
const bilingual = { title: text(), titleTa: text(), summary: text(2000), summaryTa: text(2000) };
const body = { body: text(50000), bodyTa: text(50000) };
const seo = { seoTitle: optionalText(255), seoDescription: optionalText(500) };
const sortOrder = z.number().int().min(0).max(9999).default(0);
export const eventSchema = z.object({ ...bilingual, ...body, ...seo, slug, category: text(80), categoryTa: text(120), date, endDate: date.nullable().optional(), location: text(), locationTa: text(), cover: z.string().regex(/^\/(?:images\/[a-z0-9-]+\.(?:webp|jpg|png)|api\/media\/[a-zA-Z0-9_-]+)$/).nullable().optional(), attachmentId: text(191).nullable().optional(), imageIds: z.array(text(191)).max(30).default([]), status, isDemo: z.boolean().default(false) }).strict().refine(v => !v.endDate || new Date(v.endDate) >= new Date(v.date), { message: 'End date must follow the start date.', path: ['endDate'] });
export const schemas = {
  ...schoolSchemas,
  pages: z.object({ ...bilingual, ...body, ...seo, slug, status, isDemo: z.boolean().default(false) }).strict(),
  events: eventSchema,
  activities: z.object({ ...bilingual, slug, categoryId: text(191), imageId: text(191).nullable().optional(), sortOrder, status, isDemo: z.boolean().default(false) }).strict(),
  'activity-categories': z.object({ slug: slug.max(80), title: text(120), titleTa: text(160), icon: z.enum(activityIcons), sortOrder, status }).strict(),
  announcements: z.object({ ...bilingual, ...body, slug, kind: z.enum(['ANNOUNCEMENT', 'NOTICE', 'NEWS']), status, isDemo: z.boolean().default(false), publishedAt: date, expiresAt: date.nullable().optional(), showPopup: z.boolean().default(false), priority: z.number().int().min(0).max(9999).default(0), announcementType: z.enum(['NOTICE', 'ADMISSION', 'FESTIVAL', 'HOLIDAY', 'EVENT', 'MESSAGE']).default('NOTICE'), imageId: text(191).nullable().optional(), footerMessage: optionalText(500), footerMessageTa: optionalText(500), wishes: optionalText(2000), wishesTa: optionalText(2000), ctaLabel: optionalText(80), ctaLabelTa: optionalText(120), ctaPath: z.string().regex(/^\/(?!\/)[a-zA-Z0-9/_?#=&%-]*$/).max(255).nullable().optional() }).strict().refine(item => !item.expiresAt || new Date(item.expiresAt) > new Date(item.publishedAt), { message: 'End date must follow the start date.', path: ['expiresAt'] }).refine(item => !item.ctaPath || !!item.ctaLabel, { message: 'Add an English button label.', path: ['ctaLabel'] }),
  galleries: z.object({ ...bilingual, slug, status, isDemo: z.boolean().default(false), imageIds: z.array(text(191)).max(100).default([]) }).strict(),
  translations: z.object({ key: text(191), locale: z.enum(['en', 'ta']), value: text(10000), status }).strict(),
  settings: z.object({ key: z.enum(['phone', 'email', 'principal', 'admissionDates', 'officeHours', 'seoTitle', 'seoDescription', ...socialPlatforms.map(item => item.key)]), value: text(2000), public: z.boolean() }).strict().refine(item => !socialPlatforms.some(platform => platform.key === item.key) || validSocialUrl(item.key, item.value), { path: ['value'], message: 'Use an HTTPS profile URL on the selected social platform.' }),
  media: z.object({ alt: text(), altTa: text(), status, description: z.string().max(5000).default(''), descriptionTa: z.string().max(5000).default(''), eventDate: date.nullable().optional() }).strict()
};
export const enquirySchema = z.object({ parentName: text(120), studentName: text(120), email: z.string().trim().email().max(191).transform(value => value.toLowerCase()), phone: z.string().trim().regex(/^(?:\+91[ -]?)?[6-9]\d{9}$/, 'Use a valid Indian mobile number.'), grade: z.enum(['LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => String(i + 1))]), message: z.string().trim().max(3000).default(''), locale: z.enum(['en', 'ta']).default('en'), consent: z.literal(true), website: z.string().max(0).optional(), metadataConsent: z.boolean().default(false), metadata: metadataSchema.optional() }).strict().refine(item => item.metadataConsent || !item.metadata, { message: 'Optional details require your permission.', path: ['metadataConsent'] });
export const passwordSchema = z.string().min(12).max(72).refine(v => Buffer.byteLength(v, 'utf8') <= 72, 'Password must use no more than 72 UTF-8 bytes.');
export const userSchema = z.object({ name: text(120), email: z.string().trim().email().max(191).transform(s => s.toLowerCase()), roleId: text(191), active: z.boolean(), password: passwordSchema.optional() }).strict();
export const loginSchema = z.object({ email: z.string().trim().email().max(191).transform(s => s.toLowerCase()), password: z.string().min(1).max(200) }).strict();
export const listQuery = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(50).default(9), search: z.string().trim().max(100).default(''), category: z.string().max(80).default(''), period: z.enum(['all', 'upcoming', 'past']).default('all') });
export const parse = schema => (req, _res, next) => { req.validated = schema.parse(req.body); next(); };
