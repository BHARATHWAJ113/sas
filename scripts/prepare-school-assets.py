"""Read-only source audit and repeatable web asset preparation.
Requires Pillow and pypdf. Run from repository root. Never edits source assets.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageStat, ImageFilter, ImageDraw
from pypdf import PdfReader
import hashlib, json, csv, re

root = Path(__file__).resolve().parents[1]
source = root / 'assets/schl_doc'
output = root / 'assets/optimized-school'
reports = root / 'reports'
output.mkdir(exist_ok=True)
reports.mkdir(exist_ok=True)
(root / 'artifacts').mkdir(exist_ok=True)
rows, seen, candidates = [], {}, []
for path in sorted(source.rglob('*')):
    if not path.is_file():
        continue
    rel = path.relative_to(source).as_posix()
    if path.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.webp']:
        continue
    record = dict(filename=path.name, path=str(path), dimensions='', bytes=path.stat().st_size, format=path.suffix[1:], quality='Poor', issues='', action='Exclude', section='Review', selected=False)
    try:
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im).convert('RGB')
            w,h = im.size
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            thumb = ImageOps.fit(im, (128,128)).convert('L')
            edge = ImageStat.Stat(thumb.filter(ImageFilter.FIND_EDGES)).var[0]
            duplicate = seen.get(digest)
            seen[digest] = rel
            record.update(dimensions=f'{w}x{h}', format=im.format or path.suffix[1:].upper())
            issues = []
            if duplicate: issues.append('Exact duplicate of '+duplicate)
            if min(w,h)<300: issues.append('Small source; avoid enlargement')
            if edge<180: issues.append('Low edge detail; possible softness (automated proxy)')
            if max(w,h)/min(w,h)>2: issues.append('Unusual aspect ratio')
            record['quality'] = 'Poor' if min(w,h)<180 else 'Average' if min(w,h)<600 or edge<180 else 'Good'
            record['issues'] = '; '.join(issues) or 'No automated resolution/decode issue; visual review still advised'
            record['action'] = 'Exclude' if duplicate else 'Review' if record['quality']=='Poor' else 'Optimize'
            record['section'] = 'Toppers' if rel.startswith('toppers/') else 'Historical leadership' if rel.startswith('PRINCIPALS') else 'Gallery' if re.match(r'^20\d\d', rel) else 'Unlabelled / archive review'
            if not duplicate and record['quality'] != 'Poor':
                candidates.append((rel, record, min(w,h), edge))
    except Exception as error:
        record['issues'] = 'Decode failed: '+type(error).__name__
    rows.append(record)

# All identifiable topper portraits; three representative candidates per event folder.
selected = [c for c in candidates if c[1]['section']=='Toppers']
groups={}
for candidate in candidates:
    if candidate[1]['section']=='Gallery':
        groups.setdefault(str(Path(candidate[0]).parent), []).append(candidate)
for group in groups.values():
    selected.extend(sorted(group, key=lambda c:(c[1]['quality']=='Good', c[2], c[3]), reverse=True)[:3])
# Contact-sheet review found heavy haze/poor contrast in these two files.
excluded = {'26vacc2.jpg', '26vac1.jpg'}
for r in rows:
    if r['filename'] in excluded:
        r.update(quality='Poor', action='Review', issues='Visual review: strong haze / low contrast; hold from website')
selected = [c for c in selected if Path(c[0]).name not in excluded]
principal = next((c for c in candidates if c[0].startswith('PRINCIPALS') and 'John Kennedy' in c[0]), None)
if principal: selected.append(principal)

media, galleries, toppers = [], {}, []
for index,(rel,record,_,_) in enumerate(selected):
    key = hashlib.sha256(rel.encode()).hexdigest()[:32]
    filename = key+'.webp'
    with Image.open(source/rel) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        im.thumbnail((1800,1800))
        im.save(output/filename,'WEBP',quality=84)
    record['selected']=True
    record['action']='Optimize'
    category = Path(rel).parent.name
    title = ' '.join(category.replace('_', "'").split()).title()
    item = dict(id='school-photo-'+key, filename=filename, originalName=Path(rel).name, alt=title, altTa=title, source=rel)
    if record['section']=='Gallery':
        folder=str(Path(rel).parent).replace('\\','/')
        albumId='school-album-'+hashlib.sha256(folder.encode()).hexdigest()[:24]
        title=folder.replace('_', "'").replace('/',' · ').title()
        gallery=galleries.setdefault(albumId,dict(id=albumId,slug=albumId,title=title,titleTa=title,summary='School photographs from '+title,summaryTa='பள்ளி நிகழ்வின் புகைப்படங்கள்.',status='PUBLISHED',isDemo=False,imageIds=[]))
        gallery['imageIds'].append(item['id'])
        item['alt']=title
        item['altTa']=title
    if record['section']=='Toppers':
        match=re.match(r'(.+?)\s*(\d+)\s*out\s*of\s*(\d+)',Path(rel).stem,re.I)
        group=re.search(r'(\d{2})-(\d{2}).*std\s*(\d+)',category,re.I)
        if match and group:
            name,marks,maximum=match.group(1).strip(),int(match.group(2)),int(match.group(3))
            standard=group.group(3)
            conflict = maximum != (500 if standard=='10' else 600) or any(x.lower() in name.lower() for x in ['Swathi.G','Mukeh','Kowshikan'])
            toppers.append(dict(id='school-topper-'+key,name=name,nameTa='',standard=standard,academicYear='20'+group.group(1)+'-'+group.group(2),category='SSLC' if standard=='10' else 'HSC +2',marks=marks,maximumMarks=maximum,percentage=round(marks/maximum*100,2),rank=None,imageId=item['id'],sortOrder=2026-int('20'+group.group(2)),status='DRAFT' if conflict else 'PUBLISHED',sourceRef=rel+(' | Review inconsistent marks or spelling against school records.' if conflict else ' | Name and marks transcribed from filename; no rank inferred.')))
            item['alt']=name
            item['altTa']=name
    media.append(item)

staffText='\n'.join(page.extract_text() for page in PdfReader(source/'STAFF LIST.pdf').pages)
staff=[]
for line in staffText.splitlines():
    match=re.match(r'^(\d+)\s+(.+?)\s+(Correspondent.*|PGT.*|BT\s*\(.*|SGT.*|PET|KGT|ABACUS|HINDI|Assitant.*|Cashier|Junior Assistant|Typist|Attender|Driver|Conductor|Sanitation Worker)\s*$',line)
    if not match: continue
    number,name,designation=match.groups()
    subject=re.search(r'\(([^)]+)\)',designation)
    category='Leadership' if number=='1' else 'Teaching' if int(number)<42 else 'Non-teaching'
    department=subject.group(1).strip() if subject else 'Kindergarten' if designation=='KGT' else 'Physical Education' if designation=='PET' else designation if designation in ['HINDI','ABACUS'] else 'Administration' if int(number)<48 else 'Transport' if int(number)<55 else 'Campus support'
    imageId=next((m['id'] for m in media if m['source']==principal[0]),None) if number=='1' and principal else None
    staff.append(dict(id='school-staff-'+number,name=name,nameTa='',designation=designation,designationTa='',department=department,category=category,description='',descriptionTa='',imageId=imageId,sortOrder=int(number),status='PUBLISHED',sourceRef=f'STAFF LIST.pdf | 2026-2027 | row {number}'))
assert len(staff)==60, f'Expected 60 staff, parsed {len(staff)}'

fees=[]
for standard in ['LKG','UKG']+[str(x) for x in range(1,13)]:
    amounts= [7000,7000,6500] if standard in ['LKG','UKG'] else [8000,8000,7500] if int(standard)<=5 else [10000,8000,8000] if int(standard)<=8 else [10000,9000,8000] if int(standard)<=10 else [10000,10000,9000]
    for i,(month,amount) in enumerate(zip(['June','October','January'],amounts)):
        fees.append(dict(id=f'school-fee-2026-{standard}-{month}',title='School fee',titleTa='பள்ளிக் கட்டணம்',standard=standard,academicYear='2026-27',category='School fee',amount=amount,frequency=month,installments=1,sortOrder=i,status='PUBLISHED',sourceRef='fees.pdf | 2026-27; instalments only; no category breakdown supplied'))

# Visually checked rows from the original table, including merged year cells.
honourRows=[
 (2012,'ARAVINDHAN R','SSLC',489),(2013,'NINDHINI K. R.','SSLC',492),
 (2014,'ARUN C','SSLC',496),(2014,'ARUN KUMAR B','SSLC',496),(2015,'NANDHINI V','SSLC',496),
 (2016,'SAKILA V','SSLC',492),(2016,'PRAVEEN KUMAR K','SSLC',492),(2017,'AASLIN PRAISE S','SSLC',492),
 (2018,'SUNEKA C','SSLC',491),(2019,'RAVEENDRAN R','HSC',515),(2019,'SATHISH S','SSLC',475),
 (2020,'YOGESHWARI S','HSC',575),(2020,'NITHYA SRI R','SSLC',471),
 (2022,'SWATHI S','HSC',590),(2022,'THENNARASAN A','SSLC',474),(2023,'PRITHIGA R','HSC',565),
 (2023,'KOWSHIKAN R','SSLC',475),(2024,'THENNARASAN A','HSC +2',564),(2024,'KABILA C','HSC +1',539),
 (2024,'SADHANA G','SSLC',493),(2025,'MUTHAMIZH JEEVA S','HSC +2',567),(2025,'KEERTHANA T','HSC +1',558),
 (2025,'ABIUDHAI M V','SSLC',490),(2026,'MOHAMED ISMAIL M','HSC',583),(2026,'THARUN KUMAR M','SSLC',484)]
honours=[dict(id=f'school-honour-{i}',name=name,nameTa='',title=f'{exam} · {marks} marks',titleTa='',academicYear=str(year),standard='10' if exam=='SSLC' else '11' if exam=='HSC +1' else '12',category=exam,description='',descriptionTa='',imageId=None,sortOrder=2026-year,status='PUBLISHED',sourceRef='ROLL OF HONOUR.pdf | result year; photo identity not inferred') for i,(year,name,exam,marks) in enumerate(honourRows,1)]
manifest=dict(media=media,galleries=list(galleries.values()),fees=fees,honours=honours,staff=staff,toppers=toppers)
(output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
review=root/'assets/optimized-school-review'
campus_files = {hashlib.sha256(p['file'].encode()).hexdigest()[:32]+'.webp' for p in json.loads((root/'shared/campus-photos.json').read_text(encoding='utf-8'))}
for path in output.glob('*.webp'):
    if path.name not in {m['filename'] for m in media} | campus_files:
        review.mkdir(exist_ok=True)
        path.replace(review/path.name)

fields=list(rows[0])
with (reports/'school-image-quality-report.csv').open('w',newline='',encoding='utf-8-sig') as f:
    writer=csv.DictWriter(f,fieldnames=fields); writer.writeheader();writer.writerows(rows)
lines=['# School image quality audit','',
 'Source originals are unchanged. Good/Average/Poor ratings use decode, pixel dimensions and an edge-detail proxy, not a definitive blur or compression diagnosis. Selected candidates are also provided in contact sheets for visual review. Exact duplicates use SHA-256. Unlabelled photos are held for identity/context review. No face recognition or inferred student identity is used.',
 '',f'Images audited: {len(rows)}. Selected WebP derivatives: {len(media)}. Maximum derivative dimension: 1800 px. Originals remain in assets/schl_doc.',
 '', '| Original filename / path | Dimensions | Bytes | Format | Quality | Issues | Action | Section | Selected |','|---|---|---:|---|---|---|---|---|---|']
for r in rows:
    lines.append('| '+' | '.join(str(r[k]).replace('|','/') for k in ['path','dimensions','bytes','format','quality','issues','action','section','selected'])+' |')
(reports/'school-image-quality-report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
for page in range((len(media)+35)//36):
    sheet=Image.new('RGB',(1200,1200),'white');draw=ImageDraw.Draw(sheet)
    for j,item in enumerate(media[page*36:(page+1)*36]):
        with Image.open(output/item['filename']) as im: tile=ImageOps.contain(im,(190,165))
        x=(j%6)*200;y=(j//6)*200
        sheet.paste(tile,(x+(190-tile.width)//2,y))
        draw.text((x+4,y+168),str(page*36+j+1)+' '+item['originalName'][:24],fill='black')
    sheet.save(root/f'artifacts/school-contact-{page+1}.jpg')
print(json.dumps({k:len(v) for k,v in manifest.items()}))

# Include the user-supplied campus collection whenever the complete manifest is rebuilt.
import runpy
runpy.run_path(str(root / 'scripts/prepare-campus-photos.py'))
runpy.run_path(str(root / 'scripts/prepare-school-update.py'), run_name='__main__')
