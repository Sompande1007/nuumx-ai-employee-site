/**
 * Closing sections: the final call to action rises in once, and the FAQ's native <details> open and close smoothly
 * (height eased with GSAP; without JavaScript they still open and close, just instantly). Reduced motion: no motion.
 */
import { gsap, prefersReducedMotion } from './motion/scroll';

export function startClosing() {
  const panel = document.querySelector('.fc-panel');
  if (panel && !prefersReducedMotion()) {
    gsap.from(panel.querySelectorAll('.fc-eyebrow, h2, .fc-lede, .fc-actions, .fc-wa, .fc-facts'), {
      autoAlpha: 0, y: 24, duration: 0.9, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: panel, start: 'top 78%', once: true }
    });
  }

  document.querySelectorAll<HTMLDetailsElement>('.faq-item').forEach((d) => {
    const summary = d.querySelector('summary')!, body = d.querySelector<HTMLElement>('.faq-a')!;
    summary.addEventListener('click', (e) => {
      if (prefersReducedMotion()) return;
      e.preventDefault();
      gsap.killTweensOf(body);
      if (d.open) {
        gsap.to(body, { height: 0, duration: 0.35, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height' }); } });
        d.classList.remove('is-open');
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.5, ease: 'expo.out', clearProps: 'height' });
        gsap.fromTo(body.firstElementChild, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out', delay: 0.05 });
      }
    });
  });
}
