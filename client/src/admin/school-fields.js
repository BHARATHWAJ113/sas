export const schoolOptionalFields = ['sourceRef', 'description', 'descriptionTa', 'nameTa', 'designationTa', 'marks', 'maximumMarks', 'percentage', 'rank', 'eventDate'];
const name = [['name', 'Name'], ['nameTa', 'Name · தமிழ் (optional)']];
const title = [['title', 'Title'], ['titleTa', 'Title · தமிழ் (optional)']];
const description = [['description', 'Description (optional)', 'textarea'], ['descriptionTa', 'Description · தமிழ் (optional)', 'textarea']];
const end = [['sortOrder', 'Display order', 'number'], ['sourceRef', 'Source / review notes (private, optional)', 'textarea']];
const category = ['category', 'Category'];
const year = ['academicYear', 'Academic year (2026-27) or result year (2026)'];
export function schoolAdminFields(standards) {
  const standard = ['standard', 'Standard', 'select', standards];
  return {
    fees: [...title, standard, year, category, ['amount', 'Amount per payment (INR)', 'number'], ['frequency', 'Payment schedule (e.g. June, Monthly)'], ['installments', 'Number of payments in this academic year', 'number'], ...end],
    honours: [...name, ...title, year, standard, category, ...description, ...end],
    staff: [...name, ['designation', 'Designation'], ['designationTa', 'Designation · தமிழ் (optional)'], ['department', 'Department'], category, ...description, ...end],
    toppers: [...name, standard, year, ['category', 'Examination category'], ['marks', 'Marks (optional)', 'number'], ['maximumMarks', 'Maximum marks (optional)', 'number'], ['percentage', 'Percentage (optional)', 'number'], ['rank', 'Verified rank (optional)', 'number'], ...end],
  };
}
