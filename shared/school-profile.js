import { schoolPagesHi } from './school-profile-hi.js';
export const schoolContacts = {
  phone: '04142-219542',
  email: 'stantonysneyveli@yahoo.com',
};

function schoolPage(slug, en, ta) {
  return {
    slug,
    titleHi: schoolPagesHi[slug]?.title,
    summaryHi: schoolPagesHi[slug]?.summary,
    bodyHi: schoolPagesHi[slug]?.body,
    title: en.title,
    titleTa: ta.title,
    summary: en.summary,
    summaryTa: ta.summary,
    body: en.body,
    bodyTa: ta.body,
    status: 'PUBLISHED',
    isDemo: false,
  };
}

export const schoolPages = {
  home: schoolPage('home', {
    title: 'Welcome to St. Antony’s',
    summary: 'St. Antony’s is a Catholic minority school in Neyveli, administered by the Catholic Archdiocese of Puducherry and Cuddalore. The school follows the Tamil Nadu State Board curriculum from LKG to Grade 12.',
    body: 'Our story began in 1994 with 164 kindergarten pupils at St. Paul’s Annexe in Block 29. We became a separate school in 2009 and opened our higher secondary section in 2017.',
  }, {
    title: 'புனித அந்தோணியார் பள்ளிக்கு வரவேற்கிறோம்',
    summary: 'நெய்வேலியில் உள்ள புனித அந்தோணியார் பள்ளி, புதுச்சேரி மற்றும் கடலூர் கத்தோலிக்க மறைமாவட்டத்தின் நிர்வாகத்தில் இயங்கும் சிறுபான்மைப் பள்ளி. எல்.கே.ஜி. முதல் 12ஆம் வகுப்பு வரை தமிழ்நாடு மாநிலப் பாடத்திட்டத்தைப் பின்பற்றுகிறது.',
    body: '1994ஆம் ஆண்டு பிளாக் 29-இல் புனித பவுல் பள்ளியின் கிளையாக 164 மழலையர்களுடன் எங்கள் பயணம் தொடங்கியது. 2009ஆம் ஆண்டு தனிப் பள்ளியாக உருவானது. 2017ஆம் ஆண்டு மேல்நிலைப் பிரிவு தொடங்கப்பட்டது.',
  }),
  about: schoolPage('about', {
    title: 'Our history',
    summary: 'From a kindergarten annexe in 1994 to a higher secondary school in Neyveli’s Block 29.',
    body: 'In 1994, Rev. Fr. E. Thomas started St. Paul’s Annexe with 164 kindergarten pupils, bringing school closer to families on the western side of Neyveli Township. In June 2009, Archbishop Most Rev. Dr. Antony Anandarayar established the annexe as St. Antony’s Matriculation School, a separate institution under the Catholic Archdiocese of Puducherry and Cuddalore.\n\nThe school received recognition for LKG through Class VIII in May 2010. It received permission for Class IX in December 2010 and added Class X in the 2011–12 academic year. On 6 June 2017, the higher secondary section opened in St. Thomas Block.\n\nThe school’s patron is St. Antony. In the school crest, the open book stands for knowledge, the cross for God and moral values, the dove for peace, and the crown for success. The motto is “Strive and Shine”.',
  }, {
    title: 'பள்ளியின் வரலாறு',
    summary: '1994ஆம் ஆண்டு மழலையர் பள்ளிக் கிளையாகத் தொடங்கி, நெய்வேலி பிளாக் 29-இல் மேல்நிலைப் பள்ளியாக வளர்ந்த பயணம்.',
    body: 'நெய்வேலி நகரியத்தின் மேற்குப் பகுதியில் வசித்த குடும்பங்களுக்கு அருகில் கல்வி கிடைக்க, அருட்தந்தை இ. தாமஸ் 1994ஆம் ஆண்டு 164 மழலையர்களுடன் புனித பவுல் பள்ளியின் கிளையைத் தொடங்கினார். 2009 ஜூனில், பேராயர் மேதகு முனைவர் அந்தோணி ஆனந்தராயர் அக்கிளையைப் புதுச்சேரி மற்றும் கடலூர் கத்தோலிக்க மறைமாவட்டத்தின் கீழ் புனித அந்தோணியார் மெட்ரிகுலேஷன் பள்ளி என்ற தனி நிறுவனமாக அமைத்தார்.\n\n2010 மே மாதத்தில் எல்.கே.ஜி. முதல் 8ஆம் வகுப்பு வரை அங்கீகாரம் கிடைத்தது. 2010 டிசம்பரில் 9ஆம் வகுப்புக்கான அனுமதி கிடைத்தது. 2011–12 கல்வியாண்டில் 10ஆம் வகுப்பு தொடங்கப்பட்டது. 2017 ஜூன் 6 அன்று புனித தாமஸ் கட்டடத்தில் மேல்நிலைப் பிரிவு திறக்கப்பட்டது.\n\nபுனித அந்தோணியார் பள்ளியின் பாதுகாவலர். பள்ளிச் சின்னத்தில் திறந்த புத்தகம் அறிவையும், சிலுவை இறைவனையும் ஒழுக்க விழுமியங்களையும், புறா அமைதியையும், மகுடம் வெற்றியையும் குறிக்கின்றன. “முயன்று ஒளிர்வோம்” என்பது பள்ளியின் குறிக்கோள் வாசகம்.',
  }),
  academics: schoolPage('academics', {
    title: 'Academic year and assessment',
    summary: 'The school year runs from June to April.',
    body: 'Promotion to the next class takes into account work throughout the year and annual examination results. Families are encouraged to follow their child’s progress regularly. Contact the school for class-specific subject options and examination arrangements.',
  }, {
    title: 'கல்வியாண்டும் மதிப்பீடும்',
    summary: 'பள்ளிக் கல்வியாண்டு ஜூனில் தொடங்கி ஏப்ரலில் முடிகிறது.',
    body: 'அடுத்த வகுப்புக்கான தேர்ச்சியில் ஆண்டுத் தேர்வு முடிவுகளுடன் ஆண்டு முழுவதும் மாணவரின் செயல்திறனும் கணக்கில் கொள்ளப்படுகிறது. பெற்றோர் தங்கள் குழந்தையின் முன்னேற்றத்தைத் தொடர்ந்து கவனிக்குமாறு கேட்டுக்கொள்ளப்படுகிறார்கள். வகுப்புக்குரிய பாடத் தேர்வுகள் மற்றும் தேர்வு ஏற்பாடுகளுக்குப் பள்ளியைத் தொடர்புகொள்ளுங்கள்.',
  }),
  admissions: schoolPage('admissions', {
    title: 'Applying to St. Antony’s',
    summary: 'Admission depends on the places available in each class.',
    body: 'The school admits boys and girls. A parent or guardian should introduce the applicant to the principal. For LKG, bring a birth certificate. For a transfer, bring a transfer certificate and a grade card or progress report from a recognised school.\n\nContact the school office for current application dates, class availability, age criteria and fees.',
  }, {
    title: 'புனித அந்தோணியார் பள்ளியில் சேர விண்ணப்பித்தல்',
    summary: 'ஒவ்வொரு வகுப்பிலும் உள்ள காலியிடங்களைப் பொறுத்து மாணவர் சேர்க்கை நடைபெறும்.',
    body: 'மாணவர்களும் மாணவிகளும் சேர்க்கப்படுகிறார்கள். பெற்றோர் அல்லது பாதுகாவலர் விண்ணப்பதாரரை முதல்வரிடம் அறிமுகப்படுத்த வேண்டும். எல்.கே.ஜி. சேர்க்கைக்குப் பிறப்புச் சான்றிதழை எடுத்துவரவும். வேறு பள்ளியிலிருந்து சேரும்போது அங்கீகாரம் பெற்ற பள்ளியின் மாற்றுச் சான்றிதழுடன் மதிப்பெண் அட்டை அல்லது முன்னேற்ற அறிக்கையை எடுத்துவரவும்.\n\nதற்போதைய விண்ணப்பத் தேதிகள், காலியிடங்கள், வயது வரம்பு மற்றும் கட்டணம் குறித்து அலுவலகத்தைத் தொடர்புகொள்ளுங்கள்.',
  }),
  infrastructure: schoolPage('infrastructure', {
    title: 'Campus development and transport',
    summary: 'The school history records a five-acre NLCIL lease, including a playground, and the opening of the Archbishop Anandarayar Block with 21 classrooms in 2015.',
    body: 'The Administrative Block opened in 2016, and St. Thomas Block housed the higher secondary section from 2017. Four classrooms were added in 2019 with support from NLCIL’s CSR scheme. The history also records a chapel, a rooftop garden, and a new block with 24 toilets and urinals inaugurated in September 2025.\n\nSchool bus routes to Block 29 include Periyakurichi, Iruppukurichi, Mathur and Arasakuzhi. Contact the school office for current stops, timings and availability.',
  }, {
    title: 'வளாக வளர்ச்சியும் போக்குவரத்தும்',
    summary: 'விளையாட்டு மைதானம் உட்பட ஐந்து ஏக்கர் நிலத்திற்கான என்.எல்.சி.ஐ.எல். குத்தகையையும், 2015ஆம் ஆண்டு 21 வகுப்பறைகளுடன் திறக்கப்பட்ட பேராயர் ஆனந்தராயர் கட்டடத்தையும் பள்ளி வரலாறு பதிவு செய்கிறது.',
    body: 'நிர்வாகக் கட்டடம் 2016ஆம் ஆண்டு திறக்கப்பட்டது. 2017ஆம் ஆண்டு முதல் புனித தாமஸ் கட்டடத்தில் மேல்நிலைப் பிரிவு இயங்கத் தொடங்கியது. என்.எல்.சி.ஐ.எல். நிறுவனத்தின் சமூகப் பொறுப்புத் திட்ட உதவியுடன் 2019ஆம் ஆண்டு நான்கு வகுப்பறைகள் சேர்க்கப்பட்டன. சிற்றாலயம், மாடித் தோட்டம், 2025 செப்டம்பரில் திறக்கப்பட்ட சிறுநீர் கழிக்கும் வசதிகளுடன் கூடிய 24 கழிப்பறைகள் கொண்ட கட்டடம் ஆகியவற்றையும் பள்ளி வரலாறு குறிப்பிடுகிறது.\n\nபெரியகுறிச்சி, இருப்புக்குறிச்சி, மாத்தூர், அரசக்குழி ஆகிய பகுதிகளிலிருந்து பிளாக் 29 வரை பள்ளிப் பேருந்து வழித்தடங்கள் உள்ளன. தற்போதைய நிறுத்தங்கள், நேரம், இடவசதி ஆகியவற்றைப் பள்ளி அலுவலகத்தில் கேட்டறியுங்கள்.',
  }),
  'student-life': schoolPage('student-life', {
    title: 'Learning and participation',
    summary: 'The school history records participation in science exhibitions, inter-school competitions, NCC camps and Scouts and Guides activities.',
    body: 'The history also records Bharatanatyam, Silambam, sports and the launch of the Annual Sports Meet under Rev. Fr. M. John Kennedy. In 2024–25, teachers produced books on Spoken English, Junior IAS, Moral Values and Computer Science, with printing and binding done on campus. The school also launched a magazine showcasing student and teacher work.',
  }, {
    title: 'கற்றலும் பங்கேற்பும்',
    summary: 'அறிவியல் கண்காட்சிகள், பள்ளிகளுக்கிடையிலான போட்டிகள், தேசிய மாணவர் படை முகாம்கள், சாரணர் மற்றும் சாரணியர் செயல்பாடுகளில் மாணவர்கள் பங்கேற்றதாகப் பள்ளி வரலாறு குறிப்பிடுகிறது.',
    body: 'பரதநாட்டியம், சிலம்பம், விளையாட்டுகள் மற்றும் அருட்தந்தை எம். ஜான் கென்னடியின் தலைமையில் தொடங்கப்பட்ட ஆண்டு விளையாட்டுப் போட்டி ஆகியவையும் வரலாற்றில் இடம்பெற்றுள்ளன. 2024–25 கல்வியாண்டில் பேச்சு ஆங்கிலம், ஜூனியர் ஐஏஎஸ், ஒழுக்க விழுமியங்கள் மற்றும் கணினி அறிவியல் குறித்த நூல்களை ஆசிரியர்கள் உருவாக்கினர். அவை பள்ளி வளாகத்திலேயே அச்சிடப்பட்டு, தொகுக்கப்பட்டன. மாணவர் மற்றும் ஆசிரியர் படைப்புகளை வெளியிடப் பள்ளி இதழும் தொடங்கப்பட்டது.',
  }),
  contact: schoolPage('contact', {
    title: 'Visiting the school',
    summary: 'The school office is in Block 29, Neyveli Township, Tamil Nadu 607807.',
    body: 'The school office is closed on holidays. Call ahead to arrange a visit or ask about admissions, transport or meeting a teacher.',
  }, {
    title: 'பள்ளியைச் சந்திக்க',
    summary: 'பள்ளி அலுவலகம் நெய்வேலி நகரியம், பிளாக் 29, தமிழ்நாடு 607807-இல் உள்ளது.',
    body: 'விடுமுறை நாட்களில் பள்ளி அலுவலகம் மூடப்பட்டிருக்கும். பள்ளிக்கு வருவது, சேர்க்கை, பேருந்து வசதி அல்லது ஆசிரியரைச் சந்திப்பது குறித்துத் தொலைபேசியில் கேட்டறியுங்கள்.',
  }),
};
