import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from './context';
import './loading.css';

export function Loader({ label = 'Loading…', compact = false, full = false }) {
  const Container = compact ? 'span' : 'div';
  return <Container className={`school-loader${compact ? ' is-compact' : ''}${full ? ' is-full' : ''}`} role="status" aria-live="polite">
    <span className="loader-book" aria-hidden="true"><span/><span/><i/></span><span>{label}</span>
  </Container>;
}

export function WelcomeLoader() {
  const { pathname } = useLocation();
  const { lang } = useSite();
  const [visible, setVisible] = useState(() => {
    if (pathname !== '/') return false;
    try { return sessionStorage.getItem('school-welcome-seen') !== '1'; } catch { return true; }
  });
  useEffect(() => {
    if (!visible || pathname !== '/') return;
    const shell = document.getElementById('public-shell');
    if (shell) shell.inert = true;
    try { sessionStorage.setItem('school-welcome-seen', '1'); } catch { /* No storage required. */ }
    const timer = setTimeout(() => setVisible(false), matchMedia('(prefers-reduced-motion: reduce)').matches ? 350 : 2100);
    return () => { clearTimeout(timer); if (shell) shell.inert = false; };
  }, [visible, pathname]);
  if (!visible || pathname !== '/') return null;
  return <div className="welcome-loader">
    <div className="welcome-orbit" aria-hidden="true"/>
    <div className="welcome-content" role="status"><img src="/api/assets/images/logo.webp" alt="" width="96" height="96"/><span>{lang === 'ta' ? 'வரவேற்கிறோம்' : 'WELCOME TO'}</span><h1>{lang === 'ta' ? 'புனித அந்தோணியார் பள்ளி' : 'St. Antony’s'}</h1><p>{lang === 'ta' ? 'முயன்று ஒளிர்வோம்' : 'Strive and Shine'}</p><div className="welcome-progress" aria-hidden="true"><i/></div></div>
    <button className="welcome-skip" type="button" onClick={() => setVisible(false)}>{lang === 'ta' ? 'தொடர்க' : 'Enter school website'}</button>
  </div>;
}
