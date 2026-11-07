# Email and consent operations

## Configure Gmail

Set these variables in the server environment or ignored `server/.env`.

```dotenv
EMAIL_ENABLED=true
SMTP_USER=your-approved-account@gmail.com
SMTP_APP_PASSWORD=your-google-app-password
SMTP_PORT=465
SMTP_FROM_NAME="St. Antony's School"
ADMIN_NOTIFICATION_EMAILS=the-approved-school-office@example.com,principal@example.com
EMAIL_MAX_ATTEMPTS=4
EMAIL_POLL_MS=5000
CONSENT_VERSION=2026-11-08
VISITOR_RETENTION_DAYS=30
```

Use the school's approved account and notification address. Google requires 2-Step Verification for app passwords, and some managed accounts restrict their availability. Keep these credentials in the server environment and restrict access to that file. Gmail account sending limits still apply. [Google app password guidance](https://support.google.com/accounts/answer/185833)

The transport uses `smtp.gmail.com`, authenticated TLS on port 465 or required STARTTLS on port 587, certificate verification, TLS 1.2 or later, connection and socket timeouts, and disabled file and URL attachment access. Gmail's sender address is taken from `SMTP_USER`. [Nodemailer SMTP settings](https://nodemailer.com/smtp)

Run from the project root after configuring MySQL.

```powershell
npm ci
npm run db:generate
npm run db:migrate
npm run build
npm start
```

The API process starts the durable outbox worker when email is enabled. The process manager must keep that Node process running. Multiple processes claim jobs atomically through MySQL. Use `EMAIL_ENABLED=false` while configuring credentials. Form submissions still persist and queue their two messages, with the confirmation screen explaining email availability. Automatic enquiry messages expire after 24 hours.

## Message lifecycle

Each enquiry and its confirmation and office notification are committed in one transaction. The public form preserves its idempotency reference after network failures. Identical submitted details are also deduplicated within the same UTC day. Reusing a request reference with different details returns 409.

Manual email sends require ADMIN access, a valid staff session, CSRF protection, an allowed Origin and an idempotency reference. The server sanitizes the rich-text body. Recipients are limited to one To address, five unique CC addresses and five unique BCC addresses, with no duplicates across the lists. An optional validated image/PDF attachment can be selected. Administrator sends are capped at 20 per hour, including manual retries. Public enquiries are capped at three per email address, five per client IP and 100 in total per hour. Database buckets enforce these limits across processes.

| Status | Meaning |
| --- | --- |
| PENDING | Queued or waiting for a scheduled retry |
| SENDING | Claimed by a worker |
| SENT | SMTP accepted every recipient |
| PARTIAL | SMTP accepted some recipients and rejected others |
| FAILED | A permanent error, exhausted attempts or an expired message |
| UNKNOWN | Acceptance is uncertain after a connection or worker interruption |

Transient rejections retry after 30, 60 and 120 seconds with the default four-attempt limit. Authentication errors and permanent rejections fail immediately. Expired SENDING claims become UNKNOWN. Review UNKNOWN and PARTIAL messages in Gmail before sending again. A stable Message-ID helps investigation, while SMTP itself provides no exactly-once delivery guarantee.

The history records timestamps, recipients, attempts, accepted and rejected recipients and a safe error summary. SENT represents SMTP acceptance. Check Gmail for later bounces and inbox placement. Logs contain job references and statuses. The server retains message bodies in MySQL for authorised administrative review.

Apply the school's retention and backup policy to enquiries, email history and consent records. Deleting an enquiry also deletes its generated email records. The API prevents deletion while its email is actively sending. Keep database backups and storage access restricted.

## Cookie preferences

The public banner provides accept, reject and customize choices. The footer opens the settings dialog for later changes or withdrawal. Optional Google Maps and visitor analytics are independent consent categories and stay blocked until selected. The map also requires the visitor to choose to load it. Withdrawal removes an active map, stops future analytics and propagates to other open tabs on the same origin. See [the enhancement guide](ENHANCEMENTS.md) for metadata collection and retention.

Consent choices and changes are stored in MySQL with a server timestamp and policy version. The browser carries an opaque HttpOnly, SameSite=Strict cookie, with Secure enabled in production. The stored token is hashed. The cookie lasts 180 days. A changed `CONSENT_VERSION` prompts the visitor again. Language preference and staff authentication use essential storage.

The implementation supports recording and withdrawal. The school should confirm its notices, purposes, retention periods and handling of children's data against the rules applicable to its actual operation and deployment. [ICO guidance on managing consent](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice), [India's DPDP Rules](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa)

## Performance

Public browser reads share in-flight requests and cache successful responses for 15 seconds. Server collection caches are limited to 150 entries with a 10-second TTL. Successful CMS mutations invalidate the server cache. Private staff, consent, email and enquiry responses use no shared cache.

Requests have a 15-second timeout. Public reads retry one transient failure after 500 ms. Writes use explicit idempotency references. Event searches wait 220 ms between typed changes. The email editor loads only when an administrator opens Email management. Email bodies are fetched only when opening details, while history is paginated.

The remaining IP-based ingress rate limit uses process-local memory. Deploy a shared ingress limiter when scaling behind multiple API instances. Database submission and administrator email quotas remain shared through MySQL.

The public scroll-to-top arrow appears after 500 pixels, restores keyboard focus to the main content and uses instant movement when reduced motion is requested. Its listener is passive and updates at most once per animation frame. The React root is reused during development hot updates to prevent duplicate mounts. [Vite HMR data](https://vite.dev/guide/api-hmr#hot-data)

## Main changed files

| Area | Files |
| --- | --- |
| Schema and migration | `server/prisma/schema.prisma`, `server/prisma/migrations/202611070001_email_consent/migration.sql` |
| SMTP and outbox | `server/src/email-content.js`, `email-worker.js`, `email-admin.js`, `enquiries.js`, `idempotency.js` |
| API integration | `server/src/app.js`, `admin.js`, `config.js`, `index.js`, `validation.js`, `consent.js`, `public-cache.js` |
| Admin editor | `client/src/admin/Admin.jsx`, `EmailManager.jsx`, `email.css` |
| Public consent and form | `client/src/CookieConsent.jsx`, `cookie-consent.css`, `pages.jsx`, `components.jsx`, `main.jsx`, `school-copy.js` |
| Frontend performance and motion | `client/src/api.js`, `public-design.css`, `public-motion.css` |
| Verification | `server/tests/email-consent.test.js`, `client-requests.test.js`, `api.test.js`, `mysql.integration.test.js` |
| Configuration and setup | `server/.env.example`, workspace package manifests/lockfile, `README.md`, `docs/API.md` |

## Verification and deployment limits

The additive migration was applied to local MySQL on 7 November 2026. Integration tests used uniquely prefixed temporary records in the local database because the restricted application account cannot create a separate test database. Cleanup removed only those records. A dedicated migrated test database remains recommended for routine runs. Tests exercised actual MySQL persistence and competing workers with a test transport; a separate test used Nodemailer against a loopback SMTP server. No external email was sent.

Browser checks use an isolated API fixture and synthetic email recipients. They cover the rich-text composer, email history, enquiry confirmation, cookie rejection across reload, acceptance, map withdrawal, English/Tamil controls and responsive layouts. Live Gmail acceptance, deployed HTTPS/reverse-proxy behavior and real inbox placement still require verification after school credentials and hosting are configured. Cache timings are configured limits, not claims from a production load benchmark.
