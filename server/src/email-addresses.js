import { z } from 'zod';
export function parseAdminRecipients(value) {
  const items = [...new Set(value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean))];
  return z.array(z.email().max(191)).max(20).parse(items);
}
