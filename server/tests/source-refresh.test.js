import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { refreshSchoolSources, sourceUpdateSchema } from '../prisma/refresh-school-sources.js';

const updates = JSON.parse(readFileSync(new URL('../../assets/optimized-school/source-updates.json', import.meta.url), 'utf8'));
const portrait = updates.find(row => row.resource === 'staff');
const rank = updates.find(row => row.resource === 'toppers');
function fixture(patch = portrait, overrides = {}) {
  const record = { id: patch.id, ...patch.expected, updatedAt: new Date(), ...overrides };
  const model = { findUnique: vi.fn().mockResolvedValue(record), updateMany: vi.fn().mockResolvedValue({ count: 1 }) };
  const db = { staffMember: model, topper: model,
    media: { findUnique: vi.fn().mockResolvedValue({ status: 'PUBLISHED', mimeType: 'image/webp' }) },
    auditLog: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() } };
  db.$transaction = callback => callback(db);
  return { db, model, record };
}
describe('safe source enrichment', () => {
  it('validates the reviewed batch and rejects extra mutation fields', () => {
    expect(updates).toHaveLength(56);
    for (const patch of updates) expect(sourceUpdateSchema.safeParse(patch).success).toBe(true);
    expect(sourceUpdateSchema.safeParse({ ...portrait, data: { ...portrait.data, status: 'PUBLISHED' } }).success).toBe(false);
  });
  it.each([portrait, rank])('fills only the approved fields for $resource and audits the change', async patch => {
    const { db, model, record } = fixture(patch);
    expect((await refreshSchoolSources(db, [patch])).updated).toBe(1);
    expect(model.updateMany).toHaveBeenCalledWith({ where: { id: patch.id, updatedAt: record.updatedAt, ...patch.expected }, data: patch.data });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: { action: 'SOURCE_ENRICH', entity: patch.resource, entityId: patch.id } });
  });
  it('is idempotent when a refresh or fresh import already applied the source', async () => {
    const { db, model } = fixture(portrait, portrait.data);
    expect((await refreshSchoolSources(db, [portrait])).unchanged).toBe(1);
    expect(model.updateMany).not.toHaveBeenCalled();
  });
  it.each([{ imageId: 'school-selected-photo' }, { name: 'Edited name' }, { sourceRef: 'Different source' }])('preserves changed source data %j', async values => {
    const { db, model } = fixture(portrait, values);
    expect((await refreshSchoolSources(db, [portrait])).skipped).toHaveLength(1);
    expect(model.updateMany).not.toHaveBeenCalled();
  });
  it('does not restore a portrait deliberately removed in the CMS', async () => {
    const { db, model } = fixture();
    db.auditLog.findFirst.mockResolvedValue({ action: 'UPDATE' });
    expect((await refreshSchoolSources(db, [portrait])).skipped[0].reason).toContain('CMS edit');
    expect(model.updateMany).not.toHaveBeenCalled();
  });
  it('does not attach a draft source portrait', async () => {
    const { db, model } = fixture();
    db.media.findUnique.mockResolvedValue({ status: 'DRAFT', mimeType: 'image/webp' });
    expect((await refreshSchoolSources(db, [portrait])).skipped).toHaveLength(1);
    expect(model.updateMany).not.toHaveBeenCalled();
  });
  it('preserves a concurrent change without falsely logging success', async () => {
    const { db, model } = fixture();
    model.updateMany.mockResolvedValue({ count: 0 });
    const result = await refreshSchoolSources(db, [portrait]);
    expect(result.updated).toBe(0);
    expect(result.skipped[0].reason).toContain('Concurrent');
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
});
