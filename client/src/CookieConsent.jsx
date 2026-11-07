import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { api, useApi } from './api';
import { useSite } from './context';
import './cookie-consent.css';

const ConsentContext = createContext(null);
export const useConsent = () => useContext(ConsentContext);

export function CookieConsentProvider({ children }) {
  const { t, lang } = useSite();
  const stored = useApi('/consent');
  const [saved, setSaved] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mapChoice, setMapChoice] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);
  const dialog = useRef(null);
  const channel = useRef(null);
  const preference = saved || stored.data;
  const optionalAllowed = !!(preference?.maps ?? preference?.choice === 'ACCEPTED');
  const analyticsAllowed = preference?.analytics === true;
  const known = !!preference?.choice;

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const connection = new BroadcastChannel('school-cookie-preferences');
    channel.current = connection;
    connection.onmessage = ({ data }) => {
      if (['ACCEPTED', 'REJECTED'].includes(data?.choice)) setSaved(data);
    };
    return () => connection.close();
  }, []);

  useEffect(() => {
    if (!preference?.expiresAt) return;
    let timer;
    function checkExpiry() {
      const remaining = new Date(preference.expiresAt).getTime() - Date.now();
      if (remaining <= 0) setSaved({ choice: null });
      else timer = setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    }
    checkExpiry();
    return () => clearTimeout(timer);
  }, [preference?.expiresAt]);

  async function choose(action) {
    if (pending) return;
    setPending(true);
    setError('');
    // Optional content stays blocked until the server confirms acceptance.
    setSaved({ choice: 'REJECTED' });
    channel.current?.postMessage({ choice: 'REJECTED' });
    try {
      const result = await api('/consent', { method: 'POST', body: JSON.stringify({ action, ...(action === 'customize' ? { maps: mapChoice, analytics: analyticsChoice } : {}) }) });
      setSaved(result);
      channel.current?.postMessage(result);
      dialog.current?.close();
    } catch {
      setError(t('cookieSaveError'));
    } finally {
      setPending(false);
    }
  }
  function openSettings() {
    setMapChoice(optionalAllowed); setAnalyticsChoice(analyticsAllowed);
    setSettingsOpen(true); dialog.current.showModal();
  }

  const controls = (
    <div className="cookie-actions">
      <button type="button" disabled={pending} onClick={() => choose('reject')}>{t('cookieReject')}</button>
      <button type="button" disabled={pending} className="cookie-accept" onClick={() => choose('accept')}>{t('cookieAccept')}</button>
    </div>
  );

  return (
    <ConsentContext.Provider value={{ optionalAllowed, analyticsAllowed, popupAllowed: !stored.loading && known && !error && !settingsOpen, openSettings }}>
      {children}
      {!stored.loading && (!known || error) && (
        <aside className="cookie-banner" aria-label={t('cookieTitle')}>
          <Cookie size={24} aria-hidden="true" />
          <div><h2>{t('cookieTitle')}</h2><p>{t('cookieText')} <Link to="/privacy">{t('privacy')}</Link></p>{error && <p role="alert">{error}</p>}</div>
          <div>{controls}<button className="cookie-customize" type="button" onClick={openSettings}>{t('cookieCustomize')}</button></div>
        </aside>
      )}
      <dialog className="cookie-dialog" ref={dialog} aria-labelledby="cookie-settings-title" onClose={() => setSettingsOpen(false)}>
        <button className="dialog-close" type="button" aria-label={t('close')} onClick={() => dialog.current.close()}><X /></button>
        <h2 id="cookie-settings-title">{t('cookieSettings')}</h2>
        <p>{t('cookieText')}</p>
        <p><Link to="/privacy" onClick={() => dialog.current.close()}>{t('privacy')}</Link> · <Link to="/cookie-policy" onClick={() => dialog.current.close()}>{t('cookiePolicy')}</Link></p>
        <p role="status"><strong>{t(!known ? 'cookieChoiceUnset' : optionalAllowed || analyticsAllowed ? 'cookieChoiceAccepted' : 'cookieChoiceRejected')}</strong></p>
        <dl>
          <div><dt>{t('cookieEssential')}</dt><dd>{t('cookieEssentialText')}</dd></div>
          <div><dt>{t('cookieOptional')}</dt><dd>{t('cookieOptionalText')}</dd></div>
          <div><dt>{t('cookieAnalytics')}</dt><dd>{t('cookieAnalyticsText')}</dd></div>
        </dl>
        <label className="checkbox-label"><input type="checkbox" checked={mapChoice} onChange={event => setMapChoice(event.target.checked)}/><span>{t('cookieOptional')}</span></label>
        <label className="checkbox-label"><input type="checkbox" checked={analyticsChoice} onChange={event => setAnalyticsChoice(event.target.checked)}/><span>{t('cookieAnalytics')}</span></label>
        <button className="cookie-customize" type="button" disabled={pending} onClick={() => choose('customize')}>{t('cookieSaveChoices')}</button>
        {preference?.timestamp && <p className="cookie-saved">{t('cookieSaved')} {new Date(preference.timestamp).toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN')}</p>}
        {error && <p role="alert">{error}</p>}
        {controls}
        {(optionalAllowed || analyticsAllowed) && <button type="button" className="cookie-withdraw" disabled={pending} onClick={() => choose('withdraw')}>{t('cookieWithdraw')}</button>}
      </dialog>
    </ConsentContext.Provider>
  );
}
