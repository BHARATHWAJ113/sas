// Explicit read-only preview: this cannot be enabled in production.
process.env.DEMO_MODE = 'true';
await import('./index.js');
