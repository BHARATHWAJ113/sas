import { useCallback, useEffect, useState } from 'react';

const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
const publicReads = /^\/(site|pages\/[^?]+|events(?:\/[^?]+)?|announcements(?:\/[^?]+)?|home-announcements|activities|gallery-media|galleries)(?:\?|$)/;
const reads = new Map();
export const mediaUrl = id => `${BASE}/media/${encodeURIComponent(id)}`;
export const assetUrl = url => url?.startsWith('/api/media/') ? mediaUrl(url.slice('/api/media/'.length)) : url;

export function invalidatePublicCache() { reads.clear(); }

export async function api(path, options = {}) {
  const { timeoutMs = 15000, signal, ...request } = options;
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
  try {
    const response = await fetch(`${BASE}${path}`, {
      credentials: 'include', ...request, signal: controller.signal,
      headers: { ...(request.body && !(request.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...request.headers },
    });
    if (response.status === 204) { if (path.startsWith('/admin/')) invalidatePublicCache(); return null; }
    let data;
    try { data = await response.json(); }
    catch (error) {
      if (controller.signal.aborted) throw controller.signal.reason || error;
      throw Object.assign(new Error('The server returned an unreadable response. Please try again.'), { status: 502 });
    }
    if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed.'), { status: response.status, fields: data.fields });
    if (request.method && request.method !== 'GET' && path.startsWith('/admin/')) invalidatePublicCache();
    return data;
  } catch (error) {
    if (controller.signal.reason?.name === 'TimeoutError') throw Object.assign(new Error('The request timed out. Please try again.'), { status: 504 });
    if (error instanceof TypeError) throw Object.assign(new Error('Could not connect to the school server. Check your connection and try again.'), { status: 503 });
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export function readPublic(path, refresh = false) {
  const cached = reads.get(path);
  if (cached && (cached.pending || (!refresh && cached.expires > Date.now()))) return cached.promise;
  const entry = { pending: true, expires: 0 };
  entry.promise = (async () => {
    try {
      let data;
      try { data = await api(path); }
      catch (error) {
        if (![502, 503, 504].includes(error.status)) throw error;
        await new Promise(resolve => setTimeout(resolve, 500));
        data = await api(path);
      }
      entry.pending = false;
      entry.expires = Date.now() + 15000;
      return data;
    } catch (error) {
      if (reads.get(path) === entry) reads.delete(path);
      throw error;
    }
  })();
  if (reads.size >= 100) reads.delete(reads.keys().next().value);
  reads.set(path, entry);
  return entry.promise;
}

export function useApi(path, { debounceMs = 0 } = {}) {
  const [state, setState] = useState({ path: null, data: null, loading: !!path, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!path) { setState({ path, data: null, loading: false, error: null }); return; }
    let mounted = true;
    const controller = new AbortController();
    setState({ path, data: null, loading: true, error: null });
    const timer = setTimeout(() => {
      const request = publicReads.test(path) ? readPublic(path, version > 0) : api(path, { signal: controller.signal });
      request.then(data => {
        if (mounted) setState({ path, data, loading: false, error: null });
      }).catch(error => {
        if (mounted && error.name !== 'AbortError') setState({ path, data: null, loading: false, error });
      });
    }, debounceMs);
    return () => {
      mounted = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [path, version, debounceMs]);
  const retry = useCallback(() => setVersion(value => value + 1), []);
  const current = state.path === path ? state : { data: null, loading: !!path, error: null };
  return { ...current, retry };
}
