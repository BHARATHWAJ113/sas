# School images in MinIO

Storage endpoint: **https://minio.tecnozard.com**. Bucket: **stantonys**. Region: **us-east-1**.

The school API stores new images in MinIO only. It validates the file contents, rotates photographs correctly, strips embedded metadata, fits images within 2400 × 2400 pixels and encodes WebP at quality 85. It creates 640 px and 1200 px versions at quality 82. This is high-quality lossy compression; file-size reduction varies by image. Processing uses memory, with an 8 MB upload limit and 25-megapixel input limit. PDFs are validated and stored unchanged in the same private bucket. Logos and other prepared site images are uploaded unchanged to preserve their existing quality.

No runtime image upload, thumbnail or attachment is written to a local folder. Homepage photos, logo, favicon, placeholder illustration and CMS media are all served from MinIO through the school API. Source artwork under `assets/` and the transfer ZIP are migration inputs/backups, not runtime storage. Videos remain separate from this image migration. Inline SVG interface icons and CSS animations remain application code.

## 1. Bucket and credentials

Use the S3 API endpoint, not the MinIO console address. Create a **private** bucket named `stantonys`. It must never have had versioning enabled: with versioning, normal deletion leaves old object versions behind. Do not enable object retention/locking on this bucket. Keep separate protected backups if required by the school.

Create a dedicated application service account with the policy in [minio-policy.json](./minio-policy.json). Do not give browser users MinIO keys or anonymous bucket access. The school API checks publication status and staff authentication before streaming CMS images. `MINIO_URL` identifies the bucket for configuration and verification; it is deliberately not exposed as a public bypass for draft images.

Add these to the **environment used by the running API** (normally `/var/www/stantonysneyveli.in/shared/server.env`, linked as `live/server/.env`):

```dotenv
MINIO_ENDPOINT=https://minio.tecnozard.com
MINIO_URL=https://minio.tecnozard.com/stantonys
MINIO_BUCKET=stantonys
MINIO_REGION=us-east-1
MINIO_ACCESS_KEY=YOUR_APPLICATION_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_APPLICATION_SECRET_KEY
```

Replace the last two values privately on the server. Do not commit this file, include it in a ZIP, or paste keys into chat. `UPLOAD_DIR` is no longer used. Keep existing database, session and SMTP configuration.

## 2. Migrate all existing images (recommended)

Back up the database and old upload files. Pause CMS editing during the transfer so the database and files remain consistent. Run the migration from a full checkout or a maintenance staging copy that contains `assets/site-images`, before switching the live application. Configure its environment and run from the project root:

```bash
npm ci
npm run build
npm run db:migrate
npm run storage:migrate -- --uploads /var/lib/st-antonys/uploads
npm run storage:migrate -- --uploads /var/lib/st-antonys/uploads --apply
npm run production:check
```

Use the old directory that actually contains the files. On your server the other candidate is `/var/www/stantonysneyveli.in/live/server/uploads`. The argument is a **source directory**, not a new storage location. On Windows use an absolute path such as `D:\SAS\server\uploads`.

The CI deployment excludes the root `assets/` source directory and all upload/transfer directories. Thus the release uses MinIO without copying image folders onto the web server. Initial migration/import commands need the full maintenance checkout; normal production builds and readiness checks need only the code, database and MinIO. Once this collection has been transferred, do not upload it again for every deployment.

The first migration command is read-only. The second uploads missing objects and verifies their actual bytes with SHA-256. Both use the database to include all media, including drafts, archived records and PDFs, then include the 54 prepared site assets. Missing thumbnails are generated in memory. Missing originals stop the migration; recover them from the old upload backup first. Different existing MinIO objects stop the migration instead of being overwritten. An interrupted transfer can be rerun: matching objects are verified and skipped. It never deletes source files or edits captions, publication status, media IDs or gallery associations.

For the original school asset collection only, `npm run assets:import -- --apply` can restore missing source-imported photos directly into MinIO while preserving existing database edits. It cannot recover later uploads made by school staff. `npm run storage:migrate -- --site-only --apply` transfers just the homepage/logo assets.

Apply the updated Apache proxy configuration, including the `/images/` compatibility proxy for old saved cover URLs. Use the updated systemd unit: it no longer needs `school-private` or a writable uploads directory. After installing the unit and activating the release:

```bash
sudo systemctl daemon-reload
sudo systemctl restart school-api
```

Verify homepage images, gallery photos, a draft visible only while logged in, an upload and a replacement. Do not remove old source files until the transfer is verified and backups are retained. Rolling back to an older filesystem-based release requires its original upload files and configuration.

## 3. Upload the prepared group of images manually

The prepared `artifacts/minio-school-images-2026-11-22.zip` contains **360 image objects** for the original collection: 102 originals, 204 responsive versions and 54 site assets. This ZIP does not include any later uploads that exist only on the production server; use the database-driven migration above for those.

Extract the ZIP on your computer. Open the `stantonys` bucket in the MinIO console and upload the contents using **exactly these prefixes**:

```text
stantonys/
  media/
    239d62aa3e6480e752740514b14d5b9....webp
    <same-name>-640.webp
    <same-name>-1200.webp
    ...
  assets/
    images/
      logo.webp
      campus-chess.webp
      ...
```

The filename above is illustrative: use the complete filenames in the ZIP, unchanged. Do not type a filename as a shell command. Do not upload the ZIP itself, rename files, flatten the directories, add a second `stantonys` folder inside the bucket, or use `schl_doc` camera filenames. In consoles without folder upload, create/open `media` and upload the files from the extracted `media` directory; then create/open `assets/images` and upload the extracted site images. Keep `OBJECTS.json` and `README.txt` locally as verification records.

The database must already contain the corresponding media/gallery records (your existing database import does this). Uploading objects alone does not create gallery entries. After manual upload run the read-only migration command above to compare hashes, then `npm run production:check` on the server.

## 4. Future uploads and replacements

Use **Admin → Media library → Upload file** to select a group of JPEG, PNG or WebP images. The existing batch uploader sends them individually through the compression pipeline into MinIO. Add English and Tamil captions, then publish approved photos and add them to the relevant gallery. Direct uploads of arbitrary new camera files into MinIO bypass compression, validation and database registration; use the admin uploader for new content.

To update an existing photo, open **Media library → Edit → Replace file**, select the new image and save. Caption and publication changes are saved in the same database transaction. The media ID stays the same, so all linked galleries, staff cards and events use the new image. Once the replacement succeeds, the old original and both thumbnails are deleted. Replacing a PDF requires another PDF. Changing a card to point to another existing library image does not delete that library image, because it may be used elsewhere.

Deleting an unused media-library record also deletes its MinIO objects. Referenced media cannot be deleted until those references are removed. If MinIO deletion fails, a database outbox retries automatically every minute and after restarts. A partially failed new upload is eligible for cleanup after 24 hours, with a database-reference check to protect successfully committed images. Run `npm run storage:cleanup` to process due tasks manually; rerun if more than 100 tasks are pending. Check service logs and DeleteObject permission if tasks persist.

## 5. Operations and handover

`npm run production:check` verifies the database, active administrator, published originals/thumbnails, all site assets, deletion queue, bucket access, disabled versioning and rejection of anonymous object reads. A successful local check is not evidence that the updated code has been deployed to the public server.

Back up the database and MinIO objects together, including drafts. Test restoration into a separate private bucket before changing production. Keep service-account credentials in the school's protected password manager; rotate them in the API environment and restart the service when necessary. MinIO service credentials are separate from CMS login accounts. Existing CMS users and roles are unchanged.

Technical support / future reference: **Bharathwaj TP — 9600641464**. The general school administrator handbook is in `docs/handover/`; this document supersedes its filesystem-upload storage and backup instructions.

Implementation reference: [AWS SDK S3 operations](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html), used with MinIO's S3-compatible endpoint.
