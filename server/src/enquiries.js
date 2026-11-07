import { config } from './config.js';
import { fail } from './auth.js';
import { consumeRate, digest, requestKey } from './idempotency.js';
import { enquiryEmails } from './email-content.js';
import { submissionMetadata, metadataExpiry } from './metadata.js';

export async function saveEnquiry(db, req) {
  const { consent: _consent, website: _website, metadataConsent, metadata, ...data } = req.validated;
  const payloadHash = digest(data);
  const key = requestKey(req, payloadHash, 'enquiry');
  const fingerprint = digest([payloadHash, new Date().toISOString().slice(0, 10)]);
  let enquiry = await db.admissionEnquiry.findUnique({ where: { requestKey: key } });
  enquiry ||= await db.admissionEnquiry.findUnique({ where: { fingerprint } });

  if (!enquiry) {
    try {
      enquiry = await db.$transaction(async tx => {
        await consumeRate(tx, ['enquiry-email', data.email], 3);
        await consumeRate(tx, ['enquiry-ip', req.ip], 5);
        await consumeRate(tx, 'all-enquiries', 100);
        const saved = await tx.admissionEnquiry.create({ data: { ...data, requestKey: key, payloadHash, fingerprint, ...(metadataConsent ? { metadata: submissionMetadata(req, metadata), metadataExpiresAt: metadataExpiry() } : {}) } });
        await tx.auditLog.create({ data: { action: 'SUBMIT', entity: 'enquiry', entityId: saved.id } });
        await tx.emailMessage.createMany({
          data: enquiryEmails(saved).map(message => ({
            ...message, dedupeKey: digest([saved.id, message.kind]), payloadHash: digest(message),
            lastError: config.emailEnabled ? null : 'Waiting for the school’s email service to be configured.',
          })),
        });
        return saved;
      });
    } catch (error) {
      if (error.code !== 'P2002') throw error;
      enquiry = await db.admissionEnquiry.findUnique({ where: { requestKey: key } });
      enquiry ||= await db.admissionEnquiry.findUnique({ where: { fingerprint } });
      if (!enquiry) throw error;
    }
  }

  if (enquiry.payloadHash !== payloadHash) throw fail(409, 'This request reference was already used for different form details.');
  return {
    id: enquiry.id,
    message: 'Your enquiry has been received. This is not an admission confirmation.',
    emailStatus: config.emailEnabled ? 'pending' : 'unavailable',
  };
}
