import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Megaphone, X, ArrowUpRight } from 'lucide-react';
import { useApi, mediaUrl } from './api';
import { useSite } from './context';
import { isPopupEligible, popupPreferences, rememberPopup, POPUP_INTERVAL } from './popup-policy';
import './announcement-popup.css';
const loadedOnHome = window.location.pathname === '/';

export function AnnouncementContent({ item, preview = false, onNavigate }) {
  const { t, pick } = useSite();
  const image = item.image || (preview && item.imageId ? { id: item.imageId } : null);
  return <article className={`announcement-content theme-${(item.announcementType || 'NOTICE').toLowerCase()}`}>
    <div className="popup-brand"><img src="/images/logo.webp" alt="" width="54" height="54"/><span>{t('school')}<small>{t('schoolSub')}</small></span></div>
    <span className="popup-type"><Megaphone size={14}/>{t(`popupType${item.announcementType || 'NOTICE'}`)}</span>
    {item.isDemo && <p className="demo-badge">{t('demoContent')}</p>}
    <h2 id={preview ? undefined : 'announcement-heading'}>{pick(item, 'title')}</h2>
    <p className="popup-summary">{pick(item, 'summary')}</p>
    {image && <img className="popup-image" src={mediaUrl(image.id)} alt={pick(image, 'alt') || pick(item, 'title')} width="720" height="360" loading="lazy"/>}
    <div className="popup-body">{pick(item, 'body')}</div>
    {pick(item, 'wishes') && <blockquote><strong>{t('fathersWishes')}</strong><p>{pick(item, 'wishes')}</p></blockquote>}
    {pick(item, 'footerMessage') && <p className="popup-footer-message">{pick(item, 'footerMessage')}</p>}
    {item.ctaPath && item.ctaLabel && (preview ? <span className="button">{pick(item, 'ctaLabel')}<ArrowUpRight size={17}/></span> : <Link className="button" to={item.ctaPath} onClick={onNavigate}>{pick(item, 'ctaLabel')}<ArrowUpRight size={17}/></Link>)}
  </article>;
}

export default function AnnouncementPopup() {
  const { pathname } = useLocation();
  const initialHome = useRef(loadedOnHome && pathname === '/');
  const departed = useRef(false);
  const { t } = useSite();
  const state = useApi(initialHome.current ? '/home-announcements' : null);
  const [closed, setClosed] = useState([]);
  const [active, setActive] = useState(null);
  const [snooze, setSnooze] = useState('refresh');
  const [nextAt, setNextAt] = useState(0);
  const [closing, setClosing] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const dialog = useRef(null);
  const fade = useRef(null);
  const memory = useRef({});
  const items = useMemo(() => state.data?.items || [], [state.data]);
  useEffect(() => {
    const changed = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', changed);
    return () => { document.removeEventListener('visibilitychange', changed); clearTimeout(fade.current); };
  }, []);
  useEffect(() => { if (pathname !== '/') departed.current = true; }, [pathname]);
  const allowed = initialHome.current && !departed.current && pathname === '/' && visible;
  function eligible(item) {
    let preferences = memory.current;
    try { preferences = { ...popupPreferences(localStorage), ...memory.current }; } catch { /* In-memory preferences remain active. */ }
    return !closed.includes(item.id) && isPopupEligible(item, preferences);
  }
  useEffect(() => {
    if (!allowed || active) return;
    const timer = setTimeout(() => {
      let preferences = memory.current;
      try { preferences = { ...popupPreferences(localStorage), ...memory.current }; } catch { /* Storage can be unavailable. */ }
      const next = items.find(item => !closed.includes(item.id) && isPopupEligible(item, preferences));
      if (next) { setActive(next.id); setSnooze('refresh'); }
    }, Math.max(0, nextAt - Date.now()));
    return () => clearTimeout(timer);
  }, [allowed, active, items, closed, nextAt]);
  const selected = items.find(item => item.id === active);
  useLayoutEffect(() => {
    if (selected && allowed && !dialog.current.open) dialog.current.showModal();
    else if ((!selected || !allowed) && dialog.current.open) dialog.current.close();
  }, [selected, allowed]);
  useEffect(() => {
    if (!selected?.expiresAt) return;
    const timer = setTimeout(() => { setClosed(value => [...value, selected.id]); setActive(null); }, Math.min(2147483647, Math.max(0, new Date(selected.expiresAt).getTime() - Date.now())));
    return () => clearTimeout(timer);
  }, [selected]);
  function dismiss() {
    if (!selected || closing) return;
    let saved;
    try { saved = rememberPopup(localStorage, selected, snooze); } catch { saved = false; }
    if (!saved) {
      memory.current[selected.id] = { revision: String(selected.updatedAt || selected.publishedAt || selected.id), until: snooze === 'never' ? 'never' : Date.now() + Number(snooze) * 60000 };
      setStorageError(true);
    }
    setClosing(true);
    setNextAt(Date.now() + POPUP_INTERVAL);
    fade.current = setTimeout(() => { dialog.current?.close(); setClosed(value => [...value, selected.id]); setActive(null); setClosing(false); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160);
  }
  return <><dialog ref={dialog} className={`announcement-dialog${closing ? ' is-closing' : ''}`} aria-labelledby="announcement-heading" onCancel={event => { event.preventDefault(); dismiss(); }}>
    {selected && <><button className="dialog-close" type="button" aria-label={t('close')} onClick={dismiss}><X/></button>
      {items.filter(eligible).length > 1 && <nav className="popup-pages" aria-label={t('popupNavigation')}>{items.filter(eligible).map((item, index) => <button type="button" key={item.id} aria-current={item.id === active ? 'true' : undefined} aria-label={`${t('popupAnnouncement')} ${index + 1}: ${item.title}`} onClick={() => { setActive(item.id); setSnooze('refresh'); }}>{index + 1}</button>)}</nav>}
      <AnnouncementContent item={selected} onNavigate={() => { departed.current = true; dialog.current.close(); setActive(null); }}/>
      <div className="popup-preferences"><label htmlFor="popup-reminder">{t('popupReminder')}<select id="popup-reminder" value={snooze} onChange={event => setSnooze(event.target.value)}><option value="refresh">{t('popupEveryRefresh')}</option><option value="5">{t('popupHide5')}</option><option value="10">{t('popupHide10')}</option><option value="30">{t('popupHide30')}</option><option value="never">{t('popupNever')}</option></select></label><small>{t('popupMessageOnly')}</small><button className="button" type="button" disabled={closing} onClick={dismiss}>{t('popupSaveClose')}</button></div>
    </>}
  </dialog>{storageError && <p className="popup-storage-error" role="status">{t('popupStorageError')}</p>}</>;
}
