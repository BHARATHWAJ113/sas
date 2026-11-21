import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { api } from '../api';
import { Loader } from '../Loading';
import './email.css';
import { useRecordQuery, RecordFilters, RecordPagination } from './RecordControls';

const statusLabels = {
  PENDING: 'Pending', SENDING: 'Sending', SENT: 'Sent · SMTP accepted', FAILED: 'Failed',
  PARTIAL: 'Partially accepted', UNKNOWN: 'Needs review',
};

function RichText({ onChange, editorRef }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ codeBlock: false, code: false, heading: { levels: [2, 3] }, link: { openOnClick: false } })],
    content: '<p></p>',
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { role: 'textbox', 'aria-label': 'Email body', 'aria-multiline': 'true' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  useEffect(() => { editorRef.current = editor; }, [editor, editorRef]);
  const formats = [
    ['Bold', 'bold', 'toggleBold'], ['Italic', 'italic', 'toggleItalic'], ['Underline', 'underline', 'toggleUnderline'],
    ['Bullet list', 'bulletList', 'toggleBulletList'], ['Numbered list', 'orderedList', 'toggleOrderedList'],
  ];
  return (
    <div className="email-editor">
      <div role="toolbar" aria-label="Email formatting" className="email-toolbar">
        {formats.map(([label, mark, command]) => (
          <button key={mark} type="button" disabled={!editor} aria-pressed={editor?.isActive(mark) || false} onClick={() => editor.chain().focus()[command]().run()}>{label}</button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default function EmailManager({ mutate }) {
  const controls = useRecordQuery('emails');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('<p></p>');
  const [detail, setDetail] = useState(null);
  const [version, setVersion] = useState(0);
  const request = useRef(null);
  const editor = useRef(null);
  const attachmentInput = useRef(null);
  const readSequence = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = ++readSequence.current;
    let timer;
    async function load() {
      try {
        const result = await api(`/admin/emails?${controls.query}`, { signal: controller.signal });
        if (sequence !== readSequence.current || controller.signal.aborted) return;
        setData(result);
        setHistoryError(null);
        if (result.items.some(item => ['PENDING', 'SENDING'].includes(item.status))) {
          timer = setTimeout(() => { if (!document.hidden) load(); else timer = setTimeout(load, 15000); }, 15000);
        }
      } catch (failure) {
        if (!controller.signal.aborted && sequence === readSequence.current) setHistoryError(failure);
      }
    }
    setData(null);
    setError(null);
    setHistoryError(null);
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [controls.query, version]);

  async function send(event) {
    event.preventDefault();
    if (pending || !data?.configured) return;
    const recipients = cc.split(/[,;\n]+/).map(value => value.trim()).filter(Boolean);
    if (recipients.some(value => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      setError(new Error('Enter valid CC addresses separated by commas.'));
      return;
    }
    const blindRecipients = bcc.split(/[,;\n]+/).map(value => value.trim()).filter(Boolean);
    const payload = { to, cc: recipients, bcc: blindRecipients, attachmentId: attachment?.id || null, subject, html };
    const body = JSON.stringify(payload);
    if (request.current?.body !== body) request.current = { body, key: crypto.randomUUID() };
    setPending(true);
    setError(null);
    setNotice('');
    try {
      const result = await mutate('/emails', 'POST', payload, { 'Idempotency-Key': request.current.key });
      setNotice(`Email queued. Reference ${result.id}. The history shows SMTP acceptance and any failures.`);
      setTo(''); setCc(''); setBcc(''); setAttachment(null); setSubject(''); setHtml('<p></p>');
      if (attachmentInput.current) attachmentInput.current.value = '';
      editor.current?.commands.clearContent();
      request.current = null;
      setVersion(value => value + 1);
    } catch (failure) { setError(failure); }
    finally { setPending(false); }
  }

  async function upload(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError(new Error('Choose an image or PDF up to 8 MB.')); return; }
    setUploading(true); setError(null);
    try { const body = new FormData(); body.append('file', file); body.append('alt', 'Email attachment'); body.append('altTa', 'Email attachment'); setAttachment(await mutate('/media/upload', 'POST', body)); }
    catch (failure) { setError(failure); } finally { setUploading(false); }
  }

  async function retry(item) {
    setPending(true);
    setError(null);
    try { await mutate(`/emails/${item.id}/retry`, 'POST'); setVersion(value => value + 1); }
    catch (failure) { setError(failure); }
    finally { setPending(false); }
  }

  async function view(item) {
    try { setDetail(await api(`/admin/emails/${item.id}`)); }
    catch (failure) { setError(failure); }
  }
  const displayError = error || historyError;

  return (
    <>
      <div className="admin-title"><div><span className="eyebrow">SCHOOL CORRESPONDENCE</span><h1>Email management</h1><p>Send individual messages and review form acknowledgements and office notifications.</p></div></div>
      {displayError && <div className="admin-error" role="alert">{displayError.message}{displayError.fields && <ul>{Object.entries(displayError.fields).map(([name, message]) => <li key={name}>{name} · {message}</li>)}</ul>}</div>}
      {notice && <div className="admin-notice" role="status">{notice}</div>}
      {data && !data.configured && <div className="admin-notice">Sending is unavailable. Configure Gmail SMTP on the server. Saved enquiry emails remain pending until the service is enabled or the messages expire.</div>}
      <form className="admin-panel email-compose" onSubmit={send}>
        <h2>Compose email</h2>
        <div className="admin-form-grid">
          <label>To<input type="email" required maxLength="191" value={to} onChange={event => setTo(event.target.value)} autoComplete="off" /></label>
          <label>CC · Optional, up to five addresses<input value={cc} onChange={event => setCc(event.target.value)} maxLength="1000" placeholder="name@example.com, another@example.com" /></label>
          <label>BCC · Optional, up to five addresses<input value={bcc} onChange={event => setBcc(event.target.value)} maxLength="1000" placeholder="Private copy recipients"/></label><label className="full-width">Subject<input required maxLength="160" value={subject} onChange={event => setSubject(event.target.value)} /></label>
        </div>
        <label>Attachment · Optional image or PDF, up to 8 MB<input ref={attachmentInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={uploading || pending} onChange={event => upload(event.target.files?.[0])}/></label>{uploading && <Loader label="Validating attachment…" compact />}{attachment && <p>{attachment.originalName} <button type="button" onClick={() => { setAttachment(null); attachmentInput.current.value = ''; }}>Remove attachment</button></p>}<span id="email-body-label">Body</span>
        <RichText onChange={setHtml} editorRef={editor} />
        <button className="button" disabled={pending || uploading || !data?.configured || editor.current?.isEmpty}>{pending ? <Loader label="Queuing…" compact /> : 'Send email'}</button>
      </form>
      <section className="admin-panel email-history">
        <div className="email-history-title"><h2>Email history</h2><button type="button" onClick={() => setVersion(value => value + 1)}>Refresh</button></div>
        <RecordFilters resource="emails" controls={controls} items={data?.items || []}/>
        <p className="editor-help">Sent means the SMTP server accepted the message. Inbox placement and later bounces require checking Gmail. Review uncertain or partially accepted messages before sending again.</p>
        {!data ? historyError ? <p role="alert">Email history is unavailable. Choose Refresh to try again.</p> : <Loader label="Loading history…" /> : data.items.length ? (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Recipients</th><th>Subject</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead><tbody>
            {data.items.map(item => <tr key={item.id}>
              <td>{item.to}{item.bcc?.length > 0 && <small>BCC {item.bcc.join(', ')}</small>}{item.cc.length > 0 && <small>CC {item.cc.join(', ')}</small>}</td>
              <td>{item.subject}<small>{item.kind}</small></td>
              <td><span className={`status-pill ${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span>{item.lastError && <small>{item.lastError}</small>}</td>
              <td>{new Date(item.createdAt).toLocaleString('en-IN')}{item.sentAt && <small>Accepted {new Date(item.sentAt).toLocaleString('en-IN')}</small>}</td>
              <td><button type="button" onClick={() => view(item)}>Details</button>{item.status === 'FAILED' && item.attempts < 8 && (!item.expiresAt || new Date(item.expiresAt) > new Date()) && <button type="button" disabled={pending || !data.configured} onClick={() => retry(item)}>Retry</button>}</td>
            </tr>)}
          </tbody></table></div>
        ) : <p>No email records match this filter.</p>}
        <RecordPagination data={data} controls={controls}/>
      </section>
      {detail && <div className="admin-panel email-detail"><button type="button" onClick={() => setDetail(null)}>Close details</button><h2>{detail.subject}</h2><p>{detail.to}{detail.cc.length > 0 && ` · CC ${detail.cc.join(', ')}`}</p><p>{detail.bcc?.length > 0 && `BCC ${detail.bcc.join(', ')}`}{detail.attachmentId && ' · Includes attachment'}</p><p>{statusLabels[detail.status]} · {detail.attempts} attempt(s)</p><p>{detail.lastError}</p>{detail.accepted?.length > 0 && <p>Accepted {detail.accepted.join(', ')}</p>}{detail.rejected?.length > 0 && <p>Rejected {detail.rejected.join(', ')}</p>}<pre>{detail.text}</pre></div>}
    </>
  );
}
