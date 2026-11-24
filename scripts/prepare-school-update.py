"""Merge verified November source additions; preserve originals and prior manifest data.

Run after prepare-school-assets.py, or independently. Requires Pillow.
No network, database writes, fuzzy identity matching, or source-file deletion.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageStat, ImageFilter
import csv
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/schl_doc'
UPDATE = SOURCE / 'update-23112026'
OUTPUT = ROOT / 'assets/optimized-school'
REPORTS = ROOT / 'reports'
MANIFEST = OUTPUT / 'manifest.json'


def normalized(name):
    name = re.sub(r'^(MRS|MR|MISS)\.?\s*', '', name.upper())
    return re.sub(r'[^A-Z0-9]', '', name)


def main():
    if not UPDATE.exists():
        print('November update folder unavailable; existing manifest preserved.')
        return
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    media_by_id = {m['id']: m for m in manifest['media']}
    names = {}
    for staff in manifest['staff']:
        names.setdefault(normalized(staff['name']), []).append(staff)
    patches, matches, held = [], [], []
    for path in sorted(UPDATE.glob('STAFF*/*')):
        if not path.is_file():
            continue
        candidates = names.get(normalized(path.stem), [])
        if len(candidates) != 1:
            held.append(path.relative_to(SOURCE).as_posix())
            continue
        staff = candidates[0]
        rel = path.relative_to(SOURCE).as_posix()
        # Content participates in IDs, so changed source bytes never silently replace
        # an object already used by a school's edited record.
        key = hashlib.sha256(rel.encode() + path.read_bytes()).hexdigest()[:32]
        filename = key + '.webp'
        media_id = 'school-photo-' + key
        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image).convert('RGB')
            image.thumbnail((1600, 1600))
            image.save(OUTPUT / filename, 'WEBP', quality=85, method=6)
        media_by_id.setdefault(media_id, dict(id=media_id, filename=filename,
            originalName=path.name, alt=staff['name'], altTa=staff['name'],
            altHi=staff['name'], source=rel))
        if staff.get('imageId') not in (None, media_id):
            raise ValueError(f"Manifest already has another portrait for {staff['id']}; review first")
        staff['imageId'] = media_id
        patches.append(dict(resource='staff', id=staff['id'],
            expected=dict(name=staff['name'], sourceRef=staff['sourceRef'], imageId=None),
            data=dict(imageId=media_id), evidence=rel + ' | Exact filename/staff-list name after spacing, punctuation and title normalization.'))
        matches.append((staff['name'], rel, media_id))

    # Visually verified pages 1-2 of the supplied report: academic results refer
    # to 2024-25, despite the report title being 2025-26. No rank inferred from marks.
    ranks = [('Abiudhai.M.V', '10', 490, 500, 1, 1),
             ('Sarina.J', '10', 477, 500, 2, 2),
             ('Ansten Roys.J', '10', 475, 500, 3, 2),
             ('Kabila.C', '12', 564, 600, 2, 1),
             ('Priyadarshini.C', '12', 558, 600, 3, 1)]
    rank_evidence = []
    for name, standard, marks, maximum, rank, page in ranks:
        records = [t for t in manifest['toppers'] if normalized(t['name']) == normalized(name)
                   and t['academicYear'] == '2024-25' and t['standard'] == standard
                   and t['marks'] == marks and t['maximumMarks'] == maximum]
        if len(records) != 1:
            raise ValueError(f'Expected one corroborated topper: {name}')
        record = records[0]
        evidence = f'update-23112026/Annual_Report_2025-26_web.pdf | page {page}; explicit 2024-25 rank {rank}'
        base_source = record['sourceRef'].split(' | Rank evidence:')[0]
        source_ref = base_source + ' | Rank evidence: ' + evidence
        if record.get('rank') not in (None, rank):
            raise ValueError(f'Conflicting rank in manifest: {name}')
        record.update(rank=rank, sourceRef=source_ref)
        patches.append(dict(resource='toppers', id=record['id'],
            expected=dict(name=record['name'], sourceRef=base_source, academicYear='2024-25',
                          standard=standard, marks=marks, maximumMarks=maximum, rank=None),
            data=dict(rank=rank, sourceRef=source_ref), evidence=evidence))
        rank_evidence.append((name, rank, page))
    manifest['media'] = list(media_by_id.values())
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUTPUT / 'source-updates.json').write_text(json.dumps(patches, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    # Explicitly identified by the user's attached filename, 24 November 2026.
    # Historical leadership is an existing site-asset section, not current staff.
    father_rel = 'PRINCIPALS OF ST. ANTONY_S/Rev. Fr. V. Chinnappan 2002 - 2006.jpeg'
    father = SOURCE / father_rel
    if father.exists():
        site = ROOT / 'assets/site-images'
        with Image.open(father) as image:
            image = ImageOps.exif_transpose(image).convert('RGB')
            for width, suffix in [(1200, ''), (640, '-640'), (1200, '-1200')]:
                variant = image.copy()
                variant.thumbnail((width, width))
                variant.save(site / f'fr-v-chinnappan{suffix}.webp', 'WEBP', quality=85, method=6)
        assets = [dict(filename=p.name, mimeType='image/svg+xml' if p.suffix == '.svg' else 'image/webp',
                       size=p.stat().st_size, sha256=hashlib.sha256(p.read_bytes()).hexdigest())
                  for p in sorted(site.iterdir()) if p.suffix in ('.webp', '.svg')]
        (ROOT / 'shared/site-assets.json').write_text(json.dumps(assets, indent=2) + '\n', encoding='utf-8')

    # Rescan every source image, retaining earlier visual decisions and campus selection.
    previous = {}
    audit_csv = REPORTS / 'school-image-quality-report.csv'
    if audit_csv.exists():
        with audit_csv.open(encoding='utf-8-sig', newline='') as file:
            previous = {str(Path(r['path']).resolve()): r for r in csv.DictReader(file)}
    selected = {m['source'] for m in manifest['media']}
    if father.exists(): selected.add(father_rel)
    seen, rows = {}, []
    for path in sorted(SOURCE.rglob('*')):
        if not path.is_file() or path.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'):
            continue
        rel = path.relative_to(SOURCE).as_posix()
        row = dict(filename=path.name, path=str(path.resolve()), dimensions='', bytes=path.stat().st_size,
                   format=path.suffix[1:].upper(), quality='Poor', issues='', action='Review', section='Source review', selected=rel in selected)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        duplicate = seen.get(digest)
        seen.setdefault(digest, rel)
        try:
            with Image.open(path) as im:
                original_format = im.format
                im = ImageOps.exif_transpose(im).convert('RGB')
                w, h = im.size
                edge = ImageStat.Stat(ImageOps.fit(im, (128, 128)).convert('L').filter(ImageFilter.FIND_EDGES)).var[0]
            row.update(dimensions=f'{w}x{h}', format=original_format,
                       quality='Poor' if min(w, h) < 180 else 'Average' if min(w, h) < 600 or edge < 180 else 'Good')
            issues = []
            if min(w, h) < 600: issues.append('Small source; no enlargement')
            if edge < 180: issues.append('Low edge detail; possible softness (screening proxy)')
            if max(w, h) / min(w, h) > 2: issues.append('Unusual aspect ratio')
            row.update(issues='; '.join(issues) or 'No automated decode/resolution issue', action='Optimize' if rel in selected else 'Review')
        except Exception as error:
            row['issues'] = 'Decode unavailable/failed: ' + type(error).__name__ + '; retain original for review'
            if path == UPDATE / 'IMG_0562.HEIC':
                row.update(dimensions='5712x4284 (header only)', quality='Average', issues='HEIC header readable with Sharp; pixel decoding failed. Visual quality unverified; export an original JPEG/PNG for review.')
        old = previous.get(str(path.resolve()))
        if old and not rel.startswith('update-23112026/'):
            row['section'] = old['section']
        if rel.startswith('toppers/'): row['section'] = 'Toppers'
        if rel == father_rel:
            row.update(section='Historical leadership', issues=row['issues'] + '; User identified Rev. Fr. V. Chinnappan, 2002–2006; supplied photo visually reviewed')
        if '/STAFF PHOTO WITH NAME ' in rel:
            row['section'] = 'Staff directory'
            row['issues'] += '; ' + ('Filename matched staff list; contact sheet reviewed' if rel in selected else 'Unconfirmed spelling/initial: not assigned to any profile')
        if path.name in ('26vacc2.jpg', '26vac1.jpg'):
            row.update(quality='Poor', action='Review', issues='Visual review: strong haze / low contrast; held from website')
        if path.name in ('repeted image.jpeg', 'repeted img 2.jpeg', 'side image size reduce.jpeg'):
            row.update(section='Website feedback screenshot', action='Exclude', issues='Screenshot of website feedback; not an original school photograph')
        if path.name == 'school anthem.jpeg':
            row.update(section='Document reference', action='Review', issues='Rotated photograph of anthem text; use accessible text after transcription review')
        if path.parent == UPDATE and path.name in ('ncc logo.png', 'scout.jpeg', 'sports.webp', 'ST. ANTONY.jpg.jpeg', 'fr-m-john-kennedy.webp'):
            row.update(section='Branding / leadership reference', action='Review')
        if duplicate:
            row['issues'] += '; Exact duplicate of ' + duplicate
            if not row['selected']: row['action'] = 'Exclude'
        rows.append(row)
    with audit_csv.open('w', newline='', encoding='utf-8-sig') as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
    lines = ['# School image quality audit', '', 'Updated 24 November 2026. Source originals are unchanged.', '',
             'Good/Average/Poor ratings screen decoding, dimensions and edge detail; they are not a definitive blur or compression diagnosis. New staff contact sheets were visually inspected. Exact duplicates use SHA-256. Name matching uses source filenames and staff-list text, never faces. Uncertain identities and unsupported HEIC pixels remain for review.', '',
             f'Images audited: {len(rows)}. Selected CMS WebP derivatives: {len(manifest["media"])}. New staff derivatives fit within 1600 px at quality 85, without enlargement; responsive variants are created by the MinIO importer.', '',
             '| Original filename / path | Dimensions | Bytes | Format | Quality | Issues | Action | Section | Selected |', '|---|---|---:|---|---|---|---|---|---|']
    for row in rows:
        lines.append('| ' + ' | '.join(str(row[k]).replace('|', '/') for k in ['path', 'dimensions', 'bytes', 'format', 'quality', 'issues', 'action', 'section', 'selected']) + ' |')
    (REPORTS / 'school-image-quality-report.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    inventory = [dict(path=p.relative_to(SOURCE).as_posix(), bytes=p.stat().st_size, extension=p.suffix.lower()) for p in sorted(SOURCE.rglob('*')) if p.is_file()]
    (REPORTS / 'school-asset-inventory.json').write_text(json.dumps(inventory, indent=2) + '\n', encoding='utf-8')
    original_bytes = sum((SOURCE / rel).stat().st_size for _, rel, _ in matches)
    optimized_bytes = sum((OUTPUT / media_by_id[mid]['filename']).stat().st_size for _, _, mid in matches)
    notes = ['# November school source additions', '', 'Prepared 24 November 2026; this report does not assert production deployment.', '',
             f'{len(matches)} named staff portraits matched to existing profiles. Source bytes: {original_bytes:,}; optimized main-image bytes: {optimized_bytes:,} ({100 * (1 - optimized_bytes / original_bytes):.1f}% smaller). Originals preserved; no face recognition or inferred identity.', '',
             '## Matched staff photographs', '', '| Staff-list name | Source | Media ID |', '|---|---|---|']
    notes.extend(f'| {name} | {rel} | {mid} |' for name, rel, mid in matches)
    notes += ['', '## Identity confirmation required', '', 'These eight photos remain outside the import. Their filenames differ from the staff list (including two different initials and one missing initial). Do not automatically fuzzy-match them.', '']
    notes.extend('- ' + name for name in held)
    notes += ['', '## Annual report', '', 'Pages 1–2 were extracted and visually reviewed. Five exact name/year/class/score matches receive the explicitly stated rank. Results belong to 2024–25, not the report title year. Existing names, marks, photos and publication states remain unchanged.', '']
    notes.extend(f'- {name}: rank {rank}, page {page}.' for name, rank, page in rank_evidence)
    notes += ['', 'The report uses MUTHAMIZH JEEVA. S and MUKESH. R while the existing topper filenames use Muthamizh Jeeva and Mukesh Kumar.R. Their ranks remain unset pending school confirmation; no duplicate topper was created. The four previously disputed topper records remain drafts.', '',
              'Other annual-report events and sports claims are retained as reference material, not automatically converted into dated gallery associations or photo identities. Existing fee data is unchanged.', '',
              '## Remaining reference assets', '', 'Three screenshots are website feedback, not gallery photographs. NCC/scout/sports emblems, the saint image, anthem photograph and alternate principal photo are retained for content review. The existing principal portrait is already sourced; it was not overwritten. IMG_0562.HEIC has readable dimensions but this decoder could not decode its pixels; it is held for a JPEG/PNG export. Nothing was deleted.', '',
              '## Import behavior', '', 'Run `npm run assets:import` to validate. `--apply` creates missing source records and uploads their media to MinIO. Add `--refresh-source` to fill the approved empty staff image and topper rank fields in previously imported records. Updates require matching source identity and original values, skip any record with a CMS UPDATE audit, and use an updatedAt guard against concurrent edits. All other existing admin content is preserved. SOURCE_ENRICH audit entries identify the affected records; source-updates.json preserves their supporting filenames/pages.', '']
    if father.exists():
        notes += ['## Additional leadership portrait', '', 'The user supplied Rev. Fr. V. Chinnappan’s photograph and the 2002–2006 period on 24 November. The original was copied unchanged into the PRINCIPALS source folder. Three WebP site-asset versions were prepared without enlargement or alteration of the person. The existing About-page leadership cards and detail modal now include this entry in English, Tamil and Hindi. Transfer it with `npm run storage:migrate -- --site-only --apply` or the updated MinIO ZIP before activating the new frontend. This does not add him to the current staff directory.', '']
    (REPORTS / 'school-source-update-2026-11-24.md').write_text('\n'.join(notes), encoding='utf-8')
    print(json.dumps(dict(audited=len(rows), staffPhotos=len(matches), heldStaffPhotos=len(held), explicitRanks=len(ranks), media=len(manifest['media']))))


if __name__ == '__main__':
    main()
