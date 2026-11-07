export const POPUP_INTERVAL = 20000;
const key = 'school-announcement-preferences-v1';
export const revision = item => String(item.updatedAt || item.publishedAt || item.id);
export function popupPreferences(storage) {
  try { const data = JSON.parse(storage.getItem(key) || '{}'); return data && !Array.isArray(data) && typeof data === 'object' ? data : {}; }
  catch { return {}; }
}
export function isPopupEligible(item, preferences, now = Date.now()) {
  if (!item.showPopup || item.status !== 'PUBLISHED' || new Date(item.publishedAt).getTime() > now || item.expiresAt && new Date(item.expiresAt).getTime() <= now) return false;
  const saved = preferences[item.id];
  return !saved || saved.revision !== revision(item) || saved.until !== 'never' && !(Number(saved.until) > now);
}
export function rememberPopup(storage, item, minutes, now = Date.now()) {
  if (!['5', '10', '30', 'never'].includes(minutes)) return true;
  const records = popupPreferences(storage);
  records[item.id] = { revision: revision(item), until: minutes === 'never' ? 'never' : now + Number(minutes) * 60000, savedAt: now };
  try { storage.setItem(key, JSON.stringify(records)); return true; } catch { return false; }
}
