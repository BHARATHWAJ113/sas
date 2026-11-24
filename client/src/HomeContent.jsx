import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Quote, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { assetUrl, mediaUrl, useApi } from './api';
import { useSite } from './context';

const fallbackSlides = [
  { id: 'campus-video', kind: 'VIDEO', asset: 'home-campus-video.mp4', alt: 'Welcome to St. Antony’s Matriculation Higher Secondary School', altTa: 'புனித அந்தோணியார் மெட்ரிகுலேஷன் மேல்நிலைப் பள்ளிக்கு வரவேற்கிறோம்', altHi: 'सेंट एंटनीज़ मैट्रिकुलेशन हायर सेकेंडरी स्कूल में आपका स्वागत है', duration: 12 },
  { id: 'st-antony', kind: 'IMAGE', asset: 'st-antony-home.webp', alt: 'St. Antony, patron of the school', altTa: 'பள்ளியின் பாதுகாவலரான புனித அந்தோணியார்', altHi: 'विद्यालय के संरक्षक संत एंटनी', duration: 7 },
  { id: 'campus-library', kind: 'IMAGE', asset: 'campus-library.webp', alt: 'The school library', altTa: 'பள்ளி நூலகம்', altHi: 'विद्यालय का पुस्तकालय', duration: 7 },
  { id: 'campus-sports', kind: 'IMAGE', asset: 'campus-carrom.webp', alt: 'Students taking part in school activities', altTa: 'பள்ளிச் செயல்பாடுகளில் பங்கேற்கும் மாணவர்கள்', altHi: 'विद्यालय की गतिविधियों में भाग लेते विद्यार्थी', duration: 7 },
];

const fallbackPrincipal = {
  title: 'From the Principal’s Desk',
  titleTa: 'முதல்வரின் மேசையிலிருந்து',
  titleHi: 'प्रधानाचार्य की ओर से',
  name: 'Rev. Fr. M. John Kennedy',
  nameTa: 'அருட்தந்தை எம். ஜான் கென்னடி',
  nameHi: 'रेवरेंड फादर एम. जॉन केनेडी',
  designation: 'Correspondent & Principal',
  designationTa: 'தாளாளர் மற்றும் முதல்வர்',
  designationHi: 'प्रबंधक एवं प्रधानाचार्य',
  message: 'Education is a shared journey of faith, knowledge, discipline and service. At St. Antony’s, we strive to create a caring environment where every child can discover their gifts, grow in character and prepare to serve society with confidence.',
  messageTa: 'கல்வி என்பது நம்பிக்கை, அறிவு, ஒழுக்கம் மற்றும் சேவையின் கூட்டுப் பயணம். ஒவ்வொரு குழந்தையும் தனது திறமைகளை அறிந்து, நற்பண்பில் வளர்ந்து, தன்னம்பிக்கையுடன் சமூகத்திற்குச் சேவை செய்யத் தயாராகும் அன்பான சூழலை புனித அந்தோணியார் பள்ளியில் உருவாக்க முயல்கிறோம்.',
  messageHi: 'शिक्षा विश्वास, ज्ञान, अनुशासन और सेवा की साझा यात्रा है। सेंट एंटनीज़ में हम ऐसा स्नेहपूर्ण वातावरण बनाने का प्रयास करते हैं जहाँ हर बच्चा अपनी प्रतिभा पहचाने, चरित्र में विकसित हो और आत्मविश्वास के साथ समाज की सेवा के लिए तैयार हो।',
  imageAsset: 'fr-m-john-kennedy.webp',
};

function slideSource(slide) {
  if (slide.media?.id) return mediaUrl(slide.media.id);
  if (slide.asset) return `/api/assets/images/${slide.asset}`;
  return assetUrl(slide.videoUrl);
}

export function HomeCarousel() {
  const { data } = useApi('/home-slides');
  const { pick, t } = useSite();
  const slides = data?.items?.length ? data.items : fallbackSlides;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const video = useRef(null);

  useEffect(() => setActive(current => Math.min(current, slides.length - 1)), [slides.length]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = event => setReduced(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || reduced || slides.length < 2) return;
    const delay = Math.max(3, Math.min(30, slides[active]?.duration || 7)) * 1000;
    const timer = window.setTimeout(() => setActive(value => (value + 1) % slides.length), delay);
    return () => window.clearTimeout(timer);
  }, [active, paused, reduced, slides]);

  useEffect(() => {
    if (video.current) video.current.muted = muted;
  }, [active, muted]);

  const move = direction => setActive(value => (value + direction + slides.length) % slides.length);
  const toggleMute = () => setMuted(current => {
    const next = !current;
    if (video.current) {
      video.current.muted = next;
      if (!next && video.current.volume === 0) video.current.volume = 1;
    }
    return next;
  });
  const slide = slides[active];
  return (
    <section
      className="home-carousel"
      aria-roledescription="carousel"
      aria-label={t('homeCarousel')}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setPaused(true); }}
      onPointerLeave={event => { if (event.pointerType === 'mouse') setPaused(false); }}
    >
      <div className="home-carousel-frame">
        {slide.kind === 'VIDEO' ? (
          <video ref={video} key={slide.id} src={slideSource(slide)} poster={slide.poster?.id ? mediaUrl(slide.poster.id) : undefined} muted={muted} autoPlay={!reduced} playsInline controls onVolumeChange={event => setMuted(event.currentTarget.muted || event.currentTarget.volume === 0)} aria-label={pick(slide, 'alt')} />
        ) : <img key={slide.id} src={slideSource(slide)} alt={pick(slide, 'alt')} width="1920" height="920" fetchPriority={active === 0 ? 'high' : 'auto'} />}
        <div className="home-carousel-vignette" aria-hidden="true" />
        <div className="container home-carousel-mark">
          <span>{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
          <strong>{pick(slide, 'alt')}</strong>
        </div>
        {slides.length > 1 && <>
          <button className="home-carousel-arrow home-carousel-arrow-previous" type="button" onClick={() => move(-1)} aria-label={t('previousSlide')}><ChevronLeft size={24} /></button>
          <button className="home-carousel-arrow home-carousel-arrow-next" type="button" onClick={() => move(1)} aria-label={t('nextSlide')}><ChevronRight size={24} /></button>
        </>}
        {slide.kind === 'VIDEO' && <button className="home-carousel-audio" type="button" onClick={toggleMute} aria-label={t(muted ? 'unmuteVideo' : 'muteVideo')}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>}
      </div>
      {slides.length > 1 && <div className="container home-carousel-controls">
        <div className="home-carousel-dots" role="tablist" aria-label={t('selectSlide')}>
          {slides.map((item, index) => <button key={item.id} type="button" aria-label={`${t('slide')} ${index + 1}`} aria-selected={index === active} role="tab" onClick={() => setActive(index)} />)}
        </div>
        <button className="home-carousel-pause" type="button" onClick={() => setPaused(value => !value)} aria-label={t(paused ? 'playCarousel' : 'pauseCarousel')}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
      </div>}
    </section>
  );
}

export function PrincipalDesk() {
  const { data } = useApi('/principal-desk');
  const { pick, t } = useSite();
  const item = data || fallbackPrincipal;
  const image = item.image?.id ? mediaUrl(item.image.id) : `/api/assets/images/${item.imageAsset || fallbackPrincipal.imageAsset}`;
  const message = pick(item, 'message') || item.message;
  return (
    <section className="section principal-desk" id="principal-desk">
      <div className="container principal-desk-grid">
        <div className="principal-desk-copy">
          <span className="eyebrow"><ShieldCheck size={15} aria-hidden="true" />{t('principalDesk')}</span>
          <h2>{pick(item, 'title')}</h2>
          <Quote size={34} aria-hidden="true" className="principal-quote" />
          <div className="principal-message">{message.split(/\n{2,}/).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
          <div className="principal-signature"><strong>{pick(item, 'name')}</strong><span>{pick(item, 'designation')}</span></div>
        </div>
        <figure className="principal-portrait">
          <img src={image} alt={pick(item, 'name')} width="1200" height="900" loading="lazy" />
          <figcaption><span>{pick(item, 'name')}</span><small>{pick(item, 'designation')}</small></figcaption>
        </figure>
      </div>
    </section>
  );
}
