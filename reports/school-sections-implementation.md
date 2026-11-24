# Dynamic school sections

Updated 24 November 2026. Existing features were reused; no duplicate sections were created.

## Implemented features

- Fees, honours, staff and toppers have Prisma models, validated public APIs, authenticated admin CRUD, publication controls, search, filters, ordering, pagination and audit logs.
- Gallery supports albums, batch uploads, metadata, previews, ordering, responsive images, lightbox navigation and zoom.
- Public APIs expose published records only, hide draft portraits and omit private source notes. Referenced media cannot be deleted until unlinked.
- English, Tamil and Hindi interfaces, compact profile cards with accessible detail modals, light mode for new visitors and a theme toggle are available. The CMS offers free MyMemory translation with manual corrections and quota handling.
- Fees show the complete selected year's schedule and total in paise. No unsupported fee breakdown is invented.
- Runtime images live in private MinIO storage, served through the API. Uploads are compressed in memory; replacing an image uses the deletion outbox to remove old objects safely.

## Verified source collection

The prepared import contains **42 fee installments, 60 staff profiles, 25 honours, 25 toppers, 28 gallery albums and 153 media originals**. The transfer package has **516 image objects**, including 306 responsive versions and 57 site assets.

Fee amounts follow fees.pdf: June, October and January installments across 14 standards. No tuition/admission breakdown was provided. Honour years are result years as printed; the 2021 COVID rows have no individual results and are omitted. No unverified honour portraits are attached.

Staff names/designations follow STAFF LIST.pdf. The previously matched principal portrait plus 51 new photos cover 52 profiles. Matching removes only titles, spaces and punctuation from filenames; it does not compare faces or fuzzy-match different names. Eight conflicting spellings/initials remain unassigned. See [source match report](school-source-update-2026-11-24.md).

Five existing toppers receive ranks explicitly stated on pages 1–2 of Annual_Report_2025-26_web.pdf, with matching names, classes, year and scores. These results belong to **2024–25**, not the report's title year. Rank is never inferred by sorting marks. Four earlier records remain drafts:

- Swathi.G: initials conflict with SWATHI S in the honour document; group presentation photo.
- Mukeh Kumar.R: spelling conflict.
- Kowshikan.R: spelling conflict with KOWSHIKAN.
- Keerthana.T: denominator conflicts with the Class 10 folder.

Muthamizh Jeeva and Mukesh Kumar.R retain unset ranks because the annual report's names differ. Source spelling and existing photos are preserved. Personal-name translations require school review; missing translated content falls back to English.

The 13 campus IMG photographs remain in five activity-based albums without inferred identities. Gallery dates remain unset unless documented. Two hazy vaccination images remain excluded. New feedback screenshots are not gallery photographs; branding references and the anthem photograph are retained for review. The new HEIC has readable dimensions but failed pixel decoding and is held for a JPEG/PNG export.

The user-supplied **Rev. Fr. V. Chinnappan (2002–2006)** photograph is now included in the former-principals section and its accessible detail modal, with English, Tamil and Hindi labels. The original is preserved in the principals source folder; three optimized WebP sizes are served from MinIO. It is historical leadership content, not an additional current staff profile.

## Files changed in this update

- scripts/prepare-school-update.py: repeatable source matching, optimized staff portraits and complete audit/inventory; originals unchanged.
- scripts/prepare-school-assets.py: invokes the supplement after the original and campus pipelines.
- assets/optimized-school/manifest.json, source-updates.json and 51 new WebP files: prepared import data and evidence.
- server/prisma/refresh-school-sources.js, import-school-assets.js: validated optional enrichment, preserving CMS and concurrent edits; database preflight before storage writes.
- server/tests/source-refresh.test.js, school-sections.test.js: preservation, concurrency, draft photo, repeat import and rank-provenance checks.
- scripts/package-school-images.mjs: offline ZIP with SHA-256 inventory; no credentials or database dumps.
- scripts/audit-school-cleanup.py: audits current MinIO source inputs instead of the obsolete public image folder.
- Reports: image-quality Markdown/CSV, asset inventory JSON, cleanup report, source-match report, implementation report and resume checkpoint.
- deployment/MINIO.md: updated group-upload and source-refresh instructions.
- client/src/SchoolRecords.jsx, three assets/site-images/fr-v-chinnappan*.webp files and shared/site-assets.json: former-principal portrait and responsive sizes.
- server/src/database.js, server/tests/database-options.test.js and environment examples: optional trusted MySQL RSA public key, retaining verified TLS and avoiding automatic key retrieval.
- docs/SCHOOL-SOURCES.md and deployment/PRODUCTION.md: portrait provenance and database authentication/deployment notes.

Existing relevant implementation: server/src/school-sections.js, admin.js, uploads.js, storage.js, storage-cleanup.js; client/src/SchoolSection.jsx, ProfileModal.jsx, Gallery.jsx and admin forms; shared field definitions and Prisma migrations. No new schema migration is needed for this update.

## Import and deployment

Back up the database and private MinIO bucket together. Use an updated full maintenance checkout containing assets/optimized-school; normal CI releases exclude source assets. Configure the server environment privately as described in [MinIO instructions](../deployment/MINIO.md). Run from the repository root:

```bash
npm ci
npm run db:migrate
npm run build
npm run assets:import -- --refresh-source
npm run assets:import -- --apply --refresh-source
npm run storage:migrate -- --site-only --apply
npm run production:check
```

Without --apply, import validates without connecting or writing. Apply creates missing stable IDs and uploads missing objects. The optional --refresh-source fills only reviewed empty portrait/rank fields on unchanged source imports. It skips records with a CMS UPDATE audit, including intentionally removed portraits, and checks updatedAt to preserve concurrent changes. SOURCE_ENRICH audits identify changed records; source-updates.json contains evidence. Review skips and use the CMS for manual corrections. Existing names, translations, publication states and selected photos are preserved.

No UPLOAD_DIR is used. Source documents, manifests, environment files and review assets must not be publicly served. Follow [production instructions](../deployment/PRODUCTION.md) for release activation. No automatic deployment was performed.

Rebuild additions with python scripts/prepare-school-update.py (Pillow), then python scripts/audit-school-cleanup.py. The complete pipeline is python scripts/prepare-school-assets.py (Pillow and pypdf), which includes this supplement. Review regenerated manifests before import. Package images with node scripts/package-school-images.mjs (Python 3 for ZIP creation). Originals are retained.

## Validation on 24 November 2026

- Lint and production build passed.
- Automated suite: **149 passed**; the four opt-in MySQL integration tests were skipped by the default command and **all four passed separately against local MySQL**.
- Source validation passed: 153 media files and 56 narrowly scoped enrichment patches.
- Browser checks: **16 passed** using the built frontend, prepared source records and intercepted API fixtures. Desktop/mobile fees, honours, staff, toppers, gallery, filters, compact cards, image decoding, modal focus/Escape, gallery navigation/zoom, default light mode, admin creation forms and Chinnappan's portrait were checked. Screenshots were visually reviewed. These checks do not assert public-server deployment.
- ZIP verification: 516 objects, ZIP CRC and SHA-256 checksums; CMS originals match prepared files; no environment files included.
- Audit covers 341 source images. The 51 new staff main images are 93.5% smaller than their originals; complete totals are in the cleanup report.
- Local import created 51 media records and applied all 56 source enrichments without skips. A pre-import backup of the affected records is retained privately under artifacts/.
- Repeat refresh verified idempotence: zero changes, 56 unchanged, no skips. Actual local counts are 60 staff, 52 linked portraits, 153 media records (149 published) and five ranked toppers.
- MinIO site transfer uploaded Chinnappan's three images and verified the existing 54 by SHA-256.
- Production-readiness command **passed against the local database and configured MinIO bucket**: one active administrator, 149 published media records, required site assets present and anonymous reads denied.

The earlier Prisma P2039 / adapter 45028 error was traced to MySQL SHA2 public-key authentication. Pinning the local server's public key restored connectivity without resetting the database or changing account credentials. The optional DATABASE_RSA_PUBLIC_KEY path is deployment-specific; never copy a Windows path to Linux. No public-server database import, release activation, production performance benchmark or live-server login verification was performed. Repeat the deployment acceptance checks on the actual server before launch.

Technical support and future reference: **Bharathwaj TP — 9600641464**. Existing guides are in docs/handover; current MinIO instructions supersede their older filesystem-storage instructions.
