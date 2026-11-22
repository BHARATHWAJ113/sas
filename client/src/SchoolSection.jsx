import ProfileModal from './ProfileModal';
import { localeFor } from '../../shared/languages.js';
import { useState } from 'react';
import { Award, Users, BookOpen, Search, X, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { useApi, mediaUrl } from './api';
import { useSite } from './context';
import { Seo, Pagination, StateBox } from './components';
import { standards, schoolLabels } from '../../shared/school-sections.js';
import './school-sections.css';

export default function SchoolSection({ resource }) {
  const { lang, pick, t } = useSite();
  const labels = schoolLabels[lang];
  const fees = resource === 'fees';
  const [selected, setSelected] = useState(null);
  const [selection, setSelection] = useState({ standard: fees ? 'LKG' : '', academicYear: '', category: '', department: '', search: '', page: 1 });
  const options = useApi(`/${resource}?limit=1`);
  const year = selection.academicYear || (fees ? options.data?.filters.academicYear?.[0] || '' : '');
  const query = new URLSearchParams({ ...selection, academicYear: year });
  const results = useApi(`/${resource}?${query}`, { debounceMs: 250 });
  const filters = options.data?.filters || {};
  const change = (key, value) => setSelection(current => ({ ...current, [key]: value, page: 1 }));
  const money = new Intl.NumberFormat(localeFor(lang), { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  const Icon = fees ? BookOpen : resource === 'staff' ? Users : Award;
  const filter = (key, label, values) => <label key={key}>{label}<select aria-label={label} value={key === 'academicYear' ? year : selection[key]} onChange={e => change(key, e.target.value)}>{!(fees && ['standard', 'academicYear'].includes(key)) && <option value="">{labels.all}</option>}{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>;
  return <>
    <Seo title={labels[resource]} description={labels.intro}/>
    <section className="directory-hero"><div className="container"><span className="eyebrow"><Icon size={18}/> St. Antony’s</span><h1>{labels[resource]}</h1><p>{labels.intro}</p></div></section>
    <section className="section"><div className="container directory-catalog">
      <div className="directory-filter-panel">
        {!fees && <div className="directory-segments" role="group" aria-label={labels.category}>{['', ...(filters.category || [])].map(category => <button type="button" key={category} aria-pressed={selection.category === category} onClick={() => change('category', category)}><Icon size={18}/>{category || labels.all}</button>)}</div>}
        {!fees && <div className="directory-search"><Search size={21} aria-hidden="true"/><input type="search" aria-label={labels.search} placeholder={labels.search} maxLength={100} value={selection.search} onChange={event => change('search', event.target.value)}/>{selection.search && <button type="button" onClick={() => change('search', '')} aria-label={t('clearFilters')}><X size={18}/></button>}</div>}
        <div className="directory-filters">
          {resource !== 'staff' && filter('academicYear', labels.year, filters.academicYear || [])}
          {resource !== 'staff' && filter('standard', labels.standard, standards)}
          {resource === 'staff' && filter('department', labels.department, filters.department || [])}
          {!fees && <button type="button" className="directory-reset" onClick={() => setSelection({ standard: '', academicYear: '', category: '', department: '', search: '', page: 1 })}><SlidersHorizontal size={16}/>{t('clearFilters')}</button>}
        </div>
        {!fees && <p className="directory-result-count" role="status" aria-live="polite">{results.loading ? t('loading') : <><strong>{results.data?.total || 0}</strong> / {options.data?.total || 0} {labels[resource]}</>}</p>}
      </div>
      <StateBox {...results}/>
      {!results.loading && !results.error && results.data?.items.length === 0 && <p className="directory-empty">{labels.empty}</p>}
      {fees && results.data?.items.length > 0 && <div className="fee-schedule" tabIndex={0} role="region" aria-label={labels.fees}>
        <table><caption>{labels.standard} {selection.standard} · {year}</caption><thead><tr><th scope="col">{labels.category}</th><th scope="col">{labels.frequency}</th><th scope="col">{labels.amount}</th><th scope="col">{labels.installments}</th></tr></thead>
          <tbody>{results.data.items.map(row => <tr key={row.id}><th scope="row">{pick(row, 'title')}</th><td>{row.frequency}</td><td>{money.format(row.amount)}</td><td>{row.installments}</td></tr>)}</tbody>
          <tfoot><tr><th colSpan={2} scope="row">{labels.total}</th><td colSpan={2}>{money.format(results.data.annualTotal)}</td></tr></tfoot>
        </table>
      </div>}
      {!fees && !results.loading && !results.error && <div className="directory-grid">{results.data?.items.map(item => <button type="button" className="directory-card" key={item.id} onClick={() => setSelected(item)} aria-label={`${t('viewDetails')}: ${pick(item, 'name')}`} aria-haspopup="dialog">
        <div className="directory-photo"><img src={item.image ? `${mediaUrl(item.image.id)}${item.image.hasVariants ? '?width=640' : ''}` : '/api/assets/images/profile-placeholder.svg'} width="88" height="104" loading="lazy" decoding="async" alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/api/assets/images/profile-placeholder.svg'; }}/></div>
        <div className="directory-card-body"><span className="directory-category">{item.category}</span><h2>{pick(item, 'name')}</h2><p className="directory-subtitle">{resource === 'staff' ? pick(item, 'designation') : resource === 'honours' ? pick(item, 'title') : `${labels.standard} ${item.standard}`}</p><small>{item.department || item.academicYear}{item.rank != null && ` · ${labels.rank} ${item.rank}`}</small></div><ArrowUpRight className="directory-open" size={16}/>
      </button>)}</div>}
      {!fees && <Pagination page={selection.page} pages={results.data?.pages || 0} onChange={page => setSelection(current => ({ ...current, page }))}/>}
    </div></section>
    {selected && <ProfileModal title={pick(selected, 'name')} image={selected.image ? mediaUrl(selected.image.id) : '/api/assets/images/profile-placeholder.svg'} onClose={() => setSelected(null)}>
      <p className="directory-subtitle">{resource === 'staff' ? pick(selected, 'designation') : pick(selected, 'title')}</p>
      <dl className="profile-facts">{[['category', labels.category], ['department', labels.department], ['academicYear', labels.year], ['standard', labels.standard], ['rank', labels.rank]].filter(([key]) => selected[key] != null && selected[key] !== '').map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{selected[key]}</dd></div>)}</dl>
      {pick(selected, 'description') && <p>{pick(selected, 'description')}</p>}
      {resource === 'toppers' && <dl className="directory-scores">{selected.marks != null && <div><dt>{labels.marks}</dt><dd>{selected.marks}{selected.maximumMarks != null && ` / ${selected.maximumMarks}`}</dd></div>}{(selected.percentage != null || selected.maximumMarks > 0 && selected.marks != null) && <div><dt>{labels.percentage}</dt><dd>{Number(selected.percentage ?? Number(selected.marks) / Number(selected.maximumMarks) * 100).toFixed(2)}%</dd></div>}</dl>}
    </ProfileModal>}
  </>;
}
