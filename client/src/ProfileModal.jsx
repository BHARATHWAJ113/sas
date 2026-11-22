import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useSite } from './context';
import './profile-modal.css';

export default function ProfileModal({ title, image, children, onClose }) {
  const dialog = useRef(null);
  const { t } = useSite();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog className="profile-modal" ref={dialog} aria-labelledby="profile-modal-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <button type="button" className="profile-close" onClick={onClose} aria-label={t('close')} autoFocus><X size={20}/></button>
    <div className="profile-modal-photo"><img src={image} alt={title} width="400" height="400" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/api/assets/images/profile-placeholder.svg'; }}/></div>
    <div className="profile-modal-content"><h2 id="profile-modal-title">{title}</h2>{children}</div>
  </dialog>;
}
