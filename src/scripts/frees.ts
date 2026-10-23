/**
 * "It frees them": once the stage scrolls into view, the busywork chips are pulled into Riya's glow one by one
 * (shrinking and blurring, the glow pulsing as each arrives), then .is-free lights up the team and the summary.
 * Plays once. Reduced motion: the final state straight away.
 */
import { gsap, prefersReducedMotion } from './motion/scroll';

export function startFrees() {
  const fr = document.getElementById('frees');
  if (!fr) return;
  const core = fr.querySelector<HTMLElement>('.fr-core')!, rings = fr.querySelectorAll('.fr-ring');
  const busy = Array.from(fr.querySelectorAll<HTMLElement>('.fr-busy'));

  if (prefersReducedMotion()) {
    gsap.set(busy, { autoAlpha: 0 });
    fr.classList.add('is-free');
    return;
  }

  const toCore = (c: HTMLElement, axis: 'x' | 'y') => () => {
    const a = c.getBoundingClientRect(), b = core.getBoundingClientRect();
    return axis === 'x' ? b.left + b.width / 2 - (a.left + a.width / 2) : b.top + b.height / 2 - (a.top + a.height / 2);
  };
  const tl = gsap.timeline({ paused: true, delay: 0.3 });
  busy.forEach((c, i) => {
    tl.to(c, { x: toCore(c, 'x'), y: toCore(c, 'y'), scale: 0.2, autoAlpha: 0, filter: 'blur(3px)', duration: 0.9, ease: 'power3.in' }, i * 0.32)
      .fromTo(core, { scale: 1 }, { scale: 1.18, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 }, i * 0.32 + 0.75);
  });
  tl.to(rings, { scale: 1.12, autoAlpha: 0.2, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, '>-0.1')
    .add(() => fr.classList.add('is-free'), '<');

  gsap.timeline({ scrollTrigger: { trigger: fr.querySelector('.fr-stage'), start: 'top 70%', once: true, onEnter: () => tl.play(0) } });
}
