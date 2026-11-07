import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useConsent } from './CookieConsent';
import { api } from './api';
import { browserMetadata } from './visitor-metadata';
export default function VisitorTracker() {
  const { pathname, key } = useLocation();
  const { analyticsAllowed } = useConsent();
  const visit = useRef(null);
  useEffect(() => {
    if (!analyticsAllowed || !/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(pathname)) return;
    if (visit.current?.key !== key) visit.current = { key, id: crypto.randomUUID() };
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api('/visits', { method: 'POST', signal: controller.signal, body: JSON.stringify({ path: pathname, requestId: visit.current.id, metadata: browserMetadata() }) }).catch(() => {});
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [analyticsAllowed, pathname, key]);
  return null;
}
