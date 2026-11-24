import 'dotenv/config';
import { createDatabase } from '../src/database.js';
import { homeContentSchemas } from '../src/home-content.js';

const slides = [
  { id: 'home-st-antony', kind: 'IMAGE', alt: 'St. Antony, patron of the school', altTa: 'பள்ளியின் பாதுகாவலரான புனித அந்தோணியார்', altHi: 'विद्यालय के संरक्षक संत एंटनी', asset: 'st-antony-home.webp', mediaId: null, videoUrl: null, posterId: null, duration: 7, sortOrder: 10, status: 'PUBLISHED' },
  { id: 'home-library', kind: 'IMAGE', alt: 'The school library', altTa: 'பள்ளி நூலகம்', altHi: 'विद्यालय का पुस्तकालय', asset: 'campus-library.webp', mediaId: null, videoUrl: null, posterId: null, duration: 7, sortOrder: 20, status: 'PUBLISHED' },
  { id: 'home-activities', kind: 'IMAGE', alt: 'Students taking part in school activities', altTa: 'பள்ளிச் செயல்பாடுகளில் பங்கேற்கும் மாணவர்கள்', altHi: 'विद्यालय की गतिविधियों में भाग लेते विद्यार्थी', asset: 'campus-carrom.webp', mediaId: null, videoUrl: null, posterId: null, duration: 7, sortOrder: 30, status: 'PUBLISHED' },
];
const principal = {
  id: 'principal-john-kennedy', title: 'From the Principal’s Desk', titleTa: 'முதல்வரின் மேசையிலிருந்து', titleHi: 'प्रधानाचार्य की ओर से',
  name: 'Rev. Fr. M. John Kennedy', nameTa: 'அருட்தந்தை எம். ஜான் கென்னடி', nameHi: 'रेवरेंड फादर एम. जॉन केनेडी',
  designation: 'Correspondent & Principal', designationTa: 'தாளாளர் மற்றும் முதல்வர்', designationHi: 'प्रबंधक एवं प्रधानाचार्य',
  message: 'Education is a shared journey of faith, knowledge, discipline and service. At St. Antony’s, we strive to create a caring environment where every child can discover their gifts, grow in character and prepare to serve society with confidence.',
  messageTa: 'கல்வி என்பது நம்பிக்கை, அறிவு, ஒழுக்கம் மற்றும் சேவையின் கூட்டுப் பயணம். ஒவ்வொரு குழந்தையும் தனது திறமைகளை அறிந்து, நற்பண்பில் வளர்ந்து, தன்னம்பிக்கையுடன் சமூகத்திற்குச் சேவை செய்யத் தயாராகும் அன்பான சூழலை புனித அந்தோணியார் பள்ளியில் உருவாக்க முயல்கிறோம்.',
  messageHi: 'शिक्षा विश्वास, ज्ञान, अनुशासन और सेवा की साझा यात्रा है। सेंट एंटनीज़ में हम ऐसा स्नेहपूर्ण वातावरण बनाने का प्रयास करते हैं जहाँ हर बच्चा अपनी प्रतिभा पहचाने, चरित्र में विकसित हो और आत्मविश्वास के साथ समाज की सेवा के लिए तैयार हो।',
  imageId: null, imageAsset: 'fr-m-john-kennedy.webp', status: 'PUBLISHED',
};
const leaders = [
  ['leader-e-thomas', 'Rev. Fr. E. Thomas', 'அருட்தந்தை இ. தாமஸ்', 'रेवरेंड फादर ई. थॉमस', 'From 1994', 'As principal of St. Paul’s, he started its Block 29 kindergarten annexe in 1994.', 'புனித பவுல் பள்ளியின் முதல்வராக இருந்தபோது, 1994ஆம் ஆண்டு பிளாக் 29-இல் மழலையர் பள்ளிக் கிளையைத் தொடங்கினார்.', 'सेंट पॉल्स के प्रधानाचार्य के रूप में उन्होंने 1994 में ब्लॉक 29 में किंडरगार्टन की शाखा शुरू की।', 'fr-e-thomas.webp'],
  ['leader-v-chinnappan', 'Rev. Fr. V. Chinnappan', 'அருட்தந்தை வி. சின்னப்பன்', 'रेवरेंड फादर वी. चिन्नप्पन', '2002–2006', 'He served as principal from 2002 to 2006.', '2002 முதல் 2006 வரை முதல்வராகப் பணியாற்றினார்.', 'उन्होंने 2002 से 2006 तक प्रधानाचार्य के रूप में सेवा की।', 'fr-v-chinnappan.webp'],
  ['leader-pascal-raj', 'Rev. Fr. Pascal Raj', 'அருட்தந்தை பாஸ்கல் ராஜ்', 'रेवरेंड फादर पास्कल राज', null, 'The school history names him as principal during the early expansion of St. Antony’s.', 'புனித அந்தோணியார் பள்ளியின் தொடக்ககால விரிவாக்கத்தின்போது அவர் முதல்வராக இருந்ததாகப் பள்ளி வரலாறு குறிப்பிடுகிறது.', 'विद्यालय के इतिहास में सेंट एंटनीज़ के प्रारंभिक विस्तार के दौरान उनका नाम प्रधानाचार्य के रूप में दर्ज है।', 'fr-pascal-raj.webp'],
  ['leader-anandaraj', 'Rev. Fr. Anandaraj', 'அருட்தந்தை ஆனந்தராஜ்', 'रेवरेंड फादर आनंदराज', '2015–2023', 'He took charge as correspondent and principal in June 2015. The higher secondary section opened under his leadership in 2017.', '2015 ஜூனில் தாளாளராகவும் முதல்வராகவும் பொறுப்பேற்றார். அவரது தலைமையில் 2017ஆம் ஆண்டு மேல்நிலைப் பிரிவு திறக்கப்பட்டது.', 'उन्होंने जून 2015 में प्रबंधक और प्रधानाचार्य का कार्यभार सँभाला। उनके नेतृत्व में 2017 में उच्चतर माध्यमिक विभाग शुरू हुआ।', 'fr-anandaraj.webp'],
  ['leader-john-kennedy', 'Rev. Fr. M. John Kennedy', 'அருட்தந்தை எம். ஜான் கென்னடி', 'रेवरेंड फादर एम. जॉन केनेडी', '2023–Present', 'The school history records his appointment as correspondent and principal on 13 June 2023.', '2023 ஜூன் 13 அன்று அவர் தாளாளராகவும் முதல்வராகவும் பொறுப்பேற்றதாகப் பள்ளி வரலாறு பதிவு செய்கிறது.', 'विद्यालय के इतिहास में 13 जून 2023 को प्रबंधक और प्रधानाचार्य के रूप में उनकी नियुक्ति दर्ज है।', 'fr-m-john-kennedy.webp'],
].map(([id, name, nameTa, nameHi, tenure, legacy, legacyTa, legacyHi, imageAsset], sortOrder) => ({ id, name, nameTa, nameHi, designation: 'Principal & Correspondent', designationTa: 'முதல்வர் மற்றும் தாளாளர்', designationHi: 'प्रधानाचार्य एवं प्रबंधक', tenure, legacy, legacyTa, legacyHi, quote: null, quoteTa: null, quoteHi: null, imageId: null, imageAsset, sortOrder: (sortOrder + 1) * 10, status: 'PUBLISHED' }));

for (const { id: _id, ...slide } of slides) homeContentSchemas['home-slides'].parse(slide);
homeContentSchemas['principal-desks'].parse(Object.fromEntries(Object.entries(principal).filter(([key]) => key !== 'id')));
for (const { id: _id, ...leader } of leaders) homeContentSchemas.leadership.parse(leader);

if (!process.argv.includes('--apply')) {
  console.log(`Validated ${slides.length} slides, 1 Principal’s Desk record and ${leaders.length} leadership profiles. Use --apply to import records missing from the configured database.`);
} else {
  const db = createDatabase();
  const created = { slides: 0, principal: 0, leaders: 0 };
  try {
    await db.$queryRaw`SELECT 1`;
    for (const record of slides) if (!await db.homeSlide.findUnique({ where: { id: record.id } })) { await db.homeSlide.create({ data: record }); created.slides++; }
    if (!await db.principalDesk.findUnique({ where: { id: principal.id } })) { await db.principalDesk.create({ data: principal }); created.principal++; }
    for (const record of leaders) if (!await db.leaderProfile.findUnique({ where: { id: record.id } })) { await db.leaderProfile.create({ data: record }); created.leaders++; }
    console.log('Created missing homepage records:', created, 'Existing CMS records were preserved.');
  } finally { await db.$disconnect(); }
}
