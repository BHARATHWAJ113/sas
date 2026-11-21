import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { Seo } from '../components';
import { ThemeToggle } from '../Theme';
import { Loader } from '../Loading';
import SchoolCharacters from './SchoolCharacters';

export default function Login({ onLogin, error: initialError, retry }) {
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [focused, setFocused] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [caps, setCaps] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true); setError(null);
    try { onLogin(await api('/auth/login', { method: 'POST', body: JSON.stringify(values) })); }
    catch (failure) { setError(failure); }
    finally { setPending(false); }
  }
  const failure = error || initialError;
  return <div className="staff-login"><Seo title="Staff sign in"/>
    <header className="staff-login-header"><Link to="/" className="staff-brand"><img src="/images/logo.webp" width="46" height="46" alt="School crest"/><span>St. Antony’s<small>NEYVELI · STAFF WORKSPACE</small></span></Link><ThemeToggle/></header>
    <div className="staff-login-card">
      <section className="staff-login-story"><span className="login-story-label">A LITTLE CARE. A WORLD OF LEARNING.</span><h2>Great school days<br/>start with you.</h2><p>A welcoming space for the people behind every lesson, discovery and achievement.</p><SchoolCharacters focused={focused} watchingPassword={focused === 'password'} revealed={revealed}/><span className="login-story-footer">Strive and Shine <span>✦</span> Since 1994</span></section>
      <section className="staff-login-form"><div className="login-lock"><LockKeyhole size={24}/></div><h1>Welcome back.</h1><p>Sign in to your school workspace.</p>
        {failure && <div className="admin-error" role="alert"><AlertCircle size={18}/><span>{failure.message}</span></div>}
        {initialError?.status === 503 && <button type="button" className="text-link" onClick={retry}>Check connection again</button>}
        <form onSubmit={submit} aria-busy={pending}>
          <label htmlFor="staff-email">Email address</label><input id="staff-email" type="email" name="email" required autoComplete="username" maxLength="191" placeholder="Your staff email" onFocus={() => setFocused('email')} onBlur={() => setFocused('')} disabled={pending}/>
          <label htmlFor="staff-password">Password</label><div className="staff-password"><input id="staff-password" type={revealed ? 'text' : 'password'} name="password" required autoComplete="current-password" maxLength="200" placeholder="Enter your password" onFocus={() => setFocused('password')} onBlur={() => { setFocused(''); setCaps(false); }} onKeyUp={event => setCaps(event.getModifierState('CapsLock'))} disabled={pending}/><button type="button" aria-label={revealed ? 'Hide password' : 'Show password'} aria-pressed={revealed} onClick={() => setRevealed(value => !value)}>{revealed ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div>
          {caps && <small role="status">Caps Lock is on.</small>}
          <button type="submit" className="button staff-sign-in" disabled={pending || initialError?.status === 503}>{pending ? <Loader label="Signing in…" compact/> : 'Sign in to workspace'}</button>
        </form>
        <p className="staff-access-help">Need access or a password reset? Contact your school administrator.</p><Link to="/" className="staff-back">Back to school website</Link>
      </section>
    </div><footer className="staff-login-footer">St. Antony’s Matriculation Higher Secondary School · Neyveli</footer>
  </div>;
}
