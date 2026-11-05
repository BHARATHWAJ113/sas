import { useState } from 'react';
import { Compass, FlaskConical, HandHeart, HeartPulse, Leaf, Palette, Shapes, Sparkles, Trophy } from 'lucide-react';
import { mediaUrl, useApi } from './api';
import { DemoBadge, Pagination, SectionHeading, StateBox } from './components';
import { useSite } from './context';
import './activities.css';

const categoryIcons = {
  sparkles: Sparkles,
  leadership: Compass,
  sports: Trophy,
  arts: Palette,
  science: FlaskConical,
  service: HandHeart,
  environment: Leaf,
  health: HeartPulse,
};
const activitiesPath = '/activities?limit=6';

function ActivityCard({ item }) {
  const { pick } = useSite();
  const [failedImageId, setFailedImageId] = useState(null);
  const Icon = categoryIcons[item.category.icon] || Sparkles;
  const image = item.image?.id !== failedImageId && item.image;
  return (
    <li className="activity-card">
      <div className="activity-visual" data-icon={item.category.icon}>
        <div className="activity-emblem" aria-hidden="true"><Icon size={46} strokeWidth={1.65} /></div>
        {image && <img src={mediaUrl(image.id)} width="480" height="260" alt={pick(image, 'alt') || pick(item, 'title')} loading="lazy" onError={() => setFailedImageId(image.id)} />}
        <span className="activity-category">{pick(item.category, 'title')}</span>
      </div>
      <div className="activity-copy">
        {item.isDemo && <DemoBadge />}
        <h3>{pick(item, 'title')}</h3>
        <p>{pick(item, 'summary')}</p>
      </div>
    </li>
  );
}

export function ActivityExplorer() {
  const { pick, t } = useSite();
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const catalog = useApi(activitiesPath);
  const filtered = useApi(category || page > 1 ? `${activitiesPath}&page=${page}&category=${encodeURIComponent(category)}` : null);
  const results = category || page > 1 ? filtered : catalog;
  const categories = catalog.data?.categories ?? [];

  function selectCategory(slug) {
    setCategory(slug);
    setPage(1);
  }

  return (
    <section id="activities" className="section activity-section">
      <div className="container">
        <SectionHeading eyebrow={t('activitiesTag')} title={t('activitiesTitle')} text={t('activitiesIntro')} icon={Shapes} />
        {categories.length > 0 && (
          <div className="activity-filters" role="group" aria-label={t('activitiesFilter')}>
            <button type="button" aria-pressed={!category} onClick={() => selectCategory('')}>{t('activitiesAll')}</button>
            {categories.map(item => (
              <button key={item.slug} type="button" aria-pressed={category === item.slug} onClick={() => selectCategory(item.slug)}>{pick(item, 'title')}</button>
            ))}
          </div>
        )}
        <div aria-busy={results.loading}>
          <StateBox {...results} empty={results.data?.items.length === 0} />
          {results.data?.items.length > 0 && (
            <>
              <ul className="activity-grid">{results.data.items.map(item => <ActivityCard key={item.id} item={item} />)}</ul>
              <Pagination page={page} pages={results.data.pages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
