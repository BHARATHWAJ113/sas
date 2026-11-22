# Automatic translation and directory update

English public-content fields in the CMS now automatically fill Tamil and Hindi after a 1.4-second typing pause. This includes page titles and text, events, announcements, activities, people records, fees and image captions. Batch photo uploads support it too.

The server uses the free MyMemory API. No API key, paid subscription, browser extension or database migration is needed for this update. The server must be able to reach `https://api.mymemory.translated.net` over HTTPS.

## Editing

1. Enter or change English text. Wait for “Translating…” to finish.
2. Review both translations, especially people's names, titles and school terminology. Correct them directly if necessary. Manual edits in the current editor are protected from later automatic responses.
3. Save normally. Automatic translation does not publish or save records on its own.

Use “Translate / retry English fields” to translate existing English content. Turn off the automatic translation checkbox to work entirely manually. The current English text is sent to MyMemory only for supported public-content fields; account passwords, private enquiries and email messages are not automatically submitted.

MyMemory's anonymous free allowance is **5,000 characters per day**. Translating into two languages consumes allowance for each target. Requests are cached in server memory for one hour, and long text is split into segments below its 500-byte limit. This integration accepts up to 5,000 characters per field per request; provider quota or service availability can prevent completion. Failed responses are shown as errors, never inserted as translated content. Manual translation remains available. No unlimited-free guarantee is made.

Official references: [API specification](https://mymemory.translated.net/doc/spec.php) and [free usage limits](https://mymemory.translated.net/doc/usagelimits.php).

## Appearance and directories

- New visits default to light mode even if the operating system uses dark mode. An explicitly saved light/dark choice remains respected.
- Honours, staff, toppers and school leadership use compact cards. Select a card for its full photograph and details. Close with the close button, Escape or the backdrop; focus returns to the card.
- Directory filters have category segments, search with a clear button, year/class or department controls, reset, result counts and pagination. Their labels use the selected public language.

## Release

Upload the updated source and run `npm ci`, `npm run build`, then restart the API using your existing process manager. If deploying the preceding Hindi release for the first time, also run `npm run db:migrate` before restarting. Verify English, Tamil and Hindi, a sample translation, and a directory modal after deployment.

Maintenance: **Bharathwaj TP · 9600641464**.
