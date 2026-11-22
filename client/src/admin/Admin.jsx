import { useAutoTranslation } from './useAutoTranslation';
import TranslationControls from './TranslationControls';
import Login from './Login';
import { Loader } from '../Loading';
import { ThemeToggle } from '../Theme';
import { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard, FileText, Languages, Megaphone, CalendarDays, Shapes, Tags, Images, ImagePlus, Inbox, Users, SearchCheck, ShieldCheck, Settings, LogOut, Plus, Pencil, Trash2, X, Menu, Upload, Copy, AlertCircle, Mail } from 'lucide-react';
import { api, mediaUrl } from '../api';
import { Seo } from '../components';
import { activityIcons } from '../../../shared/school-activities.js';
import './admin.css';
import './admin-design.css';
import { standards, schoolResources } from '../../../shared/school-sections.js';
import { schoolAdminFields, schoolOptionalFields } from './school-fields';
import BatchUpload from './BatchUpload';
import { useRecordQuery, RecordFilters, RecordPagination } from './RecordControls';
import RecordDetails from './RecordDetails';
import SearchableSelect from './SearchableSelect';
import { AnnouncementContent } from '../AnnouncementPopup';
const EmailManager = lazy(() => import('./EmailManager'));
const sections = [['dashboard', 'Dashboard', LayoutDashboard], ['fees', 'Fees structure', FileText], ['honours', 'Roll of Honour', ShieldCheck], ['staff', 'Staff directory', Users], ['toppers', 'Academic toppers', ShieldCheck], ['pages', 'Pages & SEO', FileText], ['translations', 'Languages', Languages], ['announcements', 'Announcements, notices & news', Megaphone], ['events', 'Events', CalendarDays], ['activities', 'Activities', Shapes], ['activity-categories', 'Activity categories', Tags], ['galleries', 'Gallery albums', Images], ['media', 'Media library', ImagePlus], ['enquiries', 'Admission enquiries', Inbox], ['emails', 'Email management', Mail], ['users', 'Users & roles', Users], ['settings', 'Site settings & SEO', Settings], ['audit-logs', 'Audit logs', ShieldCheck]];
const adminOnly = ['users', 'audit-logs', 'settings', 'emails'];
const baseFields = [['title', 'Title · English'], ['titleTa', 'Title · தமிழ்'], ['slug', 'URL slug'], ['summary', 'Summary · English', 'textarea'], ['summaryTa', 'Summary · தமிழ்', 'textarea']];
const bodyFields = [['body', 'Content · English', 'textarea'], ['bodyTa', 'Content · தமிழ்', 'textarea']];
const seoFields = [['seoTitle', 'SEO title (optional)'], ['seoDescription', 'SEO description (optional)', 'textarea']];
const statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const orderField = ['sortOrder', 'Display order (lower numbers first)', 'number'];
const fields = {
  ...schoolAdminFields(standards),
  pages: [...baseFields, ...bodyFields, ...seoFields],
  events: [...baseFields, ...bodyFields, ['category', 'Category · English'], ['categoryTa', 'Category · தமிழ்'], ['date', 'Starts · local date & time', 'datetime-local'], ['endDate', 'Ends · local date & time (optional)', 'datetime-local'], ['location', 'Location · English'], ['locationTa', 'Location · தமிழ்'], ['cover', 'Cover image URL (optional)'], ...seoFields],
  activities: [...baseFields, ['categoryId', 'Activity category', 'activity-category'], orderField],
  'activity-categories': [...baseFields.slice(0, 3), ['icon', 'Card illustration', 'select', activityIcons], orderField],
  announcements: [...baseFields, ...bodyFields, ['kind', 'Content type', 'select', ['ANNOUNCEMENT', 'NOTICE', 'NEWS']], ['publishedAt', 'Publish from · local date & time', 'datetime-local'], ['expiresAt', 'Expires · local date & time (optional)', 'datetime-local'], ['announcementType', 'Announcement theme', 'select', ['NOTICE','ADMISSION','FESTIVAL','HOLIDAY','EVENT','MESSAGE']], ['priority', 'Popup priority · higher numbers first', 'number'], ['footerMessage', 'Footer message · English (optional)', 'textarea'], ['footerMessageTa', 'Footer message · Tamil (optional)', 'textarea'], ['wishes', 'Rev. Father’s wishes · English (optional)', 'textarea'], ['wishesTa', 'Rev. Father’s wishes · Tamil (optional)', 'textarea'], ['ctaLabel', 'Button label · English (optional)'], ['ctaLabelTa', 'Button label · Tamil (optional)'], ['ctaPath', 'Button path · e.g. /admissions (optional)']],
  galleries: baseFields,
  translations: [['key', 'Interface key (e.g. hero1 or welcomeTitle)'], ['locale', 'Language', 'select', ['en', 'ta', 'hi']], ['value', 'Translation', 'textarea']],
  settings: [['key', 'Setting', 'select', ['phone', 'email', 'principal', 'admissionDates', 'officeHours', 'seoTitle', 'seoDescription', 'socialInstagram', 'socialFacebook', 'socialX', 'socialLinkedIn', 'socialYouTube', 'socialThreads']], ['value', 'Value / HTTPS profile URL', 'textarea']],
  users: [['name', 'Name'], ['email', 'Email', 'email'], ['password', 'New password · 12+ characters (leave blank to preserve)', 'password'], ['roleId', 'Role', 'role']],
  media: [['alt', 'Photo title / alternative text · English'], ['altTa', 'Photo title / alternative text · தமிழ்'], ['description', 'Description · English', 'textarea'], ['descriptionTa', 'Description · தமிழ்', 'textarea'], ['eventDate', 'Event date (optional)', 'datetime-local']]
};
for (const resource of Object.keys(fields)) {
  fields[resource] = fields[resource].flatMap(field => field[0].endsWith('Ta')
    ? [field, [field[0].slice(0, -2) + 'Hi', field[1].replace(/தமிழ்|Tamil/g, 'हिन्दी / Hindi') + ' (optional)', ...field.slice(2)]]
    : [field]);
}
function isRequiredField(key, resource, item) {
  if (key.endsWith('Hi')) return false;
  if (schoolOptionalFields.includes(key) || resource in schoolResources && key.endsWith('Ta')) return false;
  if (['endDate','expiresAt','cover','seoTitle','seoDescription','footerMessage','footerMessageTa','wishes','wishesTa','ctaLabel','ctaLabelTa','ctaPath'].includes(key)) return false;
  return key !== 'password' || resource === 'users' && !item.id;
}
function initialForm(resource, item) {
  const form = {};
  for (const [key] of fields[resource] || []) form[key] = item?.[key] ?? '';
  if (resource === 'events') { form.date ||= new Date().toISOString(); form.imageIds = item?.images?.map(x => x.mediaId) || []; form.attachmentId = item?.attachmentId || ''; }
  if (['activities', 'staff', 'honours', 'toppers'].includes(resource)) form.imageId = item?.imageId ?? null;
  if (resource === 'activity-categories') form.icon ||= 'sparkles';
  if (resource === 'fees') form.installments ||= 1;
  if ('sortOrder' in form) form.sortOrder = item?.sortOrder ?? 0;
  if (resource === 'galleries') form.imageIds = item?.images?.map(x => x.mediaId) || [];
  if (resource === 'announcements') { form.kind ||= 'NOTICE'; form.publishedAt ||= new Date().toISOString(); form.priority = item?.priority ?? 0; form.announcementType ||= 'NOTICE'; form.showPopup = item?.showPopup ?? false; form.imageId = item?.imageId ?? null; }
  if (resource === 'translations') form.locale ||= 'en';
  if (resource === 'settings') { form.key ||= 'phone'; form.public = item?.public ?? false; }
  if (resource === 'users') form.active = item?.active ?? true;
  if (!['users', 'settings'].includes(resource)) form.status = item?.status || 'DRAFT';
  if (['pages', 'events', 'announcements', 'galleries', 'activities'].includes(resource)) form.isDemo = item?.isDemo ?? true;
  return form;
}
function localDate(value) { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function ErrorMessage({ error }) { return error ? <div className="admin-error" role="alert"><AlertCircle size={18}/><div>{error.message}{error.fields && <ul>{Object.entries(error.fields).map(([key, message]) => <li key={key}>{key}: {message}</li>)}</ul>}</div></div> : null; }
export default function Admin() {
  const [session, setSession] = useState(null); const [checking, setChecking] = useState(true); const [authError, setAuthError] = useState(null); const [menu, setMenu] = useState(false); const [navSearch, setNavSearch] = useState('');
  const location = useLocation(); const resource = location.pathname.split('/')[2] || 'dashboard';
  const check = useCallback(async () => { setChecking(true); try { setSession(await api('/auth/me')); setAuthError(null); } catch (error) { setSession(null); setAuthError(error.status === 401 ? null : error); } finally { setChecking(false); } }, []);
  useEffect(() => { check(); }, [check]);
  useEffect(() => { setMenu(false); }, [location.pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = event => { if (event.key === 'Escape') { setMenu(false); document.querySelector('.admin-menu')?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menu]);
  async function mutate(path, method, body, headers = {}) {
    try { return await api(`/admin${path}`, { method, timeoutMs: path === '/translate' ? 65000 : 15000, headers: { 'x-csrf-token': session.csrfToken, ...headers }, ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) }); }
    catch (error) { if (error.status === 401) { setSession(null); setAuthError(error); } throw error; }
  }
  async function logout() { try { await api('/auth/logout', { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } }); setSession(null); } catch (error) { setAuthError(error); } }
  if (checking) return <Loader label="Opening staff workspace…" full/>;
  if (!session) return <Login onLogin={setSession} error={authError} retry={check}/>;
  const visibleSections = sections.filter(([key, name]) => (!adminOnly.includes(key) || session.user.role === 'ADMIN') && (key !== 'enquiries' || ['ADMIN', 'EDITOR'].includes(session.user.role)) && name.toLowerCase().includes(navSearch.toLowerCase()));
  const allowed = !adminOnly.includes(resource) || session.user.role === 'ADMIN';
  const canEdit = ['ADMIN', 'EDITOR'].includes(session.user.role);
  return <div className="admin-app"><Seo title="Staff CMS"/>{menu && <button type="button" className="admin-mobile-backdrop" aria-label="Close CMS navigation" onClick={() => setMenu(false)}/>}<aside id="staff-navigation" className={`admin-sidebar ${menu ? 'open' : ''}`}><Link to="/" className="admin-logo"><img src="/api/assets/images/logo.webp" width="45" height="45" alt="School crest"/><span>St. Antony’s<small>CONTENT WORKSPACE</small></span></Link><nav aria-label="CMS navigation">{visibleSections.map(([key, name, Icon]) => <NavLink key={key} to={`/admin/${key}`} onClick={() => setMenu(false)} className={resource === key ? 'active' : ''}><Icon size={17}/>{name}</NavLink>)}{!visibleSections.length && <p className="admin-nav-empty">No matching section.</p>}</nav><div className="admin-sidebar-bottom"><span>{session.user.name}<small>{session.user.role}</small></span><button onClick={logout}><LogOut size={16}/>Sign out</button><Link to="/">View website<ArrowUpRight size={14}/></Link></div></aside><div className="admin-main"><header className="admin-header"><button className="admin-menu" aria-label="Toggle CMS navigation" aria-expanded={menu} aria-controls="staff-navigation" onClick={() => setMenu(!menu)}><Menu/></button><Link to="/admin/dashboard" className="staff-brand"><img src="/api/assets/images/logo.webp" width="44" height="44" alt="School crest"/><span>St. Antony’s<small>SCHOOL WORKSPACE</small></span></Link><label className="admin-nav-search"><span className="sr-only">Find a workspace section</span><input type="search" value={navSearch} placeholder="Find a section…" onChange={event => setNavSearch(event.target.value)}/></label><div className="admin-header-actions"><ThemeToggle/><div className="admin-account"><strong>{session.user.name}</strong><span>{session.user.role}</span></div></div></header><main className="admin-content"><ErrorMessage error={authError}/>{!allowed || (resource === 'enquiries' && !canEdit) ? <div className="admin-empty">Your role cannot access this section.</div> : resource === 'dashboard' ? <Dashboard canEdit={canEdit}/> : resource === 'emails' ? <Suspense fallback={<Loader label="Loading email workspace…"/>}><EmailManager mutate={mutate}/></Suspense> : sections.some(([key]) => key === resource) ? <Resource key={resource} resource={resource} session={session} mutate={mutate} canEdit={canEdit}/> : <div className="admin-empty">Section not found. <Link to="/admin/dashboard">Return to dashboard</Link></div>}</main></div></div>;
}
function useAdminData(path) {
  const [state, setState] = useState({ loading: true, data: null, error: null }); const [version, setVersion] = useState(0);
  useEffect(() => { if (!path) return; const controller = new AbortController(); setState(s => ({ ...s, loading: true, error: null })); const timer = setTimeout(() => api(`/admin${path}`, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setState({ data, loading: false, error: null }); }).catch(error => { if (error.name !== 'AbortError') setState({ data: null, loading: false, error }); }), 0); return () => { clearTimeout(timer); controller.abort(); }; }, [path, version]);
  return { ...state, reload: () => setVersion(v => v + 1) };
}
function Dashboard({ canEdit }) {
  const { data, loading, error, reload } = useAdminData('/dashboard');
  return <><div className="admin-title"><div><span className="eyebrow">SCHOOL OVERVIEW</span><h1>Your school, in focus.</h1><p>Manage approved content and keep your school community informed.</p></div><Link className="button button-secondary" to="/" target="_blank">View website<ArrowUpRight size={16}/></Link></div><ErrorMessage error={error}/>{error && <button className="text-link" onClick={reload}>Try again</button>}{loading ? <Loader label="Loading dashboard…"/> : data && <><div className="admin-stats">{[['events', 'Events', CalendarDays], ['pages', 'Pages', FileText], ...(canEdit ? [['enquiries', 'New enquiries', Inbox]] : []), ['media', 'Media files', Images]].map(([key, label, Icon]) => <Link to={`/admin/${key}`} key={key}><Icon size={22}/><strong>{data[key]}</strong><span>{label}<ArrowUpRight size={16}/></span></Link>)}</div><div className="admin-guidance"><SearchCheck size={28}/><div><h2>Publish with confidence.</h2><p>Keep demo labels enabled until every date, photograph, contact detail and school claim is verified. Publish Tamil and English together. Media starts as a draft and must be published separately before it appears publicly.</p></div></div><section className="admin-panel"><h2>{data.recent?.length ? 'Recent activity' : 'Your workspace'}</h2>{data.recent?.length ? <AuditTable items={data.recent}/> : <p>Choose a section in the menu to manage school content.</p>}</section></>}</>;
}
function Resource({ resource, session, mutate, canEdit }) {
  const controls = useRecordQuery(resource); const state = useAdminData(`/${resource}?${controls.query}`); const [details, setDetails] = useState(null); const [editing, setEditing] = useState(null); const [deleting, setDeleting] = useState(null); const [error, setError] = useState(null); const [notice, setNotice] = useState(''); const [pending, setPending] = useState(false);
  const name = sections.find(([key]) => key === resource)?.[1];
  const readOnly = ['enquiries', 'audit-logs', 'visitors'].includes(resource); const isAdmin = session.user.role === 'ADMIN';
  async function edit(item) { if (pending) return; setPending(true); setError(null); try { setEditing(await api(`/admin/${resource}/${item.id}`)); } catch (error) { setError(error); } finally { setPending(false); } }
  async function remove() { setPending(true); setError(null); try { await mutate(`/${resource}/${deleting.id}`, 'DELETE'); setDeleting(null); state.reload(); setNotice('Record deleted.'); } catch (err) { setError(err); } finally { setPending(false); } }
  async function changeEnquiry(item, status) { setError(null); try { await mutate(`/enquiries/${item.id}`, 'PATCH', { status }); state.reload(); setNotice('Enquiry status updated.'); } catch (err) { setError(err); } }
  return <><div className="admin-title"><div><span className="eyebrow">CONTENT MANAGEMENT</span><h1>{name}</h1><p>{resource === 'translations' ? 'Manage English, Tamil and Hindi interface text. Content records have optional Hindi fields; blank Hindi fields display English.' : resource === 'media' ? 'JPEG, PNG, WebP and PDF · Up to 8 MB. Images are validated, resized and stripped of metadata.' : resource === 'users' ? 'ADMIN: full access · EDITOR: content, uploads and enquiries · VIEWER: content review only.' : resource === 'enquiries' ? 'Private submissions are visible only to authorised staff.' : 'Only published content is visible on the public website.'}</p></div>{canEdit && !readOnly && <button className="button" onClick={() => { setEditing({}); setNotice(''); }}>{resource === 'media' ? <Upload size={17}/> : <Plus size={17}/>} {resource === 'media' ? 'Upload file' : 'Create new'}</button>}</div><ErrorMessage error={error || state.error}/>{notice && <div className="admin-notice" role="status">{notice}</div>}{pending && <Loader label="Working…" compact/>}<RecordFilters resource={resource} controls={controls} items={state.data?.items || []}/>{state.loading ? <Loader label="Loading records…"/> : state.data?.items.length ? resource === 'audit-logs' ? <div className="admin-panel"><AuditTable items={state.data.items}/></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{resource === 'enquiries' ? 'Parent / student' : 'Content'}</th><th>{resource === 'users' ? 'Role' : resource === 'translations' ? 'Language' : 'Status'}</th><th>{resource === 'enquiries' ? 'Contact / message' : 'Details'}</th><th>Actions</th></tr></thead><tbody>{state.data.items.map(item => <tr key={item.id}><td><strong>{item.title || item.name || item.alt || item.key || item.parentName}</strong><small>{item.slug || item.email || item.originalName || item.studentName || item.value?.slice(0, 100)}</small>{item.isDemo && <span className="status-pill demo">DEMO</span>}{resource === 'media' && item.mimeType.startsWith('image/') && <img className="admin-thumb" src={mediaUrl(item.id)} width="80" height="55" alt={item.alt}/>}</td><td><span className={`status-pill ${(item.status || '').toLowerCase()}`}>{item.role || item.locale || (resource === 'announcements' && item.status === 'PUBLISHED' && new Date(item.publishedAt) > new Date() ? 'SCHEDULED' : item.status) || (item.active ? 'ACTIVE' : item.public ? 'PUBLIC' : 'PRIVATE')}</span></td><td>{resource === 'enquiries' ? <div className="enquiry-cell"><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone}`}>{item.phone}</a><span>Class: {item.grade}</span><p>{item.message || 'No message'}</p><small>{new Date(item.createdAt).toLocaleString('en-IN')}</small></div> : <small>{resource === 'media' ? `${item.mimeType} · ${Math.round(item.size / 1024)} KB` : (resource === 'activities' ? item.category?.title : item.category) || item.kind || item.titleTa || (item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-IN') : item.email)}{resource === 'media' && <code>{`/api/media/${item.id}`}</code>}</small>}</td><td><div className="admin-row-actions">{isAdmin && resource === 'enquiries' && <button type="button" onClick={() => setDetails(item.id)}>Details</button>}{canEdit && !readOnly && <button disabled={pending} aria-label={`Edit ${item.title || item.name || item.key || item.alt}`} onClick={() => edit(item)}><Pencil size={16}/></button>}{resource === 'media' && <button aria-label="Copy media URL" onClick={async () => { try { await navigator.clipboard.writeText(`/api/media/${item.id}`); setNotice('Media URL copied.'); } catch { setNotice(`Media URL: /api/media/${item.id}`); } }}><Copy size={16}/></button>}{resource === 'enquiries' && <select aria-label={`Status for ${item.parentName}`} value={item.status} onChange={e => changeEnquiry(item, e.target.value)}>{['NEW', 'CONTACTED', 'CLOSED'].map(value => <option key={value}>{value}</option>)}</select>}{isAdmin && item.id !== session.user.id && <button aria-label={`Delete ${item.title || item.name || item.key || item.alt || item.parentName}`} className="danger" onClick={() => { setDeleting(item); setError(null); }}><Trash2 size={16}/></button>}</div></td></tr>)}</tbody></table></div> : !state.error && <div className="admin-empty">No records yet. {canEdit && !readOnly && 'Create the first record using the button above.'}</div>}{state.error && <button className="text-link" onClick={state.reload}>Try again</button>}<RecordPagination data={state.data} controls={controls}/>{details && <RecordDetails resource={resource} id={details} onClose={() => setDetails(null)}/>}{editing && <Editor resource={resource} item={editing} mutate={mutate} onClose={() => setEditing(null)} onSaved={result => { setEditing(null); state.reload(); setNotice(result?.cleanupPending ? 'Image saved. Old file deletion is queued and will retry automatically.' : 'Changes saved.'); }}/ >}{deleting && <Modal title="Delete this record?" onClose={() => setDeleting(null)}><p>This permanently deletes “{deleting.title || deleting.name || deleting.key || deleting.alt || deleting.parentName}”. {resource === 'media' && 'Media used by other records cannot be deleted.'}{resource === 'activity-categories' && 'Reassign its activities before deleting this category.'}</p><ErrorMessage error={error}/><div className="editor-actions"><button className="button button-secondary" onClick={() => setDeleting(null)}>Cancel</button><button className="button danger-button" disabled={pending} onClick={remove}>{pending ? 'Deleting…' : 'Delete record'}<Trash2 size={16}/></button></div></Modal>}</>;
}
function AuditTable({ items }) { return items.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>Record</th><th>Staff</th><th>Time</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><span className="status-pill">{item.action}</span></td><td>{item.entity}<small>{item.entityId}</small></td><td>{item.user?.name || 'Deleted account'}</td><td>{new Date(item.createdAt).toLocaleString('en-IN')}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No activity recorded yet.</div>; }
function Modal({ title, children, onClose, wide = false }) {
  const [node, setNode] = useState(null);
  useEffect(() => { if (node && !node.open) node.showModal(); }, [node]);
  return <dialog ref={setNode} className={`admin-modal ${wide ? 'wide' : ''}`} onClose={onClose} aria-label={title}><button className="dialog-close" aria-label="Close editor" onClick={onClose}><X/></button><h2>{title}</h2>{children}</dialog>;
}
function ActivityImagePicker({ value, onChange }) {
  const [page, setPage] = useState(1);
  const library = useAdminData(`/media?page=${page}&limit=12`);
  const images = library.data?.items.filter(item => item.mimeType.startsWith('image/')) ?? [];

  return (
    <section className="media-picker">
      <h3>Content image (optional)</h3>
      <p>Upload approved photos in the Media library. The public page uses its illustration until its selected photo is published.</p>
      {value && (
        <div className="media-option activity-image-option">
          <img src={mediaUrl(value)} width="60" height="45" alt="" />
          <span>Selected photo</span>
          <button type="button" onClick={() => onChange(null)}>Remove image</button>
        </div>
      )}
      <ErrorMessage error={library.error} />
      {library.loading ? <Loader label="Loading images…" compact/> : !library.error && images.length === 0 && <p>No images on this page.</p>}
      {images.map(image => (
        <div key={image.id} className="media-option activity-image-option">
          <img src={mediaUrl(image.id)} alt="" width="60" height="45" loading="lazy" />
          <span>{image.alt}<small>{image.status}</small></span>
          <button type="button" onClick={() => onChange(image.id)} disabled={value === image.id}>{value === image.id ? 'Selected' : 'Use image'}</button>
        </div>
      ))}
      {library.data?.pages > 1 && (
        <div className="picker-pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous files</button>
          <span>{page} / {library.data.pages}</span>
          <button type="button" disabled={page >= library.data.pages} onClick={() => setPage(page + 1)}>Next files</button>
        </div>
      )}
    </section>
  );
}
function Editor({ resource, item, mutate, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(resource, item)); const [file, setFile] = useState(null); const [pending, setPending] = useState(false); const [error, setError] = useState(null); const [mediaPage, setMediaPage] = useState(1); const [preview, setPreview] = useState(false);
  const library = useAdminData(['events', 'galleries'].includes(resource) ? `/media?page=${mediaPage}&limit=12` : null); const roles = useAdminData(resource === 'users' ? '/roles' : null);
  const categories = useAdminData(resource === 'activities' ? '/activity-category-options' : null);
  const translationFields = (fields[resource] || []).filter(([key]) => key.endsWith('Ta')).map(([key]) => key.slice(0, -2));
  const translation = useAutoTranslation(form, setForm, translationFields, mutate);
  const change = translation.change;
  async function save(e) {
    e.preventDefault(); if (pending || translation.busy) return; setPending(true); setError(null);
    try {
      let body = { ...form }; let path = `/${resource}${item.id ? `/${item.id}` : ''}`;
      if (resource === 'media' && !item.id) { body = new FormData(); body.append('file', file); body.append('alt', form.alt); body.append('altTa', form.altTa); body.append('altHi', form.altHi || ''); path = '/media/upload'; }
      else {
        for (const [key, , type] of fields[resource] || []) if (type === 'number') body[key] = body[key] === '' ? null : Number(body[key]);
        for (const [key, , type] of fields[resource] || []) if (type === 'datetime-local') body[key] = body[key] ? new Date(body[key]).toISOString() : null;
        for (const key of ['seoTitle', 'seoDescription', 'cover', 'attachmentId']) if (key in body && !body[key]) body[key] = null;
        if (resource === 'users' && !body.password) delete body.password;
        if ('sortOrder' in body) body.sortOrder = Number(body.sortOrder); if ('priority' in body) body.priority = Number(body.priority); for (const key of ['footerMessage','footerMessageTa','wishes','wishesTa','ctaPath','ctaLabel','ctaLabelTa']) if (key in body && !body[key]) body[key] = null;
      }
      if (resource === 'media' && item.id && file) {
        const replacement = new FormData(); replacement.append('file', file); replacement.append('metadata', JSON.stringify(body));
        body = replacement; path = `/media/${item.id}/file`;
      }
      const saved = await mutate(path, item.id ? 'PUT' : 'POST', body); onSaved(saved);
    } catch (err) { setError(err); } finally { setPending(false); }
  }
  if (resource === 'media' && !item.id) return <Modal title="Upload media" onClose={onClose} wide><BatchUpload mutate={mutate} onSaved={onSaved}/></Modal>;
  return <Modal title={`${item.id ? 'Edit' : resource === 'media' ? 'Upload' : 'Create'} ${resource === 'announcements' ? 'announcement / notice / news' : resource}`} onClose={onClose} wide><form className="admin-form" onSubmit={save}>{translationFields.length > 0 && <TranslationControls translation={translation}/>}<ErrorMessage error={error || roles.error || categories.error}/>{resource === 'pages' && <p className="editor-help">Use an existing public page slug (home, about, academics, admissions, infrastructure, student-life, contact) to update its published content. Page content is plain text; HTML is displayed safely as text. Layout labels can be edited under Languages.</p>}{resource === 'translations' && <p className="editor-help">Use a key from client/src/i18n.js, for example hero1, hero2, hero3, heroText, welcomeTitle, visionText, missionText. Publish each language separately.</p>}{resource === 'activities' && <p className="editor-help">Publish the activity and its category to display the card on Home and Student Life. <Link to="/admin/activity-categories">Manage categories</Link></p>}{resource === 'activity-categories' && <p className="editor-help">Published categories appear in the filters once they have a published activity. Archiving a category also hides its cards.</p>}<div className="admin-form-grid">{fields[resource]?.map(([key, label, type, options]) => <label key={key} className={type === 'textarea' ? 'full-width' : ''}><span>{label}{isRequiredField(key, resource, item) && <span aria-hidden="true"> *</span>}</span>{type === 'textarea' ? <textarea value={form[key]} rows={key.startsWith('body') ? 8 : 3} required={isRequiredField(key, resource, item)} maxLength={key.startsWith('description') ? 5000 : key.startsWith('body') ? 50000 : key.startsWith('summary') ? 2000 : key === 'value' ? 10000 : key.startsWith('wishes') ? 2000 : 500} onChange={e => change(key, e.target.value)}/> : ['role', 'activity-category'].includes(type) ? <SearchableSelect value={form[key]} options={(type === 'role' ? roles.data?.items : categories.data?.items) || []} loading={type === 'role' ? roles.loading : categories.loading} onChange={value => change(key, value)}/> : type === 'select' ? <select value={form[key]} required onChange={e => change(key, e.target.value)}><option value="" disabled>Select…</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select> : <input type={type || 'text'} value={type === 'datetime-local' ? localDate(form[key]) : form[key]} required={isRequiredField(key, resource, item)} min={type === 'number' ? 0 : undefined} step={type === 'number' ? (['amount', 'marks', 'maximumMarks', 'percentage'].includes(key) ? '0.01' : '1') : undefined} maxLength={key === 'password' ? 72 : key === 'slug' ? (resource === 'activity-categories' ? 80 : 160) : resource === 'activity-categories' ? (key === 'title' ? 120 : 160) : 255} minLength={key === 'password' && form[key] ? 12 : undefined} autoComplete={key === 'password' ? 'new-password' : undefined} pattern={key === 'slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined} onChange={e => change(key, type === 'datetime-local' && e.target.value ? new Date(e.target.value).toISOString() : e.target.value)}/ >}{error?.fields?.[key] && <span className="field-error">{error.fields[key]}</span>}</label>)}</div>{resource === 'media' && item.id && <label className="upload-label">Replace file (optional, 8 MB maximum). Saving replaces it everywhere it is used and deletes the old file and thumbnails.<input disabled={pending} type="file" accept={item.mimeType.startsWith('image/') ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} onChange={e => setFile(e.target.files?.[0] || null)}/></label>}{resource === 'media' && !item.id && <label className="upload-label">Choose image or PDF (8 MB maximum) · Uploaded as DRAFT<input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setFile(e.target.files?.[0])}/></label>}{['events', 'galleries'].includes(resource) && <section className="media-picker"><h3>Event / gallery photos{resource === 'events' ? ' and attachment' : ''}</h3><p>Select photos below. Publish the media record separately to make it available publicly. Cover URLs must be a school /api/assets/images/ asset or /api/media/ ID.</p><ErrorMessage error={library.error}/>{library.loading && <Loader label="Loading media…" compact/>}<div>{library.data?.items.map(media => <label key={media.id} className="media-option">{media.mimeType.startsWith('image/') ? <><input type="checkbox" checked={form.imageIds.includes(media.id)} onChange={e => change('imageIds', e.target.checked ? [...form.imageIds, media.id] : form.imageIds.filter(id => id !== media.id))}/><img src={mediaUrl(media.id)} alt={media.alt} width="60" height="45"/><span>{media.alt}<small>{media.status}</small></span>{resource === 'events' && <button type="button" onClick={() => change('cover', `/api/media/${media.id}`)}>Set cover</button>}</> : <><span>PDF · {media.originalName}<small>{media.status}</small></span>{resource === 'events' && <button type="button" onClick={() => change('attachmentId', media.id)}>{form.attachmentId === media.id ? 'Selected' : 'Attach PDF'}</button>}</>}</label>)}</div>{library.data?.pages > 1 && <div className="picker-pagination"><button type="button" disabled={mediaPage <= 1} onClick={() => setMediaPage(mediaPage - 1)}>Previous files</button><span>{mediaPage} / {library.data.pages}</span><button type="button" disabled={mediaPage >= library.data.pages} onClick={() => setMediaPage(mediaPage + 1)}>Next files</button></div>}{resource === 'events' && form.attachmentId && <p>Attachment: {form.attachmentId} <button type="button" className="text-link" onClick={() => change('attachmentId', '')}>Remove attachment</button></p>}<p>{form.imageIds.length} photo(s) selected. Use arrows to set display order.</p><ol>{form.imageIds.map((id, index) => <li key={id} className="media-option"><img src={mediaUrl(id)} width="60" height="45" alt="Selected photo"/><span>Photo {index + 1}</span><button type="button" disabled={index === 0} aria-label={`Move photo ${index + 1} up`} onClick={() => { const next = [...form.imageIds]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; change('imageIds', next); }}>↑</button><button type="button" disabled={index === form.imageIds.length - 1} aria-label={`Move photo ${index + 1} down`} onClick={() => { const next = [...form.imageIds]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; change('imageIds', next); }}>↓</button><button type="button" onClick={() => change('imageIds', form.imageIds.filter(value => value !== id))}>Remove</button></li>)}</ol></section>}{['activities','announcements','staff','honours','toppers'].includes(resource) && <ActivityImagePicker value={form.imageId} onChange={id => change('imageId', id)} />}{resource === 'announcements' && <><label className="checkbox-label"><input type="checkbox" checked={form.showPopup} onChange={event => change('showPopup', event.target.checked)}/><span>Show as a homepage popup. Published records respect the start and end dates. Default: every refresh, with per-message visitor reminder choices.</span></label><button className="button button-secondary" type="button" onClick={() => setPreview(value => !value)}>{preview ? 'Hide preview' : 'Preview announcement popup'}</button>{preview && <div className="announcement-preview"><AnnouncementContent item={form} preview/></div>}</>}<div className="publication-controls">{'status' in form && !(resource === 'media' && !item.id) && <label>Publication status<select value={form.status} onChange={e => change('status', e.target.value)}>{statuses.map(value => <option key={value} value={value}>{resource === 'announcements' && value === 'PUBLISHED' && new Date(form.publishedAt) > new Date() ? 'SCHEDULED · publish at selected start time' : value}</option>)}</select></label>}{'isDemo' in form && <label className="checkbox-label"><input type="checkbox" checked={form.isDemo} onChange={e => change('isDemo', e.target.checked)}/><span>Clearly label as demo content. Disable only after school approval.</span></label>}{resource === 'settings' && <label className="checkbox-label"><input type="checkbox" checked={form.public} onChange={e => change('public', e.target.checked)}/><span>Expose this setting on the public website</span></label>}{resource === 'users' && <label className="checkbox-label"><input type="checkbox" checked={form.active} onChange={e => change('active', e.target.checked)}/><span>Account is active. Updating an account revokes its sessions.</span></label>}</div><div className="editor-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button" disabled={pending || translation.busy}>{pending ? <Loader label="Saving…" compact/> : 'Save changes'}<ArrowUpRight size={17}/></button></div></form></Modal>;
}
