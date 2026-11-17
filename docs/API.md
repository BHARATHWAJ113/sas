# API contract

All JSON errors return `{ "error": "Readable explanation", "fields": { "fieldName": "Validation error" } }`. `fields` is supplied for validation failures. Unknown or unpublished records return 404, malformed data 422, conflicts 409, rejected origins/roles/CSRF 403, expired sessions 401, unavailable persistence 503. Public collections use `{items,total,page,pages}`. Pagination is one-based and bounded to 50 records per request.

## Public

| Method | Route | Behaviour |
|---|---|---|
| GET | `/api/health` | Database readiness; explicit read-only demo status |
| GET | `/api/site` | Public settings and published interface translations |
| GET | `/api/pages/:slug` | Published bilingual page |
| GET | `/api/events` | `search`, `category`, `period=all/upcoming/past`, `page`, `limit`; category facets included |
| GET | `/api/events/:slug` | Published event and published media relationships |
| GET | `/api/activities` | Published activity cards in published categories. Filter by category slug and paginate with `page` and `limit`. Includes available categories. Only published image metadata is returned. |
| GET | `/api/announcements` | `kind=ANNOUNCEMENT/NOTICE/NEWS/NOTICE_BOARD`; only active publication windows |
| GET | `/api/galleries` | Published albums and published images |
| GET | `/api/gallery-media` | Paginated published photos with album counts. Filter with `category` (album slug). Shows the bundled school archive and labeled illustrations when no albums have published photos. |
| GET | `/api/media/:id` | Published file, or staff-authorised draft preview; PDFs download with a sandbox policy |
| GET | `/api/sitemap.xml` | Published static pages and events; configure `SITE_URL` |
| POST | `/api/enquiries` | Validate, persist in MySQL, then return 201 with reference ID |

Enquiry fields: `parentName`, `studentName`, `email`, `phone` (Indian mobile), `grade` (`LKG`, `UKG`, `1`–`12`), `message`, `locale` (`en`/`ta`), `consent:true`, optional empty `website` honeypot. No uploaded personal documents are collected. Rate limit: 5 submissions per hour per client IP.

All write requests require an `Origin` matching `CLIENT_ORIGIN`. Browser requests through Vite or Apache use that website's origin. Non-browser clients must explicitly include an allowed Origin as well.

## Authentication

`POST /api/auth/login` accepts `{email,password}`. It returns `{user,csrfToken}` and sets an opaque HttpOnly SameSite=Strict cookie scoped to `/api`. Only the SHA-256 hash of the random session token is stored in MySQL. Passwords use bcrypt cost 12. One active session per user; sessions expire after `SESSION_DAYS` (default 1). Sign-in is limited to 10 attempts per 15 minutes per IP.

`GET /api/auth/me` restores `{user,csrfToken}`. Every authenticated mutation requires `x-csrf-token` and the session cookie. `POST /api/auth/logout` revokes the session and clears the cookie. Account updates revoke all that user's sessions. There is no public registration or password reset endpoint; an administrator manages staff accounts.

## Staff CMS

| Resource | Read | Create/update | Delete |
|---|---|---|---|
| pages, events, activities, activity categories, announcements, translations, galleries, media | ADMIN / EDITOR / VIEWER | ADMIN / EDITOR | ADMIN |
| site settings | ADMIN / EDITOR / VIEWER | ADMIN | ADMIN |
| admission enquiries | ADMIN / EDITOR | ADMIN / EDITOR: update status | ADMIN |
| users and role assignments | ADMIN | ADMIN | ADMIN (except self) |
| audit logs | ADMIN | System only | None |
| email history and sending | ADMIN | ADMIN | Enquiry-linked emails follow enquiry deletion |

Generic content: `GET /api/admin/:resource?page=1&limit=20`, `GET /api/admin/:resource/:id`, `POST /api/admin/:resource`, `PUT /api/admin/:resource/:id`, `DELETE /api/admin/:resource/:id`. Resource names are `pages`, `events`, `activities`, `activity-categories`, `announcements`, `translations`, `galleries`, `settings`, `media`, `users`. Deletion is permanent and recorded in the audit log. Use ARCHIVED for reversible content withdrawal. Long bodies are omitted from lists and returned by the detail route for editing.

`GET /api/admin/activity-category-options` supplies the category selector for editors and administrators. An activity references one category and can reference an image via `imageId`. Reassign or delete associated activities before deleting their category.

`GET /api/admin/dashboard`, `GET /api/admin/roles`, `GET /api/admin/audit-logs`, `GET /api/admin/enquiries`, `PATCH /api/admin/enquiries/:id` (`{status:"NEW"|"CONTACTED"|"CLOSED"}`) are dedicated routes. Roles are fixed policy roles, not arbitrary permission strings.

Upload: `POST /api/admin/media/upload`, multipart fields `file`, `alt`, `altTa`. JPEG/PNG/WebP/PDF only; 8 MB limit; magic-byte detection; images decoded with a 25-megapixel ceiling, auto-oriented, resized to 2400px and re-encoded to metadata-free WebP. Files start DRAFT. Set media PUBLISHED separately. Attach event/gallery photos using `imageIds`; an event attachment is a PDF `attachmentId`; cover is a local asset or `/api/media/:id` URL. SVG, HTML, executables and archives are rejected. PDF content is not antivirus-scanned; inspect approved files before publishing and add host-level scanning if your operation requires it.

Every CMS write records actor, action, entity, record ID and timestamp in the same database transaction. Audit logs omit passwords and enquiry text. No server route directly exposes the uploads directory. Deleted media records become inaccessible immediately; unreferenced disk files are retained for offline backup retention/purge.

## Email

`GET /api/admin/emails?page=1&status=PENDING` defaults to 20 history records, counts and whether sending is configured. `GET /api/admin/emails/:id` returns message details as plain text.

`POST /api/admin/emails` accepts `{to,cc:[],bcc:[],subject,html,attachmentId:null}`, plus an `Idempotency-Key` header. The attachment is an optional validated image/PDF from the media library, up to 8 MB. It queues a sanitized message and returns 202 with its reference and current status. `POST /api/admin/emails/:id/retry` queues eligible failed messages. Both require ADMIN authorization and CSRF protection.

Enquiry submissions accept an `Idempotency-Key` header. The response includes `emailStatus=pending/unavailable`. The enquiry and its two email jobs are stored in one transaction. See [email operations](EMAIL-AND-CONSENT.md) for setup, limits and status meanings.

## Expanded record queries

Admin collections accept `page`, `limit` (1–200, default 20), `search` (100 characters maximum), `column`, `status`, `from`, `to`, `sort` and `direction=asc|desc`. Dates use `YYYY-MM-DD` and the school's IST day boundaries. Columns are validated against `shared/record-fields.js`; unsupported columns/statuses and reversed ranges return 422. Internal media pickers can use smaller page sizes. Public collection limits remain unchanged. Responses include `items`, `total`, `page`, `limit`, `pages`. The UI offers 20/50/100/200 records.

`GET /api/admin/enquiries/:id` requires ADMIN and returns submitted details, current email statuses, staff activity and unexpired optional metadata. Editor enquiry collections exclude metadata.

## Homepage announcements

`GET /api/home-announcements` returns at most 50 popup-enabled, published records within their start/end window, ordered by descending `priority`. Draft images are omitted. Public news/notice collection bodies are omitted; `GET /api/announcements/:slug` returns the full published article.

Announcement writes support `showPopup`, `priority`, `announcementType` (`NOTICE|ADMISSION|FESTIVAL|HOLIDAY|EVENT|MESSAGE`), `imageId`, bilingual `footerMessage`, `wishes`, `ctaLabel` fields and a local `ctaPath`. Future `publishedAt` values schedule a PUBLISHED record. Reminder choices are stored locally per announcement/revision, not as visitor tracking.

## Optional enquiry metadata

Enquiries can include `metadataConsent:true` and validated `metadata`. Without that explicit flag, supplying metadata returns 422. Browser metadata permits available screen/language/time-zone/network data and a reported location permission state. Coordinates require `permission:"granted"`. IP comes from the configured Express/proxy context, never the client payload. Optional enquiry metadata expires under `VISITOR_RETENTION_DAYS`. See [the enhancement guide](ENHANCEMENTS.md) for privacy details and operational limits.
