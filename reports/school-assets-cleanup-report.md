# School asset cleanup report

Audited 271 source images. Generated 102 selected WebP derivatives.
Selected original bytes: 145,384,279. Optimized main-image bytes: 12,716,268. Reduction: 91.3%. Responsive variants are generated separately at import/upload.

## Safe changes

- Source documents and photographs were preserved without modification.
- Two rejected generated vaccination derivatives were moved to assets/optimized-school-review. Their originals remain in assets/schl_doc.
- The live database gallery no longer falls back to illustrative/demo albums when no real albums are published. Empty states remain honest.
- The import archives published demo gallery albums only when it creates real replacement albums. It does not delete database records or upload files.
- Historical leadership assets remain in use. Generated hero/discovery/sports image references now resolve to authentic campus photographs, and the generated preview video is no longer used. Legacy files are preserved for reference review.
- All 13 supplied IMG photographs are now classified by visible school activity and included in five campus albums. No staff/student name was attached based on appearance.

## Existing public asset reference scan

This static scan checks source code, shared data and seed records, including common responsive filename variants. Database-managed references cannot be proven unused by a source scan. No existing public asset was deleted or moved.

Potentially unreferenced files requiring a database/reference review:
- None found.

## Source quality exclusions / duplicates

- D:\SAS\assets\schl_doc\2024\BOOK FAIR\IMG-20240713-WA0010.jpg: Decode failed: UnidentifiedImageError
- D:\SAS\assets\schl_doc\2026-2027\trip\26o2.jpg: Exact duplicate of 2026-2027/trip/26o1.jpg; Small source; avoid enlargement
- D:\SAS\assets\schl_doc\2026-2027\vaccine\26vac1.jpg: Visual review: strong haze / low contrast; hold from website
- D:\SAS\assets\schl_doc\2026-2027\vaccine\26vacc2.jpg: Visual review: strong haze / low contrast; hold from website

## Document inventory

- assets/schl_doc/fees.pdf
- assets/schl_doc/ROLL OF HONOUR.pdf
- assets/schl_doc/school history.pdf
- assets/schl_doc/St. Antony's Diary 2026 - 27 -06072026.pdf
- assets/schl_doc/STAFF LIST.pdf

The fees, staff and Roll of Honour PDFs were extracted and visually checked. The existing school-history and diary content already has source documentation in docs/SCHOOL-SOURCES.md and was preserved. Full per-image quality evidence is in school-image-quality-report.md and its CSV.

Contact sheets for all selected candidates were inspected. Automated Good/Average/Poor grades are screening aids, not a guarantee of optical sharpness. Smaller archival portraits are displayed without destructive source editing. The two visibly hazy vaccination images are excluded from import.
