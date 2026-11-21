import { describe, expect, it } from 'vitest';
import { publishedSocialLinks, validSocialUrl } from '../../shared/social-links.js';
import { schemas } from '../src/validation.js';

describe('social profile settings', () => {
  it('accepts supported HTTPS profile URLs and rejects unsafe or mismatched destinations', () => {
    expect(validSocialUrl('socialYouTube', 'https://www.youtube.com/@school')).toBe(true);
    for (const value of ['javascript:alert(1)', 'http://instagram.com/school', 'https://instagram.com.evil.test/school', 'https://facebook.com/school', 'https://user:password@instagram.com/school', 'https://instagram.com/', 'https://instagram.com:444/school']) {
      expect(validSocialUrl('socialInstagram', value)).toBe(false);
      expect(schemas.settings.safeParse({ key: 'socialInstagram', value, public: true }).success).toBe(false);
    }
    expect(schemas.settings.safeParse({ key: 'socialInstagram', value: 'https://www.instagram.com/school/', public: true }).success).toBe(true);
  });
  it('renders only configured valid links and tolerates missing settings', () => {
    expect(publishedSocialLinks()).toEqual([]);
    const links = publishedSocialLinks({ socialFacebook: 'https://www.facebook.com/school', socialYouTube: 'Demo placeholder', socialX: 'https://x.com/school' });
    expect(links.map(link => link.name)).toEqual(['Facebook', 'X']);
  });
});
