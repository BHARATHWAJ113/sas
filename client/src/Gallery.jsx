import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { mediaUrl, useApi } from './api';
import { AdmissionsCTA, Pagination, ResponsiveImage, SectionHeading, Seo, StateBox, TextLink } from './components';
import { useSite } from './context';

const imageSource = media => media.url || mediaUrl(media.id);

export function ImageGrid({ images, gallery = false }) {
  const { pick, t } = useSite();
  const [active, setActive] = useState(-1);
  const dialog = useRef(null);
  const selected = images[active]?.media;

  useEffect(() => {
    if (active >= 0 && !dialog.current.open) dialog.current.showModal();
  }, [active]);

  function move(step) {
    setActive(index => (index + step + images.length) % images.length);
  }

  function navigate(event) {
    if (images.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  }

  return (
    <>
      <div className={gallery ? 'image-grid gallery-photo-grid' : 'image-grid'}>
        {images.map((item, index) => (
          <button
            type="button"
            key={item.id}
            data-album={item.gallery?.slug}
            onClick={() => setActive(index)}
            aria-label={`${t('galleryOpen')}: ${pick(item.media, 'alt')}`}
          >
            <ResponsiveImage src={imageSource(item.media)} alt={pick(item.media, 'alt')} loading="lazy" width="600" height="450" sizes="(max-width: 440px) 100vw, (max-width: 800px) 50vw, 33vw" />
            {item.gallery?.isDemo && <small className="gallery-demo-label">{t(item.gallery.slug === 'illustrations' ? 'galleryIllustration' : 'demo')}</small>}
            <span aria-hidden="true"><ArrowUpRight size={23} /></span>
          </button>
        ))}
      </div>
      <dialog
        className="lightbox"
        ref={dialog}
        onClose={() => setActive(-1)}
        onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}
        onKeyDown={navigate}
        aria-label={t('gallery')}
      >
        <button type="button" className="dialog-close" aria-label={t('close')} onClick={() => dialog.current.close()}><X /></button>
        {selected && (
          <>
            <ResponsiveImage src={imageSource(selected)} alt={pick(selected, 'alt')} sizes="min(920px, 90vw)" />
            <p>{pick(selected, 'alt')}</p>
            {images.length > 1 && (
              <div className="lightbox-controls">
                <button type="button" aria-label={t('previous')} onClick={() => move(-1)}><ChevronLeft /></button>
                <span aria-live="polite">{active + 1} / {images.length}</span>
                <button type="button" aria-label={t('next')} onClick={() => move(1)}><ChevronRight /></button>
              </div>
            )}
          </>
        )}
      </dialog>
    </>
  );
}

function GalleryMedia({ preview = false }) {
  const { pick, t, lang } = useSite();
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const path = `/gallery-media?limit=${preview ? 3 : 12}`;
  const all = useApi(path);
  const filtered = useApi(category || page > 1 ? `${path}&category=${encodeURIComponent(category)}&page=${page}` : null);
  const results = category || page > 1 ? filtered : all;
  const count = new Intl.NumberFormat(lang === 'ta' ? 'ta-IN' : 'en-IN');

  function selectCategory(slug) {
    setCategory(slug);
    setPage(1);
  }

  return (
    <div className="container gallery-catalog">
      {all.data?.categories.length > 0 && (
        <div className="gallery-filters" role="group" aria-label={t('galleryFilter')}>
          <button type="button" aria-pressed={!category} onClick={() => selectCategory('')}>
            {t('galleryAll')} <span>{count.format(all.data.allCount)}</span>
          </button>
          {all.data.categories.map(album => (
            <button type="button" key={album.slug} aria-pressed={category === album.slug} onClick={() => selectCategory(album.slug)}>
              {pick(album, 'title')} <span>{count.format(album.count)}</span>
            </button>
          ))}
        </div>
      )}
      <div aria-busy={results.loading}>
        <StateBox {...results} empty={results.data?.items.length === 0} />
        {results.data?.items.length > 0 && <ImageGrid key={`${category}:${page}`} images={results.data.items} gallery />}
        {!preview && <Pagination page={page} pages={results.data?.pages || 0} onChange={setPage} />}
      </div>
      {preview && <div className="gallery-more"><TextLink to="/gallery">{t('allGallery')}</TextLink></div>}
    </div>
  );
}

export function GalleryPreview() {
  const { t } = useSite();
  return (
    <section className="section gallery-preview gallery-media-section">
      <div className="container"><SectionHeading eyebrow={t('galleryVisual')} title={t('galleryTitle')} icon={Images} /></div>
      <GalleryMedia preview />
    </section>
  );
}

export function Gallery() {
  const { t } = useSite();
  return (
    <>
      <Seo title={t('gallery')} description={t('galleryIntro')} />
      <section className="gallery-hero">
        <div className="container">
          <span className="eyebrow"><Images size={16} aria-hidden="true" />{t('galleryVisual')}</span>
          <h1>{t('galleryHeadingStart')} <span>{t('school')}</span> {t('galleryHeadingEnd')}</h1>
          <p>{t('galleryIntro')}</p>
        </div>
      </section>
      <section className="section gallery-media-section" aria-label={t('gallery')}>
        <GalleryMedia />
      </section>
      <AdmissionsCTA />
    </>
  );
}
