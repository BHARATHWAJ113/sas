# School asset cleanup report

Audited 341 source images. Generated 153 selected WebP derivatives.
Selected original bytes: 239,320,006. Optimized main-image bytes: 18,803,270. Reduction: 92.1%. Responsive variants are generated separately at import/upload.

## Safe changes

- Source documents and photographs were preserved without modification.
- Two rejected generated vaccination derivatives were moved to assets/optimized-school-review. Their originals remain in assets/schl_doc.
- The live database gallery no longer falls back to illustrative/demo albums when no real albums are published. Empty states remain honest.
- The import archives published demo gallery albums only when it creates real replacement albums. It does not delete database records or upload files.
- Historical leadership assets remain in use. Generated hero/discovery/sports image references now resolve to authentic campus photographs, and the generated preview video is no longer used. Legacy files are preserved for reference review.
- All 13 supplied IMG photographs are now classified by visible school activity and included in five campus albums. No staff/student name was attached based on appearance.

## Existing MinIO site-asset reference scan

This static scan checks the offline assets/site-images collection against source code, shared data (including the MinIO asset allowlist) and seed records, including responsive filename variants. Runtime files are served from MinIO. Database-managed references cannot be proven unused by a source scan. No existing source asset was deleted or moved.

Potentially unreferenced files requiring a database/reference review:
- None found.

## Source quality exclusions / duplicates

- D:\SAS\assets\schl_doc\2024\BOOK FAIR\IMG-20240713-WA0010.jpg: Decode unavailable/failed: UnidentifiedImageError; retain original for review
- D:\SAS\assets\schl_doc\2026-2027\trip\26o2.jpg: Small source; no enlargement; Exact duplicate of 2026-2027/trip/26o1.jpg
- D:\SAS\assets\schl_doc\2026-2027\vaccine\26vac1.jpg: Visual review: strong haze / low contrast; held from website
- D:\SAS\assets\schl_doc\2026-2027\vaccine\26vacc2.jpg: Visual review: strong haze / low contrast; held from website

## Document inventory

- assets/schl_doc/fees.pdf
- assets/schl_doc/ROLL OF HONOUR.pdf
- assets/schl_doc/school history.pdf
- assets/schl_doc/St. Antony's Diary 2026 - 27 -06072026.pdf
- assets/schl_doc/STAFF LIST.pdf
- assets/schl_doc/update-23112026/Annual_Report_2025-26_web.pdf

The fees, staff and Roll of Honour PDFs were extracted and visually checked. The existing school-history and diary content already has source documentation in docs/SCHOOL-SOURCES.md and was preserved. Full per-image quality evidence is in school-image-quality-report.md and its CSV.

## November additions

The user-supplied Rev. Fr. V. Chinnappan (2002–2006) portrait is preserved in the principals source directory and represented by three optimized site-image sizes in MinIO. It is historical leadership content, separate from the 153 CMS originals.

51 staff portraits were matched using filenames and staff-list names and optimized without altering originals. Eight names/initials differ and remain unassigned. Five explicit topper ranks were corroborated against pages 1-2 of Annual_Report_2025-26_web.pdf. No rank was inferred from marks. See school-source-update-2026-11-24.md for every match and held photo.

Three feedback screenshots were excluded from gallery import; branding references and the rotated anthem photograph remain for review. IMG_0562.HEIC could not be pixel-decoded and was not imported. No new source file was deleted. No production database cleanup or deployment was performed in this update.

Contact sheets for all selected candidates were inspected. Automated Good/Average/Poor grades are screening aids, not a guarantee of optical sharpness. Smaller archival portraits are displayed without destructive source editing. The two visibly hazy vaccination images are excluded from import.
