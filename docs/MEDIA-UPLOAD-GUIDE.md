# School website media upload guide

Use these source dimensions before uploading through **Admin → Media library**. Larger images are accepted within the hard limits, but correct aspect ratios avoid unwanted cropping and reduce upload time.

## Recommended dimensions by section

| Website section | Width × height | Aspect ratio | Maximum upload | Recommended format and notes |
|---|---:|---:|---:|---|
| Homepage carousel image | **1920 × 1080 px** | 16:9 | 30 MB | JPEG, PNG or WebP. Keep important faces and text away from the outer 10% because desktop and mobile use `cover` cropping. |
| Homepage carousel video | **1920 × 1080 px**; 1280 × 720 minimum | 16:9 | 30 MB | MP4 with H.264 video; AAC or no audio. Recommended duration 8–20 seconds. Videos are stored as supplied, so compress them before upload. |
| Carousel video poster | **1920 × 1080 px** | 16:9 | 30 MB | JPEG, PNG or WebP. Use a clear frame that matches the video. |
| Principal’s Desk portrait | **1600 × 1200 px** | 4:3 landscape | 30 MB | Keep the principal near the centre with space around the head and shoulders. The public panel crops responsively. |
| Leadership through the years | **800 × 1000 px** or 1200 × 1500 px | 4:5 portrait | 30 MB | Head-and-shoulders portrait; keep the face in the upper-middle. Cards crop the image and the modal shows the larger version. |
| Staff directory | **800 × 1000 px** | 4:5 portrait | 30 MB | Plain or uncluttered background; one person per image. |
| Roll of Honour | **800 × 1000 px** | 4:5 portrait | 30 MB | Use consistent portrait framing across all records. |
| Academic toppers | **800 × 1000 px** | 4:5 portrait | 30 MB | Keep shoulders visible and avoid text printed into the photo. |
| Activities cards | **1600 × 850 px** | 16:8.5 | 30 MB | Wide action photograph because the activity card uses a wide crop. |
| Event cover | **1600 × 900 px** | 16:9 | 30 MB | Put the main subject near the centre. Avoid small text because cards resize on phones. |
| Event additional photos | **1600 × 1200 px** | 4:3 | 30 MB each | Landscape preferred; portrait photos are also supported. |
| Gallery photos | **1600 × 1200 px** | 4:3 | 30 MB each | Use the original orientation. The lightbox supports portrait and landscape photos. |
| Announcement/news photograph | **1200 × 675 px** | 16:9 | 30 MB | Best for an ordinary announcement photograph. The popup keeps the entire picture visible. |
| Announcement poster | **1200 × 1600 px** | 3:4 portrait | 30 MB | Ensure embedded poster text remains readable on a phone. |
| General page hero image | **1800 × 1000 px** | approximately 16:9 | 30 MB | Wide photograph with the main subject away from the edge used for page text. |
| School logo/crest | **800 × 800 px** | 1:1 square | 30 MB | Transparent PNG or WebP preferred. The current static logo is served at 160 × 160. |
| Email attachment image or PDF | Image as needed | — | **8 MB** | JPEG, PNG, WebP or PDF only. MP4 is not permitted as an email attachment. |

## Media Library hard limits

- Single upload: **30 MB maximum**.
- Batch upload: **up to 30 files**, each **30 MB maximum**.
- Accepted media: JPEG, PNG, WebP, MP4 and PDF.
- Uploaded records begin as **DRAFT** and must be reviewed and published.
- Input images must be **under 25 megapixels**. Use less than 5000 × 5000 px to stay safely below the ceiling.
- Images are auto-rotated, metadata is removed, and the main image is resized to fit within **2400 × 2400 px** without enlargement.
- Images are saved in MinIO as WebP at quality 85, with responsive **1200 px** and **640 px** variants at quality 82.
- MP4 and PDF files are not recompressed by the server. Optimise them before upload.
- Replacements must stay in the same family: image with image, video with video, or document with document. Old objects and image variants are removed after a successful replacement.

## Practical file-size targets

The 30 MB value is a safety ceiling, not a target.

| File type | Good target before upload |
|---|---:|
| Carousel or hero image | 300 KB–1.5 MB |
| Portrait or card image | 150–800 KB |
| Gallery photograph | 300 KB–2 MB |
| MP4 carousel video | 5–20 MB, never above 30 MB |
| PDF | Prefer under 8 MB when it may also be emailed |

Do not upload images directly through the MinIO console. Upload through the Media Library so the database record, captions, translations, responsive variants and publication status remain consistent.
