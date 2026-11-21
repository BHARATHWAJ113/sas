import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { ResponsiveImage } from './components';
import { useSite } from './context';

const schoolVideo = import.meta.env.VITE_HOME_VIDEO?.trim();
const videoSource = schoolVideo;

export function HeroVideo() {
  const { t } = useSite();
  const video = useRef(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pauseForReducedMotion = event => { if (event.matches) player.pause(); };
    if (!motion.matches && !navigator.connection?.saveData) {
      player.play().catch(() => { /* The play button remains available when autoplay is blocked. */ });
    }
    motion.addEventListener('change', pauseForReducedMotion);
    return () => {
      motion.removeEventListener('change', pauseForReducedMotion);
      player.pause();
    };
  }, []);

  async function togglePlayback() {
    const player = video.current;
    if (!player.paused) {
      player.pause();
      return;
    }
    try {
      await player.play();
    } catch (error) {
      if (error.name !== 'AbortError') setFailed(true);
    }
  }

  return (
    <>
      <ResponsiveImage className="hero-image" sizes="100vw" src="/api/assets/images/campus-students.webp" alt="" width="1800" height="1400" fetchPriority="high" />
      {schoolVideo && <video
        ref={video}
        className={`hero-video${started && !failed ? ' is-visible' : ''}`}
        src={videoSource}
        width="1280"
        height="720"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        onPlaying={() => { setStarted(true); setPlaying(true); }}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />}
      <div className="hero-shade" />
      <div className="hero-video-tools">
        <span>{t(started && !failed ? 'heroSchoolVideo' : 'campusPhotos')}</span>
        {schoolVideo && !failed && (
          <button type="button" onClick={togglePlayback} aria-label={t(playing ? 'pauseVideo' : 'playVideo')}>
            {playing ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          </button>
        )}
      </div>
    </>
  );
}
