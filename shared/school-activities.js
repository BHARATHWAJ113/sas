export const activityIcons = ['sparkles', 'leadership', 'sports', 'arts', 'science', 'service', 'environment', 'health'];

export const schoolActivityCategories = [
  { slug: 'leadership', titleHi: 'नेतृत्व और चरित्र', title: 'Leadership & Character', titleTa: 'தலைமையும் பண்பும்', icon: 'leadership', sortOrder: 10 },
  { slug: 'sports', titleHi: 'एथलेटिक्स और खेल', title: 'Athletics & Sports', titleTa: 'தடகளமும் விளையாட்டும்', icon: 'sports', sortOrder: 20 },
  { slug: 'arts', titleHi: 'कला और संस्कृति', title: 'Arts & Culture', titleTa: 'கலையும் பண்பாடும்', icon: 'arts', sortOrder: 30 },
  { slug: 'science', titleHi: 'विज्ञान और खोज', title: 'Science & Discovery', titleTa: 'அறிவியலும் கண்டறிதலும்', icon: 'science', sortOrder: 40 },
];

export const schoolActivities = [
  {
    titleHi: 'स्काउट्स और गाइड्स', summaryHi: 'स्काउट्स और गाइड्स गतिविधियों में भाग लेकर विद्यार्थियों ने टीमवर्क, जिम्मेदारी और व्यावहारिक कौशल विकसित किए हैं।',
    slug: 'scouts-and-guides', categorySlug: 'leadership', sortOrder: 10,
    title: 'Scouts and Guides', titleTa: 'சாரணர் மற்றும் சாரணியர்',
    summary: 'Students have taken part in Scouts and Guides activities, building teamwork, responsibility and practical skills.',
    summaryTa: 'சாரணர் மற்றும் சாரணியர் செயல்பாடுகளில் பங்கேற்ற மாணவர்கள் குழுப்பணி, பொறுப்புணர்வு மற்றும் நடைமுறைத் திறன்களை வளர்த்துள்ளனர்.',
  },
  {
    titleHi: 'राष्ट्रीय कैडेट कोर (एनसीसी)', summaryHi: 'विद्यार्थियों ने एनसीसी शिविरों में भाग लेकर अनुशासन और मिलकर काम करने का अभ्यास किया है।',
    slug: 'ncc', categorySlug: 'leadership', sortOrder: 20,
    title: 'National Cadet Corps (NCC)', titleTa: 'தேசிய மாணவர் படை (NCC)',
    summary: 'Students have participated in NCC camps, where they practise discipline and work together.',
    summaryTa: 'ஒழுக்கத்தையும் குழுப்பணியையும் பயிற்சி செய்யும் தேசிய மாணவர் படை முகாம்களில் மாணவர்கள் பங்கேற்றுள்ளனர்.',
  },
  {
    titleHi: 'एथलेटिक्स और खेल', summaryHi: 'खेल और वार्षिक खेल प्रतियोगिता विद्यार्थियों को प्रतिस्पर्धा करने और अपने साथियों का समर्थन करने के अवसर देते हैं।',
    slug: 'athletics-and-games', categorySlug: 'sports', sortOrder: 30,
    title: 'Athletics & Games', titleTa: 'தடகளமும் விளையாட்டுகளும்',
    summary: 'Sports and the annual Sports Meet give students opportunities to compete and support their teammates.',
    summaryTa: 'விளையாட்டுகளும் ஆண்டு விளையாட்டுப் போட்டியும் மாணவர்கள் போட்டியிடவும் அணியினருக்கு ஆதரவளிக்கவும் வாய்ப்பளிக்கின்றன.',
  },
  {
    titleHi: 'सिलंबम', summaryHi: 'विद्यार्थियों ने संतुलन और समन्वय की आवश्यकता वाली तमिल पारंपरिक युद्धकला सिलंबम में भाग लिया है।',
    slug: 'silambam', categorySlug: 'sports', sortOrder: 40,
    title: 'Silambam', titleTa: 'சிலம்பம்',
    summary: 'Students have taken part in Silambam, a traditional Tamil martial art that calls for balance and coordination.',
    summaryTa: 'சமநிலையும் ஒருங்கிணைப்பும் தேவைப்படும் தமிழர்களின் பாரம்பரியத் தற்காப்புக் கலையான சிலம்பத்தில் மாணவர்கள் பங்கேற்றுள்ளனர்.',
  },
  {
    titleHi: 'भरतनाट्यम', summaryHi: 'इस शास्त्रीय नृत्य के माध्यम से विद्यार्थियों ने लय, अभिव्यक्ति और कहानी कहने की कला सीखी है।',
    slug: 'bharatanatyam', categorySlug: 'arts', sortOrder: 50,
    title: 'Bharatanatyam', titleTa: 'பரதநாட்டியம்',
    summary: 'Students have explored rhythm, expression and storytelling through this classical dance form.',
    summaryTa: 'பரதநாட்டியம் வழியாகத் தாளம், பாவனை மற்றும் கதைசொல்லலை மாணவர்கள் கற்றறிந்துள்ளனர்.',
  },
  {
    titleHi: 'विज्ञान प्रदर्शनियाँ', summaryHi: 'विद्यार्थियों ने विज्ञान प्रदर्शनियों में अपने विचार साझा किए हैं और जो सीखा है उसे समझाया है।',
    slug: 'science-exhibitions', categorySlug: 'science', sortOrder: 60,
    title: 'Science Exhibitions', titleTa: 'அறிவியல் கண்காட்சிகள்',
    summary: 'Students have participated in science exhibitions, sharing their ideas and explaining what they learned.',
    summaryTa: 'அறிவியல் கண்காட்சிகளில் பங்கேற்ற மாணவர்கள் தங்கள் சிந்தனைகளைப் பகிர்ந்து, கற்றவற்றை விளக்கியுள்ளனர்.',
  },
];
