"""Prepare supplied campus photos and append idempotent CMS import records.
Original JPEGs are never modified. Run after prepare-school-assets.py, or alone.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageStat
import hashlib
import json
import csv

root = Path(__file__).resolve().parents[1]
photos = json.loads((root / 'shared/campus-photos.json').read_text(encoding='utf-8'))
output = root / 'assets/site-images'
output.mkdir(parents=True, exist_ok=True)
cms = root / 'assets/optimized-school'
manifest_path = cms / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
albums = {
    'library': ('Our library', 'எங்கள் நூலகம்'),
    'classrooms': ('In the classroom', 'வகுப்பறையில்'),
    'smart-learning': ('Smart learning', 'திறன்மிகு கற்றல்'),
    'indoor-games': ('Indoor games', 'உள் விளையாட்டுகள்'),
    'school-life': ('Life at St. Antony’s', 'பள்ளி வாழ்க்கை'),
}
original_bytes = optimized_bytes = 0
report = []
for photo in photos:
    source = root / 'assets/schl_doc' / photo['file']
    original_bytes += source.stat().st_size
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert('RGB')
        # Remove only nearly solid black edge rows (letterboxing), not scene content.
        probe = image.resize((128, image.height))
        top, bottom = 0, image.height
        def black_row(y):
            row = ImageStat.Stat(probe.crop((0, y, 128, y + 1)))
            return max(row.mean) < 12 and max(row.stddev) < 8
        while top < image.height // 10 and black_row(top):
            top += 1
        while bottom > image.height * 9 // 10 and black_row(bottom - 1):
            bottom -= 1
        image = image.crop((0, top, image.width, bottom))
        for width in [640, 1200, 1800]:
            variant = image.copy()
            variant.thumbnail((width, width))
            suffix = '' if width == 1800 else '-' + str(width)
            variant.save(output / (photo['key'] + suffix + '.webp'), 'WEBP', quality=82, method=6)
        key = hashlib.sha256(photo['file'].encode()).hexdigest()[:32]
        filename = key + '.webp'
        main = output / (photo['key'] + '.webp')
        (cms / filename).write_bytes(main.read_bytes())
        optimized_bytes += main.stat().st_size
        item = dict(id='school-photo-' + key, filename=filename, originalName=photo['file'], alt=photo['alt'], altTa=photo['altTa'], source=photo['file'])
        manifest['media'] = [m for m in manifest['media'] if m['id'] != item['id']] + [item]
        photo['mediaId'] = item['id']
        report.append(dict(source=photo['file'], asset=photo['key'], trimmedTop=top, trimmedBottom=probe.height-bottom, bytes=main.stat().st_size))
for slug, (title, title_ta) in albums.items():
    album = dict(id='campus-album-' + slug, slug='campus-' + slug, title=title, titleTa=title_ta, summary='A glimpse of everyday school life at St. Antony’s.', summaryTa='புனித அந்தோணியார் பள்ளியின் அன்றாட வாழ்க்கைக் காட்சிகள்.', status='PUBLISHED', isDemo=False, imageIds=[p['mediaId'] for p in photos if p['album'] == slug])
    manifest['galleries'] = [a for a in manifest['galleries'] if a['id'] != album['id']] + [album]
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
(root / 'reports/campus-photo-assets.json').write_text(json.dumps(dict(originalBytes=original_bytes, optimizedMainBytes=optimized_bytes, photos=report), indent=2), encoding='utf-8')
audit_path = root / 'reports/school-image-quality-report.csv'
if audit_path.exists():
    with audit_path.open(encoding='utf-8-sig') as file:
        rows = list(csv.DictReader(file))
    captions = {p['file']: p for p in photos}
    for row in rows:
        if row['filename'] in captions:
            row.update(selected=True, action='Optimize', section='Campus gallery / ' + captions[row['filename']]['album'])
    with audit_path.open('w', newline='', encoding='utf-8-sig') as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    lines = ['# School image quality audit', '', 'Original photographs are unchanged. Ratings use decode, resolution and edge detail as screening aids. The 13 supplied campus photos were reviewed by visible activity; no identity was inferred. See campus-photo-assets.json for letterbox removal and compression details.', '', f'Images audited: {len(rows)}. Selected WebP derivatives: {len(manifest["media"])}. Maximum derivative dimension: 1800 px.', '', '| Original filename / path | Dimensions | Bytes | Format | Quality | Issues | Action | Section | Selected |', '|---|---|---:|---|---|---|---|---|---|']
    for row in rows:
        lines.append('| ' + ' | '.join(str(row[key]).replace('|', '/') for key in ['path', 'dimensions', 'bytes', 'format', 'quality', 'issues', 'action', 'section', 'selected']) + ' |')
    (root / 'reports/school-image-quality-report.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'{len(photos)} campus photos; {original_bytes:,} original bytes -> {optimized_bytes:,} main WebP bytes ({100*(1-optimized_bytes/original_bytes):.1f}% smaller). Responsive sizes: 640, 1200, 1800.')

# Regenerate the immutable published asset inventory after offline preparation.
site_manifest = [dict(filename=p.name, mimeType="image/svg+xml" if p.suffix == ".svg" else "image/webp", size=p.stat().st_size, sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in sorted(output.iterdir()) if p.suffix in [".webp", ".svg"]]
(root / "shared/site-assets.json").write_text(json.dumps(site_manifest, indent=2) + "\n", encoding="utf-8")
