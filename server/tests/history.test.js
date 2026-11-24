import { describe, expect, it } from 'vitest';
import { schoolPages } from '../../shared/school-profile.js';
import { schemas } from '../src/validation.js';

describe('official school history', () => {
  it('retains the supplied chronology in all three languages', () => {
    const history = schemas.pages.parse(schoolPages.about);
    expect(history.body.split('\n\n')).toHaveLength(10);
    expect(history.body).toContain('Rev. Fr. P. Arulnathan');
    expect(history.body).toContain('34 books');
    expect(history.body).toContain('26 June 2026');
    expect(history.bodyTa).toContain('34 நூல்களை');
    expect(history.bodyHi).toContain('34 पुस्तकें');
    expect(history.isDemo).toBe(false);
    expect(history.status).toBe('PUBLISHED');
  });
});
