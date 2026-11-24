# School website resume checkpoint

Updated: 24 November 2026 (Asia/Calcutta).

## User preference

Preserve progress if usage credits run out. This file preserves state; it does not enable a billing-triggered automatic restart. If the chat stops, send “continue” in the same chat.

## Completed

- Reused and checked the existing dynamic fees, honours, staff, toppers and gallery interfaces and admin management, English/Tamil/Hindi, free translation, default light theme and MinIO storage.
- Audited 341 source images; preserved all originals. Prepared 153 CMS images plus 57 site assets.
- Matched 51 new staff portraits using filenames and the official staff list. Eight conflicting names remain unassigned; see school-source-update-2026-11-24.md.
- Added five explicitly documented topper ranks from annual-report pages 1–2; no inferred ranks or identities.
- Added the user-supplied Rev. Fr. V. Chinnappan portrait (2002–2006) to former principals and the detail modal, with three MinIO image sizes.
- Restored local MySQL authentication using its trusted public key. The ignored server/.env holds a local DATABASE_RSA_PUBLIC_KEY path; do not copy that Windows path to production. No credentials changed or database reset.
- Backed up affected local records to artifacts/source-import-backup-2026-11-24.json. Keep it private.
- Imported 51 media records and applied all 56 source updates to the local database. Uploaded new media to configured MinIO. Site transfer uploaded three images and verified 54 existing objects.
- Readiness passed with one administrator and 149 published media records. No public-server database import or deployment performed.
- Lint/build passed; 149 automated tests passed; four real MySQL integration tests passed separately. Sixteen browser checks passed using source-data API fixtures; mobile/desktop screenshots reviewed.
- Prepared artifacts/minio-school-images-2026-11-24.zip with 516 image objects, inventory and upload instructions.

## Deployment and outstanding source review

Read deployment/MINIO.md and deployment/PRODUCTION.md. Deploy only when explicitly requested. Use a full maintenance checkout to import on the server; routine CI releases exclude source assets. Run assets:import with --apply --refresh-source, storage:migrate with --site-only --apply, and production:check against that server's configuration. Preserve school CMS edits and inspect any reported skips. Keep the bucket private.

Eight staff photographs need identity/spelling confirmation; four earlier topper records remain drafts. Two ambiguous annual-report names retain unset ranks. Review the source-match report for details. A HEIC cannot be decoded; preserve it until a JPEG/PNG export is available. No invented source facts or original-file deletions.

Current implementation/test evidence is in school-sections-implementation.md; image quality and cleanup reports are alongside it. No commit, push or automatic production deployment was performed. Support: Bharathwaj TP — 9600641464.
