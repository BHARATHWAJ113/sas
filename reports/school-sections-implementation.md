# Dynamic school sections

## Included

- Public routes /fees, /honours, /staff, /toppers, with English/Tamil interface labels, filters, loading/error/empty states and navigation links.
- Existing CMS extended with four resource types, image selection/removal, private source notes, search, column filters, ordering, pagination, publication controls, authenticated writes and audit records.
- Existing gallery extended with zoom, captions, event dates, responsive image variants, selected-image ordering and sequential batch upload with individual previews and retry status.
- Additive Prisma migration creates fees, honours, staff_members, toppers, and extends media. Existing records and historical migrations are preserved.
- Public APIs only expose published records. Draft portraits are hidden, source notes are omitted, and referenced portraits cannot be deleted until unlinked.
- Server-side 10-second bounded caching and client request deduplication cover the new routes. Admin mutations invalidate caches. Profiles are paginated. Fees use the complete selected year's schedule with totals calculated in paise.
- School pages are lazy-loaded. Uploaded/imported photos have 640/1200 pixel WebP variants. Original source assets remain untouched.

## Source import and review decisions

The importer contains 42 fee instalments (14 standards), 60 staff profiles, 25 honour entries, 25 topper entries, 23 gallery albums and 89 optimized photographs.

Fee amounts were checked visually against fees.pdf. Only its June, October and January instalments are entered. The document does not supply a tuition/admission/other-charge breakdown, so none is invented.

Honour years are result years as printed. The 2021 COVID rows have no individual results and are omitted. Merged cells in 2014 and 2016 contain two names each and are entered as separate records. No unverified portraits are attached to honour records.

Staff names and designations follow STAFF LIST.pdf. Department/type labels group the supplied designations. Only the explicitly named principal photograph is matched. Other staff use a profile placeholder.

Topper names, classes and marks follow filenames. No ranks are invented. Four records remain drafts:

- Swathi.G 590 out of 600.png: initials conflict with the honour document's SWATHI S; the image is a group presentation photo.
- Mukeh Kumar.R 463 out of 500.png: filename spelling differs from the later Mukesh Kumar record.
- Kowshikan.R 475 out of 500.png: filename differs from the honour document's KOWSHIKAN.
- Keerthana.T 491 out of 600.jpg: denominator conflicts with its Class 10 folder.

Names remain in their source spelling. Tamil names/descriptions can be added in the CMS; until supplied, the public Tamil view falls back to the source English content.

Gallery titles use the supplied year/event folder context. Exact event dates remain unset unless entered by staff. Two hazy vaccination images were withheld following visual review. Unlabelled IMG files are held for context review. No identities are inferred from faces.

## Changed and new files

- shared/school-sections.js, shared/record-fields.js: shared labels, standards, resource mapping and admin search fields.
- server/prisma/schema.prisma, server/prisma/migrations/202611210001_school_sections/migration.sql: additive database changes.
- server/src/school-sections.js: validation and public directory/fee APIs.
- server/src/admin.js, validation.js, app.js, gallery.js, public-cache.js: reuse of CRUD, publication, cache and media serving.
- server/src/image-variants.js, uploads.js: optimized responsive images.
- client/src/SchoolSection.jsx, school-sections.css, main.jsx, SiteHeader.jsx, context.jsx, api.js: public pages and navigation.
- client/src/Gallery.jsx, components.jsx: gallery zoom, metadata and responsive sources.
- client/src/admin/Admin.jsx, school-fields.js, BatchUpload.jsx: reusable admin forms and uploads.
- client/public/images/profile-placeholder.svg: default portrait.
- scripts/prepare-school-assets.py: repeatable audit, derivative and source manifest generation.
- server/prisma/import-school-assets.js, root/server package scripts: validated, repeatable database import.
- assets/optimized-school/: source manifest and selected derivatives.
- server/tests/school-sections.test.js, mysql.integration.test.js: API, validation, roles, publication, totals, real persistence and media checks.

## Local run and deployment

Use the existing environment templates. No new credentials or environment variables are needed. Back up the target database and upload directory before deployment.

    npm ci
    npm run db:migrate
    npm run build
    npm run assets:import
    npm run assets:import -- --apply
    npm run lint
    npm test
    npm run dev

assets:import without --apply validates files and data without connecting to the database. The apply command creates missing stable IDs and preserves existing records/admin edits. It archives published demo gallery albums only when real albums are first imported. It never resets a database. Re-running it does not overwrite existing rows or files.

Deploy the application code and assets/optimized-school/ along with the migration. The original multi-megabyte source collection is not required on the VPS. Import as the service user with write access to the existing UPLOAD_DIR, so Node can serve the files. Publish client/dist through the existing Apache configuration and restart the existing Node service using your established deployment procedure. Do not expose source documents, manifests, review assets, .env or uploads as an unrestricted Apache directory.

There was no automatic production deployment.

To rebuild the asset audit, run python scripts/prepare-school-assets.py in an environment with Pillow and pypdf. Review generated manifests before importing. Regeneration preserves originals and moves obsolete generated candidates into assets/optimized-school-review/.

## Validation

The additive migration was applied to local MySQL. Source import and schema validation succeeded. The automated suite passed 92 tests, with four database tests skipped in its default mode. All four MySQL integration tests passed separately, including authenticated CRUD/publication changes for the new resources, fee totals, gallery metadata, media variants, and the existing authentication/enquiry/email workflows.

Production build and lint passed. Public pages were checked at 1440, 768 and 390 pixels with no page-level horizontal overflow or broken displayed images. Fee standard selection, staff search, Tamil layout, gallery zoom and keyboard navigation passed. All six affected CMS create/upload forms opened successfully at 390 pixels. Screenshots and local QA scripts are under the ignored artifacts directory.

The repeat import created zero duplicate records. The audit covered 271 originals; selected main WebP files are 91.8% smaller in total than their corresponding originals. No performance benchmark against production was performed. Batch uploads reuse the tested single-file upload API sequentially; no live production upload or deployment was performed.
