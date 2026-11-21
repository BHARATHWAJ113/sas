# MinIO migration — 22 November 2026

Implemented in the local repository; the updated application has not been deployed to the public web server.

## Completed

- Endpoint `https://minio.tecnozard.com`, bucket `stantonys`, region `us-east-1`.
- Transferred 360 objects: 102 CMS originals, 204 responsive versions, 54 site assets. Each transferred object was read back and verified with SHA-256. No conflicting destination objects existed.
- Found and removed the bucket's two anonymous-access statements, which had allowed public reads, listing, uploads and deletion. The old policy is saved locally in `artifacts/minio-policy-before-private.json`. Authenticated application access still works; anonymous image requests return HTTP 403. No image objects were removed by the policy change.
- Verified private upload/read/delete using a temporary randomly named image; the probe was deleted afterward.
- New uploads are compressed in memory; all image serving and email attachments read MinIO. Replacements preserve media IDs and references, commit the replacement before deleting the old original and variants, and retry failed deletion through a persistent database outbox. Failed uploads remain eligible for reference-checked cleanup after 24 hours.
- Added the replacement file picker to the media editor and a notice when deletion is queued.
- Moved static source images to offline migration inputs under `assets/site-images`; the built website contains no raster/SVG image files. Videos and inline interface icons remain application assets/code.
- CI deployment now excludes the entire root source `assets/` directory as well as local uploads and transfer artifacts. Migration tools are run from a maintenance checkout before activating the release.
- Added deployment environment examples, scoped service-account policy, migration CLI, cleanup CLI and `deployment/MINIO.md`. The guide includes school support contact Bharathwaj TP, 9600641464.
- Prepared `artifacts/minio-school-images-2026-11-22.zip` (29,819,162 bytes), with 360 verified image objects and an object checksum manifest. The ZIP covers the original collection, not any later production-only uploads.
- Applied the additive deletion-outbox database migration to the configured **local** database. The production server must apply it separately.

## Validation

- `npm test`: 121 passed; four opt-in integration tests skipped in this command.
- Local MySQL integration suite: all four passed separately, including upload, stable-ID replacement, deletion-outbox behavior and authenticated image serving. Temporary test records were cleaned up; no external emails were sent.
- `npm run lint`: passed.
- `npm run build`: passed; client rebuilt after the final replacement notice change.
- `git diff --check`: passed (line-ending notices only).
- `npm audit --omit=dev`: zero vulnerabilities. The S3 SDK is used with MinIO path-style addressing.
- Desktop/mobile browser checks against the built local site and the real private bucket: homepage images, authenticated media thumbnails and replacement control passed; no image HTTP errors or JavaScript errors. Screenshots: `artifacts/minio-home.png`, `artifacts/minio-admin-replace.png`, `artifacts/minio-admin-mobile.png`.
- Final `npm run production:check`: PASS; one active administrator, 98 published media records, required original/variant/site objects present, no due deletion tasks, anonymous reads denied.

## Production activation still required

Deploy this repository version, add the six MinIO environment variables to the environment actually used by `school-api`, install dependencies, build, apply migrations, run readiness and restart the API. Use the updated service unit and Apache proxy configuration. Existing local files and raw source photos were preserved for backup and rollback, but the updated application does not read them at runtime. See `deployment/MINIO.md` for exact commands and bulk-upload paths. Verify any additional production-only media using the server's database and old uploads directory before activation.
