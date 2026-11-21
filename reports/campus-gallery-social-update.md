# Campus photos, gallery and social links

Implemented locally on 21 November 2026. Not deployed.

- Added all 13 user-supplied school photos from `assets/schl_doc/IMG_*.JPEG`. Preserved originals; removed only solid black letterbox rows and created 640, 1200 and 1800 pixel WebP versions. Main derivatives total 3,341,760 bytes versus 31,380,909 original bytes (89.4% smaller).
- Replaced generated hero, welcome, facilities, student-life and page-cover imagery. Legacy CMS cover paths resolve to the new campus photos. The generated preview video no longer autoplays over the real hero; an explicitly configured school video is still supported.
- Imported 13 media records and five published albums: school life, indoor games, smart learning, classrooms and library. Existing albums and CMS edits remain intact. The import now includes 102 images and 28 albums overall.
- Gallery uses overlapping rounded photo cards, horizontal category pills, expandable album selection, previous/next controls and a grid toggle. Existing pagination, lightbox, zoom, keyboard controls and Tamil captions remain available. Reduced-motion preferences are respected.
- Added `/social-media`, navigation/footer links and a right-side social rail that expands on hover or keyboard focus. On mobile, the links appear in a labelled row before the footer to avoid covering content.
- Connected the exact Instagram, Facebook share and YouTube channel URLs supplied by the user. Administrators can edit these under **Site settings & SEO** using `socialInstagram`, `socialFacebook` and `socialYouTube`. The **Expose this setting on the public website** checkbox controls visibility. X, LinkedIn and Threads remain hidden until configured. Social URLs must use HTTPS and match the selected platform. No third-party embeds are loaded.

Rebuild assets with `python scripts/prepare-campus-photos.py` or the complete `scripts/prepare-school-assets.py` workflow. Apply prepared CMS content and missing social settings using `npm run assets:import -- --apply` against the intended database. Re-running the importer preserves existing records and administrator changes.

Validation: 94 automated tests passed (four optional MySQL integration tests skipped); lint and production build passed. Browser checks cover desktop/mobile image loading, page overflow, official link destinations, gallery navigation, zoom, keyboard close, category filtering, grid view, Tamil and reduced motion. See ignored `artifacts/campus-*.png` previews.
