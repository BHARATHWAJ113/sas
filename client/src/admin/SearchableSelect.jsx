import { useEffect, useId, useRef, useState } from 'react';
import { Loader } from '../Loading';
export default function SearchableSelect({ value, options, onChange, loading = false }) {
  const listId = useId();
  const input = useRef(null);
  const label = option => option.name || `${option.title} · ${option.slug || option.status}`;
  const selected = options.find(option => option.id === value);
  const selectedLabel = selected ? label(selected) : '';
  const [query, setQuery] = useState(selectedLabel);
  useEffect(() => { setQuery(selectedLabel); }, [selectedLabel]);
  useEffect(() => { input.current?.setCustomValidity(value && selectedLabel ? '' : 'Choose an option from the suggestions.'); }, [value, selectedLabel]);
  return <>{loading && <Loader label="Loading options…" compact/>}<input ref={input} type="text" list={listId} value={query} required disabled={loading} autoComplete="off" placeholder={loading ? 'Loading options…' : 'Type to search, then choose an option…'} aria-invalid={!!query && !value} onChange={event => {
    const text = event.target.value; setQuery(text);
    const match = options.find(option => label(option).toLowerCase() === text.toLowerCase());
    onChange(match?.id || '');
  }}/><datalist id={listId}>{options.map(option => <option key={option.id} value={label(option)}/>)}</datalist></>;
}
