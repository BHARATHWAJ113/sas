export function productionConfigErrors(env) {
  const errors = [];
  try {
    const endpoint = new URL(env.MINIO_ENDPOINT);
    if (endpoint.protocol !== 'https:' || endpoint.pathname !== '/' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error();
    if (env.MINIO_URL?.replace(/\/$/, '') !== `${endpoint.origin}/${env.MINIO_BUCKET}`) throw new Error();
    if (!env.MINIO_ACCESS_KEY?.trim() || !env.MINIO_SECRET_KEY?.trim()) throw new Error();
  } catch { errors.push('Configure the HTTPS MinIO S3 endpoint, matching bucket URL, bucket and server-only access/secret keys.'); }
  if (env.DEMO_MODE === 'true') errors.push('DEMO_MODE must be false.');
  if (env.COOKIE_SECURE === 'false') errors.push('Secure session cookies are required.');
  try {
    const site = new URL(env.SITE_URL);
    if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash) throw new Error();
    const origins = env.CLIENT_ORIGIN.split(',').map(value => value.trim());
    if (!origins.includes(site.origin) || origins.some(value => { const url = new URL(value); return url.protocol !== 'https:' || url.origin !== value; })) throw new Error();
  } catch { errors.push('SITE_URL and CLIENT_ORIGIN must contain matching HTTPS origins.'); }
  try {
    const database = new URL(env.DATABASE_URL);
    if (database.protocol !== 'mysql:' || !database.username || !database.password || /unconfigured|change.?me|School@2026#Secure/i.test(decodeURIComponent(database.password))) throw new Error();
  } catch { errors.push('Configure a private MySQL account with a non-example password.'); }
  return errors;
}
