import { z } from 'zod';
import { schoolResources, standards } from '../../shared/school-sections.js';
const text = n => z.string().trim().min(1).max(n);
const optional = n => z.string().trim().max(n).default('');
const year = z.string().regex(/^\d{4}(-\d{2})?$/, 'Use a year (2026) or academic year (2026-27).');
const common = { status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']), sortOrder: z.number().int().min(0).max(9999).default(0), sourceRef: z.string().max(500).nullable().optional() };
const person = { name: text(120), nameTa: optional(160), imageId: text(191).nullable().optional() };
const description = { description: optional(5000), descriptionTa: optional(5000) };
const standard = z.enum(standards);
const score = z.number().min(0).max(999999).nullable().optional();
export const schoolSchemas = {
  fees: z.object({ ...common, title: text(255), titleTa: optional(255), standard, academicYear: year, category: text(120), amount: z.number().min(0).max(99999999.99).multipleOf(0.01), frequency: text(80), installments: z.number().int().min(1).max(12) }).strict(),
  honours: z.object({ ...common, ...person, ...description, title: text(255), titleTa: optional(255), standard, academicYear: year, category: text(120) }).strict(),
  staff: z.object({ ...common, ...person, ...description, designation: text(160), designationTa: optional(200), department: text(120), category: text(120) }).strict(),
  toppers: z.object({ ...common, ...person, standard, academicYear: year, category: text(120), marks: score, maximumMarks: z.number().positive().max(999999).nullable().optional(), percentage: z.number().min(0).max(100).nullable().optional(), rank: z.number().int().min(1).max(9999).nullable().optional() }).strict()
    .refine(v => v.marks == null || v.maximumMarks == null || v.marks <= v.maximumMarks, { message: 'Marks cannot exceed maximum marks.', path: ['marks'] })
    .refine(v => v.marks == null || v.maximumMarks == null || v.percentage == null || Math.abs(v.percentage - v.marks / v.maximumMarks * 100) <= 0.011, { message: 'Percentage must agree with marks.', path: ['percentage'] }),
};
const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(100).default(''), standard: z.enum(['', ...standards]).default(''),
  academicYear: z.string().max(9).default(''), category: z.string().max(120).default(''), department: z.string().max(120).default(''),
});
export function mountSchoolSections(app, db, databaseOnly) {
  for (const [resource, model] of Object.entries(schoolResources)) app.get(`/api/${resource}`, databaseOnly, async (req, res) => {
    const q = querySchema.parse(req.query);
    const filterKeys = resource === 'staff' ? ['department', 'category'] : ['academicYear', 'standard', 'category'];
    const where = { status: 'PUBLISHED', ...Object.fromEntries(filterKeys.filter(k => q[k]).map(k => [k, q[k]])),
      ...(q.search ? { OR: (resource === 'fees' ? ['title', 'category'] : ['name', 'nameTa']).map(k => ({ [k]: { contains: q.search } })) } : {}) };
    const filters = Object.fromEntries(await Promise.all(filterKeys.map(async key => [key, (await db[model].groupBy({ by: [key], where: { status: 'PUBLISHED' }, orderBy: { [key]: key === 'academicYear' ? 'desc' : 'asc' } })).map(row => row[key])])));
    // Fees use a complete schedule rather than a paginated subtotal.
    if (resource === 'fees' && (!q.standard || !q.academicYear)) return res.json({ items: [], total: 0, pages: 0, page: 1, filters, annualTotal: null });
    const [items, total] = await Promise.all([
      db[model].findMany({ where, omit: { sourceRef: true }, ...(resource === 'fees' ? {} : { include: { image: { select: { id: true, alt: true, altTa: true, status: true, hasVariants: true } } }, take: q.limit, skip: (q.page - 1) * q.limit }), orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
      db[model].count({ where }),
    ]);
    for (const item of items) if (resource !== 'fees' && item.image?.status !== 'PUBLISHED') { delete item.imageId; item.image = null; }
    res.json({ items, total, page: q.page, pages: resource === 'fees' ? Number(total > 0) : Math.ceil(total / q.limit), filters,
      ...(resource === 'fees' ? { annualTotal: items.reduce((cents, row) => cents + Math.round(Number(row.amount) * 100) * row.installments, 0) / 100 } : {}) });
  });
}
