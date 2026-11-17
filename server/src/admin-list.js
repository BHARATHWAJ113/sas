import { z } from 'zod';
import { fail } from './auth.js';
import { recordFields } from '../../shared/record-fields.js';
export function adminList(resource, input) {
  const fields = recordFields[resource];
  const dateField = ['translations', 'settings'].includes(resource) ? 'updatedAt' : 'createdAt';
  const query = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(200).default(20), search: z.string().trim().max(100).default(''), column: z.enum(fields).optional(), from: z.iso.date().optional(), to: z.iso.date().optional(), status: z.string().max(30).optional(), sort: z.enum([dateField, ...fields]).default(dateField), direction: z.enum(['asc', 'desc']).default('desc') }).parse(input);
  if (query.from && query.to && query.from > query.to) throw fail(422, 'The end date must follow the start date.');
  const statuses = resource === 'enquiries' ? ['NEW', 'CONTACTED', 'CLOSED'] : resource === 'emails' ? ['PENDING', 'SENDING', 'SENT', 'FAILED', 'PARTIAL', 'UNKNOWN'] : ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
  if (query.status && (!statuses.includes(query.status) || ['users', 'settings', 'audit-logs'].includes(resource))) throw fail(422, 'Invalid status filter.');
  const where = {
    ...(query.search ? { OR: (query.column ? [query.column] : fields).map(key => resource === 'announcements' && key === 'kind' ? ['ANNOUNCEMENT', 'NOTICE', 'NEWS'].includes(query.search.toUpperCase()) ? { kind: query.search.toUpperCase() } : { id: '__no_matching_kind__' } : { [key]: { contains: query.search } }) } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...((query.from || query.to) ? { [dateField]: { ...(query.from && { gte: new Date(`${query.from}T00:00:00+05:30`) }), ...(query.to && { lte: new Date(`${query.to}T23:59:59.999+05:30`) }) } } : {}),
  };
  return { query, where, take: query.limit, skip: (query.page - 1) * query.limit, orderBy: [{ [query.sort]: query.direction }, { id: query.direction }] };
}
export const listEnvelope = (items, total, query) => ({ items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) });
