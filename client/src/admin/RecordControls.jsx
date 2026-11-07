import { useEffect, useState } from 'react';
import { recordFields } from '../../../shared/record-fields.js';
export function useRecordQuery(resource) {
  const initial = () => ({ page: 1, limit: 20, search: '', column: '', from: '', to: '', status: '', sort: ['settings', 'translations'].includes(resource) ? 'updatedAt' : 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState(initial);
  const [query, setQuery] = useState('page=1&limit=20');
  useEffect(() => {
    const timer = setTimeout(() => setQuery(new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '')).toString()), filters.search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [filters]);
  const update = (key, value) => setFilters(current => ({ ...current, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));
  return { filters, query, update, reset: () => setFilters(initial()) };
}
export function exportRecords(items, name, json = false) {
  let content;
  if (json) content = JSON.stringify(items, null, 2);
  else {
    const columns = [...new Set(items.flatMap(item => Object.keys(item)))].filter(key => !['requestKey', 'payloadHash', 'fingerprint', 'passwordHash', 'html', 'metadata'].includes(key));
    const cell = value => { let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value); if (/^[\s]*[=+@-]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"', '""') + '"'; };
    content = '\ufeff' + [columns.map(cell).join(','), ...items.map(item => columns.map(key => cell(item[key])).join(','))].join('\r\n');
  }
  const url = URL.createObjectURL(new Blob([content], { type: json ? 'application/json' : 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${name}.${json ? 'json' : 'csv'}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function RecordFilters({ resource, controls, items = [] }) {
  const { filters, update, reset } = controls;
  const fields = recordFields[resource] || [];
  const statuses = resource === 'enquiries' ? ['NEW', 'CONTACTED', 'CLOSED'] : resource === 'emails' ? ['PENDING', 'SENDING', 'SENT', 'FAILED', 'PARTIAL', 'UNKNOWN'] : ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
  return <section className="record-filters" aria-label="Record search and filters">
    <label className="record-search">Search records<input type="search" value={filters.search} maxLength="100" onChange={event => update('search', event.target.value)} placeholder="Search by name, title or details…"/></label>
    <label>Search column<select value={filters.column} onChange={event => update('column', event.target.value)}><option value="">All searchable columns</option>{fields.map(key => <option key={key}>{key}</option>)}</select></label>
    <label>Records per page<select value={filters.limit} onChange={event => update('limit', Number(event.target.value))}>{[20, 50, 100, 200].map(count => <option key={count}>{count}</option>)}</select></label>
    <label>From · IST<input type="date" value={filters.from} onChange={event => update('from', event.target.value)}/></label><label>To · IST<input type="date" value={filters.to} min={filters.from || undefined} onChange={event => update('to', event.target.value)}/></label>
    <label>Sort column<select value={filters.sort} onChange={event => update('sort', event.target.value)}>{[['settings', 'translations'].includes(resource) ? 'updatedAt' : 'createdAt', ...fields].map(key => <option key={key}>{key}</option>)}</select></label>
    <label>Sort direction<select value={filters.direction} onChange={event => update('direction', event.target.value)}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
    {!['users', 'settings', 'visitors', 'audit-logs'].includes(resource) && <label>Status<select value={filters.status} onChange={event => update('status', event.target.value)}><option value="">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>}
    <button type="button" className="record-export" onClick={reset}>Reset filters</button><button type="button" className="record-export" disabled={!items.length} onClick={() => exportRecords(items, `${resource}-current-page`)}>Export current page · CSV</button>
  </section>;
}
export function RecordPagination({ data, controls }) {
  if (!data) return null;
  const { page, limit } = controls.filters;
  const last = Math.max(1, data.pages || 1);
  const start = data.total ? (data.page - 1) * (data.limit || limit) + 1 : 0;
  return <div className="record-pagination"><span>Showing {start}–{data.total ? Math.min(start + data.items.length - 1, data.total) : 0} of {data.total} records</span><div><button type="button" disabled={page <= 1} onClick={() => controls.update('page', 1)}>First</button><button type="button" disabled={page <= 1} onClick={() => controls.update('page', page - 1)}>Previous</button><span>Page {page} / {last}</span><button type="button" disabled={page >= last} onClick={() => controls.update('page', page + 1)}>Next</button><button type="button" disabled={page >= last} onClick={() => controls.update('page', last)}>Last</button></div></div>;
}
