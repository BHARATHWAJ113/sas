import { useState } from 'react';
import { useSite } from './context';
import { browserMetadata, requestVisitLocation } from './visitor-metadata';
export function useOptionalMetadata() {
  const { t } = useSite();
  const [consent, setConsent] = useState(false);
  const [location, setLocation] = useState({ permission: 'not-requested' });
  const [locating, setLocating] = useState(false);
  async function locate() {
    if (!consent || locating) return;
    setLocating(true);
    setLocation(await requestVisitLocation());
    setLocating(false);
  }
  return {
    collect: () => consent ? { metadataConsent: true, metadata: browserMetadata(location) } : { metadataConsent: false },
    fields: <section className="optional-metadata"><label className="checkbox-label"><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (!event.target.checked) setLocation({ permission: 'not-requested' }); }}/><span>{t('metadataConsent')}</span></label><p>{t('metadataNotice')}</p><button className="text-link" type="button" disabled={!consent || locating} onClick={locate}>{t(locating ? 'locationLoading' : 'locationShare')}</button><p role="status">{t(`location${location.permission}`)}</p>{location.permission === 'granted' && <button type="button" className="text-link" onClick={() => setLocation({ permission: 'not-requested' })}>{t('locationRemove')}</button>}</section>,
  };
}
