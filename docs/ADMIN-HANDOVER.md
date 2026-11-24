# St. Antony’s website administration handover

Prepared for St. Antony’s Matriculation Higher Secondary School, Neyveli.

Technical reference: **Bharathwaj TP · 9600641464**.

## Secure administrator access

The production administration page is `/admin`. Passwords and MinIO secret keys must not be written in this guide, committed to Git, or sent in an ordinary message. Hand them to the authorised school administrator through a separate secure channel.

The first administrator is created by setting `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` on the server and running `npm run db:seed`. The password must contain at least 12 characters. Remove those two seed values from the environment after the account is created. Additional accounts are managed under **Users & roles**:

- `ADMIN` — full content, user, settings, enquiry and audit access.
- `EDITOR` — normal content-management access.
- `VIEWER` — read-only administration access.

Disable accounts that are no longer required. Do not share one account among several staff members.

## New homepage controls

### Home carousel

Open **Home carousel** in the admin panel. Create a record, choose `IMAGE` or `VIDEO`, enter the English caption, generate/review the Tamil and Hindi translations, select a published image or MP4, set the duration and display order, then publish it. MP4 videos may also have a poster image. Only published slides are shown publicly.

### Principal’s Desk

Open **Principal’s Desk**. Edit the heading, principal’s name, designation and message in English, Tamil and Hindi, select the portrait, and publish the record. The public layout places the message on the left and the portrait on the right immediately below the homepage carousel.

### Leadership through the years

Open **Leadership through the years**. Each record supports the leader’s name, designation, optional tenure, contribution, optional quotation, portrait, language variants, publication status and display order. Public cards are compact; selecting a card opens its full profile in a modal.

## Group image and video upload to MinIO

Use the website’s **Media library → Batch upload** screen instead of copying files directly into the MinIO bucket. The admin upload creates the required database record, optimises images with high-quality WebP variants, stores the objects in MinIO, and keeps the public URL stable.

1. Select up to 30 JPEG, PNG, WebP, MP4 or PDF files per batch; each file may be up to 30 MB.
2. Enter meaningful English alternative text for every file, then generate and review Tamil and Hindi text.
3. Select **Upload / retry remaining files**. A failed batch can be retried; completed files are not uploaded twice.
4. Open the Media library and publish only the approved records.
5. Select the published media from the carousel, Principal’s Desk, leadership, gallery, staff, toppers or other content editor.

When an existing media record is replaced through the Media library, the server uploads and verifies the new object before deleting the old original and its variants. Do not manually overwrite or delete bucket objects because that would leave database references inconsistent.

Required server-only MinIO settings:

```dotenv
MINIO_ENDPOINT=https://minio.tecnozard.com
MINIO_URL=https://minio.tecnozard.com/stantonys
MINIO_BUCKET=stantonys
MINIO_REGION=us-east-1
MINIO_ACCESS_KEY=provided-through-secure-channel
MINIO_SECRET_KEY=provided-through-secure-channel
```

The endpoint setting contains the service origin; `MINIO_URL` contains the public bucket base URL. Keep the access and secret keys out of source control and browser configuration.

## Production release procedure

From the deployed release directory, after backing up the database:

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run home:import -- --apply
npm run build
npm run production:check
```

`home:import` adds only missing stable records and preserves later CMS edits. Restart the API service only after the build and production check pass. Verify `/`, `/about`, `/admin`, one public image, one carousel video (when configured), all three languages, light/dark mode, and the production enquiry email path over HTTPS.

The supplied homepage static assets were SHA-256 verified in MinIO. If a future release changes one of the versioned site assets, first run a read-only preview and then the explicit replacement command:

```sh
npm run storage:migrate -- --site-only
npm run storage:migrate -- --site-only --apply --replace-site
npm run storage:migrate -- --site-only
```

The final read-only run must report zero missing and zero different objects. The migration never deletes local source files.

## Routine maintenance

- Review draft media and unpublished content monthly.
- Keep one active school-owned `ADMIN` account and a separate technical-support account only while support is required.
- Back up MySQL and document MinIO bucket lifecycle/backup policy.
- Run `npm run production:check` after content migrations and before every release.
- Review the audit log after user, media, homepage or leadership changes.

