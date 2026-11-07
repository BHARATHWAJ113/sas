import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { exportRecords } from './RecordControls';
export default function RecordDetails({ resource, id, onClose }) {
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); const controller = new AbortController(); api(`/admin/${resource}/${id}`, { signal: controller.signal }).then(setItem).catch(error => { if (error.name !== 'AbortError') setError(error.message); }); return () => controller.abort(); }, [resource, id]);
  const metadata = item?.metadata;
  return <dialog className="article-dialog record-details" ref={dialog} onClose={onClose} aria-label="Record details"><button className="dialog-close" type="button" aria-label="Close record details" onClick={() => dialog.current.close()}>×</button><h2>Record details</h2>{error && <p role="alert">{error}</p>}{!item && !error && <p role="status">Loading details…</p>}{item && <>
    <h3>{resource === 'enquiries' ? 'Submitted information' : 'Visitor page view'}</h3><dl>{Object.entries(item).filter(([key]) => (resource === 'enquiries' ? ['id','parentName','studentName','email','phone','grade','message','locale','status','consentAt','createdAt','updatedAt','metadataExpiresAt'] : ['id','path','createdAt','expiresAt']).includes(key)).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value == null ? 'Not provided' : /At$/.test(key) ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>
    <h3>Device, network and location</h3>{metadata ? <><dl>{Object.entries(metadata.device || {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value == null ? 'Unavailable' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl><pre>{JSON.stringify({ network: metadata.network, location: metadata.location, submittedAt: metadata.submittedAt, source: metadata.source, consent: metadata.consent }, null, 2)}</pre></> : <p>Optional metadata was not supplied or its retention period has ended.</p>}
    {item.emails && <><h3>Email notifications</h3>{item.emails.map(mail => <p key={mail.id}>{mail.kind} · {mail.to} · {mail.status} · {mail.attempts} attempt(s){mail.lastError && ` · ${mail.lastError}`}</p>)}</>}
    {item.history && <><h3>Submission activity</h3>{item.history.length ? item.history.map((event, index) => <p key={index}>{event.action} · {new Date(event.createdAt).toLocaleString('en-IN')}</p>) : <p>No staff updates recorded.</p>}</>}
    <button className="record-export" type="button" onClick={() => exportRecords(item, `${resource}-${id}`, true)}>Export permitted details · JSON</button>
  </>}</dialog>;
}
