import { useEffect, useRef, useState } from 'react';

export function useAutoTranslation(form, setForm, fields, mutate) {
  const [enabled, setEnabled] = useState(true);
  const [jobs, setJobs] = useState({});
  const [error, setError] = useState('');
  const timers = useRef(new Map());
  const versions = useRef(new Map());
  const manual = useRef(new Set());
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    const pendingTimers = timers.current;
    return () => { active.current = false; pendingTimers.forEach(clearTimeout); pendingTimers.clear(); };
  }, []);

  function schedule(key, value, snapshot = form, immediately = false) {
    clearTimeout(timers.current.get(key));
    const version = (versions.current.get(key) || 0) + 1;
    versions.current.set(key, version);
    if (!value.trim()) {
      setJobs(current => ({ ...current, [key]: false }));
      setForm(current => ({ ...current, ...Object.fromEntries(['Ta', 'Hi'].filter(suffix => !manual.current.has(key + suffix)).map(suffix => [key + suffix, ''])) }));
      return;
    }
    if (value.length > 5000) { setError('Free automatic translation supports up to 5,000 characters per field. Shorten the text or translate this field manually.'); setJobs(current => ({ ...current, [key]: false })); return; }
    if (['Ta', 'Hi'].every(suffix => manual.current.has(key + suffix))) { setJobs(current => ({ ...current, [key]: false })); return; }
    setJobs(current => ({ ...current, [key]: true }));
    timers.current.set(key, setTimeout(async () => {
      try {
        const translated = await mutate('/translate', 'POST', { text: value });
        if (!active.current || versions.current.get(key) !== version) return;
        setForm(current => {
          if (current[key] !== value) return current;
          const next = { ...current };
          for (const [suffix, locale] of [['Ta', 'ta'], ['Hi', 'hi']]) {
            const target = key + suffix;
            if (!manual.current.has(target) && current[target] === snapshot[target]) next[target] = translated[locale];
          }
          return next;
        });
      } catch (failure) {
        if (active.current && versions.current.get(key) === version) setError(failure.message);
      } finally {
        if (active.current && versions.current.get(key) === version) setJobs(current => ({ ...current, [key]: false }));
      }
    }, immediately ? 0 : 1400));
  }
  function change(key, value) {
    setForm(current => ({ ...current, [key]: value }));
    if (/Ta$|Hi$/.test(key)) manual.current.add(key);
    if (enabled && fields.includes(key)) {
      setError('');
      schedule(key, value);
    }
  }
  function toggle(value) {
    setEnabled(value);
    if (!value) {
      timers.current.forEach(clearTimeout);
      versions.current.forEach((version, key) => versions.current.set(key, version + 1));
      setJobs({});
    }
  }
  function retry() {
    setError('');
    for (const field of fields) if (form[field]?.trim()) schedule(field, form[field], form, true);
  }
  return { change, enabled, toggle, retry, busy: Object.values(jobs).some(Boolean), error };
}
