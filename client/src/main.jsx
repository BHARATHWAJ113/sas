import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/noto-sans-tamil/tamil-400.css';
import '@fontsource/noto-sans-tamil/tamil-600.css';
import { SiteProvider } from './context';
import { Footer, RouteReset, ScrollToTop, StateBox } from './components';
import { SiteHeader } from './SiteHeader';
import { Home, About, Academics, Admissions, Infrastructure, StudentLife, Updates, Events, EventDetails, Contact, NotFound, Privacy } from './pages';
import { Gallery } from './Gallery';
import { useScrollReveal } from './useScrollReveal';
import { CookieConsentProvider } from './CookieConsent';
import AnnouncementPopup from './AnnouncementPopup';
import VisitorTracker from './VisitorTracker';
import './form-design.css';
import './styles.css';
import './public-design.css';
import './site-header.css';
import './public-motion.css';
import './gallery.css';
const Admin = lazy(() => import('./admin/Admin'));
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="container section" role="alert"><h1>Something went wrong / பிழை ஏற்பட்டது</h1><p>Please reload the page to try again.</p><button className="button" onClick={() => window.location.reload()}>Reload / மீண்டும் ஏற்றுக</button></div> : this.props.children; }
}
function PublicSite() {
  const content = useScrollReveal();
  return (
    <CookieConsentProvider>
      <SiteHeader />
      <main id="main" ref={content} tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/student-life" element={<StudentLife />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/news" element={<Updates kind="NEWS" />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:slug" element={<EventDetails />} />
          <Route path="/notices" element={<Updates kind="NOTICE" />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookie-policy" element={<Privacy cookiePolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ScrollToTop />
      <AnnouncementPopup />
      <VisitorTracker />
    </CookieConsentProvider>
  );
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<React.StrictMode><ErrorBoundary><BrowserRouter><SiteProvider><RouteReset/><Suspense fallback={<StateBox loading/>}><Routes><Route path="/admin/*" element={<Admin/>}/><Route path="*" element={<PublicSite/>}/></Routes></Suspense></SiteProvider></BrowserRouter></ErrorBoundary></React.StrictMode>);
