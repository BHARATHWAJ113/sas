import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, BookOpen, Building2, GraduationCap, CalendarDays, MessageCircle, MapPin, Palette, Trophy, Sparkles, CheckCircle2, X, Download, AlertCircle, HeartHandshake } from 'lucide-react';
import { useSite } from './context';
import { api, useApi, mediaUrl, assetUrl } from './api';
import { ResponsiveImage, AcademicCards, AdmissionsCTA, ButtonLink, ContactBlock, DemoBadge, EventCard, EventPreview, FacilityCards, PageHero, Pagination, SearchField, SectionHeading, Seo, StateBox, TextLink, Vision } from './components';
import { schoolPages } from '../../shared/school-profile.js';
import { SchoolDiary, SchoolLeadership } from './SchoolRecords';
import { SchoolJourney, SchoolStats, WhyChooseSchool } from './HomeHighlights';
import { HeroVideo } from './HeroVideo';
import { ActivityExplorer } from './ActivityExplorer';
import { GalleryPreview, ImageGrid } from './Gallery';

const quickLinks = [
  { page: 'academics', label: 'quick1', Icon: BookOpen },
  { page: 'admissions', label: 'quick2', Icon: GraduationCap },
  { page: 'gallery', label: 'quick3', Icon: CalendarDays },
  { page: 'contact', label: 'quick4', Icon: MessageCircle },
];

export function Home() {
  const { t, pick } = useSite();
  const page = useApi('/pages/home');
  const welcome = page.data && !page.data.isDemo ? page.data : schoolPages.home;

  return (
    <>
      <Seo title={page.data?.seoTitle || t('schoolFull')} description={page.data?.seoDescription} />
      <section className="hero">
        <HeroVideo />
        <div className="container hero-content">
          <span className="hero-eyebrow"><Sparkles size={17} aria-hidden="true" />{t('heroEyebrow')}</span>
          <h1>
            <span className="hero-line">{t('hero1')}</span>
            <em className="hero-emphasis">{t('hero2')} {t('hero3')}</em>
          </h1>
          <p>{t('heroText')}</p>
          <div className="hero-actions">
            <ButtonLink to="/about" light>{t('discover')}</ButtonLink>
            <Link to="/admissions" className="hero-second">{t('admissions')}<ArrowRight size={18} /></Link>
          </div>
        </div>
        <div className="hero-bottom container">
          <span><BookOpen size={18} aria-hidden="true" />{t('board')}</span>
          <span><GraduationCap size={19} aria-hidden="true" />{t('grades')}</span>
          <span className="hero-location"><MapPin size={18} aria-hidden="true" />{t('neyveli')}</span>
        </div>
      </section>
      <section className="quick-section">
        <div className="container quick-grid">
          {quickLinks.map(({ page, label, Icon }) => (
            <Link key={page} to={'/' + page} className="quick-link">
              <Icon size={26} aria-hidden="true" />
              <span><strong>{t(page)}</strong><small>{t(label)}</small></span>
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <SchoolStats />
      <SchoolJourney />
      <section className="section welcome-section">
        <div className="container welcome-grid">
          <div className="welcome-photo">
            <ResponsiveImage src="/images/discovery.webp" alt={t('illustrative')} width="650" height="620" loading="lazy" />
            <div className="welcome-seal">
              <ResponsiveImage src="/images/logo.webp" alt="" width="53" height="53" />
              <span>{t('motto')}</span>
            </div>
            <span className="photo-credit">{t('illustrative')}</span>
          </div>
          <div className="welcome-copy">
            <span className="eyebrow">{t('welcomeTag')}</span>
            <h2>{t('welcomeTitle')}</h2>
            <p>{pick(welcome, 'summary')}</p>
            <p className="muted">{pick(welcome, 'body')}</p>
            <div className="welcome-quote"><span aria-hidden="true">✳</span><strong>{t('quote')}</strong></div>
            <TextLink to="/about">{t('aboutLink')}</TextLink>
          </div>
        </div>
      </section>
      <Vision />
      <section className="section academics-section">
        <div className="container">
          <SectionHeading eyebrow={t('academicsTag')} title={t('academicsTitle')} text={t('academicsText')} link={t('allAcademics')} to="/academics" icon={BookOpen} />
          <AcademicCards />
        </div>
      </section>
      <WhyChooseSchool />
      <section className="section campus-section" id="campus-facilities">
        <div className="container">
          <SectionHeading eyebrow={t('campusTag')} title={t('campusTitle')} text={t('campusText')} link={t('facilities')} to="/infrastructure" icon={Building2} />
          <FacilityCards />
        </div>
      </section>
      <StudentLifeSection />
      <ActivityExplorer />
      <div className="container achievement-panel home-achievements">
        <Trophy size={30} aria-hidden="true" />
        <div><h2>{t('achievements')}</h2><p>{t('achievementsText')}</p></div>
      </div>
      <UpdatesPreview />
      <EventPreview />
      <GalleryPreview />
      <AdmissionsCTA />
      <ContactBlock />
    </>
  );
}
export function StudentLifeSection() {
  const { t } = useSite();
  return <section className="section life-section"><div className="container life-grid"><div><span className="eyebrow">{t('lifeTag')}</span><h2>{t('lifeTitle')}</h2><p>{t('lifeText')}</p><ul className="life-list">{[['arts', Palette], ['sports', Trophy], ['clubs', Sparkles]].map(([key, Icon]) => <li key={key}><Icon size={19}/>{t(key)}</li>)}</ul><TextLink to="/student-life">{t('lifeLink')}</TextLink></div><div className="life-photo"><ResponsiveImage src="/images/sports.webp" width="640" height="600" alt={t('illustrative')} loading="lazy"/><div><HeartHandshake size={30}/><span>{t('quote')}</span></div><small>{t('illustrative')}</small></div></div></section>;
}
function UpdatesPreview() {
  const { t, pick, lang } = useSite(); const state = useApi('/announcements?limit=4');
  return <section className="section updates-section"><div className="container"><SectionHeading eyebrow={t('updatesTag')} title={t('updatesTitle')} link={t('allNotices')} to="/notices"/><StateBox {...state} empty={state.data?.items.length === 0}/><div className="updates-grid">{state.data?.items.map(item => <Link key={item.id} to={`/${item.kind === 'NEWS' ? 'news' : 'notices'}?article=${item.slug}`} className="update-card"><div><span className="small-label">{t(item.kind === 'NEWS' ? 'news' : 'notices')}</span>{item.isDemo && <DemoBadge/>}</div><h3>{pick(item, 'title')}</h3><p>{pick(item, 'summary')}</p><span className="update-date">{new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-GB', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(item.publishedAt))}<ArrowUpRight size={20}/></span></Link>)}</div></div></section>;
}
function PageContent({ slug }) {
  const { pick, t } = useSite();
  const state = useApi('/pages/' + slug);
  const reference = schoolPages[slug];
  const page = state.data && !state.data.isDemo ? state.data : reference ?? state.data;
  const label = slug === 'student-life' ? 'studentLife' : slug;

  return (
    <>
      <Seo title={page?.seoTitle || t(label)} description={page?.seoDescription || (page && !page.isDemo ? pick(page, 'summary') : undefined)} />
      <div className="container content-section">
        {page ? (
          <article className="prose">
            {page.isDemo && <DemoBadge>{t('demoContent')}</DemoBadge>}
            <h2>{pick(page, 'title')}</h2>
            <p className="lead">{pick(page, 'summary')}</p>
            <div className="plain-body">{pick(page, 'body')}</div>
          </article>
        ) : state.error?.status === 404 ? (
          <p className="fine-print">{t('emptyText')}</p>
        ) : <StateBox {...state} />}
      </div>
    </>
  );
}

export function About() {
  const { t, setting } = useSite();
  const principal = setting('principal');

  return (
    <>
      <PageHero eyebrow={t('about')} title={t('aboutTitle')} text={t('aboutSub')} image="/images/discovery.webp" />
      <PageContent slug="about" />
      <SchoolLeadership />
      <Vision />
      {principal !== t('principalPending') && (
        <section className="section">
          <div className="container principal-panel">
            <div>
              <span className="eyebrow">{t('principal')}</span>
              <h2>{t('motto')}</h2>
              <p>{principal}</p>
            </div>
            <ResponsiveImage src="/images/logo.webp" width="180" height="180" alt="Official school crest" />
          </div>
        </section>
      )}
      <AdmissionsCTA />
    </>
  );
}
export function Academics() { const { t } = useSite(); return <><PageHero eyebrow={t('academics')} title={t('academicTitle')} text={t('academicSub')} image="/images/discovery.webp"/><section className="section"><div className="container"><SectionHeading eyebrow={t('programme')} title={t('academicsTitle')} text={t('programmeDemo')}/><AcademicCards full/></div></section><PageContent slug="academics"/><AdmissionsCTA/></>; }
export function Infrastructure() { const { t } = useSite(); return <><PageHero eyebrow={t('infrastructure')} title={t('infraTitle')} text={t('infraSub')} image="/images/discovery.webp"/><section className="section"><div className="container"><SectionHeading eyebrow={t('campusTag')} title={t('campusTitle')} text={t('campusText')} icon={Building2}/><FacilityCards/></div></section><PageContent slug="infrastructure"/><AdmissionsCTA/></>; }
export function StudentLife() { const { t } = useSite(); return <><PageHero eyebrow={t('studentLife')} title={t('lifePageTitle')} text={t('lifeSub')} image="/images/sports.webp"/><StudentLifeSection/><ActivityExplorer/><div className="container achievement-panel"><Trophy size={38}/><div><h2>{t('achievements')}</h2><p>{t('achievementsText')}</p></div></div><PageContent slug="student-life"/><EventPreview/><AdmissionsCTA/></>; }
export function EnquiryForm() {
  const { t, lang } = useSite(); const health = useApi('/health');
  const [pending, setPending] = useState(false); const [error, setError] = useState(null); const [success, setSuccess] = useState(null);
  const enabled = health.data?.database === 'connected' && !health.data?.readOnly;
  async function submit(e) {
    e.preventDefault(); if (!enabled || pending) return;
    const form = e.currentTarget; const data = Object.fromEntries(new FormData(form));
    setPending(true); setError(null);
    try { const result = await api('/enquiries', { method: 'POST', body: JSON.stringify({ ...data, consent: data.consent === 'on', locale: lang }) }); setSuccess(result.id); form.reset(); }
    catch (err) { setError(err); }
    finally { setPending(false); }
  }
  return <div className="enquiry-panel" id="enquiry"><span className="eyebrow">{t('enquire')}</span><h2>{t('enquiryTitle')}</h2><p>{t('enquirySub')}</p>{health.loading && <p role="status">{t('loading')}</p>}{!health.loading && !enabled && <div className="form-alert" role="alert"><AlertCircle size={22}/><div>{t('unavailable')}<button className="text-link" onClick={health.retry}>{t('retry')}</button></div></div>}{success ? <div className="form-success" role="status"><CheckCircle2 size={32}/><p>{t('success')}<strong>{success}</strong></p></div> : <form onSubmit={submit}><fieldset disabled={!enabled || pending}><div className="form-grid">{[['parentName', 'text', 'name'], ['studentName', 'text', 'off'], ['email', 'email', 'email'], ['phone', 'tel', 'tel']].map(([name, type, autoComplete]) => <label key={name}>{t(name)} *<input type={type} name={name} required maxLength={name === 'email' ? 191 : name === 'phone' ? 20 : 120} autoComplete={autoComplete} pattern={name === 'phone' ? '(\\+91[ -]?)?[6-9][0-9]{9}' : undefined} placeholder={name === 'phone' ? '+91 9XXXXXXXXX' : undefined} aria-invalid={!!error?.fields?.[name]}/>{error?.fields?.[name] && <span className="field-error">{error.fields[name]}</span>}</label>)}<label className="full-width">{t('grade')} *<select name="grade" required defaultValue=""><option value="" disabled>{t('chooseGrade')}</option>{['LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => String(i + 1))].map(grade => <option key={grade} value={grade}>{grade}</option>)}</select></label><label className="full-width">{t('message')}<textarea name="message" rows="4" maxLength="3000"/></label></div><div className="honey" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="checkbox-label"><input name="consent" type="checkbox" required/><span>{t('consent')} <Link to="/privacy">{t('privacy')}</Link> *</span></label>{error && <div role="alert" className="form-alert">{error.message}</div>}<button className="button" type="submit" disabled={pending}>{pending ? t('submitting') : t('submit')}<ArrowUpRight size={18}/></button></fieldset></form>}</div>;
}
export function Admissions() {
  const { t, setting } = useSite();
  return <><PageHero eyebrow={t('admissions')} title={t('admissionTitle')} text={t('admissionSub')}/><section className="section"><div className="container admissions-grid"><div><span className="eyebrow">{t('steps')}</span><h2>{t('grades')}</h2><p className="admission-dates"><CalendarDays size={20}/>{setting('admissionDates')}</p><ol className="admission-steps">{[1, 2, 3].map(i => <li key={i}><span>0{i}</span><div><h3>{t(`step${i}`)}</h3><p>{t(`step${i}Text`)}</p></div></li>)}</ol><div className="admission-footnote"><BookOpen size={20}/>{t('board')}</div></div><EnquiryForm/></div></section><PageContent slug="admissions"/><ContactBlock/></>;
}
export function Events() {
  const { t, lang } = useSite(); const [params, setParams] = useSearchParams();
  const period = ['all', 'upcoming', 'past'].includes(params.get('period')) ? params.get('period') : 'all';
  const page = Math.max(1, Math.min(10000, parseInt(params.get('page')) || 1)); const search = (params.get('search') || '').slice(0, 100); const category = (params.get('category') || '').slice(0, 80);
  const query = new URLSearchParams({ period, page, search, category, limit: 6 }); const state = useApi(`/events?${query}`);
  function update(key, value) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); setParams(next, { replace: key === 'search' }); }
  return <><Seo title={t('events')}/><PageHero eyebrow={t('events')} title={t('eventListingTitle')} text={t('eventListingSub')} image="/images/sports.webp"/><SchoolDiary/><section className="section event-list-section"><div className="container"><div className="event-toolbar"><div className="filter-tabs" aria-label={t('events')}>{['all', 'upcoming', 'past'].map(value => <button key={value} aria-pressed={period === value} onClick={() => update('period', value)}>{t(value)}</button>)}</div><div className="event-search"><SearchField value={search} label={t('searchEvents')} onChange={e => update('search', e.target.value)}/><label><span className="sr-only">{t('categories')}</span><select value={category} onChange={e => update('category', e.target.value)}><option value="">{t('categories')}</option>{state.data?.categories.map(cat => <option key={cat} value={cat}>{lang === 'ta' ? state.data.categoryTranslations?.[cat] || t('categoryTaMap')[cat] || cat : cat}</option>)}</select></label></div></div><div className="results-label"><span>{state.data?.total ?? '—'} {t('results')}</span>{(search || category || period !== 'all') && <button className="text-link" onClick={() => setParams({})}>{t('clearFilters')}<X size={14}/></button>}</div><StateBox {...state} empty={state.data?.items.length === 0}/>{state.data && <><div className="three-grid">{state.data.items.map(event => <EventCard key={event.id} event={event}/>)}</div><Pagination page={page} pages={state.data.pages} onChange={p => update('page', p)}/></>}</div></section><AdmissionsCTA/></>;
}
export function EventDetails() {
  const { slug } = useParams(); const state = useApi(`/events/${encodeURIComponent(slug)}`); const { t, pick, lang } = useSite();
  if (state.error?.status === 404) return <NotFound/>;
  if (!state.data) return <div className="container section"><StateBox {...state}/></div>;
  const event = state.data;
  return <><Seo title={event.seoTitle || pick(event, 'title')} description={event.seoDescription || pick(event, 'summary')}/><section className="event-detail-banner"><ResponsiveImage sizes="100vw" src={assetUrl(event.cover) || '/images/discovery.webp'} alt={event.isDemo || !event.cover ? t('illustrative') : pick(event, 'title')} width="1440" height="600"/><div/><section className="container"><TextLink to="/events">{t('backEvents')}</TextLink><span className="eyebrow">{pick(event, 'category')}</span><h1>{pick(event, 'title')}</h1>{event.isDemo && <DemoBadge>{t('sampleEvent')}</DemoBadge>}</section></section><div className="container event-detail-layout"><article className="prose"><p className="lead">{pick(event, 'summary')}</p><div className="plain-body">{pick(event, 'body')}</div>{event.images?.length > 0 && <><h2>{t('eventGallery')}</h2><ImageGrid images={event.images}/></>}</article><aside className="event-info"><div><CalendarDays/><h3>{t('eventDate')}</h3><p>{new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(event.date))} IST</p>{event.endDate && <p>– {new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(event.endDate))} IST</p>}</div><div><MapPin/><h3>{t('location')}</h3><p>{pick(event, 'location')}</p></div>{event.attachment && <a className="button" href={mediaUrl(event.attachment.id)} download>{t('download')}<Download size={17}/></a>}{event.isDemo && <p className="fine-print">{t('sampleEvent')}</p>}</aside></div><EventPreview/></>;
}
export function Updates({ kind }) {
  const { t, pick, lang } = useSite(); const [params, setParams] = useSearchParams(); const [page, setPage] = useState(1); const state = useApi(`/announcements?kind=${kind === "NEWS" ? "NEWS" : "NOTICE_BOARD"}&page=${page}&limit=9`); const dialog = useRef(null);
  const article = useApi(params.get('article') ? '/announcements/' + encodeURIComponent(params.get('article')) : null); const selected = article.data; const key = kind === 'NEWS' ? 'news' : 'notices';
  useEffect(() => { if (selected && !dialog.current?.open) dialog.current?.showModal(); if (!selected && dialog.current?.open) dialog.current.close(); }, [selected]);
  return <><Seo title={t(key)}/><PageHero eyebrow={t(key)} title={t(`${key}Title`)} text={t('publishedDemo')} image={kind === 'NEWS' ? '/images/discovery.webp' : '/images/hero.webp'}/><section className="section"><div className="container"><StateBox {...state} empty={state.data?.items.length === 0}/><StateBox loading={article.loading} error={article.error} retry={article.retry}/><div className="updates-grid">{state.data?.items.map(item => <article className="update-card" key={item.id}><div><span className="small-label">{new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-GB', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(item.publishedAt))}</span>{item.isDemo && <DemoBadge/>}</div><h2>{pick(item, 'title')}</h2><p>{pick(item, 'summary')}</p><button className="text-link" onClick={() => setParams({ article: item.slug })}>{t(kind === 'NEWS' ? 'read' : 'viewDetails')}<ArrowUpRight size={17}/></button></article>)}</div><Pagination page={page} pages={state.data?.pages || 0} onChange={p => { setPage(p); setParams({}); }}/></div></section><dialog className="article-dialog" ref={dialog} aria-label={selected ? pick(selected, 'title') : t('noticeDetails')} onClose={() => { if (params.has('article')) setParams({}); }}><button className="dialog-close" aria-label={t('close')} onClick={() => dialog.current.close()}><X/></button>{selected && <article className="prose">{selected.isDemo && <DemoBadge>{t('demoContent')}</DemoBadge>}<h2>{pick(selected, 'title')}</h2><p className="lead">{pick(selected, 'summary')}</p><div className="plain-body">{pick(selected, 'body')}</div></article>}</dialog></>;
}
export function Contact() { const { t } = useSite(); return <><PageHero eyebrow={t('contact')} title={t('contactTitle')} text={t('contactSub')}/><ContactBlock full/><section className="section soft-section"><div className="container narrow-container"><EnquiryForm/></div></section><PageContent slug="contact"/></>; }
export function Privacy() { const { t } = useSite(); return <><Seo title={t('privacy')}/><section className="section"><article className="container prose"><span className="eyebrow">{t('school')}</span><h1>{t('privacy')}</h1><p className="plain-body">{t('privacyText')}</p><ButtonLink to="/contact">{t('contact')}</ButtonLink></article></section></>; }
export function NotFound() { const { t } = useSite(); return <><Seo title="404"/><section className="not-found container"><span>404</span><h1>{t('notFound')}</h1><p>{t('notFoundText')}</p><ButtonLink to="/">{t('backHome')}</ButtonLink></section></>; }
