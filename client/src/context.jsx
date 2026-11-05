import { createContext, useContext, useEffect, useState } from 'react';
import { en, ta } from './i18n';
import { useApi } from './api';
import { schoolContacts } from '../../shared/school-profile.js';
import { schoolCopy } from './school-copy';
const Context = createContext(null);
export function SiteProvider({ children }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('school-language') === 'ta' ? 'ta' : 'en'; } catch { return 'en'; } });
  const site = useApi('/site');
  const dictionary = {
    ...(lang === 'ta' ? ta : en),
    ...schoolCopy[lang],
    ...Object.fromEntries((site.data?.translations || []).filter(x => x.locale === lang).map(x => [x.key, x.value])),
  };
  useEffect(() => { document.documentElement.lang = lang; try { localStorage.setItem('school-language', lang); } catch { /* Preference remains available for this visit. */ } }, [lang]);
  const t = key => dictionary[key] ?? key;
  const pick = (object, field) => lang === 'ta' ? object?.[`${field}Ta`] || object?.[field] : object?.[field];
  const setting = (key) => {
    const value = site.data?.settings?.[key];
    if (value && !value.startsWith('Demo placeholder')) return value;
    const pendingKey = { admissionDates: 'datesPending', officeHours: 'hoursPending' }[key] || `${key}Pending`;
    return schoolContacts[key] ?? t(pendingKey);
  };
  return <Context.Provider value={{ lang, setLang, t, pick, setting, site }}>{children}</Context.Provider>;
}
export const useSite = () => useContext(Context);
