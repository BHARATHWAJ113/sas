import { Facebook, Instagram, Linkedin, Youtube, AtSign, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { publishedSocialLinks } from '../../shared/social-links.js';
import { useSite } from './context';
import { Seo, StateBox } from './components';
import './social-media.css';

const icons = { Instagram, Facebook, LinkedIn: Linkedin, YouTube: Youtube, Threads: AtSign };
function SocialIcon({ name }) {
  const Icon = icons[name];
  return Icon ? <Icon size={21} aria-hidden="true"/> : <span className="social-x" aria-hidden="true">𝕏</span>;
}

export function SocialSidebar() {
  const { site, t } = useSite();
  const links = publishedSocialLinks(site.data?.settings);
  if (!links.length) return null;
  return <nav className="social-sidebar" aria-label={t('socialMedia')}>
    {links.map(link => <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer" style={{ '--social-color': link.color }} aria-label={`${link.name} (${t('school')})`}>
      <span className="social-sidebar-label">{link.name}</span><span className="social-icon"><SocialIcon name={link.name}/></span>
    </a>)}
  </nav>;
}

export function SocialMedia() {
  const { site, lang, t } = useSite();
  const links = publishedSocialLinks(site.data?.settings);
  return <>
    <Seo title={t('socialMedia')} />
    <section className="social-page section"><div className="container">
      <header><span className="eyebrow">{t('school')}</span><h1>{lang === 'ta' ? 'எங்களுடன் இணைந்திருங்கள்' : 'Stay connected with our school'}</h1><p>{lang === 'ta' ? 'எங்கள் அதிகாரப்பூர்வ சமூக ஊடகப் பக்கங்களில் பள்ளி நிகழ்வுகளையும் மாணவர்களின் செயல்பாடுகளையும் அறியுங்கள்.' : 'Follow school moments, student activities and updates on our official social pages.'}</p></header>
      <StateBox loading={site.loading} error={site.error} retry={site.retry}/>
      {links.length > 0 ? <div className="social-page-grid">{links.map(link => <a href={link.url} key={link.key} target="_blank" rel="noopener noreferrer" style={{ '--social-color': link.color }}><span className="social-icon"><SocialIcon name={link.name}/></span><h2>{link.name}</h2><span>{lang === 'ta' ? 'பக்கத்தைப் பாருங்கள்' : 'Visit our page'} <ExternalLink size={16} aria-hidden="true"/></span></a>)}</div> : !site.loading && !site.error && <div className="social-empty"><p>{lang === 'ta' ? 'அதிகாரப்பூர்வ சமூக ஊடக இணைப்புகள் விரைவில் சேர்க்கப்படும்.' : 'Our official social links will be listed here soon.'}</p><Link className="button" to="/contact">{t('contact')}</Link></div>}
    </div></section>
  </>;
}
