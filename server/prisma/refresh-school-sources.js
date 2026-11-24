import { z } from 'zod';
import { schoolResources } from '../../shared/school-sections.js';

const identity = { name: z.string().min(1).max(120), sourceRef: z.string().min(1).max(500) };
export const sourceUpdateSchema = z.discriminatedUnion('resource', [
  z.object({ resource: z.literal('staff'), id: z.string().regex(/^school-staff-\d+$/),
    expected: z.object({ ...identity, imageId: z.null() }).strict(),
    data: z.object({ imageId: z.string().regex(/^school-photo-[a-f0-9]{32}$/) }).strict(), evidence: z.string().min(1).max(500) }).strict(),
  z.object({ resource: z.literal('toppers'), id: z.string().regex(/^school-topper-[a-f0-9]{32}$/),
    expected: z.object({ ...identity, academicYear: z.string(), standard: z.string(), marks: z.number(), maximumMarks: z.number(), rank: z.null() }).strict(),
    data: z.object({ rank: z.number().int().min(1).max(9999), sourceRef: z.string().min(1).max(500) }).strict(), evidence: z.string().min(1).max(500) }).strict(),
]);
const agrees = (record, values) => Object.entries(values).every(([key, value]) =>
  typeof value === 'number' ? Number(record[key]) === value : record[key] === value);

// Narrow, opt-in enrichment of records imported before the new source material.
// Never replace a school's portrait, rank, translation, publication state or name.
export async function refreshSchoolSources(db, updates) {
  const validated = updates.map(update => sourceUpdateSchema.parse(update));
  const result = { updated: 0, unchanged: 0, skipped: [] };
  for (const patch of validated) {
    const outcome = await db.$transaction(async tx => {
      const model = tx[schoolResources[patch.resource]];
      const existing = await model.findUnique({ where: { id: patch.id } });
      if (!existing) return 'Record missing';
      if (agrees(existing, patch.data)) return 'unchanged';
      if (!agrees(existing, patch.expected)) return 'Source identity or original values changed';
      const edited = await tx.auditLog.findFirst({ where: { entity: patch.resource, entityId: patch.id, action: 'UPDATE' } });
      if (edited) return 'Preserved CMS edit; review manually';
      if (patch.resource === 'staff') {
        const media = await tx.media.findUnique({ where: { id: patch.data.imageId } });
        if (!media || media.status !== 'PUBLISHED' || !media.mimeType.startsWith('image/')) return 'Published source photo unavailable';
      }
      const changed = await model.updateMany({ where: { id: patch.id, updatedAt: existing.updatedAt, ...patch.expected }, data: patch.data });
      if (!changed.count) return 'Concurrent edit; preserved newer record';
      await tx.auditLog.create({ data: { action: 'SOURCE_ENRICH', entity: patch.resource, entityId: patch.id } });
      return 'updated';
    });
    if (outcome === 'updated' || outcome === 'unchanged') result[outcome]++;
    else result.skipped.push({ id: patch.id, reason: outcome });
  }
  return result;
}
