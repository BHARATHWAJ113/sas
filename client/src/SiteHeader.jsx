import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Bell, ChevronDown, ChevronLeft, ChevronRight, Menu, Pause, Phone, Play, X } from 'lucide-react';
import { useApi } from './api';
import { useSite } from './context';

const navigation = [
  { label: 'home', path: '/' },
  { label: 'about', pages: [['about', '/about'], ['infrastructure', '/infrastructure']] },
  { label: 'academics', path: '/academics' },
  { label: 'studentLife', pages: [['studentLife', '/student-life'], ['activitiesNav', '/student-life#activities'], ['events', '/events'], ['news', '/news']] },
  { label: 'gallery', path: '/gallery' },
  { label: 'admissions', path: '/admissions' },
  { label: 'contact', path: '/contact' },
];

function NoticeBar() {
  const { t, lang, pick } = useSite();
  const { data, loading } = useApi('/announcements?kind=NOTICE_BOARD&limit=6');
  const viewport = useRef(null);
  const row = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ticker = !reducedMotion && !loading;
  const date = new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  });

  useEffect(() => {
    const track = viewport.current;
    function measure() {
      const start = track.scrollLeft <= 1;
      const end = track.scrollWidth - track.clientWidth - track.scrollLeft <= 1;
      setEdges(current => current.start === start && current.end === end ? current : { start, end });
    }
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(row.current.parentElement);
    track.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      track.removeEventListener('scroll', measure);
    };
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = event => setReducedMotion(event.matches);
    motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!ticker || paused) return;
    const track = viewport.current;
    const original = row.current;
    let width = original.offsetWidth;
    let position = track.scrollLeft;
    let lastFrame;
    let frame;
    const observer = new ResizeObserver(() => { width = original.offsetWidth; });
    observer.observe(original);

    function tick(time) {
      if (lastFrame !== undefined && width && !track.matches(':hover, :focus-within')) {
        position = (position + Math.min(time - lastFrame, 40) * 0.045) % width;
        track.scrollLeft = position;
      } else {
        position = track.scrollLeft;
      }
      lastFrame = time;
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ticker, paused]);

  function move(direction) {
    const track = viewport.current;
    if (ticker) setPaused(true);
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function renderItems(copy = false) {
    const tabIndex = copy ? -1 : undefined;
    if (!data?.items.length) {
      return (
        <>
          <li><Link to="/notices" className="notice-item" tabIndex={tabIndex}>{t('allNotices')}<ArrowUpRight size={15} aria-hidden="true" /></Link></li>
          <li><Link to="/admissions#enquiry" className="notice-item" tabIndex={tabIndex}>{t('enquire')}<ArrowUpRight size={15} aria-hidden="true" /></Link></li>
        </>
      );
    }
    return data.items.map(item => (
      <li key={item.id}>
        <Link to={`/notices?article=${encodeURIComponent(item.slug)}`} className="notice-item" tabIndex={tabIndex}>
          <span className="notice-kind">{t(item.kind === 'ANNOUNCEMENT' ? 'noticeAnnouncement' : 'noticeSingle')}</span>
          {item.isDemo && <span className="notice-demo">{t('demo')}</span>}
          <strong>{pick(item, 'title')}</strong>
          <time dateTime={item.publishedAt}>{date.format(new Date(item.publishedAt))}</time>
        </Link>
      </li>
    ));
  }

  return (
    <aside className="container notice-ribbon" aria-label={t('noticeBoard')}>
      <Link className="notice-board-link" to="/notices" aria-label={t('allNotices')}>
        <Bell size={16} aria-hidden="true" /><span>{t('noticeBoard')}</span>
      </Link>
      <div className="notice-viewport" ref={viewport} onPointerDown={event => { if (event.pointerType === 'touch' && ticker) setPaused(true); }}>
        <div className={`notice-track${ticker ? ' notice-track-loop' : ''}`}>
          <ul className="notice-row" ref={row}>{renderItems()}</ul>
          {ticker && <ul className="notice-row" aria-hidden="true">{renderItems(true)}</ul>}
        </div>
      </div>
      {(ticker || !(edges.start && edges.end)) && (
        <div className="notice-arrows">
          <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label={t('noticePrevious')}><ChevronLeft size={17} /></button>
          {ticker && (
            <button type="button" onClick={() => setPaused(!paused)} aria-label={t(paused ? 'noticePlay' : 'noticePause')}>
              {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
            </button>
          )}
          <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label={t('noticeNext')}><ChevronRight size={17} /></button>
        </div>
      )}
    </aside>
  );
}

export function SiteHeader() {
  const { t, lang, setLang, site, setting } = useSite();
  const [open, setOpen] = useState(false);
  const shell = useRef(null);
  const menuButton = useRef(null);
  const { pathname } = useLocation();
  const phone = setting('phone').replace(/[ ().-]/g, '');
  const hasPhone = /^\+?\d{7,15}$/.test(phone);

  function closeMenu() {
    setOpen(false);
    const dropdown = shell.current.querySelector('details[open]');
    if (dropdown) dropdown.open = false;
  }

  useEffect(() => {
    function dismissOutside(event) {
      if (!shell.current.contains(event.target)) closeMenu();
    }
    function dismissOnEscape(event) {
      if (event.key !== 'Escape') return;
      const dropdown = shell.current.querySelector('details[open]');
      if (dropdown) {
        dropdown.open = false;
        dropdown.querySelector('summary').focus();
      } else if (open) {
        closeMenu();
        menuButton.current.focus();
      }
    }
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [open]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content / உள்ளடக்கத்திற்குச் செல்க</a>
      <header className="campus-header">
        <div className="container campus-nav-shell" ref={shell}>
          <Link to="/" className="brand campus-brand" aria-label={t('schoolFull')} onClick={closeMenu}>
            <img src="/images/logo.webp" width="58" height="58" alt="" />
            <span><strong>{t('school')}</strong><span>{t('schoolSub')}</span><small>{t('neyveli')}</small></span>
          </Link>
          <nav id="main-navigation" aria-label={t('mainNavigation')} className={`campus-nav${open ? ' is-open' : ''}`}>
            {navigation.map(({ label, path, pages }) => pages ? (
              <details key={label} name="campus-navigation" className="campus-dropdown">
                <summary className={pages.some(([, url]) => pathname === url || pathname.startsWith(url + '/')) ? 'is-current' : undefined}>
                  {t(label)}<ChevronDown size={14} aria-hidden="true" />
                </summary>
                <div className="campus-subnav">
                  {pages.map(([key, url]) => {
                    const MenuLink = url.includes('#') ? Link : NavLink;
                    return <MenuLink key={url} to={url} onClick={closeMenu}>{t(key)}<ArrowUpRight size={14} aria-hidden="true" /></MenuLink>;
                  })}
                </div>
              </details>
            ) : <NavLink key={label} to={path} end={path === '/'} onClick={closeMenu}>{t(label)}</NavLink>)}
            <div className="campus-mobile-actions">
              {hasPhone && <a className="campus-call" href={`tel:${phone}`}><Phone size={16} aria-hidden="true" />{t('callSchool')}</a>}
              <Link className="campus-enquire" to="/admissions#enquiry" onClick={closeMenu}>{t('enquire')}<ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
          </nav>
          <div className="campus-nav-actions">
            <button type="button" className="campus-language" onClick={() => setLang(lang === 'en' ? 'ta' : 'en')} aria-label={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}>{t('language')}</button>
            {hasPhone && <a className="campus-call" href={`tel:${phone}`} aria-label={t('callSchool')}><Phone size={16} aria-hidden="true" /><span>{t('callSchool')}</span></a>}
            <Link className="campus-enquire" to="/admissions#enquiry" onClick={closeMenu}>{t('enquire')}<ArrowUpRight size={16} aria-hidden="true" /></Link>
            <button ref={menuButton} type="button" className="campus-menu-toggle" onClick={() => open ? closeMenu() : setOpen(true)} aria-expanded={open} aria-controls="main-navigation" aria-label={t(open ? 'closeNavigation' : 'openNavigation')}>{open ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        <NoticeBar />
      </header>
      {site.data?.demo && <div className="preview-note">{t('preview')}</div>}
    </>
  );
}
