import { useRef } from 'react';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';

export default function SchoolCharacters({ watchingPassword, revealed, focused }) {
  const scene = useRef(null);
  function look(event) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = scene.current.getBoundingClientRect();
    scene.current.style.setProperty('--look-x', `${Math.max(-5, Math.min(5, (event.clientX - rect.left - rect.width / 2) / 45))}px`);
    scene.current.style.setProperty('--look-y', `${Math.max(-3, Math.min(3, (event.clientY - rect.top - rect.height / 2) / 50))}px`);
  }
  return <div ref={scene} className={`school-characters${watchingPassword || revealed ? ' eyes-away' : ''}${focused ? ' is-attentive' : ''}`} onPointerMove={look} onPointerLeave={() => { scene.current.style.setProperty('--look-x', '0px'); scene.current.style.setProperty('--look-y', '0px'); }} aria-hidden="true">
    <span className="scene-star star-one"><Sparkles size={28}/></span><span className="scene-star star-two">✦</span>
    <div className="character character-book"><GraduationCap className="character-cap" size={90}/><div className="character-eyes"><i/><i/></div><span className="character-smile"/><BookOpen className="book-mark" size={40}/><span className="book-spine"/></div>
    <div className="character character-pencil"><span className="pencil-tip"/><div className="character-eyes"><i/><i/></div><span className="character-smile"/></div>
    <div className="character character-bag"><span className="bag-handle"/><div className="character-eyes"><i/><i/></div><span className="character-smile"/><span className="bag-pocket"/></div>
    <div className="scene-floor"/>
  </div>;
}
