import { useSite } from './context';
import { SectionHeading } from './components';
import './school-records.css';

const portraits = [
  {
    image: 'fr-e-thomas.webp',
    width: 560,
    height: 801,
    title: 'Rev. Fr. E. Thomas',
    titleTa: 'அருட்தந்தை இ. தாமஸ்',
    text: 'As principal of St. Paul’s, he started its Block 29 kindergarten annexe in 1994.',
    textTa: 'புனித பவுல் பள்ளியின் முதல்வராக இருந்தபோது, 1994ஆம் ஆண்டு பிளாக் 29-இல் மழலையர் பள்ளிக் கிளையைத் தொடங்கினார்.',
  },
  {
    image: 'fr-pascal-raj.webp',
    width: 560,
    height: 720,
    title: 'Rev. Fr. Pascal Raj',
    titleTa: 'அருட்தந்தை பாஸ்கல் ராஜ்',
    text: 'The school history names him as principal during the early expansion of St. Antony’s.',
    textTa: 'புனித அந்தோணியார் பள்ளியின் தொடக்ககால விரிவாக்கத்தின்போது அவர் முதல்வராக இருந்ததாகப் பள்ளி வரலாறு குறிப்பிடுகிறது.',
  },
  {
    image: 'fr-anandaraj.webp',
    width: 560,
    height: 720,
    title: 'Rev. Fr. Anandaraj',
    titleTa: 'அருட்தந்தை ஆனந்தராஜ்',
    text: 'He took charge as correspondent and principal in June 2015. The higher secondary section opened under his leadership in 2017.',
    textTa: '2015 ஜூனில் தாளாளராகவும் முதல்வராகவும் பொறுப்பேற்றார். அவரது தலைமையில் 2017ஆம் ஆண்டு மேல்நிலைப் பிரிவு திறக்கப்பட்டது.',
  },
  {
    image: 'fr-m-john-kennedy.webp',
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

  return (
    <section className="section school-leadership" id="school-leadership" aria-label={t('leadershipTitle')}>
      <div className="container">
        <SectionHeading eyebrow={t('leadershipTag')} title={t('leadershipTitle')} text={t('leadershipIntro')} />
        <div className="leadership-grid">
          {portraits.map((portrait) => (
            <figure className="leadership-card" key={portrait.image}>
              <img
                src={`/images/${portrait.image}`}
                alt={pick(portrait, 'title')}
                width={portrait.width}
                height={portrait.height}
                loading="lazy"
              />
              <figcaption>
                <h3>{pick(portrait, 'title')}</h3>
                <p>{pick(portrait, 'text')}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const diaryDates = [
  { date: '2026-11-11', title: 'Second mid-term examinations begin', titleTa: 'இரண்டாம் இடைப்பருவத் தேர்வுகள் தொடக்கம்' },
  { date: '2026-11-14', title: 'Children’s Day', titleTa: 'குழந்தைகள் தினம்' },
  { date: '2026-12-05', title: 'Fancy dress, LKG to Class V', titleTa: 'எல்.கே.ஜி. முதல் 5ஆம் வகுப்பு வரை மாறுவேட நிகழ்ச்சி' },
  { date: '2026-12-16', title: 'Half-yearly examinations begin', titleTa: 'அரையாண்டுத் தேர்வுகள் தொடக்கம்' },
  { date: '2027-01-04', title: 'Third term begins', titleTa: 'மூன்றாம் பருவம் தொடக்கம்' },
  { date: '2027-02-16', title: 'Third mid-term examinations begin', titleTa: 'மூன்றாம் இடைப்பருவத் தேர்வுகள் தொடக்கம்' },
  { date: '2027-03-26', title: 'Good Friday holiday', titleTa: 'புனித வெள்ளி விடுமுறை' },
  { date: '2027-04-23', title: 'Last day of the academic year', titleTa: 'கல்வியாண்டின் கடைசி நாள்' },
];

export function SchoolDiary() {
  const { lang, pick, t } = useSite();
  const dateFormat = new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', {
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
