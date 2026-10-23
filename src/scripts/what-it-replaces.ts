/**
 * What it replaces: the comparison rows rise in once as the table scrolls into view; each With Riya cell lands a
 * beat after its Today cell. Reduced motion: shown at rest.
 */
import { gsap, prefersReducedMotion } from './motion/scroll';

export function startWhatItReplaces() {
  const table = document.querySelector<HTMLElement>('.wr-spec');
  if (!table || prefersReducedMotion()) return;
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const tl = gsap.timeline({ scrollTrigger: { trigger: table, start: 'top 78%', once: true } });
  rows.forEach((r, i) => {
    tl.from(r.querySelectorAll('th, .wr-t'), { autoAlpha: 0, y: 18, duration: 0.7, ease: 'expo.out' }, i * 0.08)
      .from(r.querySelector('.wr-r'), { autoAlpha: 0, y: 18, duration: 0.8, ease: 'expo.out' }, i * 0.08 + 0.12);
  });
}
