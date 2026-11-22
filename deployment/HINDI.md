# Hindi language deployment and editing

The public language menu offers English, தமிழ் and हिन्दी. The selected language persists in the visitor's browser. Hindi uses locally bundled Devanagari fonts; no external font service is required.

After uploading this release, run from the project root:

```sh
npm ci
npm run db:migrate
npm run build
sudo systemctl restart school-api
npm run production:check
```

Use your existing process manager's restart command if the API is not managed by the supplied `school-api` systemd unit. Apply the database migration before starting the new API. Follow the normal database backup procedure in `PRODUCTION.md` before deployment.

Migration `20261122010000_hindi_language` adds nullable Hindi columns. It preserves English and Tamil values and adds built-in Hindi translations only where the original English school text still matches exactly. Customised content is not overwritten. No image upload or MinIO migration is needed for this language update.

In the admin panel:

- Open Pages, Events, Announcements, Activities, Gallery albums, Staff, Honours, Toppers or Fees. Enter text in the optional **हिन्दी / Hindi** fields and save. Existing publication controls still apply.
- Edit photo captions and descriptions in Media library. Batch uploads also accept an optional Hindi caption.
- Open **Languages** to override an interface label. Select `hi`, enter its key and Hindi text, then publish. For example, `home` controls the home navigation label. Keys are defined in `client/src/i18n.js` and `client/src/school-copy.js`; Hindi defaults are in `client/src/hi.js`.
- Blank Hindi content fields display the English value. Staff must provide translations for custom records; the website does not automatically translate them. The admin workspace's own controls remain in English.

Hindi admission enquiries save their language and receive a Hindi acknowledgement when email delivery is enabled. The acknowledgement does not confirm admission.

After deployment, select हिन्दी on desktop and mobile, refresh to confirm the preference persists, check a published Hindi record and its photo caption, and switch back to English and Tamil. Confirm the existing MinIO images still load.

Maintenance contact: **Bharathwaj TP · 9600641464**.
