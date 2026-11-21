# St. Antony’s School · Neyveli

The dynamic fees, honours, staff, toppers and gallery extension is documented in [the implementation and deployment guide](reports/school-sections-implementation.md). The source photo audit is available as [Markdown](reports/school-image-quality-report.md) and [CSV](reports/school-image-quality-report.csv), with a separate [cleanup report](reports/school-assets-cleanup-report.md).

A complete React/Vite public school site and role-based Express CMS, with Prisma/MySQL persistence, bilingual English/Tamil content, event publishing, validated media uploads and admission enquiries.

Gmail SMTP, the durable email queue, and administrator email history are described in [email operations](docs/EMAIL-AND-CONSENT.md). Configure the server email variables and apply the new migrations before enabling email.

Homepage popup reminders, multiple office recipients, admin filters/pagination, attachments and optional enquiry details are covered in [the enhancement guide](docs/ENHANCEMENTS.md).

**Local verification:** the email and enhancement migrations have been applied to the configured MySQL database. Automated database tests verified staff authentication, publishing, uploads, enquiry storage, duplicate prevention and concurrent email queue claims. Gmail sending remains disabled until the school configures its approved SMTP account. Demo mode remains a separate read-only preview and disables enquiry submission and staff login.

## Start the preview

Use Node.js **22.12+ LTS or 24 LTS** and npm 10+. Implementation checks also passed under the supplied Node 26 environment.

```powershell
cd D:\SAS
npm ci
npm run db:generate
npm run dev:demo
```

Open **http://127.0.0.1:5173**. The API runs at **http://127.0.0.1:4000/api**. Staff entry is **/admin**. Ctrl+C stops both development processes. On fresh copies use `npm ci`; the committed lockfile pins all resolved dependencies.

`dev:demo` serves sample events through the real API without a database. It is explicitly read-only. It does not supply mock staff credentials or accept enquiries. Production startup rejects demo mode and insecure cookies.

## Replace the homepage video

The homepage ships with a muted, clearly labeled motion preview made from the website’s existing illustrations. To use official footage, place an approved MP4 under `client/public/videos/` and set `VITE_HOME_VIDEO=/videos/your-school-video.mp4` in `client/.env`. Restart Vite or rebuild the frontend for the change to take effect. Keep important subjects near the center of the frame for the mobile crop.

## Configure real MySQL

Use MySQL 8.4 LTS, a database named `st_antonys`, and a dedicated application account. Create the database with `utf8mb4` / `utf8mb4_unicode_ci`. Grant that account privileges on this database only; migrations need schema privileges. A separately restricted runtime account is recommended after migration.

If Docker is installed, the included Compose file starts a loopback-only MySQL service with persistent storage:

```powershell
Copy-Item .env.example .env
# Replace BOTH placeholder passwords in root .env before continuing.
docker compose up -d mysql
```

For a locally installed or managed MySQL server, create the database/account with your database administration tools instead. Compose is optional and was not run in this environment. Do not use `docker compose down -v` on a database whose contents you want to retain.

Create environment files only if they do not already exist, preserving your local settings:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Edit `server/.env`:

```dotenv
NODE_ENV=development
DATABASE_URL=mysql://school:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:3306/st_antonys
DEMO_MODE=false
CLIENT_ORIGIN=http://127.0.0.1:5173,http://localhost:5173
SITE_URL=http://127.0.0.1:5173
COOKIE_SECURE=false
TRUST_PROXY=0
UPLOAD_DIR=./uploads
SEED_ADMIN_EMAIL=your-school-admin-address
SEED_ADMIN_PASSWORD=your-unique-password-with-at-least-12-characters
SEED_DEMO=true
```

Use a real valid email address for `SEED_ADMIN_EMAIL`. These are instructions, not supplied credentials. Passwords accept 12–72 UTF-8 bytes. URL-encode reserved characters in the database password. For remote MySQL, use TLS with `DATABASE_SSL=true` and, where needed, `DATABASE_SSL_CA=/absolute/path/to/ca.pem`. Server environment variables take precedence over `.env`; do not put any database credential in a `VITE_` variable.

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

After a successful seed, remove `SEED_ADMIN_PASSWORD` from the runtime environment and set `SEED_DEMO=false`. Log in using the account you explicitly created. Existing users, passwords, roles and edited demo records are preserved by subsequent seed runs; the seed uses upserts with empty updates. The seed never deletes records or resets passwords. `SEED_DEMO=true` inserts only clearly labeled samples. Archive or delete those samples in the CMS when your verified content is ready.

## What is included

- Public routes: Home, About, Academics, Admissions, Infrastructure, Student Life, Gallery, News, Events, Event Details, Notices, Contact, Privacy and a 404 view.
- All fifteen requested home sections, with original imagery and the supplied official crest.
- English/Tamil interface and content, self-hosted Inter and Noto Sans Tamil, persistent language preference.
- Events: API search, category facets, upcoming/past filters, pagination, IST dates, details, photographs, optional PDF attachment, published-only public visibility.
- Staff workspace: dashboard; bilingual pages and SEO; interface translations; announcements, news and notices; event lifecycle; gallery albums; uploads; enquiry tracking; users/role assignments; public settings; audit logs.
- Authentication: bcrypt passwords; opaque database-backed sessions; hashed session tokens; HttpOnly cookies; role checks; origin and CSRF checks; login/API/enquiry rate limits; strict Zod validation.
- Uploads: 8 MB limit; magic-byte validation; image decoding, dimension limits and metadata stripping; private draft files; safe PDF downloads.
- Accessible navigation, native modal focus trapping, keyboard-operable galleries, form labels, alt text, loading/error/empty states and reduced-motion support.

## Editorial workflow

The original `assets/st_antonys_logo.jpeg` is preserved. `client/public/images/logo.webp` is an optimised display copy. The About page also uses four archival images supplied in `assets/schl_doc`. The general campus, classroom and sports illustrations remain labeled as AI-generated scenes. See [asset provenance and prompts](docs/ASSETS.md).

The school history and 2026–27 student handbook supply the baseline content, including contact details, vision and mission, leadership appointments, facilities, activities and admission guidance. The Events page also shows selected handbook dates separately from the sample event cards. Exact admission dates, current leadership tenure and current office hours need confirmation from the school. See [school source notes](docs/SCHOOL-SOURCES.md) for the page numbers and portrait filename references.

1. Upload approved images/PDFs in Media. Add meaningful English and Tamil alt text. Files start DRAFT.
2. Publish the media files. Create an event or gallery and select photos from the paginated media library. Set an event cover and optional PDF attachment.
3. Complete both languages. Keep the demo flag enabled while information is unverified. Choose DRAFT, PUBLISHED or ARCHIVED. Public API responses never return draft/archived content.
4. In Pages, use the existing route slugs. `home` changes the welcome copy and homepage SEO. Other page content appears within the corresponding designed page. Use English / Tamil interface keys (listed in `client/src/i18n.js`) for hero, headings, vision, mission and other layout copy. Page and event SEO fields affect document metadata.
5. Put office contact details and site-wide SEO in Site settings. Only settings with the public toggle are exposed. Setting keys are allowlisted, preventing secret configuration from being published through the CMS.
6. Add an ANNOUNCEMENT for the top bar. Notices and announcements share the notice board; NEWS appears in News. Publication and expiry timestamps govern visibility.
7. Under **Activity categories**, add a bilingual filter label, pick an illustration, set the display order and publish the category. Under **Activities**, add both language versions, assign the category and optionally choose a photo from Media. A card appears on Home and Student Life when both the activity and its category are published. Archive a category to hide its cards together.

For an existing installation, run `npm run db:migrate` and then `npm run db:seed` after updating. The seed adds six activities from school records and four categories while preserving edits to existing records.

Role permissions:

| Role | Permission |
|---|---|
| ADMIN | Full CMS, users/role assignment, settings, deletion and audit review |
| EDITOR | Create/edit/publish/archive content, upload media, read/update enquiries |
| VIEWER | Review content; no writes, private enquiries, users or full audit logs |

Roles are deliberate fixed policies, seeded into the roles table. Staff accounts cannot disable, demote or delete themselves. Updating an account revokes its sessions. There is no public registration. Use archive for reversible withdrawal; deletion is permanent and audited. A school administrator can set a new staff password in Users; there is no email delivery or reset link pretending to work.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev:demo` | Read-only API demo + Vite preview |
| `npm run dev` | Database-backed API + Vite using `server/.env` |
| `npm run db:generate` | Generate Prisma JavaScript client |
| `npm run db:migrate` | Apply committed migrations (non-resetting) |
| `npm run db:seed` | Ensure roles and optional admin/demo records |
| `npm run db:studio` | Local Prisma database inspector |
| `npm run lint` | ESLint across application and tests |
| `npm test` | API/security, request-cache and loopback SMTP tests |
| `npm run test:mysql` | Opt-in real MySQL integration test (see below) |
| `npm run build` | Generate Prisma client and build `client/dist` |
| `npm start` | Start production Node API; Apache serves the frontend |
| `npm run preview -w client` | Inspect built frontend locally; production API routing still requires a proxy |

## Validation and limits

Build and lint passed. API tests validate publication boundaries, expiry windows, search/pagination, enquiry validation and honest write failure, staff session token hashing, role restrictions, CSRF, upload rejection, self-account protection and transactional audit writes. Tests use Supertest loopback requests. The Codex network sandbox initially blocked those requests; they passed when run with local-network permission. No sandbox workaround is required in an ordinary local terminal.

All public routes, the 404 page and staff login were measured in the browser at **1440px, 768px and 390px**, with no document horizontal overflow. English/Tamil switching, event search/filter/pagination, event navigation, gallery and notice dialogs, and disabled demo enquiry submission were also checked. The new email composer, form acknowledgements and scroll-to-top control were checked using an isolated browser fixture; database behavior was verified separately with real MySQL integration tests. Evidence is under the local ignored `artifacts/` directory. Live Gmail credentials and delivery have not been tested.

To run the opt-in database test, apply migrations to a **dedicated test database** first, set `TEST_DATABASE_URL` to it in your shell, then run `npm run test:mysql`. The test creates uniquely prefixed temporary records, exercises real sign-in, publishing, upload, enquiry/outbox persistence and concurrent queue workers, then cleans up only those records. Its test transport never sends external email, and worker queries are scoped to the run's records. It does not reset a database. Do not use your production database for tests.

Enquiry and administrator email quotas are enforced in MySQL. General ingress rate limiting uses process-local memory; use a shared ingress limiter before horizontal scaling. CMS bodies render as plain text; outgoing email rich text is separately sanitized. Gmail enquiry notifications and administrator correspondence use a durable outbox. SMS, payments and online admission decisions are outside this implementation. Directions open through a link to Google Maps. Configure retention and backups. API details are in [docs/API.md](docs/API.md).

## Apache deployment

1. Put the application outside the public document root. Install dependencies with `npm ci`, configure production environment, run migrations, seed the initial administrator once, and build with `npm run build`. Preserve `server/uploads` (or a separate absolute upload directory) across releases.
2. Set `client/.env` to `VITE_API_BASE=/api` and your verified HTTPS `VITE_SITE_URL` **before building**. Set server `SITE_URL` to the same verified origin.
3. Set server `NODE_ENV=production`, `DEMO_MODE=false`, `COOKIE_SECURE=true`, `CLIENT_ORIGIN=https://your-domain`, and `TRUST_PROXY=1` only for a single trusted Apache reverse proxy. Keep the API bound to loopback. Never expose a database or Node admin port publicly.
4. Point Apache DocumentRoot to **client/dist only**. Its `.htaccess` includes the SPA rewrite, directory-listing restriction, security headers and static caching. Do not serve `server`, `.env`, Prisma files, logs or the original repository as the document root.
5. Enable Apache `ssl`, `rewrite`, `headers`, `proxy` and `proxy_http`. Adapt [deployment/apache-vhost.conf](deployment/apache-vhost.conf) for your paths, domain and real certificates. `/api/` proxies to `127.0.0.1:4000/api/`; `/sitemap.xml` proxies to the published-content sitemap. Add the final sitemap URL to `client/public/robots.txt` and rebuild.
6. Run Node under your host's process manager. An example least-privilege systemd service is provided at [deployment/school-api.service](deployment/school-api.service). Create its unprivileged OS user and upload directory, adjust Node's absolute executable path, protect the environment file, enable the service and confirm `/api/health` reports `database:connected`.
7. Verify HTTPS sign-in/logout, CSRF, all roles, published content, direct SPA URLs, a real stored enquiry and approved upload/downloads on the deployed domain. Back up MySQL and uploads and test restore. No hosting account or external deployment was modified in this task.

**Shared Apache hosting without Node/reverse-proxy support:** upload the frontend build as static files and host the Node API on a separate Node-capable host. For staff cookies, use a same-site HTTPS API subdomain, set `VITE_API_BASE` to that API URL, list the frontend origin in `CLIENT_ORIGIN`, and adapt CSP `connect-src` and `img-src` for the API origin. The recommended deployment is same-origin via a reverse proxy. A static-only upload cannot provide real CMS or enquiry persistence; the UI reports unavailable instead of false success.

## Folder structure

```text
D:\SAS
├── assets/st_antonys_logo.jpeg       # supplied, preserved
├── client/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── .htaccess
│   │   ├── robots.txt
│   │   └── images/                   # logo, originals, 640/960px variants
│   ├── src/
│   │   ├── main.jsx
│   │   ├── api.js
│   │   ├── context.jsx
│   │   ├── i18n.js
│   │   ├── components.jsx
│   │   ├── pages.jsx
│   │   ├── AnnouncementPopup.jsx
│   │   ├── popup-policy.js
│   │   ├── OptionalMetadata.jsx
│   │   ├── visitor-metadata.js
│   │   ├── SiteHeader.jsx
│   │   ├── Gallery.jsx
│   │   ├── ActivityExplorer.jsx
│   │   ├── HeroVideo.jsx
│   │   ├── HomeHighlights.jsx
│   │   ├── SchoolRecords.jsx
│   │   ├── useScrollReveal.js
│   │   ├── school-copy.js
│   │   ├── styles.css                # with component CSS, public-design.css and public-motion.css
│   │   └── admin/{Admin.jsx,admin.css,EmailManager.jsx,email.css,RecordControls.jsx,RecordDetails.jsx,SearchableSelect.jsx}
│   └── dist/                         # generated static production build
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── prisma.config.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       ├── 202610310001_initial/migration.sql
│   │       ├── 202611040001_activities/migration.sql
│   │       ├── 202611070001_email_consent/migration.sql
│   │       └── 202611080001_enhancements/migration.sql
│   ├── src/
│   │   ├── index.js
│   │   ├── preview.js
│   │   ├── app.js
│   │   ├── database.js
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── admin.js
│   │   ├── uploads.js
│   │   ├── gallery.js
│   │   ├── enquiries.js
│   │   ├── email-content.js
│   │   ├── email-worker.js
│   │   ├── email-admin.js
│   │   ├── email-addresses.js
│   │   ├── admin-list.js
│   │   ├── metadata.js
│   │   ├── idempotency.js
│   │   ├── public-cache.js
│   │   └── demo.js
│   ├── tests/{api.test.js,email.test.js,client-requests.test.js,enhancements.test.js,mysql.integration.test.js}
│   ├── generated/client/             # generated Prisma client, ignored
│   └── uploads/.gitkeep
├── scripts/test-mysql.mjs
├── deployment/{apache-vhost.conf,school-api.service}
├── shared/{school-profile.js,school-activities.js,record-fields.js}
├── docs/{API.md,ASSETS.md,SCHOOL-SOURCES.md,EMAIL-AND-CONSENT.md,ENHANCEMENTS.md,VERIFICATION.md}
├── artifacts/                        # local screenshots and layout measurements
├── .env.example                      # optional Compose secrets template
├── compose.yaml
├── eslint.config.js
├── vitest.config.js
├── package.json
├── package-lock.json
└── README.md
```

## Reference inspection

Both live references were opened in the browser before implementation. [Malla Reddy](https://www.mallareddyschool.com/) informed the full-width image hero, compact sticky navigation, academic stages, facilities/gallery hierarchy and footer. [Holy Angels events](https://holyangelsmhss.in/events/) informed the editorial events introduction and image-card approach. The references' navigation and actual event cards were inspected. Their underlying source, logos, photos, text, school claims and forms were not copied. Every breakpoint on the references was not exhaustively tested; the new implementation was tested independently at the requested three widths.
