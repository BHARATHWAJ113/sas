import { useCallback, useEffect, useState } from 'react';
const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
export const mediaUrl = id => `${BASE}/media/${encodeURIComponent(id)}`;
export const assetUrl = url => url?.startsWith('/api/media/') ? mediaUrl(url.slice('/api/media/'.length)) : url;
export async function api(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, { credentials: 'include', ...options, headers: { ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({ error: 'The server returned an unreadable response. Please try again.' }));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed.'), { status: response.status, fields: data.fields });
  return data;
}
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!path) { setState({ data: null, loading: false, error: null }); return; }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    api(path, { signal: controller.signal }).then(data => setState({ data, loading: false, error: null })).catch(error => { if (error.name !== 'AbortError') setState({ data: null, loading: false, error }); });
    return () => controller.abort();
  }, [path, version]);
  const retry = useCallback(() => setVersion(x => x + 1), []);
  return { ...state, retry };
}
