import { useAutoTranslation } from './useAutoTranslation';
import TranslationControls from './TranslationControls';
import { useEffect, useRef, useState } from 'react';
import '../school-sections.css';
import { Loader } from '../Loading';

export default function BatchUpload({ mutate, onSaved }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [translating, setTranslating] = useState({});
  const urls = useRef([]);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);
  function select(files) {
    const next = [...files].slice(0, 30).map(file => {
      const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      if (url) urls.current.push(url);
      return { file, url, alt: '', altTa: '', altHi: '', status: 'Ready' };
    });
    setTranslating({}); setItems(next); setError(files.length > 30 ? 'Select no more than 30 files per batch.' : '');
  }
  async function upload(event) {
    event.preventDefault(); if (busy || Object.values(translating).some(Boolean) || !items.length) return;
    setBusy(true); setError('');
    const next = [...items];
    try {
      for (let i = 0; i < next.length; i++) {
        if (next[i].status === 'Uploaded') continue;
        const item = next[i];
        if (item.file.size > 8 * 1024 * 1024) throw new Error(`${item.file.name} exceeds 8 MB.`);
        next[i] = { ...item, status: 'Uploading…' }; setItems([...next]);
        const body = new FormData(); body.append('file', item.file); body.append('alt', item.alt); body.append('altTa', item.altTa); body.append('altHi', item.altHi);
        try { await mutate('/media/upload', 'POST', body); }
        catch (error) { next[i].status = 'Failed'; setItems([...next]); throw error; }
        next[i].status = 'Uploaded'; setItems([...next]);
      }
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  const complete = items.length > 0 && items.every(item => item.status === 'Uploaded');
  return <form className="admin-form" onSubmit={upload}>
    <p>Upload up to 30 photos or PDFs, 8 MB each. Files remain drafts until published in the Media library. Add photos to an album to set their category and order.</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    <label>Choose files<input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onChange={e => select(e.target.files)}/></label>
    <div className="batch-upload-list">{items.map((item, i) => <div key={i} className="batch-upload-item">
      {item.url && <img src={item.url} alt="Upload preview"/>}<span>{item.file.name}<small role="status">{item.status}</small></span>
      <CaptionFields key={item.url} item={item} busy={busy} mutate={mutate} onBusy={value => setTranslating(current => current[i] === value ? current : { ...current, [i]: value })} setItem={update => setItems(current => current.map((row, index) => index === i ? update(row) : row))}/>

    </div>)}</div>
    {complete ? <button type="button" className="button" onClick={onSaved}>Done · manage uploaded files</button> : <button className="button" disabled={busy || Object.values(translating).some(Boolean) || !items.length}>{busy ? <Loader label="Uploading…" compact/> : 'Upload / retry remaining files'}</button>}
  </form>;
}

function CaptionFields({ item, busy, mutate, setItem, onBusy }) {
  const translation = useAutoTranslation(item, setItem, ['alt'], mutate);
  useEffect(() => { onBusy(translation.busy); }, [translation.busy, onBusy]);
  return <fieldset disabled={busy || item.status === 'Uploaded'} className="batch-captions">
    <TranslationControls translation={translation}/>
    {['alt', 'altTa', 'altHi'].map(key => <label key={key}>{key === 'altHi' ? 'Title / alternative text · Hindi (optional)' : key === 'alt' ? 'Title / alternative text · English' : 'Title / alternative text · Tamil'}<input required={key !== 'altHi'} maxLength={255} value={item[key]} onChange={event => translation.change(key, event.target.value)}/></label>)}
  </fieldset>;
}
