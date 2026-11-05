import { useEffect, useRef } from 'react';

const targets = [
  '.quick-grid > a', '.section-heading', '.journey-grid > li', '.welcome-photo',
  '.welcome-copy', '.vision-grid > div', '.academic-card', '.highlights-grid > li',
  '.photo-card', '.activity-card', '.life-photo', '.update-card', '.event-card',
  '.gallery-photo-grid > button', '.leadership-card', '.diary-list > li',
  '.achievement-panel', '.admission-cta > .container', '.contact-detail', '.map-panel',
].join(', ');

export function useScrollReveal() {
  const content = useRef(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const root = content.current;
    const observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting || !root.contains(target)) continue;
        target.setAttribute('data-scroll-revealed', '');
        observer.unobserve(target);
      }
    }, { rootMargin: '0px 0px -5% 0px' });

    function visitTargets(node, visit) {
      if (!(node instanceof Element)) return;
      if (node.matches(targets)) visit(node);
      node.querySelectorAll(targets).forEach(visit);
    }

    function observe(target) {
      if (!target.hasAttribute('data-scroll-revealed')) observer.observe(target);
    }

    visitTargets(root, observe);
    const changes = new MutationObserver(records => {
      for (const { addedNodes, removedNodes } of records) {
        removedNodes.forEach(node => visitTargets(node, target => observer.unobserve(target)));
        addedNodes.forEach(node => visitTargets(node, observe));
      }
    });
    changes.observe(root, { childList: true, subtree: true });

    return () => {
      changes.disconnect();
      observer.disconnect();
    };
  }, []);

  return content;
}
