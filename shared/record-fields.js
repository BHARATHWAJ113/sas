export const recordFields = {
  fees: ['title', 'standard', 'academicYear', 'category', 'frequency'],
  honours: ['name', 'nameTa', 'nameHi', 'title', 'academicYear', 'standard', 'category'],
  staff: ['name', 'nameTa', 'nameHi', 'designation', 'department', 'category'],
  toppers: ['name', 'nameTa', 'nameHi', 'academicYear', 'standard', 'category'],
  pages: ['title', 'titleTa', 'titleHi', 'slug'], events: ['title', 'titleTa', 'titleHi', 'slug', 'category'], announcements: ['title', 'titleTa', 'titleHi', 'slug', 'kind'],
  activities: ['title', 'titleTa', 'titleHi', 'slug'], 'activity-categories': ['title', 'titleTa', 'titleHi', 'slug'], galleries: ['title', 'titleTa', 'titleHi', 'slug'],
  media: ['alt', 'altTa', 'altHi', 'originalName', 'mimeType'], translations: ['key', 'value', 'locale'], settings: ['key', 'value'],
  enquiries: ['parentName', 'studentName', 'email', 'phone', 'grade'], users: ['name', 'email'], 'audit-logs': ['action', 'entity', 'entityId'],
  emails: ['to', 'subject', 'kind'],
};
