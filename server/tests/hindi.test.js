import { describe, expect, it } from 'vitest';
import { en, ta } from '../../client/src/i18n.js';
import { hi } from '../../client/src/hi.js';
import { schoolCopy } from '../../client/src/school-copy.js';
import { languageCodes, localizedField, localeFor, normalizeLanguage } from '../../shared/languages.js';
import { schoolPages } from '../../shared/school-profile.js';
import { schoolLabels } from '../../shared/school-sections.js';
import { enquirySchema, schemas } from '../src/validation.js';
import { enquiryEmails } from '../src/email-content.js';

describe('Hindi language support', () => {
  it('covers every public interface key and keeps interpolation placeholders', () => {
    const english = { ...en, ...schoolCopy.en };
    expect(Object.keys(hi).sort()).toEqual(Object.keys(english).sort());
    for (const [key, value] of Object.entries(english)) {
      expect(typeof hi[key], key).toBe(typeof value);
      if (typeof value === 'string') expect(hi[key].match(/\{\w+\}/g) || [], key).toEqual(value.match(/\{\w+\}/g) || []);
    }
    expect(Object.keys(schoolLabels.hi).sort()).toEqual(Object.keys(schoolLabels.en).sort());
    expect(ta.school).toBeTruthy();
  });

  it('remembers supported languages and safely falls back for missing content', () => {
    expect(languageCodes).toEqual(['en', 'ta', 'hi']);
    expect(normalizeLanguage('hi')).toBe('hi');
    expect(normalizeLanguage('unknown')).toBe('en');
    expect(localeFor('hi')).toBe('hi-IN');
    expect(localizedField({ title: 'School', titleTa: 'பள்ளி', titleHi: 'विद्यालय' }, 'title', 'hi')).toBe('विद्यालय');
    for (const value of [null, undefined, '', '   ']) expect(localizedField({ title: 'School', titleHi: value }, 'title', 'hi')).toBe('School');
    expect(localizedField(undefined, 'title', 'hi')).toBeUndefined();
    for (const page of Object.values(schoolPages)) for (const field of ['title', 'summary', 'body']) expect(localizedField(page, field, 'hi')).toMatch(/[\u0900-\u097f]/);
  });

  it('accepts Hindi CMS records, caps their length and keeps old records valid', () => {
    const page = { title: 'Title', titleTa: 'தலைப்பு', summary: 'Summary', summaryTa: 'சுருக்கம்', body: 'Body', bodyTa: 'உள்ளடக்கம்', slug: 'test', status: 'DRAFT' };
    expect(schemas.pages.safeParse(page).success).toBe(true);
    expect(schemas.pages.parse({ ...page, titleHi: 'शीर्षक', summaryHi: 'सारांश', bodyHi: 'विवरण' }).titleHi).toBe('शीर्षक');
    expect(schemas.pages.safeParse({ ...page, titleHi: 'अ'.repeat(256) }).success).toBe(false);
    expect(schemas.translations.parse({ key: 'home', locale: 'hi', value: 'मुखपृष्ठ', status: 'PUBLISHED' }).locale).toBe('hi');
    expect(schemas.translations.safeParse({ key: 'home', locale: 'xx', value: 'Unknown', status: 'DRAFT' }).success).toBe(false);
    expect(schemas.media.parse({ alt: 'Photo', altTa: 'படம்', altHi: 'तस्वीर', descriptionHi: 'विवरण', status: 'DRAFT' }).altHi).toBe('तस्वीर');
  });

  it('accepts Hindi enquiries and composes a Hindi acknowledgement without sending mail', () => {
    const enquiry = enquirySchema.parse({ parentName: 'अभिभावक', studentName: 'विद्यार्थी', email: 'parent@example.test', phone: '9876543210', grade: '1', locale: 'hi', consent: true });
    const [confirmation] = enquiryEmails({ ...enquiry, id: '<reference>' });
    expect(confirmation.html).toContain('lang="hi"');
    expect(confirmation.subject).toContain('पूछताछ');
    expect(confirmation.text).toContain('प्रवेश की पुष्टि नहीं');
    expect(confirmation.html).toContain('&lt;reference&gt;');
    expect(confirmation.html).not.toContain('<reference>');
  });
});
