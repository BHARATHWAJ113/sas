export default function TranslationControls({ translation }) {
  return <div className="translation-controls">
    <label className="checkbox-label"><input type="checkbox" checked={translation.enabled} onChange={event => translation.toggle(event.target.checked)}/><span>Automatically translate English to Tamil and Hindi</span></label>
    <p>Public content is sent to the free MyMemory service after you pause typing. Review names and translations before publishing. Your manual edits are preserved.</p>
    <div role="status">{translation.busy ? 'Translating…' : 'Translations remain editable.'}</div>
    {translation.error && <p role="alert" className="admin-error">{translation.error}</p>}
    <button type="button" className="button button-secondary" disabled={translation.busy || !translation.enabled} onClick={translation.retry}>Translate / retry English fields</button>
  </div>;
}
