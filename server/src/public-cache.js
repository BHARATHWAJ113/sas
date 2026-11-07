const publicPaths = new Set(['/api/site', '/api/activities', '/api/gallery-media', '/api/galleries', '/api/events']);

export function publicCache() {
  const records = new Map();
  let generation = 0;
  return {
    clear() { records.clear(); generation++; },
    middleware(req, res, next) {
      if (req.method !== 'GET' || !publicPaths.has(req.path)) return next();
      const key = req.originalUrl;
      const entry = records.get(key);
      if (entry && entry.expires > Date.now()) return res.json(entry.body);
      records.delete(key);
      const started = generation;
      const json = res.json.bind(res);
      res.json = body => {
        if (res.statusCode === 200 && started === generation) {
          if (records.size >= 150) records.delete(records.keys().next().value);
          records.set(key, { body, expires: Date.now() + 10000 });
        }
        return json(body);
      };
      next();
    },
  };
}
