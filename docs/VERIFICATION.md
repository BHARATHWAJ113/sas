# Verification record · 31 October 2026

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
