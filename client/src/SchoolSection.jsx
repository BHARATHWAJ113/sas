import { useState } from 'react';
import { Award, Users, BookOpen } from 'lucide-react';
import { useApi, mediaUrl } from './api';
import { useSite } from './context';
import { Seo, Pagination, StateBox } from './components';
import { standards, schoolLabels } from '../../shared/school-sections.js';
import './school-sections.css';

export default function SchoolSection({ resource }) {
  const { lang, pick } = useSite();
  const labels = schoolLabels[lang];
  const fees = resource === 'fees';
  const [selection, setSelection] = useState({ standard: fees ? 'LKG' : '', academicYear: '', category: '', department: '', search: '', page: 1 });
  const options = useApi(`/${resource}?limit=1`);
  const year = selection.academicYear || (fees ? options.data?.filters.academicYear?.[0] || '' : '');
  const query = new URLSearchParams({ ...selection, academicYear: year });
  const results = useApi(`/${resource}?${query}`, { debounceMs: 250 });
  const filters = options.data?.filters || {};
  const change = (key, value) => setSelection(current => ({ ...current, [key]: value, page: 1 }));
  const money = new Intl.NumberFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  const Icon = fees ? BookOpen : resource === 'staff' ? Users : Award;
  const filter = (key, label, values) => <label key={key}>{label}<select aria-label={label} value={key === 'academicYear' ? year : selection[key]} onChange={e => change(key, e.target.value)}>{!(fees && ['standard', 'academicYear'].includes(key)) && <option value="">{labels.all}</option>}{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>;
  return <>
    <Seo title={labels[resource]} description={labels.intro}/>
    <section className="directory-hero"><div className="container"><span className="eyebrow"><Icon size={18}/> St. Antony’s</span><h1>{labels[resource]}</h1><p>{labels.intro}</p></div></section>
    <section className="section"><div className="container directory-catalog">
      <div className="directory-filters">
        {resource !== 'staff' && filter('academicYear', labels.year, filters.academicYear || [])}
        {resource !== 'staff' && filter('standard', labels.standard, standards)}
        {resource === 'staff' && filter('department', labels.department, filters.department || [])}
        {!fees && filter('category', labels.category, filters.category || [])}
        {!fees && <label>{labels.search}<input type="search" maxLength={100} value={selection.search} onChange={e => change('search', e.target.value)}/></label>}
      </div>
      <StateBox {...results}/>
      {!results.loading && !results.error && results.data?.items.length === 0 && <p className="directory-empty">{labels.empty}</p>}
      {fees && results.data?.items.length > 0 && <div className="fee-schedule" tabIndex={0} role="region" aria-label={labels.fees}>
        <table><caption>{labels.standard} {selection.standard} · {year}</caption><thead><tr><th scope="col">{labels.category}</th><th scope="col">{labels.frequency}</th><th scope="col">{labels.amount}</th><th scope="col">{labels.installments}</th></tr></thead>
          <tbody>{results.data.items.map(row => <tr key={row.id}><th scope="row">{pick(row, 'title')}</th><td>{row.frequency}</td><td>{money.format(row.amount)}</td><td>{row.installments}</td></tr>)}</tbody>
          <tfoot><tr><th colSpan={2} scope="row">{labels.total}</th><td colSpan={2}>{money.format(results.data.annualTotal)}</td></tr></tfoot>
        </table>
      </div>}
      {!fees && <div className="directory-grid">{results.data?.items.map(item => <article className="directory-card" key={item.id}>
        <div className="directory-photo"><img src={item.image ? mediaUrl(item.image.id) : '/api/assets/images/profile-placeholder.svg'} srcSet={item.image?.hasVariants ? `${mediaUrl(item.image.id)}?width=640 640w, ${mediaUrl(item.image.id)}?width=1200 1200w` : undefined} sizes="(max-width: 600px) 90vw, (max-width: 900px) 45vw, 25vw" width="400" height="400" loading="lazy" decoding="async" alt={pick(item, 'name')} onError={event => { event.currentTarget.removeAttribute('srcset'); event.currentTarget.src = '/api/assets/images/profile-placeholder.svg'; }}/>{item.rank != null && <span className="directory-rank">{labels.rank} {item.rank}</span>}</div>
        <div className="directory-card-body"><span className="eyebrow">{item.category}</span><h2>{pick(item, 'name')}</h2>
          <p className="directory-subtitle">{resource === 'staff' ? pick(item, 'designation') : resource === 'honours' ? pick(item, 'title') : `${labels.standard} ${item.standard}`}</p>
          <p>{item.department || item.academicYear}{resource === 'honours' && ` · ${labels.standard} ${item.standard}`}</p>
          {item.description && <p>{pick(item, 'description')}</p>}
          {resource === 'toppers' && <dl className="directory-scores">{item.marks != null && <div><dt>{labels.marks}</dt><dd>{item.marks}{item.maximumMarks != null && ` / ${item.maximumMarks}`}</dd></div>}{(item.percentage != null || item.maximumMarks != null && item.marks != null) && <div><dt>{labels.percentage}</dt><dd>{Number(item.percentage ?? Number(item.marks) / Number(item.maximumMarks) * 100).toFixed(2)}%</dd></div>}</dl>}
        </div>
      </article>)}</div>}
      {!fees && <Pagination page={selection.page} pages={results.data?.pages || 0} onChange={page => setSelection(current => ({ ...current, page }))}/>}
    </div></section>
  </>;
}
