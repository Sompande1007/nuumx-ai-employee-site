/**
 * The site's single scroll engine. Every section imports gsap and ScrollTrigger from here,
 * so there is one Lenis instance and one animation clock for the whole page.
 *
 * Lenis smooths the native scroll; GSAP's ticker drives Lenis, and Lenis tells ScrollTrigger
 * whenever the page moves. Reduced motion: Lenis stops smoothing (scroll tracks input 1:1)
 * and sections fall back to their static states.
 *
 * Other code can pause scrolling (for example while a dialog is open) by dispatching
 * `nx:scroll-lock` and resume with `nx:scroll-unlock` on window.
 */
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const HEADER_OFFSET = 88;

export const lenis = new Lenis({
  lerp: 0.1,
  anchors: { offset: -HEADER_OFFSET },
  stopInertiaOnNavigate: true,
  respectReducedMotion: true
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

addEventListener('nx:scroll-lock', () => lenis.stop());
addEventListener('nx:scroll-unlock', () => lenis.start());

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger };
