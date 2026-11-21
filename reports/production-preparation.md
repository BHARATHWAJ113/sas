# Website redesign and production preparation

Prepared 21 November 2026. Support contact: Bharathwaj TP, 9600641464.

## Delivered

- Branded homepage welcome with animated crest presentation, orbit and progress line, skip control, once-per-tab-session behaviour and reduced-motion support. Other data and action waits use a shared animated book loader; initial HTML has a matching boot indicator.
- School-themed login inspired by the supplied video, with animated book, pencil and schoolbag characters, password privacy animation, show/hide control, Caps Lock hint and real existing authentication.
- Rounded admin header, sidebar, dashboard and forms in a common navy, gold, blue and terracotta palette. Mobile menu supports backdrop and Escape dismissal. Dashboard metrics use database counts; no sample business charts were introduced.
- Persistent light/dark control on the public site and staff workspace, including first-paint theme selection, form fields, dialogs and email controls.
- Role-safe dashboard response: only ADMIN receives audit history and VIEWER receives no enquiry count.
- Production environment validation; read-only content/storage readiness command; staged deployment script with build, migrations, health check and application rollback; updated Apache, systemd and protected-environment instructions. GitLab verifies before a manual production deployment.
- Seven-page editable Word and printable PDF school handbook under docs/handover. Includes the existing administrator email, every CMS section, roles, publishing, enquiries/email, recovery, ownership and support. Passwords are omitted and were not changed.

## Verification

- Fresh dependency installation completed from the committed lockfile. An initial attempt encountered a Windows file lock from the temporary preview server; after stopping that server, the fresh installation completed.
- ESLint and production build pass. Prisma generation succeeds with the patched Effect dependency.
- 103 standard automated tests pass, including production configuration and dashboard role checks. Four opt-in MySQL integration tests pass separately; their controlled transport sends no external mail.
- Production dependency audit reports zero vulnerabilities. Effect 3.22.1 is pinned by a root override and lockfile for the [upstream security fix](https://github.com/advisories/GHSA-7589-6fvf-x4pw); reassess the override when Prisma updates its dependency. This result refers to `npm audit --omit=dev`.
- Built frontend reviewed through local preview with the production Content Security Policy: login errors and pending state, password controls, once-per-session welcome, persistent theme, dashboard and gallery editor at 1440px and 390px in both themes, mobile Escape dismissal, reduced motion and blob upload preview. No tested page runtime errors or CSP violations.
- Local readiness check passes: one active ADMIN and all 98 published media originals present. Seven labelled demo events, eleven demo pages and three demo announcements were archived locally without deletion. Four topper photos remain draft for spelling review.
- Deployment shell syntax passes. CI, Apache and systemd configuration were prepared and reviewed, not executed against the hosting server.
- All seven handbook pages were rendered and visually reviewed. The preferred LibreOffice renderer was unavailable on Windows, so the installed Microsoft Word exported PDF and the bundled PDFium runtime rendered the page images for review.

## Remaining live acceptance

No deployment, push, password reset or live email was performed. Follow deployment/PRODUCTION.md to configure shared secrets and media permissions, verify a fresh restorable backup, deploy, and check external HTTPS, real staff login, approved content and controlled email delivery. The primary email was verified in the configured local database and must be confirmed against the production database. Local SMTP is configured; the preview and integration checks deliberately did not run the live mail worker.
