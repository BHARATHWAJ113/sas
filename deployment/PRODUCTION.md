# Production operation and school handover

Prepared 21 November 2026 for St. Antony’s Matriculation Higher Secondary School, Neyveli. Support: **Bharathwaj TP · 9600641464**.

This repository is prepared for deployment to `https://stantonysneyveli.in`. These changes have **not been deployed** by this task. Local verification cannot certify the live server, DNS, TLS, backups or SMTP delivery.

## Access ownership

- School login: `https://stantonysneyveli.in/admin` after deployment.
- Existing primary account verified in the configured local database: `stantonysneyveli@yahoo.com`, ADMIN, active. No password was changed. Confirm that the production database contains the same approved account before handover.
- Give each staff member an individual account through Users & roles. ADMIN controls users, settings, audit logs and email; EDITOR manages content and the enquiry list; VIEWER reviews content. Detailed enquiry metadata and email history require ADMIN.
- Transfer the initial password, hosting access, database access, DNS account, SMTP app password and recovery details through a school-approved private channel. Do not put them in this repository or the school guide. The website account is separate from the hosting and mailbox accounts.
- Keep two approved administrators for recovery. An administrator can set another account’s password; account changes revoke that user’s sessions. There is no self-service password-reset email flow. If all administrators are locked out, contact the maintainer for verified recovery. Running seed does not reset an existing password.

## One time server setup

Use an operator with authority over this server. Install Node 22.12 or newer, npm, MySQL, Apache, TLS certificates, curl, flock and rsync. Use the committed lockfile. Keep MySQL and the API private; the API listens on loopback port 4000. This configuration assumes Apache is the one trusted reverse proxy. Adjust the proxy policy if the infrastructure differs.

Use this layout:

```text
/var/www/stantonysneyveli.in/
  incoming/<commit>/       uploaded source
  releases/<release>/      application releases
  shared/server.env        protected production configuration
  shared/backup-confirmed  operator backup confirmation timestamp
  live -> releases/...     active release
MinIO stantonys bucket       persistent private image/media storage
```

Create `school-api` as an unprivileged service user and `school-web` as the shared group for readable release files. Add the deployment operator and Apache user as appropriate. Set up MinIO using [MINIO.md](./MINIO.md). The API no longer needs a writable uploads directory or school-private group. Keep the bucket private: the API performs publication and authentication checks before streaming images.

Copy `server.env.production.example` to shared/server.env and configure it privately. Owner should be the deployment operator, group school-private, mode 0640, inside a shared directory with group school-private and mode 0750. Keep Apache out of school-private. Use a unique URL-encoded database password; replace every placeholder. Set NODE_ENV=production, DEMO_MODE=false, SEED_DEMO=false, COOKIE_SECURE=true and the supplied HTTPS site origins. The application rejects unsafe production settings. Keep `VITE_` values public; never use them for secrets.

If `live` is currently a real directory, first back up and inspect its absolute path, stop the service in an agreed maintenance window, move it to a named release **within the same root**, and replace it with a symlink. Preserve its environment and back up its uploads; migrate them to MinIO before activating this release. The deployment script refuses to overwrite an existing real live directory. Check the previous release also uses persistent media and shared configuration so rollback works.

Install the supplied school-api.service under `/etc/systemd/system/` and the Apache virtual host in the server’s enabled site configuration. Confirm the Node executable path. Enable ssl, headers, rewrite, proxy and proxy_http. Provision certificates covering both the apex domain and www before enabling the HTTPS virtual host. Run `apachectl configtest` and `systemctl daemon-reload`; enable school-api for boot. Grant the deploy user narrowly scoped passwordless permission to restart **school-api only**. Do not grant unrestricted sudo.

## Database and content preparation

Back up the current database, uploaded media and shared configuration together. Verify restoration into an isolated database before relying on a backup. Keep encrypted backups off the server and record their location, date and owner privately. Agree a schedule and retention with the school; a daily backup and a pre-deployment backup are a starting point.

For a new database, use a prepared incoming checkout with shared/server.env linked as server/.env. Install dependencies, generate Prisma, apply migrations and provision approved data before the first deploy:

```sh
npm ci
npm run db:generate
npm run db:migrate
# Only for initial setup: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD privately.
# Never enable SEED_DEMO for production.
npm run db:seed
# Review the source import first. --apply writes its approved source records.
npm run assets:import
npm run assets:import -- --apply
npm run storage:migrate -- --site-only --apply
npm run production:check
```

Restore the approved database and migrate its matching files into MinIO using the instructions in [MINIO.md](./MINIO.md). Do not seed over a live database as a routine deployment step. Review school facts, fees, staff names, Tamil translations, photos and topper spellings before publication. Four source topper images remain draft pending spelling verification. Local preparation archived 7 labelled sample events, 11 sample pages and 3 sample announcements; it did not delete them. Apply equivalent review on the production database. If explicitly desired, `npm run production:check -- --archive-demo` archives all published records marked isDemo in the supported content models.

`production:check` is read-only by default. It requires an active administrator, no published labelled sample content, writable upload storage and all published media files present. It does not certify factual accuracy or live infrastructure.

## Deployment

GitLab verification installs, lints, tests and builds every pipeline. Protect master and the production environment. Set protected File variables SSH_PRIVATE_KEY and SSH_KNOWN_HOSTS; validate the server host key through an independent trusted channel. Set protected DEPLOY_HOST and DEPLOY_USER. The production job is manual and serialised.

Before running that job, verify a fresh restorable backup and use `touch /var/www/stantonysneyveli.in/shared/backup-confirmed` to record the operator’s confirmation. This marker must be less than 60 minutes old; it does not create or verify a backup itself.

The job uploads into incoming/<commit>, then calls deploy.sh. The script locks deployment, creates a separate release, links the protected environment, installs, builds, applies migrations and runs readiness checks. It atomically switches the live symlink and restarts the service. On failed startup health checks it restores the previous application symlink when one exists. Migrations are **not** reversed automatically. Use backwards-compatible migrations and a reviewed database recovery plan. A failed first installation has no previous release to restore.

Apache must be able to traverse the symlink target and read built assets. Keep previous releases and backup evidence until the new release has been accepted. Do not delete shared media, environments or databases during release cleanup.

## Live acceptance before school handover

1. Confirm HTTPS for apex and www, HTTP redirects, certificate renewal and browser security headers. Direct requests to server secrets and draft media must fail. Check `/api/health` returns status ok with database connected.
2. Open home, gallery, school records, contact and privacy on phone and desktop in English, Tamil and Hindi. Check welcome animation once per browser tab session, reduced motion, light and dark modes, and keyboard navigation.
3. Sign in with the approved administrator. Verify account details, create a draft, publish approved content and confirm the public page. Verify EDITOR and VIEWER restrictions with school-approved test accounts. Sign out on shared devices.
4. Submit one clearly labelled test enquiry with school approval and verify its reference and saved record. Remove test personal data through the approved retention process.
5. Configure approved Gmail SMTP credentials and office notification recipients before enabling email. Enabling the worker can send pending queued mail: review the queue first. With explicit school approval, test confirmation and office delivery to controlled recipients. SENT means SMTP acceptance, not confirmed inbox delivery. No live email was sent in this task.
6. Confirm backup/restore ownership, monitoring, service auto-restart, disk space, log rotation and the school’s routine for reviewing enquiries. Record who accepted the release and when.

## Troubleshooting and rollback

- Login failure: verify email and account state, allow rate limits to clear, check HTTPS cookies and origin configuration. An account update invalidates old sessions. Never send passwords in screenshots.
- Site loads but data fails: check `systemctl status school-api`, `journalctl -u school-api`, `/api/health`, database connectivity and migration status. Redact personal data before sharing logs.
- MySQL SHA2 authentication after a restart: if the connector reports `ER_CANNOT_RETRIEVE_RSA_KEY` (sometimes wrapped as a pool timeout/P2039), configure verified database TLS or set `DATABASE_RSA_PUBLIC_KEY` to a trusted copy of that MySQL server's public-key PEM. Obtain it from the server administrator. The connector pins this key for SHA2 authentication; it does not enable automatic key retrieval or disable TLS verification. This setting is optional and deployment-specific. Do not copy the local Windows/Laragon path onto Linux, use a private key, or reset database users to work around the error.
- Email issue: inspect Email management status before retrying; UNKNOWN or PARTIAL may already have delivered to some recipients. See `docs/EMAIL-AND-CONSENT.md`.
- Manual rollback: verify a known previous release remains compatible with the current database, atomically repoint live to it, restart school-api and check health and external HTTPS. Restore a database backup only with an agreed outage and reconciliation plan to avoid losing newer enquiries.

## Maintenance and support

Support contact: **Bharathwaj TP · 9600641464**. Provide the page URL, time, affected account role and a redacted screenshot. Do not include passwords, SMTP credentials or private student data. Keep school ownership of domain, hosting, source repository and recovery channels documented privately. Review staff accounts when employment changes and audit dependencies before each release.

The root package override pins Effect 3.22.1 for the upstream [Effect security fix](https://github.com/advisories/GHSA-7589-6fvf-x4pw). Reassess this override when Prisma updates its dependency. Do not downgrade Prisma across a major version as an automatic audit fix.
- Missing photos: verify MinIO environment variables, bucket permissions, object prefixes and publication status. Follow [MINIO.md](./MINIO.md) for bulk transfer and checksum verification; database migration does not transfer images.
- Back up MinIO objects and the database together. The running application no longer stores images on disk.
