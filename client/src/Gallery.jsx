import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Images, X, ZoomIn, ZoomOut } from 'lucide-react';
import { mediaUrl, useApi } from './api';
import { AdmissionsCTA, Pagination, ResponsiveImage, SectionHeading, Seo, StateBox, TextLink } from './components';
import { useSite } from './context';
import './school-sections.css';

const imageSource = media => media.url || mediaUrl(media.id);

export function ImageGrid({ images, gallery = false, carousel = false }) {
  const { pick, t, lang } = useSite();
  const [zoom, setZoom] = useState(false);
  const [active, setActive] = useState(-1);
  const [featured, setFeatured] = useState(0);
  const dialog = useRef(null);
  const selected = images[active]?.media;

  useEffect(() => {
    if (active >= 0 && !dialog.current.open) dialog.current.showModal();
  }, [active]);

  function move(step) {
    setZoom(false);
    setActive(index => (index + step + images.length) % images.length);
  }

  function navigate(event) {
    if (images.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  }

  function slide(step) { setFeatured(index => (index + step + images.length) % images.length); }

  return (
    <>
      <div className={carousel ? 'gallery-coverflow' : gallery ? 'image-grid gallery-photo-grid' : 'image-grid'}
        role={carousel ? 'region' : undefined} aria-roledescription={carousel ? 'carousel' : undefined}
        aria-label={carousel ? t('gallery') : undefined}
        onKeyDown={event => {
          if (!carousel || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault(); slide(event.key === 'ArrowRight' ? 1 : -1);
        }}>
        {images.map((item, index) => {
          let offset = (index - featured + images.length) % images.length;
          if (offset > images.length / 2) offset -= images.length;
          if (carousel && Math.abs(offset) > 2) return null;
          return (
          <button
            type="button"
            key={item.id}
            data-album={item.gallery?.slug}
            className={carousel ? 'gallery-slide' : undefined}
            style={carousel ? { '--offset': offset, '--distance': Math.abs(offset), zIndex: 3 - Math.abs(offset) } : undefined}
            tabIndex={carousel && offset !== 0 ? -1 : undefined}
            onClick={() => { if (carousel && offset !== 0) setFeatured(index); else { setZoom(false); setActive(index); } }}
            aria-label={`${carousel && offset !== 0 ? (lang === 'ta' ? 'படத்தைக் காட்டு' : 'Show photo') : t('galleryOpen')}: ${pick(item.media, 'alt')}`}
          >
            <ResponsiveImage src={imageSource(item.media)} srcSet={item.media.hasVariants ? `${imageSource(item.media)}?width=640 640w, ${imageSource(item.media)}?width=1200 1200w` : undefined} alt={pick(item.media, 'alt')} loading="lazy" decoding="async" width="600" height="450" sizes="(max-width: 440px) 100vw, (max-width: 800px) 50vw, 33vw" />
            {item.gallery?.isDemo && <small className="gallery-demo-label">{t(item.gallery.slug === 'illustrations' ? 'galleryIllustration' : 'demo')}</small>}
            <span aria-hidden="true"><ArrowUpRight size={23} /></span>
          </button>
        ); })}
      </div>
      {carousel && <div className="gallery-carousel-footer">
        <div className="gallery-caption" aria-live="polite"><span className="eyebrow">{pick(images[featured]?.gallery, 'title')}</span><p>{pick(images[featured]?.media, 'alt')}</p></div>
        <div className="gallery-carousel-controls">
          <button type="button" onClick={() => slide(-1)} disabled={images.length < 2} aria-label={t('previous')}><ChevronLeft size={20}/></button>
          <span>{featured + 1} / {images.length}</span>
          <button type="button" onClick={() => slide(1)} disabled={images.length < 2} aria-label={t('next')}><ChevronRight size={20}/></button>
        </div>
      </div>}
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
            <div className={`lightbox-zoom-viewport${zoom ? ' is-zoomed' : ''}`} tabIndex={0}><ResponsiveImage src={imageSource(selected)} alt={pick(selected, 'alt')} sizes="min(920px, 90vw)" /></div>
            <p>{pick(selected, 'alt')}</p>
            {selected.description && <p>{pick(selected, 'description')}</p>}
            {selected.eventDate && <p>{new Date(selected.eventDate).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { timeZone: 'Asia/Kolkata' })}</p>}
            <button type="button" aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? <ZoomOut/> : <ZoomIn/>}{lang === 'ta' ? 'பெரிதாக்கு' : 'Zoom'}</button>
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
  const [expanded, setExpanded] = useState(false);
  const [grid, setGrid] = useState(false);
  const path = `/gallery-media?limit=${preview ? 9 : 12}`;
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
        <div className="gallery-filter-bar">
        <div id={preview ? 'home-gallery-albums' : 'gallery-albums'} className={`gallery-filters${expanded ? ' is-expanded' : ''}`} role="group" aria-label={t('galleryFilter')}>
          <button type="button" aria-pressed={!category} onClick={() => selectCategory('')}>
            {t('galleryAll')} <span>{count.format(all.data.allCount)}</span>
          </button>
          {all.data.categories.map(album => (
            <button type="button" key={album.slug} aria-pressed={category === album.slug} onClick={() => selectCategory(album.slug)}>
              {pick(album, 'title')} <span>{count.format(album.count)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="gallery-expand" aria-expanded={expanded} aria-controls={preview ? 'home-gallery-albums' : 'gallery-albums'} onClick={() => setExpanded(value => !value)}>{lang === 'ta' ? (expanded ? 'சுருக்கு' : 'அனைத்து ஆல்பங்கள்') : (expanded ? 'Show less' : 'All albums')}</button>
        </div>
      )}
      <div aria-busy={results.loading}>
        <StateBox {...results} empty={results.data?.items.length === 0} />
        {!results.loading && results.data?.items.length > 0 && <ImageGrid key={`${category}:${page}`} images={results.data.items} gallery carousel={!grid} />}
        {!preview && results.data?.items.length > 0 && <div className="gallery-view-switch"><button type="button" className="gallery-expand" aria-pressed={grid} onClick={() => setGrid(value => !value)}>{lang === 'ta' ? (grid ? 'படத் தொகுப்பைக் காட்டு' : 'அனைத்துப் படங்களைக் காட்டு') : (grid ? 'Carousel view' : 'View all photos')}</button></div>}
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
