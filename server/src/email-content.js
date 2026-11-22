import sanitizeHtml from 'sanitize-html';
import { convert } from 'html-to-text';
import { z } from 'zod';
import { config } from './config.js';
import { parseAdminRecipients } from './email-addresses.js';

export const emailAddress = z.string().trim().email().max(191).transform(value => value.toLowerCase());
export const composeEmailSchema = z.object({
  to: emailAddress,
  cc: z.array(emailAddress).max(5).default([]),
  bcc: z.array(emailAddress).max(5).default([]),
  attachmentId: z.string().min(1).max(191).nullable().optional(),
  subject: z.string().trim().min(1).max(160).regex(/^[^\p{Cc}]+$/u, 'Use a single-line subject.'),
  html: z.string().min(1).max(50000),
}).strict().refine(value => new Set([value.to, ...value.cc, ...value.bcc]).size === value.cc.length + value.bcc.length + 1, {
  message: 'Each recipient must appear once.', path: ['cc'],
});

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function cleanEmail(html) {
  const clean = sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'a', 'hr'],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
  });
  const text = convert(clean, { wordwrap: false }).trim();
  if (!text) throw Object.assign(new Error('Write an email message before sending.'), { status: 422 });
  return { html: clean, text };
}

export function emailTemplate(title, content, language = 'en') {
  return `<!doctype html><html lang="${['en', 'ta', 'hi'].includes(language) ? language : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title>
<style>body{margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#334155}a{color:#102a56}p,li{font-size:16px;line-height:1.7}td{overflow-wrap:anywhere}@media(max-width:600px){.content{padding:24px 18px!important}.shell{width:100%!important}}</style></head>
<body><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" class="shell" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#102a56;padding:25px 28px;color:#fff"><strong style="font-size:22px">St. Antony’s School</strong><div style="margin-top:8px;font-size:13px">Matriculation Higher Secondary School · Neyveli</div></td></tr>
<tr><td class="content" style="padding:32px"><h1 style="font-size:24px;color:#102a56;margin-top:0">${escapeHtml(title)}</h1>${content}</td></tr>
<tr><td style="padding:22px 28px;background:#eaf4ff;font-size:13px;line-height:1.7">St. Antony’s Matriculation Higher Secondary School<br>Block 29, Neyveli, Tamil Nadu 607807<br><a href="${escapeHtml(config.SITE_URL)}">Visit the school website</a></td></tr></table></td></tr></table></body></html>`;
}

export function enquiryEmails(enquiry) {
  const admins = parseAdminRecipients(config.ADMIN_NOTIFICATION_EMAILS || config.SMTP_NOTIFY_TO);
  const reference = escapeHtml(enquiry.id);
  const confirmation = enquiry.locale === 'hi'
    ? `<p>सेंट एंटनीज़ विद्यालय से संपर्क करने के लिए धन्यवाद। हमें आपकी प्रवेश संबंधी पूछताछ प्राप्त हो गई है।</p><p>आपकी संदर्भ संख्या: <strong>${reference}</strong></p><p>विद्यालय कार्यालय आपकी पूछताछ की समीक्षा करेगा। यह पावती प्रवेश की पुष्टि नहीं है।</p>`
    : enquiry.locale === 'ta'
    ? `<p>உங்கள் சேர்க்கை விசாரணை பெறப்பட்டது.</p><p>விசாரணை எண் <strong>${reference}</strong></p><p>பள்ளி அலுவலகம் உங்கள் விசாரணையைப் பரிசீலிக்கும். இது சேர்க்கை உறுதிப்படுத்தல் அல்ல.</p>`
    : `<p>Thank you for contacting St. Antony’s School. We have received your admission enquiry.</p><p>Your reference is <strong>${reference}</strong>.</p><p>The school office will review your enquiry. This acknowledgement is not an admission confirmation.</p>`;
  const fields = [['Reference', enquiry.id], ['Parent / guardian', enquiry.parentName], ['Student', enquiry.studentName], ['Class', enquiry.grade], ['Email', enquiry.email], ['Phone', enquiry.phone], ['Language', enquiry.locale], ['Message', enquiry.message || 'No message']];
  const details = fields.map(([name, value]) => `<tr><th scope="row" align="left" valign="top" style="padding:10px;border-bottom:1px solid #dde5ee;font-size:14px">${escapeHtml(name)}</th><td style="padding:10px;border-bottom:1px solid #dde5ee;white-space:pre-wrap;font-size:14px">${escapeHtml(value)}</td></tr>`).join('');
  return [
    { kind: 'ENQUIRY_CONFIRMATION', to: enquiry.email, cc: [], subject: enquiry.locale === 'hi' ? 'आपकी पूछताछ प्राप्त हुई · सेंट एंटनीज़ विद्यालय' : 'Your enquiry has been received · St. Antony’s School', html: emailTemplate(enquiry.locale === 'hi' ? 'प्रवेश संबंधी पूछताछ प्राप्त हुई' : 'Admission enquiry received', confirmation, enquiry.locale) },
    { kind: 'ENQUIRY_NOTIFICATION', to: admins[0] || 'unconfigured@example.invalid', cc: [], bcc: admins.slice(1), replyTo: enquiry.email, subject: 'New admission enquiry · St. Antony’s School', html: emailTemplate('New admission enquiry', `<table role="table" width="100%" cellspacing="0" cellpadding="0">${details}</table>`) },
  ].map(message => ({ ...message, text: convert(message.html, { wordwrap: false }), enquiryId: enquiry.id, expiresAt: new Date(Date.now() + 86400000) }));
}
