/* global URL */
// Official destinations supplied by the school. Seed only; CMS edits take precedence.
export const schoolSocialSettings = {
  socialInstagram: 'https://www.instagram.com/st.antonys_schl_neyveli/',
  socialFacebook: 'https://www.facebook.com/share/1J4JBN8WGy/?mibextid=wwXIfr',
  socialYouTube: 'https://www.youtube.com/channel/UCzZisnH57j3WrXQx5CGdVtQ',
};

export const socialPlatforms = [
  { key: 'socialInstagram', name: 'Instagram', hosts: ['instagram.com'], color: '#b72875' },
  { key: 'socialFacebook', name: 'Facebook', hosts: ['facebook.com'], color: '#0866d9' },
  { key: 'socialX', name: 'X', hosts: ['x.com', 'twitter.com'], color: '#171717' },
  { key: 'socialLinkedIn', name: 'LinkedIn', hosts: ['linkedin.com'], color: '#0a66c2' },
  { key: 'socialYouTube', name: 'YouTube', hosts: ['youtube.com'], color: '#d60000' },
  { key: 'socialThreads', name: 'Threads', hosts: ['threads.net', 'threads.com'], color: '#171717' },
];

export function validSocialUrl(key, value) {
  const platform = socialPlatforms.find(item => item.key === key);
  if (!platform || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      platform.hosts.includes(host) && url.pathname.replaceAll('/', '').length > 0;
  } catch { return false; }
}

export function publishedSocialLinks(settings = {}) {
  return socialPlatforms.filter(item => validSocialUrl(item.key, settings[item.key]))
    .map(item => ({ ...item, url: settings[item.key].trim() }));
}
