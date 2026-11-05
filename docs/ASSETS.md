# Original assets and provenance

The supplied **assets/st_antonys_logo.jpeg** is preserved unchanged. The 160px WebP at **client/public/images/logo.webp** is a resized display copy of that official crest. No logo or asset from either design reference was copied.

The school supplied four additional archival images for the About page. The WebP display copies are `fr-e-thomas.webp`, `fr-pascal-raj.webp`, `fr-anandaraj.webp` and `fr-m-john-kennedy.webp`. Their original filenames and caption evidence are recorded in [school source notes](SCHOOL-SOURCES.md).

The following project assets were generated with the built-in ImageGen tool and optimised to WebP with Sharp. They are fictional illustrative school scenes, explicitly labeled in the public interface. They are not photographs of St. Antony’s campus, staff or students. Final files:

- `client/public/images/hero.webp` — 177 KB
- `client/public/images/discovery.webp` — 165 KB
- `client/public/images/sports.webp` — 159 KB

Each of hero, discovery and sports also has `-640.webp` and `-960.webp` derivatives for native responsive `srcset` selection. These are resized versions of the same original generated assets.

The bundled `client/public/videos/school-life-preview.mp4` is a silent 10.7-second montage of these same illustrations with slow zooms and crossfades, encoded as a 1280 × 720 H.264 MP4. The homepage labels it as illustrative.

ImageGen prompts:

**Hero:** “Use case: photorealistic-natural. Asset type: wide 16:9 school website hero photograph. Create an original editorial photograph of a small group of happy South Indian schoolchildren ages 9-12 in neat navy blue pinafores and trousers with pale blue shirts, carrying notebooks, walking together in a lush green tree-lined school courtyard in Tamil Nadu. Warm natural morning sunlight, candid smiles, premium authentic documentary photography, subtle depth of field. Children positioned mostly in the RIGHT two thirds of the frame; leafy atmospheric softly blurred trees on the left to accommodate a dark blue overlay and headline. School building only softly blurred in background, no distinctive identifiable campus, no signs. Realistic anatomy and faces. No text, no logo, no watermark. This is illustrative imagery, not an actual photograph of a named school.”

**Discovery:** “Use case: photorealistic-natural. Original landscape editorial photo for a school website, 4:3 ratio. Four South Indian primary school pupils, boys and girls, in pale blue shirts and navy uniforms, looking curiously at a small plant and magnifying glass on a wooden table with a friendly female teacher beside them in a bright airy classroom. Authentic natural daylight, candid learning moment, lush green outside window, thoughtfully composed premium photography. No logos, no text or signage, no watermarks. This is an illustrative fictional scene, not a real named school. Natural realistic hands and anatomy.”

**Sports:** “Use case: photorealistic-natural. Original landscape editorial photo for an Indian school website, 4:3 ratio. A cheerful group of South Indian schoolchildren age 10-12 wearing white sports polo shirts and navy trousers at a sunny green outdoor playing field, one child holding a football and friends smiling. Background leafy tropical Tamil Nadu school grounds, candid energy, authentic documentary photography, soft golden daylight, refined muted natural greens and navy color palette. No actual identifiable campus. No text, no logos, no watermarks. This fictional illustrative scene is not a real school event. Anatomically realistic.”

English text uses bundled Inter font files and Tamil uses bundled Noto Sans Tamil from the corresponding Fontsource npm packages. Font licenses are included with their installed packages. Icons use Lucide React. The map preview is original CSS geometry; Google Maps is embedded only on demand. No nonfunctional social-media icons or invented social accounts are included.
