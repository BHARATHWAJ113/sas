export const languages = [
  { code: 'en', label: 'English', locale: 'en-IN', suffix: '' },
  { code: 'ta', label: 'தமிழ்', locale: 'ta-IN', suffix: 'Ta' },
  { code: 'hi', label: 'हिन्दी', locale: 'hi-IN', suffix: 'Hi' },
];
export const languageCodes = languages.map(language => language.code);
export const normalizeLanguage = language => languageCodes.includes(language) ? language : 'en';
export const localeFor = language => languages.find(item => item.code === language)?.locale || 'en-IN';
export function localizedField(object, field, language) {
  const suffix = languages.find(item => item.code === language)?.suffix;
  const translated = suffix ? object?.[`${field}${suffix}`] : null;
  return typeof translated === 'string' && translated.trim() ? translated : object?.[field];
}
