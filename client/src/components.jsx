import { localeFor } from '../../shared/languages.js';
import { Loader } from './Loading';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, ArrowRight, MapPin, Phone, Mail, BookOpen, GraduationCap, CalendarDays, UsersRound, RefreshCw, AlertCircle, Search, Compass, ExternalLink } from 'lucide-react';
import { useSite } from './context';
import { useApi, assetUrl } from './api';
import campusPhotos from '../../shared/campus-photos.json';
export const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=JF45%2B88R%20Neyveli%20Tamil%20Nadu%20607807';
export function ScrollToTop() {
  const { t } = useSite();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVisible(window.scrollY > 500));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => { window.removeEventListener('scroll', update); cancelAnimationFrame(frame); };
  }, []);
  function goToTop() {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  }
  return <button className="scroll-to-top" type="button" aria-label={t('backToTop')} title={t('backToTop')} hidden={!visible} onClick={goToTop}><ArrowUp size={23} aria-hidden="true" /></button>;
}
export function ResponsiveImage(props) {
  const { pick } = useSite();
  // Retire legacy generated covers, including references saved in older CMS records.
  const legacy = { '/api/assets/images/hero.webp': 'campus-students', '/api/assets/images/discovery.webp': 'campus-smart-class', '/api/assets/images/sports.webp': 'campus-table-tennis' };
  const src = legacy[props.src] ? `/api/assets/images/${legacy[props.src]}.webp` : props.src;
  const photo = campusPhotos.find(item => src === `/api/assets/images/${item.key}.webp`);
  const srcSet = photo ? `/api/assets/images/${photo.key}-640.webp 640w, /api/assets/images/${photo.key}-1200.webp 1200w, ${src} 1800w` : undefined;
  return <img {...props} src={src} alt={props.alt === '' ? '' : photo ? pick(photo, 'alt') : props.alt} srcSet={props.srcSet || srcSet} sizes={props.sizes || '(max-width: 650px) 100vw, 50vw'}/>;
}
export function ButtonLink({ to, children, secondary = false, light = false, className = '', ...props }) { return <Link to={to} className={`button ${secondary ? 'button-secondary' : ''} ${light ? 'button-light' : ''} ${className}`} {...props}>{children}<ArrowUpRight size={18}/></Link>; }
export function TextLink({ to, children, ...props }) { return <Link to={to} className="text-link" {...props}>{children}<ArrowUpRight size={17}/></Link>; }
export function SectionHeading({ eyebrow, title, text, link, to, icon: Icon, light = false }) {
  return (
    <div className={`section-heading${light ? ' on-dark' : ''}`}>
      <div>
        <span className="eyebrow">{Icon && <Icon size={16} aria-hidden="true" />}{eyebrow}</span>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {link && <TextLink to={to}>{link}</TextLink>}
    </div>
  );
}
export function StateBox({ loading, error, retry, empty = false }) {
  const { t } = useSite();
  if (loading) return <Loader label={t('loading')}/>;
  if (error) return <div className="state-box error" role="alert"><AlertCircle size={23}/><p>{t('offline')}</p>{retry && <button onClick={retry} className="text-link"><RefreshCw size={16}/>{t('retry')}</button>}</div>;
  if (empty) return <div className="state-box"><CalendarDays size={30}/><h3>{t('empty')}</h3><p>{t('emptyText')}</p></div>;
  return null;
}
export function DemoBadge({ children }) { const { t } = useSite(); return <span className="demo-badge">{children || t('demo')}</span>; }

function ContactValue({ kind }) {
  const { setting } = useSite();
  const value = setting(kind);

  if (kind === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return <a href={`mailto:${encodeURIComponent(value).replace('%40', '@')}`}>{value}</a>;
  }
  if (kind === 'phone') {
    const number = value.replace(/[ ().-]/g, '');
    if (/^\+?\d{7,15}$/.test(number)) return <a href={`tel:${number}`}>{value}</a>;
  }
  return value;
}

export function Footer() {
  const { t, lang } = useSite();
  return <footer className="site-footer"><div className="container footer-grid"><div className="footer-brand"><Link to="/" className="brand"><ResponsiveImage src="/api/assets/images/logo.webp" width="68" height="68" alt="St. Antony's official crest"/><span><strong>{t('school')}</strong><span>{t('schoolSub')}</span><small>{t('neyveli')}</small></span></Link><p>{t('footerText')}</p><span className="footer-motto">{t('motto')} <span>↗</span></span></div><div><h3>{t('explore')}</h3>{[['about','about'],['academics','academics'],['infrastructure','infrastructure'],['student-life','studentLife']].map(([p,k])=><Link key={p} to={`/${p}`}>{t(k)}</Link>)}</div><div><h3>{t('useful')}</h3>{[['admissions','admissions'],['events','events'],['gallery','gallery'],['news','news'],['notices','notices'],['social-media','socialMedia']].map(([p,k])=><Link key={p} to={`/${p}`}>{t(k)}</Link>)}</div><div className="footer-contact"><h3>{t('connect')}</h3><a href={mapsUrl} target="_blank" rel="noreferrer"><MapPin size={18}/>{t(lang === 'ta' ? 'addressTa' : 'address')}</a><p><Phone size={17}/><ContactValue kind="phone"/></p><p><Mail size={17}/><ContactValue kind="email"/></p></div></div><div className="container footer-bottom">
    <div className="footer-credits">
      <span>© {new Date().getFullYear()} {t('copyright')} {t('copyrightYear')}</span>
      <span className="footer-credit">{t('websiteCredit')} <a href="https://tecnozard.com/">Tecnozard Private Limited</a></span>
    </div>
    <div><Link to="/privacy">{t('privacy')}</Link><Link to="/admin">{t('admin')}<ArrowUpRight size={13}/></Link></div>
  </div></footer>;
}
export function Seo({ title, description }) {
  const { t, site } = useSite(); const location = useLocation();
  useEffect(() => {
    document.title = `${title || site.data?.settings?.seoTitle || t('school')} · Neyveli`;
    function meta(name, content, property = false) { let node = document.head.querySelector(`meta[${property ? 'property' : 'name'}="${name}"]`); if (!node) { node = document.createElement('meta'); node.setAttribute(property ? 'property' : 'name', name); document.head.append(node); } node.content = content; }
    const text = description || site.data?.settings?.seoDescription || t('footerText');
    meta('description', text); meta('og:title', document.title, true); meta('og:description', text, true); meta('og:type', 'website', true); meta('robots', site.data?.demo || location.pathname.startsWith('/admin') ? 'noindex, nofollow' : 'index, follow');
    let canonical = document.head.querySelector('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); } canonical.href = `${import.meta.env.VITE_SITE_URL || window.location.origin}${location.pathname}`;
  }, [title, description, location.pathname, t, site.data]);
  return null;
}
export function RouteReset() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior }));
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname, hash]);
  return null;
}
export function PageHero({ eyebrow, title, text, image = '/api/assets/images/campus-students.webp' }) {
  const { t } = useSite();
  return <section className="page-hero"><div className="container page-hero-inner"><div><div className="breadcrumb"><Link to="/">{t('home')}</Link><span>/</span>{eyebrow}</div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div><div className="page-hero-photo"><ResponsiveImage src={image} alt={t('schoolFull')} width="600" height="400"/></div></div></section>;
}
export function AcademicCards({ full = false }) {
  const { t } = useSite();
  return <><div className={`academic-grid ${full ? 'full' : ''}`}>{[['early', BookOpen], ['primary', Compass], ['middle', UsersRound], ['secondary', GraduationCap], ['higher', BookOpen]].map(([key, Icon], i) => <Link to={`/academics#${key}`} id={full ? key : undefined} key={key} className="academic-card"><div className="academic-top"><span className="icon-tile"><Icon size={23}/></span><span>0{i + 1}</span></div><span className="small-label">{t(`${key}Grade`)}</span><h3>{t(key)}</h3><p>{t(`${key}Text`)}</p><ArrowUpRight className="card-arrow" size={19}/></Link>)}</div><p className="fine-print">{t('programmeDemo')}</p></>;
}
export function FacilityCards() {
  const { t } = useSite();
  return <div className="three-grid facility-grid">{['campus-library', 'campus-classroom', 'campus-table-tennis'].map((key, i) => <Link to="/infrastructure" className="photo-card" key={key}><div><ResponsiveImage src={`/api/assets/images/${key}.webp`} alt={t('schoolFull')} loading="lazy" width="600" height="400"/></div><div className="photo-card-body"><h3>{t(`facility${i + 1}`)}<ArrowUpRight size={20}/></h3><p>{t(`facility${i + 1}Text`)}</p></div></Link>)}</div>;
}
export function Vision() {
  const { t } = useSite();
  return <section className="vision-section"><div className="container"><div className="vision-grid"><div><span className="vision-icon"><Compass size={30}/></span><div><h2>{t('vision')}</h2><p>{t('visionText')}</p></div></div><div><span className="vision-icon"><BookOpen size={30}/></span><div><h2>{t('mission')}</h2><p>{t('missionText')}</p></div></div></div></div></section>;
}
export function AdmissionsCTA() { const { t } = useSite(); return <section className="admission-cta"><div className="container"><div><span className="eyebrow">{t('ctaTag')}</span><h2>{t('ctaTitle')}</h2><p>{t('ctaText')}</p></div><div><span className="cta-symbol" aria-hidden="true">✳</span><ButtonLink to="/admissions#enquiry" light>{t('ctaButton')}</ButtonLink></div></div></section>; }
export function ContactBlock({ full = false }) {
  const { t, lang } = useSite();
  return (
    <section className={`section contact-section ${full ? 'contact-full' : ''}`}>
      <div className="container contact-grid">
        <div>
          <span className="eyebrow">{t('visitTag')}</span>
          <h2>{t('visitTitle')}</h2>
          <div className="contact-detail">
            <MapPin/>
            <div><h3>{t('schoolFull')}</h3><p>{t(lang === 'ta' ? 'addressTa' : 'address')}</p></div>
          </div>
          <div className="contact-detail"><Phone/><div><h3>{t('phone')}</h3><p><ContactValue kind="phone"/></p></div></div>
          <div className="contact-detail"><Mail/><div><h3>{t('email')}</h3><p><ContactValue kind="email"/></p></div></div>
        </div>
        <div className="map-panel">
          <div className="map-preview">
            <div className="map-road road1"/><div className="map-road road2"/><div className="map-road road3"/>
            <div className="map-pin"><MapPin size={30}/></div>
            <span className="map-town">NEYVELI</span>
            <a className="button" href={mapsUrl} target="_blank" rel="noreferrer">{t('directions')}<ExternalLink size={16}/></a>
            <small>{t('mapPrivacy')}</small>
          </div>
        </div>
      </div>
    </section>
  );
}
export function EventCard({ event }) {
  const { t, pick, lang } = useSite(); const date = new Date(event.date);
  return <article className="event-card"><Link to={`/events/${event.slug}`} className="event-image" tabIndex={-1} aria-hidden="true"><ResponsiveImage src={assetUrl(event.cover) || '/api/assets/images/campus-smart-class.webp'} alt={event.isDemo || !event.cover ? t('illustrative') : pick(event, 'title')} width="600" height="400" loading="lazy"/><div className="date-badge"><strong>{new Intl.DateTimeFormat(localeFor(lang), { day: '2-digit', timeZone: 'Asia/Kolkata' }).format(date)}</strong><span>{new Intl.DateTimeFormat(localeFor(lang), { month: 'short', timeZone: 'Asia/Kolkata' }).format(date)}</span></div>{event.isDemo && <DemoBadge/>}</Link><div className="event-body"><div className="event-meta"><span>{pick(event, 'category')}</span><span>{new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Kolkata' }).format(date)}</span></div><h3><Link to={`/events/${event.slug}`}>{pick(event, 'title')}</Link></h3><p>{pick(event, 'summary')}</p><TextLink to={`/events/${event.slug}`}>{t('viewDetails')}</TextLink>{event.isDemo && <small className="event-demo">{t('sampleEvent')}</small>}</div></article>;
}
export function EventPreview() {
  const { t } = useSite(); const state = useApi('/events?period=upcoming&limit=3');
  return <section className="section events-section"><div className="container"><SectionHeading eyebrow={t('eventTag')} title={t('eventTitle')} text={t('eventText')} link={t('allEvents')} to="/events"/><StateBox {...state} empty={state.data?.items.length === 0}/>{state.data && <div className="three-grid">{state.data.items.map(event => <EventCard key={event.id} event={event}/>)}</div>}<p className="fine-print"><TextLink to="/events#school-diary">{t('diaryLink')}</TextLink></p></div></section>;
}
export function Pagination({ page, pages, onChange }) {
  const { t } = useSite(); if (pages <= 1) return null;
  return <nav className="pagination" aria-label="Pagination"><button disabled={page <= 1} onClick={() => onChange(page - 1)}>{t('previous')}</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => onChange(page + 1)}>{t('next')}<ArrowRight size={15}/></button></nav>;
}
export function SearchField({ value, onChange, label }) { return <label className="search-field"><Search size={19}/><span className="sr-only">{label}</span><input type="search" placeholder={label} value={value} onChange={onChange}/></label>; }
