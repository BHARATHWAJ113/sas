import { describe, it, expect } from 'vitest';
import { productionConfigErrors } from '../src/production-config.js';
const valid = { SITE_URL: 'https://stantonysneyveli.in', CLIENT_ORIGIN: 'https://stantonysneyveli.in,https://www.stantonysneyveli.in', DATABASE_URL: 'mysql://school:unique-test-secret@127.0.0.1:3306/school', DEMO_MODE: 'false', COOKIE_SECURE: 'true' };
describe('production environment gate', () => {
  it('accepts matching secure origins without exposing credentials', () => { expect(productionConfigErrors(valid)).toEqual([]); });
  it.each([{DEMO_MODE:'true'}, {COOKIE_SECURE:'false'}, {SITE_URL:'http://localhost:5173'}, {CLIENT_ORIGIN:'https://unrelated.example'}, {CLIENT_ORIGIN:'https://stantonysneyveli.in,http://localhost:5173'}, {DATABASE_URL:'mysql://school:unconfigured@localhost/school'}])('rejects unsafe configuration %j', override => { expect(productionConfigErrors({...valid,...override}).length).toBeGreaterThan(0); });
});
