import { useState } from 'react';
import ProfileModal from './ProfileModal';
import { localeFor } from '../../shared/languages.js';
import { useSite } from './context';
import { SectionHeading } from './components';
import './school-records.css';

const portraits = [
  {
    image: 'fr-e-thomas.webp', titleHi: 'रेवरेंड फादर ई. थॉमस', textHi: 'सेंट पॉल्स के प्रधानाचार्य के रूप में उन्होंने 1994 में ब्लॉक 29 में किंडरगार्टन की शाखा शुरू की।',
    width: 560,
    height: 801,
    title: 'Rev. Fr. E. Thomas',
    titleTa: 'அருட்தந்தை இ. தாமஸ்',
    text: 'As principal of St. Paul’s, he started its Block 29 kindergarten annexe in 1994.',
    textTa: 'புனித பவுல் பள்ளியின் முதல்வராக இருந்தபோது, 1994ஆம் ஆண்டு பிளாக் 29-இல் மழலையர் பள்ளிக் கிளையைத் தொடங்கினார்.',
  },
  {
    image: 'fr-v-chinnappan.webp',
    width: 843,
    height: 1084,
    title: 'Rev. Fr. V. Chinnappan',
    titleTa: 'அருட்தந்தை வி. சின்னப்பன்',
    titleHi: 'रेवरेंड फादर वी. चिन्नप्पन',
    text: 'Principal, 2002–2006.',
    textTa: 'முதல்வர், 2002–2006.',
    textHi: 'प्रधानाचार्य, 2002–2006।',
  },
  {
    image: 'fr-pascal-raj.webp', titleHi: 'रेवरेंड फादर पास्कल राज', textHi: 'विद्यालय के इतिहास में सेंट एंटनीज़ के प्रारंभिक विस्तार के दौरान उनका नाम प्रधानाचार्य के रूप में दर्ज है।',
    width: 560,
    height: 720,
    title: 'Rev. Fr. Pascal Raj',
    titleTa: 'அருட்தந்தை பாஸ்கல் ராஜ்',
    text: 'The school history names him as principal during the early expansion of St. Antony’s.',
    textTa: 'புனித அந்தோணியார் பள்ளியின் தொடக்ககால விரிவாக்கத்தின்போது அவர் முதல்வராக இருந்ததாகப் பள்ளி வரலாறு குறிப்பிடுகிறது.',
  },
  {
    image: 'fr-anandaraj.webp', titleHi: 'रेवरेंड फादर आनंदराज', textHi: 'उन्होंने जून 2015 में प्रबंधक और प्रधानाचार्य का कार्यभार सँभाला। उनके नेतृत्व में 2017 में उच्चतर माध्यमिक विभाग शुरू हुआ।',
    width: 560,
    height: 720,
    title: 'Rev. Fr. Anandaraj',
    titleTa: 'அருட்தந்தை ஆனந்தராஜ்',
    text: 'He took charge as correspondent and principal in June 2015. The higher secondary section opened under his leadership in 2017.',
    textTa: '2015 ஜூனில் தாளாளராகவும் முதல்வராகவும் பொறுப்பேற்றார். அவரது தலைமையில் 2017ஆம் ஆண்டு மேல்நிலைப் பிரிவு திறக்கப்பட்டது.',
  },
  {
    image: 'fr-m-john-kennedy.webp', titleHi: 'रेवरेंड फादर एम. जॉन केनेडी', textHi: 'विद्यालय के इतिहास में 13 जून 2023 को प्रबंधक और प्रधानाचार्य के रूप में उनकी नियुक्ति दर्ज है।',
    width: 1200,
    height: 800,
    title: 'Rev. Fr. M. John Kennedy',
    titleTa: 'அருட்தந்தை எம். ஜான் கென்னடி',
    text: 'The school history records his appointment as correspondent and principal on 13 June 2023.',
    textTa: '2023 ஜூன் 13 அன்று அவர் தாளாளராகவும் முதல்வராகவும் பொறுப்பேற்றதாகப் பள்ளி வரலாறு பதிவு செய்கிறது.',
  },
];

export function SchoolLeadership() {
  const { t, pick } = useSite();
  const [selected, setSelected] = useState(null);

  return (
    <section className="section school-leadership" id="school-leadership" aria-label={t('leadershipTitle')}>
      <div className="container">
        <SectionHeading eyebrow={t('leadershipTag')} title={t('leadershipTitle')} text={t('leadershipIntro')} />
        <div className="leadership-grid">
          {portraits.map((portrait) => (
            <button type="button" className="leadership-card" key={portrait.image} onClick={() => setSelected(portrait)} aria-haspopup="dialog" aria-label={`${t('viewDetails')}: ${pick(portrait, 'title')}`}>
              <img
                src={`/api/assets/images/${portrait.image}`}
                alt={pick(portrait, 'title')}
                width={portrait.width}
                height={portrait.height}
                loading="lazy"
              />
              <span className="leadership-caption">
                <h3>{pick(portrait, 'title')}</h3>
                <small>{t('viewDetails')} ↗</small>
              </span>
            </button>
          ))}
        </div>
      </div>
      {selected && <ProfileModal title={pick(selected, 'title')} image={`/api/assets/images/${selected.image}`} onClose={() => setSelected(null)}><p>{pick(selected, 'text')}</p></ProfileModal>}
    </section>
  );
}

const diaryDates = [
  { date: '2026-11-11', titleHi: 'दूसरी मध्यावधि परीक्षाएँ शुरू', title: 'Second mid-term examinations begin', titleTa: 'இரண்டாம் இடைப்பருவத் தேர்வுகள் தொடக்கம்' },
  { date: '2026-11-14', titleHi: 'बाल दिवस', title: 'Children’s Day', titleTa: 'குழந்தைகள் தினம்' },
  { date: '2026-12-05', titleHi: 'एलकेजी से कक्षा 5 तक फैंसी ड्रेस कार्यक्रम', title: 'Fancy dress, LKG to Class V', titleTa: 'எல்.கே.ஜி. முதல் 5ஆம் வகுப்பு வரை மாறுவேட நிகழ்ச்சி' },
  { date: '2026-12-16', titleHi: 'अर्धवार्षिक परीक्षाएँ शुरू', title: 'Half-yearly examinations begin', titleTa: 'அரையாண்டுத் தேர்வுகள் தொடக்கம்' },
  { date: '2027-01-04', titleHi: 'तीसरा सत्र शुरू', title: 'Third term begins', titleTa: 'மூன்றாம் பருவம் தொடக்கம்' },
  { date: '2027-02-16', titleHi: 'तीसरी मध्यावधि परीक्षाएँ शुरू', title: 'Third mid-term examinations begin', titleTa: 'மூன்றாம் இடைப்பருவத் தேர்வுகள் தொடக்கம்' },
  { date: '2027-03-26', titleHi: 'गुड फ़्राइडे का अवकाश', title: 'Good Friday holiday', titleTa: 'புனித வெள்ளி விடுமுறை' },
  { date: '2027-04-23', titleHi: 'शैक्षणिक वर्ष का अंतिम दिन', title: 'Last day of the academic year', titleTa: 'கல்வியாண்டின் கடைசி நாள்' },
];

export function SchoolDiary() {
  const { lang, pick, t } = useSite();
  const dateFormat = new Intl.DateTimeFormat(localeFor(lang), {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  });

  return (
    <section className="section school-diary" id="school-diary" aria-label={t('diaryTitle')}>
      <div className="container">
        <SectionHeading eyebrow={t('diaryTag')} title={t('diaryTitle')} text={t('diaryIntro')} />
        <ul className="diary-list">
          {diaryDates.map((entry) => (
            <li key={entry.date}>
              <time dateTime={entry.date}>{dateFormat.format(new Date(entry.date))}</time>
              <span>{pick(entry, 'title')}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
