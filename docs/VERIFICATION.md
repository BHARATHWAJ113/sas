# Verification record

## Announcements, admin and visitor privacy · 8 November 2026

- Applied the additive `202611080001_enhancements` migration to local MySQL. Existing school data was not reset; historical notices default to popup disabled.
- Final regression run: **80 tests passed**. The **3 opt-in MySQL integration tests** passed separately, including actual JSON metadata expiry cleanup, publication scheduling, all four page sizes, consent gating, duplicate visit references, BCC and attachment handling.
- Final `npm run lint`, `npm run build` and `git diff --check` passed. Production files are in `client/dist`. The email editor remains a separate lazy bundle; no new dependencies were needed for this enhancement.
- Browser tests used an isolated in-memory fixture with clearly labeled demo announcements and synthetic recipients. Verified numbered navigation, refresh behavior, per-message reminder persistence, delayed follow-up display, internal-navigation cancellation, preview/edit/save, category search/validation/edit prefill, BCC/attachment upload, queue/history status, CSV export, private record details, cookie customization/withdrawal and optional enquiry metadata.
- Table checks used 205 synthetic records: 20, 50, 100 and 200 rows rendered correctly; First/Last navigation, range/count summaries and column-specific search worked. CSV export produced the expected download.
- Desktop 1440px, tablet 768px and mobile 390px checks showed no document horizontal overflow in the new layouts. Tamil mobile consent controls and private detail dialogs fit the viewport. Fresh admin checks showed no console errors.
- Location was not requested from the operator during browser QA. Controlled tests cover granted, denied, unavailable, timeout and policy-blocked results; ordinary submission works without requesting location.
- Evidence: `artifacts/announcement-popup-desktop.png`, `announcement-popup-mobile.png`, `searchable-field-mobile.png`. The temporary preview was stopped and its tabs closed.
- No external email was sent. Gmail credentials/inbox delivery and deployed HTTPS/proxy/browser-permission behavior still need school-approved live verification. No production load benchmark was performed. Configuration and operational notes are in [ENHANCEMENTS.md](ENHANCEMENTS.md).

## Email, consent and performance · 7 November 2026

- Applied `202611070001_email_consent` to the configured local MySQL database without resetting existing content.
- `npm test`: **55 passed**; the **2 opt-in MySQL tests** also passed in a separate run. Tests cover input sanitization, authorization/CSRF, idempotent submissions, atomic outbox writes, SMTP retries and ambiguous failures, cookie persistence and request coalescing/timeouts. Nodemailer was exercised against a local SMTP test server.
- Real MySQL checks cover staff sign-in, publication and upload operations, enquiry and paired email persistence, consent audit history, administrator correspondence, and competing queue workers. Test records use a unique prefix and were cleaned up; workers were restricted to those records and used a synthetic transport.
- `npm run lint`, `npm run build` and `git diff --check` passed. The email editor is a separate lazy-loaded bundle, excluded from public page startup.
- Browser checks used an isolated API fixture. Verified To/CC/subject, bold formatting, queued/sent history, enquiry confirmation, reject/reload persistence, accept/load map, withdrawal removing the iframe, English/Tamil settings, scroll-to-top and focus restoration.
- Measured the new public and admin layouts at 1440px, 768px and 390px with no document horizontal overflow. Fresh admin page checks showed no console errors.
- Evidence: `artifacts/email-management-desktop.png`, `email-management-mobile.png`, `consent-banner-desktop.png`, `cookie-settings-mobile.png`.
- No external emails were sent. Approved Gmail credentials, deployed HTTPS/proxy behavior and actual inbox delivery still require live verification. There is no production load benchmark.

## Original website · 31 October 2026

The following is the historical verification record from the original implementation.

## Completed

- Inspected the original workspace before creating files. The supplied official logo was the only existing asset and was preserved.
- Opened both live reference sites in the browser, inspected their rendered homepage/events layouts and navigation, and created an original implementation.
- Installed dependencies; updated packages identified by the initial audit. Final npm production dependency audit reported **0 vulnerabilities**. The updated full dependency installation also reported 0.
- Generated the Prisma 7.10.1 JavaScript client successfully and generated the committed initial MySQL migration from the schema. Migration SQL defines all requested tables plus sessions and gallery-media relationships with utf8mb4 collation and foreign keys.
- `npm run lint` passed without warnings/errors.
- `npm run build` passed; output is `client/dist`, including `.htaccess`, original WebP imagery, responsive image variants and self-hosted fonts. Main JS is approximately 340 KB before gzip / 105 KB gzip; the CMS is a separate lazy-loaded bundle.
- `npm test`: **28 passed**, **1 opt-in real-MySQL integration test skipped**. Supertest tests ran with local-network permission because the Codex sandbox initially rejected loopback connections.
- Browser overflow measurements: 14 English routes at 1440, 768 and 390px (42 checks), and 13 Tamil public routes at the same three widths (39 checks). **No document horizontal overflow** was observed. These include every requested route, the event detail page, 404 view and staff login.
- Visually reviewed desktop homepage, tablet events, mobile homepage, Tamil mobile homepage and mobile staff login. Refined tablet event cards to two columns and corrected the mobile Tamil image-caption position.
- Tested event search (“science”), past-event filtering (two records), pagination to the second page, and navigation into an event detail view. Demo labels appeared on cards and details.
- Tested mobile navigation open/close and English/Tamil switching. Reload retained Tamil preference.
- Tested gallery lightbox open/next/close and notice dialog deep-link/open/close in Tamil.
- Checked the enquiry form with unavailable persistence: it displayed an explicit unavailable message, disabled its fieldset and had **no success state**.
- Inspected staff login with unavailable MySQL: it explained the database requirement and disabled sign-in rather than inventing credentials.

## Evidence

Local, ignored artifacts in `artifacts/`:

- `home-1440.jpg`, `home-768.jpg`, `home-390.jpg`
- `home-tamil-390.jpg`
- `events-768.jpg`, `admin-390.jpg`
- `responsive-checks.json`, `responsive-tamil-checks.json`

## Required before launch

No configured MySQL connection or Docker command was available in this workspace. **Migration application, real seeding/reseeding, authenticated CMS operations, upload persistence and MySQL-backed enquiry storage were not live-verified.** API tests use a mocked persistence boundary and are not represented as database integration tests.

Apply the committed migration to a dedicated MySQL instance, run the seed with explicitly supplied staff credentials, and execute `npm run test:mysql` against a separate migrated test database. That opt-in test exercises real authentication, uploads, draft/public/archive event behaviour, enquiry persistence and transactional audit writes. It only cleans up its uniquely identified test records and never resets a database.

Apache/TLS deployment and shared-host proxy configuration were not executed; no hosting account, DNS, domain or external site was modified. The supplied Apache and process-manager files are concrete examples for your environment, not claims of a deployed service.

Verify school content, facilities, activities, achievements, principal details, phone/email, admissions information and approved photography. All current unverified items remain clearly marked as demos/placeholders. Original AI imagery is illustrative and does not portray the actual school.
