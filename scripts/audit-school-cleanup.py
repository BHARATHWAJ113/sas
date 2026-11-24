from pathlib import Path
import json, csv
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'assets/optimized-school/manifest.json').read_text(encoding='utf-8'))
with (root/'reports/school-image-quality-report.csv').open(encoding='utf-8-sig') as file:
    rows=list(csv.DictReader(file))
sourceBytes=sum((root/'assets/schl_doc'/m['source']).stat().st_size for m in manifest['media'])
webBytes=sum((root/'assets/optimized-school'/m['filename']).stat().st_size for m in manifest['media'])
code='\n'.join(file.read_text(encoding='utf-8',errors='replace') for base in ['client/src','server/src','server/prisma','shared'] for file in (root/base).rglob('*') if file.suffix in ['.js','.jsx','.css','.json'])
unused=[]
for file in (root/'assets/site-images').glob('*'):
    if file.is_file() and file.stem.removesuffix('-640').removesuffix('-960').removesuffix('-1200') not in code and file.name!='profile-placeholder.svg':
        unused.append(file.name)
lines=['# School asset cleanup report','',
 f'Audited {len(rows)} source images. Generated {len(manifest["media"])} selected WebP derivatives.',
 f'Selected original bytes: {sourceBytes:,}. Optimized main-image bytes: {webBytes:,}. Reduction: {(1-webBytes/sourceBytes)*100:.1f}%. Responsive variants are generated separately at import/upload.',
 '',
 '## Safe changes',
 '',
 '- Source documents and photographs were preserved without modification.',
 '- Two rejected generated vaccination derivatives were moved to assets/optimized-school-review. Their originals remain in assets/schl_doc.',
 '- The live database gallery no longer falls back to illustrative/demo albums when no real albums are published. Empty states remain honest.',
 '- The import archives published demo gallery albums only when it creates real replacement albums. It does not delete database records or upload files.',
 '- Historical leadership assets remain in use. Generated hero/discovery/sports image references now resolve to authentic campus photographs, and the generated preview video is no longer used. Legacy files are preserved for reference review.',
 '- All 13 supplied IMG photographs are now classified by visible school activity and included in five campus albums. No staff/student name was attached based on appearance.',
 '',
 '## Existing MinIO site-asset reference scan',
 '',
 'This static scan checks the offline assets/site-images collection against source code, shared data (including the MinIO asset allowlist) and seed records, including responsive filename variants. Runtime files are served from MinIO. Database-managed references cannot be proven unused by a source scan. No existing source asset was deleted or moved.',
 '',
 'Potentially unreferenced files requiring a database/reference review:',
 *(['- '+name for name in unused] or ['- None found.']),
 '',
 '## Source quality exclusions / duplicates',
 '',
 *['- '+r['path']+': '+r['issues'] for r in rows if r['quality']=='Poor' or 'duplicate' in r['issues'].lower()],
 '',
 '## Document inventory',
 '',
 *['- '+p.relative_to(root).as_posix() for p in sorted((root/'assets/schl_doc').rglob('*.pdf'))],
 '',
 'The fees, staff and Roll of Honour PDFs were extracted and visually checked. The existing school-history and diary content already has source documentation in docs/SCHOOL-SOURCES.md and was preserved. Full per-image quality evidence is in school-image-quality-report.md and its CSV.',
 '',
 '## November additions',
 '',
 'The user-supplied Rev. Fr. V. Chinnappan (2002–2006) portrait is preserved in the principals source directory and represented by three optimized site-image sizes in MinIO. It is historical leadership content, separate from the 153 CMS originals.',
 '',
 '51 staff portraits were matched using filenames and staff-list names and optimized without altering originals. Eight names/initials differ and remain unassigned. Five explicit topper ranks were corroborated against pages 1-2 of Annual_Report_2025-26_web.pdf. No rank was inferred from marks. See school-source-update-2026-11-24.md for every match and held photo.',
 '',
 'Three feedback screenshots were excluded from gallery import; branding references and the rotated anthem photograph remain for review. IMG_0562.HEIC could not be pixel-decoded and was not imported. No new source file was deleted. No production database cleanup or deployment was performed in this update.',
 '',
 'Contact sheets for all selected candidates were inspected. Automated Good/Average/Poor grades are screening aids, not a guarantee of optical sharpness. Smaller archival portraits are displayed without destructive source editing. The two visibly hazy vaccination images are excluded from import.'
]
(root/'reports/school-assets-cleanup-report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(f'{len(rows)} originals audited; {len(manifest["media"])} optimized; {(1-webBytes/sourceBytes)*100:.1f}% smaller main images; {len(unused)} existing files require review.')
