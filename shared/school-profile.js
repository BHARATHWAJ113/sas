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
    title: 'History of the School',
    summary: 'From St. Paul’s Annexe in 1994 to today’s St. Antony’s Matriculation Higher Secondary School in Block 29, Neyveli.',
    body: [
      'St. Antony’s Matriculation Higher Secondary School, Block 29, Neyveli, was originally established as St. Paul’s Annexe in 1994 by Rev. Fr. E. Thomas, the then Principal of St. Paul’s Matriculation Higher Secondary School, Block 4. It began with a KG section and 164 students, providing quality education closer to the residents of Block 29.',
      'In June 2009, on the initiative of Rev. Fr. P. Arulnathan, the annexe was bifurcated from St. Paul’s School and established as an independent institution by His Grace Most Rev. Dr. Antony Anandarayar, Archbishop of Pondicherry and Cuddalore. Rev. Fr. R. Pascal Raj was appointed as its first Principal. The school received official recognition on 3 May 2010 for classes LKG to VIII. Classes IX and X were subsequently introduced in 2010 and 2011, completing the High School section.',
      'In 2015, the Archbishop Anandarayar Block, comprising 21 classrooms, was inaugurated. The school also secured a five-acre land lease from NLCIL, including a spacious playground. Under the leadership of Rev. Fr. R. Anandaraj, an Administrative Block with modern staff and office facilities was inaugurated on 8 October 2016. The Higher Secondary Section was introduced on 6 June 2017 in the newly constructed St. Thomas Block. In 2019, four additional classrooms were built with the support of NLCIL CSR funds. Four new buses were also purchased to ensure safe transportation for students. A chapel and St. Antony’s Grotto were established to strengthen the spiritual atmosphere of the campus.',
      'Following the challenges caused by the COVID-19 pandemic, Rev. Fr. R. Joseph Paul was appointed Correspondent and Rev. Fr. M. John Kennedy was appointed Principal-in-Charge on 25 October 2021. During their leadership, the Audio-Visual Room and Knowledge Centre (Library) were inaugurated.',
      'On 13 June 2023, Rev. Fr. M. John Kennedy assumed charge as Correspondent and Principal. His leadership focused on ensuring the financial stability and academic development of the institution. A Tabernacle was installed in the chapel, and a separate Physics Laboratory and Indoor Games Room were established. The school also organised its first Annual Sports Meet and launched its magazine, St. Antony’s Flair (Firmly).',
      'During the academic year 2024–2025, the teachers achieved a remarkable milestone by writing and publishing 34 books on Spoken English, Junior IAS, Moral Values and Computer Science. These books were released by His Grace Most Rev. Dr. Francis Kalist, making the school one of the pioneering institutions in the Archdiocese to publish its own student-oriented academic books. The Dr. Anthony Anandarayar Building was also renovated and repainted.',
      'The newly constructed Grotto dedicated to Our Lady Undoer of Knots was solemnly blessed on 23 March 2024. With the support of NLCIL CSR funds, a modern boys’ restroom building comprising 24 toilets with urinals across the ground and first floors was constructed. It was inaugurated on 9 September 2025 by Mr. I. S. Jasper Rose, Executive Director, Mines and Land, and blessed by Rev. Fr. Peter Rajendiram, Episcopal Vicar for Education. The renovated Audio-Visual Room was blessed on 21 March 2026.',
      'Two interactive panels were blessed and inaugurated on 26 June 2026 by Correspondent and Principal Rev. Fr. M. John Kennedy to promote digital learning, making classroom teaching more engaging, effective and technology-driven.',
      'Spiritual growth remains an integral part of the institution. Regular Tuesday Mass, First Friday Eucharistic Adoration, Advent prayers, Lenten retreats and the annual Feast of St. Antony, accompanied by a three-day Novena, have become an essential part of the school’s spiritual life.',
      'Today, St. Antony’s Matriculation Higher Secondary School stands as a testament to faith, perseverance and commitment to excellence, striving to nurture students through quality education, discipline, moral values and spiritual formation.',
    ].join('\n\n'),
  }, {
    title: 'பள்ளியின் வரலாறு',
    summary: '1994ஆம் ஆண்டு புனித பவுல் பள்ளியின் கிளையாகத் தொடங்கி, இன்று நெய்வேலி பிளாக் 29-இல் புனித அந்தோணியார் மெட்ரிகுலேஷன் மேல்நிலைப் பள்ளியாக வளர்ந்த பயணம்.',
    body: [
      'நெய்வேலி பிளாக் 29-இல் உள்ள புனித அந்தோணியார் மெட்ரிகுலேஷன் மேல்நிலைப் பள்ளி, 1994ஆம் ஆண்டு அப்போதைய பிளாக் 4 புனித பவுல் மெட்ரிகுலேஷன் மேல்நிலைப் பள்ளி முதல்வரான அருட்தந்தை இ. தாமஸ் அவர்களால் புனித பவுல் பள்ளியின் கிளையாகத் தொடங்கப்பட்டது. 164 மாணவர்களுடன் மழலையர் பிரிவாகத் தொடங்கிய இப்பள்ளி, பிளாக் 29 குடியிருப்பாளர்களுக்கு அருகிலேயே தரமான கல்வியை வழங்கியது.',
      '2009 ஜூனில் அருட்தந்தை பி. அருள்நாதன் அவர்களின் முயற்சியால் இக்கிளை புனித பவுல் பள்ளியிலிருந்து பிரிக்கப்பட்டு, புதுச்சேரி மற்றும் கடலூர் பேராயர் மேதகு முனைவர் அந்தோணி ஆனந்தராயர் அவர்களால் தனித்த கல்வி நிறுவனமாக நிறுவப்பட்டது. அருட்தந்தை ஆர். பாஸ்கல் ராஜ் முதல் முதல்வராக நியமிக்கப்பட்டார். 2010 மே 3 அன்று எல்.கே.ஜி. முதல் 8ஆம் வகுப்பு வரை அரசின் அதிகாரப்பூர்வ அங்கீகாரம் கிடைத்தது. தொடர்ந்து 2010 மற்றும் 2011ஆம் ஆண்டுகளில் 9 மற்றும் 10ஆம் வகுப்புகள் தொடங்கப்பட்டு உயர்நிலைப் பிரிவு முழுமை பெற்றது.',
      '2015ஆம் ஆண்டு 21 வகுப்பறைகள் கொண்ட பேராயர் ஆனந்தராயர் கட்டடம் திறந்து வைக்கப்பட்டது. விசாலமான விளையாட்டு மைதானம் உட்பட ஐந்து ஏக்கர் நிலம் என்.எல்.சி.ஐ.எல். நிறுவனத்திடமிருந்து குத்தகையாகப் பெறப்பட்டது. அருட்தந்தை ஆர். ஆனந்தராஜ் அவர்களின் தலைமையில் நவீன ஆசிரியர் மற்றும் அலுவலக வசதிகளுடன் நிர்வாகக் கட்டடம் 2016 அக்டோபர் 8 அன்று திறக்கப்பட்டது. புதிதாகக் கட்டப்பட்ட புனித தாமஸ் கட்டடத்தில் 2017 ஜூன் 6 அன்று மேல்நிலைப் பிரிவு தொடங்கப்பட்டது. 2019ஆம் ஆண்டு என்.எல்.சி.ஐ.எல். சமூகப் பொறுப்பு நிதியுதவியுடன் மேலும் நான்கு வகுப்பறைகள் கட்டப்பட்டன. மாணவர்களின் பாதுகாப்பான போக்குவரத்துக்காக நான்கு புதிய பேருந்துகளும் வாங்கப்பட்டன. வளாகத்தின் ஆன்மிகச் சூழலை வலுப்படுத்த சிற்றாலயமும் புனித அந்தோணியார் கெபியும் அமைக்கப்பட்டன.',
      'கோவிட்-19 பெருந்தொற்றால் ஏற்பட்ட சவால்களைத் தொடர்ந்து, 2021 அக்டோபர் 25 அன்று அருட்தந்தை ஆர். ஜோசப் பால் தாளாளராகவும், அருட்தந்தை எம். ஜான் கென்னடி பொறுப்பு முதல்வராகவும் நியமிக்கப்பட்டனர். அவர்களது தலைமையில் ஒலி-ஒளி அறையும் அறிவு மையமும் (நூலகம்) திறந்து வைக்கப்பட்டன.',
      '2023 ஜூன் 13 அன்று அருட்தந்தை எம். ஜான் கென்னடி தாளாளர் மற்றும் முதல்வராகப் பொறுப்பேற்றார். நிறுவனத்தின் நிதி நிலைத்தன்மை மற்றும் கல்வி வளர்ச்சியை உறுதி செய்வதில் அவரது தலைமை கவனம் செலுத்தியது. சிற்றாலயத்தில் திருப்பேழை நிறுவப்பட்டதுடன், தனி இயற்பியல் ஆய்வகமும் உள்விளையாட்டு அறையும் அமைக்கப்பட்டன. பள்ளியின் முதல் ஆண்டு விளையாட்டு விழா நடத்தப்பட்டு, “St. Antony’s Flair (Firmly)” என்ற பள்ளி இதழும் தொடங்கப்பட்டது.',
      '2024–2025 கல்வியாண்டில் ஆசிரியர்கள் பேச்சு ஆங்கிலம், ஜூனியர் ஐ.ஏ.எஸ்., ஒழுக்க விழுமியங்கள் மற்றும் கணினி அறிவியல் தொடர்பான 34 நூல்களை எழுதி வெளியிட்டு குறிப்பிடத்தக்க சாதனை படைத்தனர். மேதகு முனைவர் பிரான்சிஸ் கலிஸ்ட் அவர்களால் வெளியிடப்பட்ட இந்நூல்கள், மாணவர்களுக்கான சொந்தக் கல்வி நூல்களை வெளியிட்ட மறைமாவட்டத்தின் முன்னோடி நிறுவனங்களில் ஒன்றாகப் பள்ளியை உயர்த்தின. முனைவர் அந்தோணி ஆனந்தராயர் கட்டடமும் புதுப்பிக்கப்பட்டு மீண்டும் வர்ணம் பூசப்பட்டது.',
      'முடிச்சுகளை அவிழ்க்கும் அன்னை மரியாவுக்கு அர்ப்பணிக்கப்பட்ட புதிய கெபி 2024 மார்ச் 23 அன்று மந்திரிக்கப்பட்டது. என்.எல்.சி.ஐ.எல். சமூகப் பொறுப்பு நிதியுதவியுடன் தரை மற்றும் முதல் தளங்களில் சிறுநீர் கழிப்பிடங்களுடன் 24 கழிப்பறைகள் கொண்ட நவீன மாணவர் கழிப்பறைக் கட்டடம் கட்டப்பட்டது. சுரங்கங்கள் மற்றும் நிலத்துறை செயல் இயக்குநர் திரு. ஐ. எஸ். ஜாஸ்பர் ரோஸ் அவர்களால் 2025 செப்டம்பர் 9 அன்று திறந்து வைக்கப்பட்ட இக்கட்டடத்தை கல்விக்கான ஆயர் பிரதிநிதி அருட்தந்தை பீட்டர் ராஜேந்திரம் மந்திரித்தார். புதுப்பிக்கப்பட்ட ஒலி-ஒளி அறை 2026 மார்ச் 21 அன்று மந்திரிக்கப்பட்டது.',
      'மின்னணுக் கற்றலை ஊக்குவித்து வகுப்பறைக் கற்பித்தலை ஈர்க்கக்கூடியதாகவும் பயனுள்ளதாகவும் தொழில்நுட்பம் சார்ந்ததாகவும் மாற்றுவதற்காக இரண்டு ஊடாடும் காட்சிப்பலகைகள் 2026 ஜூன் 26 அன்று தாளாளர் மற்றும் முதல்வர் அருட்தந்தை எம். ஜான் கென்னடி அவர்களால் மந்திரிக்கப்பட்டு திறந்து வைக்கப்பட்டன.',
      'ஆன்மிக வளர்ச்சி நிறுவனத்தின் இன்றியமையாத அங்கமாகத் தொடர்கிறது. செவ்வாய்க்கிழமை திருப்பலி, முதல் வெள்ளி நற்கருணை ஆராதனை, திருவருகைக்கால செபங்கள், தவக்கால தியானங்கள் மற்றும் மூன்று நாள் நவநாளுடன் கொண்டாடப்படும் ஆண்டு புனித அந்தோணியார் திருவிழா ஆகியவை பள்ளியின் ஆன்மிக வாழ்வின் முக்கியப் பகுதிகளாகியுள்ளன.',
      'இன்று புனித அந்தோணியார் மெட்ரிகுலேஷன் மேல்நிலைப் பள்ளி நம்பிக்கை, விடாமுயற்சி மற்றும் சிறப்பிற்கான அர்ப்பணிப்பின் சான்றாகத் திகழ்ந்து, தரமான கல்வி, ஒழுக்கம், நன்னெறி விழுமியங்கள் மற்றும் ஆன்மிக உருவாக்கத்தின் மூலம் மாணவர்களை வளர்க்கிறது.',
    ].join('\n\n'),
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
  'school-anthem': schoolPage('school-anthem', {
    title: 'Our school anthem',
    summary: 'The school anthem expresses the shared spirit and values of St. Antony’s.',
    body: 'The anthem reference is presented below for the school community. Contact the school office for the official words, music and guidance for school programmes.',
  }, {
    title: 'எங்கள் பள்ளி கீதம்',
    summary: 'புனித அந்தோணியார் பள்ளியின் பொதுவான உணர்வையும் விழுமியங்களையும் பள்ளி கீதம் வெளிப்படுத்துகிறது.',
    body: 'பள்ளிச் சமூகத்திற்கான கீதக் குறிப்பு கீழே வழங்கப்பட்டுள்ளது. அதிகாரப்பூர்வ வரிகள், இசை மற்றும் பள்ளி நிகழ்ச்சிகளுக்கான வழிகாட்டலுக்கு பள்ளி அலுவலகத்தைத் தொடர்புகொள்ளுங்கள்.',
  }),
  'annual-report': schoolPage('annual-report', {
    title: 'Annual Report 2025–26',
    summary: 'Read the school’s annual report for the 2025–26 academic year.',
    body: 'The report records the academic year’s programmes, activities and development. Use the PDF button below to open the complete report.',
  }, {
    title: '2025–26 ஆண்டு அறிக்கை',
    summary: '2025–26 கல்வியாண்டிற்கான பள்ளியின் ஆண்டு அறிக்கையைப் பாருங்கள்.',
    body: 'கல்வியாண்டின் நிகழ்ச்சிகள், செயல்பாடுகள் மற்றும் வளர்ச்சியை இவ்வறிக்கை பதிவு செய்கிறது. முழு அறிக்கையைத் திறக்க கீழே உள்ள PDF பொத்தானைப் பயன்படுத்தவும்.',
  }),
  'e-communication': schoolPage('e-communication', {
    title: 'e-Communication',
    summary: 'Official digital communication keeps families connected with school information.',
    body: 'Current notices and announcements are published on this website. Families should use the contact details registered with the school and follow instructions issued by the school office. For access support or a change of contact details, contact the office directly.',
  }, {
    title: 'மின்னணுத் தொடர்பு',
    summary: 'பள்ளியின் அதிகாரப்பூர்வ தகவல்களை குடும்பங்களுடன் இணைக்க மின்னணுத் தொடர்பு உதவுகிறது.',
    body: 'தற்போதைய அறிவிப்புகள் இந்த இணையதளத்தில் வெளியிடப்படுகின்றன. பள்ளியில் பதிவு செய்யப்பட்ட தொடர்பு விவரங்களைப் பயன்படுத்தி அலுவலகம் வழங்கும் அறிவுறுத்தல்களைப் பின்பற்றவும். அணுகல் உதவி அல்லது தொடர்பு விவர மாற்றத்திற்கு அலுவலகத்தை நேரடியாகத் தொடர்புகொள்ளுங்கள்.',
  }),
  'e-magazine': schoolPage('e-magazine', {
    title: 'e-Magazine',
    summary: 'A digital space for student and teacher writing, creativity and school memories.',
    body: 'The next school-approved issue will be published here. Contributions and publication dates are coordinated by the school; contact the office for current information.',
  }, {
    title: 'மின்னிதழ்',
    summary: 'மாணவர் மற்றும் ஆசிரியர் எழுத்துகள், படைப்பாற்றல், பள்ளி நினைவுகளுக்கான மின்னணு தளம்.',
    body: 'பள்ளி அங்கீகரிக்கும் அடுத்த இதழ் இங்கே வெளியிடப்படும். படைப்புகள் மற்றும் வெளியீட்டுத் தேதிகளை பள்ளி ஒருங்கிணைக்கிறது; தற்போதைய தகவலுக்கு அலுவலகத்தைத் தொடர்புகொள்ளுங்கள்.',
  }),
  'school-chimes': schoolPage('school-chimes', {
    title: 'School Chimes',
    summary: 'School Chimes is the school’s designated communication channel for families.',
    body: 'This page provides a permanent reference for the service. Parents and guardians should use only the access details issued by the school. For login, account recovery or a change of registered mobile number, contact the school office; never share a password or one-time code with another person.',
  }, {
    title: 'ஸ்கூல் சைம்ஸ்',
    summary: 'குடும்பங்களுக்கான பள்ளியின் குறிப்பிட்ட தகவல் தொடர்புச் சேவை ஸ்கூல் சைம்ஸ்.',
    body: 'இந்தப் பக்கம் சேவைக்கான நிலையான குறிப்பாகும். பள்ளி வழங்கிய அணுகல் விவரங்களை மட்டும் பெற்றோர் பயன்படுத்த வேண்டும். உள்நுழைவு, கணக்கு மீட்பு அல்லது பதிவு செய்யப்பட்ட கைபேசி எண் மாற்றத்திற்கு பள்ளி அலுவலகத்தைத் தொடர்புகொள்ளுங்கள்; கடவுச்சொல் அல்லது ஒருமுறை குறியீட்டை மற்றவருடன் பகிர வேண்டாம்.',
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
