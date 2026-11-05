import { useEffect, useRef, useState } from 'react';
import { BookOpen, Building2, BusFront, GraduationCap, LibraryBig, School, Sprout, Trophy, UsersRound } from 'lucide-react';
import { SectionHeading } from './components';
import { useSite } from './context';

const milestones = [
  { year: 1994, label: 'journey1994', Icon: Sprout },
  { year: 2009, label: 'journey2009', Icon: School },
  { year: 2017, label: 'journey2017', Icon: GraduationCap },
];

const schoolHighlights = [
  { title: 'whyCurriculum', text: 'whyCurriculumText', Icon: BookOpen },
  { title: 'whyGrades', text: 'whyGradesText', Icon: GraduationCap },
  { title: 'whyLibrary', text: 'whyLibraryText', Icon: LibraryBig },
  { title: 'whyActivities', text: 'whyActivitiesText', Icon: Trophy },
  { title: 'whyTransport', text: 'whyTransportText', Icon: BusFront },
];

const schoolStats = [
  { value: 1994, label: 'statsAnnexe', Icon: GraduationCap },
  { value: 164, label: 'statsPupils', Icon: UsersRound },
  { value: 21, label: 'statsClassrooms', Icon: Building2 },
  { value: 5, label: 'statsCampus', Icon: Sprout },
];

export function SchoolStats() {
  const { t } = useSite();
  const grid = useRef(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !('IntersectionObserver' in window)) return;

    let frame;
    let start;
    function tick(timestamp) {
      start ??= timestamp;
      const elapsed = Math.min((timestamp - start) / 1000, 1);
      setProgress(1 - (1 - elapsed) ** 3);
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.25) return;
      observer.disconnect();
      setProgress(0);
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.25 });
    observer.observe(grid.current);

    function stop() {
      observer.disconnect();
      cancelAnimationFrame(frame);
    }
    function onMotionChange() {
      if (!motion.matches) return;
      stop();
      setProgress(null);
    }
    motion.addEventListener('change', onMotionChange);
    return () => {
      stop();
      motion.removeEventListener('change', onMotionChange);
    };
  }, []);

  return (
    <section className="school-stats-section" id="school-stats" aria-label={t('statsLabel')}>
      <ul className="container school-stats-grid" ref={grid} data-animated={progress !== null}>
        {schoolStats.map(({ value, label, Icon }) => (
          <li key={label} className="school-stat">
            <span className="school-stat-icon"><Icon size={22} aria-hidden="true" /></span>
            <strong className="school-stat-number">
              <span className="sr-only">{value}</span>
              <span aria-hidden="true">{Math.round(value * (progress ?? 1))}</span>
            </strong>
            <span className="school-stat-label">{t(label)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SchoolJourney() {
  const { t } = useSite();

  return (
    <section className="section journey-section" id="school-journey">
      <div className="container">
        <SectionHeading
          eyebrow={t('journeyTag')}
          title={<>{t('journeyTitle')} <em>{t('journeyAccent')}</em></>}
          text={t('journeyIntro')}
          icon={School}
        />
        <ol className="journey-grid">
          {milestones.map(({ year, label, Icon }) => (
            <li key={year}>
              <span className="journey-icon"><Icon size={25} aria-hidden="true" /></span>
              <time dateTime={String(year)}>{year}</time>
              <p>{t(label)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhyChooseSchool() {
  const { t } = useSite();

  return (
    <section className="section school-highlights" id="why-st-antonys">
      <div className="container highlights-panel">
        <SectionHeading
          eyebrow={t('whyTag')}
          title={<>{t('whyTitle')} <em>{t('whyAccent')}</em></>}
        />
        <ul className="highlights-grid">
          {schoolHighlights.map(({ title, text, Icon }) => (
            <li key={title}>
              <span className="highlight-icon"><Icon size={27} aria-hidden="true" /></span>
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
