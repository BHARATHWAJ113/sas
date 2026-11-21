export const recordFields = {
  fees: ['title', 'standard', 'academicYear', 'category', 'frequency'],
  honours: ['name', 'title', 'academicYear', 'standard', 'category'],
  staff: ['name', 'designation', 'department', 'category'],
  toppers: ['name', 'academicYear', 'standard', 'category'],
  pages: ['title', 'titleTa', 'slug'], events: ['title', 'titleTa', 'slug', 'category'], announcements: ['title', 'titleTa', 'slug', 'kind'],
  activities: ['title', 'titleTa', 'slug'], 'activity-categories': ['title', 'titleTa', 'slug'], galleries: ['title', 'titleTa', 'slug'],
  media: ['alt', 'originalName', 'mimeType'], translations: ['key', 'value', 'locale'], settings: ['key', 'value'],
  enquiries: ['parentName', 'studentName', 'email', 'phone', 'grade'], users: ['name', 'email'], 'audit-logs': ['action', 'entity', 'entityId'],
  emails: ['to', 'subject', 'kind'],
};
