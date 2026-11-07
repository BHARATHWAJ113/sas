import { z } from 'zod';
import { config } from './config.js';

const short = z.string().max(120).nullable().optional();
export const metadataSchema = z.object({
  screen: z.object({ width: z.number().int().min(1).max(20000), height: z.number().int().min(1).max(20000) }).strict().optional(),
  language: short, timezone: short,
  network: z.object({ type: short, effectiveType: short, downlink: z.number().min(0).max(100000).nullable().optional(), rtt: z.number().min(0).max(100000).nullable().optional() }).strict().optional(),
  location: z.object({ permission: z.enum(['not-requested', 'granted', 'denied', 'unavailable', 'timeout']), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), accuracy: z.number().min(0).max(100000).optional() }).strict().refine(item => item.permission === 'granted' || (item.latitude === undefined && item.longitude === undefined), 'Coordinates require granted permission.').optional(),
}).strict();

export function submissionMetadata(req, supplied = {}, purpose = 'optional-enquiry-details') {
  const ua = (req.get('user-agent') || '').slice(0, 512);
  const browserName = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : null;
  const browser = browserName ? new RegExp(`${({ Edge: 'Edg', Firefox: 'Firefox', Chrome: 'Chrome', Safari: 'Version' })[browserName]}/([\\d.]+)`).exec(ua) : null;
  const os = /Windows NT ([\d.]+)|Android ([\d.]+)|(?:iPhone OS|CPU OS) ([\d_]+)|Mac OS X ([\d_]+)/.exec(ua);
  const osName = /Windows NT/.test(ua) ? 'Windows NT' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : null;
  return {
    device: { type: /iPad|Tablet/.test(ua) || /Android/.test(ua) && !/Mobile/.test(ua) ? 'tablet' : /Mobile|iPhone/.test(ua) ? 'mobile' : osName ? 'desktop' : null, os: osName, osVersion: os?.slice(1).find(Boolean)?.replaceAll('_', '.') || null, browser: browserName, browserVersion: browserName ? browser?.[1] || null : null, model: null, userAgent: ua || null, screen: supplied.screen || null, language: supplied.language || null, timezone: supplied.timezone || null },
    network: { ...supplied.network, ipAddress: req.ip || null },
    location: supplied.location || { permission: 'not-requested' },
    submittedAt: new Date().toISOString(), source: 'Visitor-reported browser data; IP from configured server/proxy. Device detection is approximate.',
    consent: { purpose, granted: true, recordedAt: new Date().toISOString() },
  };
}
export const metadataExpiry = () => new Date(Date.now() + config.VISITOR_RETENTION_DAYS * 86400000);
export async function cleanPrivateMetadata(db) {
  const now = new Date();
  await db.visitorRecord.deleteMany({ where: { expiresAt: { lt: now } } });
  // JSON null is represented with the Prisma JsonNull sentinel.
  const { Prisma } = await import('../generated/client/index.js');
  await db.admissionEnquiry.updateMany({ where: { metadataExpiresAt: { lt: now } }, data: { metadata: Prisma.DbNull, metadataExpiresAt: null } });
}
