# Announcements, administration and visitor privacy

## Setup

The existing React/Vite, Express and Prisma/MySQL architecture is retained. Apply migrations with `npm run db:migrate`, generate with `npm run db:generate`, and run `npm run dev` for local development. Build with `npm run build`; the existing Apache reverse-proxy instructions still apply. No additional runtime dependencies were needed for this enhancement.

New server configuration:

```dotenv
ADMIN_NOTIFICATION_EMAILS=office@example.com,principal@example.com
VISITOR_RETENTION_DAYS=30
```

Set approved addresses, not the examples. `ADMIN_NOTIFICATION_EMAILS` accepts up to 20 comma-separated addresses; whitespace and duplicates are removed and invalid addresses prevent startup. It overrides the legacy single-address `SMTP_NOTIFY_TO` when set. Existing Gmail `SMTP_USER`, `SMTP_APP_PASSWORD`, `SMTP_PORT` and `EMAIL_ENABLED` settings remain in use. Additional office recipients use BCC. Keep all SMTP settings server-side. Live Gmail delivery still requires configured school credentials; automated tests use a local SMTP server and synthetic transports.

## Announcement management

In **Announcements, notices & news**, create or edit bilingual content, select the announcement theme, start and end times, priority, optional image, footer text, Rev. Father's wishes, and a local call-to-action path. Use **Preview announcement popup** to review the card. Enable **Show as a homepage popup** and publish the record. A published record with a future start time is scheduled automatically; the publication selector labels that state. Published images can appear publicly; drafts remain private. Existing announcements default to popup disabled, so migration does not suddenly open every historical notice.

The public homepage requests only currently published, enabled announcements within their date window. The API returns at most 50 in priority order. News and notices remain available through their existing pages and notice bar.

Per the latest request, popups default to **every homepage refresh**, with visitor choices specific to each message:

- Show on every refresh.
- Hide for 5, 10 or 30 minutes.
- Never show this message again.

“Never” applies to that announcement and its current revision in that browser. Editing the announcement makes the updated revision eligible again. Clearing browser storage also clears reminder choices. An ordinary close dismisses that message for the current page load; it does not persist across refreshes. Numbered buttons allow visitors to browse eligible announcements in one dialog. Closing a message schedules the next eligible message after 20 seconds. Closing the final message ends the queue. Escape uses the same dismissal behavior.

Automatic display starts only on an initial homepage load or refresh. Navigating away cancels the queue, and returning through internal navigation does not start another queue. Refreshing another page never opens an announcement. Background tabs defer popups until visible. Native dialog focus handling, keyboard controls, a scrollable mobile layout and reduced-motion styling are included.

Reminder choices are local preference storage and do not enable analytics. If browser storage is blocked, the visitor is told that the preference lasts for the visit only.

## Admin records

Content tables, enquiries, email history, users and audit logs share validated server-side search, column-specific search, date filters in IST, sorting and pagination. The UI offers 20, 50, 100 or 200 rows, defaults to 20, and provides First/Previous/Next/Last controls and a visible range/count summary. Internal media pickers may request smaller pages. Public collection limits remain unchanged.

CSV export includes the currently displayed filtered page and is labeled accordingly. Values are quoted and formula-leading values are escaped for spreadsheet safety. Large matching datasets are paginated instead of being silently exported in full. The enquiry detail dialog offers an authorized JSON export.

Long content bodies are omitted from admin content lists and public news/notice collections; editors and public detail views fetch them only when needed. Search is debounced. Only approved columns can reach Prisma sorting/filtering. Enquiry summaries available to editors exclude metadata. Detailed enquiry metadata and email correspondence require ADMIN access.

The email composer supports To, CC, BCC, rich text and one optional validated image/PDF up to 8 MB. Uploads reuse the media validation service and start as drafts. Outgoing attachments are read as bounded buffers from the configured upload directory, not remote URLs or arbitrary client paths. Referenced media cannot be deleted. The existing durable queue, idempotency, CSRF, role checks and send quotas also protect these messages. Upload signature/size checks are not an antivirus service; apply the school's malware-scanning policy to files and infrastructure as needed.

## Optional enquiry metadata

The enquiry form has a separate, unchecked optional-details choice. Without it, device, network and location metadata are not stored. A second explicit **Share location** action explains that location is for directions to a school visit, then uses the browser permission prompt. Denial, timeout or unsupported geolocation never blocks enquiry submission. Visitors can remove coordinates before sending. No Wi-Fi names, passwords or hidden network information are collected.

Stored JSON includes available screen/language/time-zone/network data, reported user agent and approximate browser/OS classification, the IP from Express's trusted server/proxy configuration, optional reported location/accuracy, server time and consent purpose/time. Unavailable values remain null; device model is left unavailable rather than invented. Browser metadata can be spoofed and is not identity verification. Configure `TRUST_PROXY` only for the actual trusted reverse proxy; do not trust arbitrary forwarded headers.

Optional enquiry metadata expires after `VISITOR_RETENTION_DAYS` (default 30; supported 1–90). The configured period is shown in the privacy text. Expired optional enquiry metadata is omitted from detailed reads. An hourly API maintenance task removes expired records/metadata; physical deletion can therefore trail expiry by up to the cleanup interval while the process is running. Core enquiry and email-history retention remains the school's operational policy. Protect database backups and exports under the same policy. The former consent and visitor tracking endpoints are retired. Historical visitor rows continue to expire under their original expiry dates. The previous database migrations and consent history are retained.

## Design and verification

Category and role selectors provide native searchable suggestions with validation. Existing image selections remain accessible multi-selection checkbox groups. Existing controls use consistent navy/slate borders, rounded corners, readable font sizes, required markers, focus/error states and responsive layouts. Native controls retain keyboard and screen-reader behavior. A lightweight pencil cursor applies only to fine-pointer desktop devices without reduced-motion preference; typing and clickable controls retain standard cursors. No cursor tracking animation or new animation library is used.

Automated checks cover reminder expiry and message revision isolation, invalid popup schedules/CTAs, all page sizes, authorization, retired tracking routes, unavailable metadata, notification recipient deduplication, BCC SMTP envelope delivery and attachment handling. Real MySQL integration tests use uniquely labeled temporary records and a synthetic email transport. Browser checks use an isolated fixture, never real school announcements or external emails.

Browser location permissions were not granted during QA; denied, unavailable and timed-out outcomes were tested with controlled callbacks. The platform behavior follows the [W3C Geolocation API](https://www.w3.org/TR/geolocation/).

There is no production traffic benchmark or blanket legal-compliance certification. Deployment still requires HTTPS/proxy checks, school-approved SMTP credentials, inbox delivery checks, operational privacy/retention review and a shared ingress limiter before horizontal scaling.

## Main files

- Announcement UI/policy: `client/src/AnnouncementPopup.jsx`, `popup-policy.js`, `announcement-popup.css`.
- Optional enquiry metadata UI: `OptionalMetadata.jsx`, `visitor-metadata.js`, `form-design.css`, `pages.jsx`, `main.jsx`, `context.jsx`, `school-copy.js`.
- Admin: `client/src/admin/Admin.jsx`, `RecordControls.jsx`, `RecordDetails.jsx`, `SearchableSelect.jsx`, `EmailManager.jsx`.
- Server: `admin-list.js`, `admin.js`, `app.js`, `metadata.js`, `enquiries.js`, `email-addresses.js`, `email-content.js`, `email-admin.js`, `email-worker.js`, `config.js`, `index.js`, `validation.js`.
- Shared fields: `shared/record-fields.js`.
- Database: `server/prisma/schema.prisma`, `server/prisma/migrations/202611080001_enhancements/migration.sql`.
- Verification: `server/tests/enhancements.test.js` and expanded email/MySQL tests.
