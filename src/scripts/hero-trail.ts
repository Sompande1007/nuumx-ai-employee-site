/**
 * Hero cursor trail: "the apps fall away".
 * As the mouse moves over the hero, small tiles with the five tool icons (chat, call, WhatsApp, email, CRM)
 * pop off the cursor and drop out of view under gravity (GSAP Physics2DPlugin).
 *
 * Desktop mouse only, never with reduced motion. The tiles pass behind the headline and buttons, nothing
 * spawns over them, and the trail stops once the windows start merging into the nuumx window.
 * A fixed pool of tiles is reused, so moving the mouse creates no new elements.
 */
import { gsap, ScrollTrigger } from './motion/scroll';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';

gsap.registerPlugin(Physics2DPlugin);

const POOL = 15;          // tiles in rotation (3 of each icon)
const SPACING = 58;       // px of mouse travel between tiles
const MAX_PER_MOVE = 3;   // cap for very fast flicks
const STOP_AT = 0.4;      // merge progress after which no new tiles appear

export function startHeroTrail() {
  const track = document.getElementById('heroTrack');
  const hero = document.getElementById('hero');
  const trail = document.getElementById('trail');
  if (!track || !hero || !trail) return;

  const sources = Array.from(trail.querySelectorAll<HTMLElement>('.drop'));
  if (!sources.length) return;
  const tiles: HTMLElement[] = [];
  for (let i = 0; i < POOL; i++) {
    const tile = i < sources.length ? sources[i] : (sources[i % sources.length].cloneNode(true) as HTMLElement);
    if (!tile.isConnected) trail.appendChild(tile);
    tiles.push(tile);
  }
  gsap.set(tiles, { xPercent: -50, yPercent: -50, opacity: 0 });

  const R = gsap.utils.random;
  const clampV = gsap.utils.clamp(-2200, 2200);
  let next = 0, travel = 0, live = true;
  let last: { x: number; y: number; t: number } | null = null;

  const drop = (x: number, y: number, vx: number, vy: number) => {
    const el = tiles[next];
    next = (next + 1) % tiles.length;
    gsap.killTweensOf(el);
    gsap.set(el, { x, y, rotation: R(-10, 10), opacity: 0, scale: 0.5 });
    gsap.to(el, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' });
    // Start with a share of the mouse's own velocity plus a small upward pop, then let gravity take over.
    const ix = vx * 0.14 + R(-50, 50), iy = vy * 0.14 - R(60, 150);
    gsap.to(el, {
      duration: 1.8, ease: 'none',
      physics2D: { velocity: Math.hypot(ix, iy), angle: (Math.atan2(iy, ix) * 180) / Math.PI, gravity: 900 },
      rotation: `+=${R(-90, 90)}`
    });
    gsap.to(el, { opacity: 0, duration: 0.5, delay: 1.2, ease: 'power1.in' });
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    const prev = last;
    last = { x, y, t: now };
    if (!prev || !live) return;
    // Keep the headline and buttons clean.
    if ((e.target as Element).closest?.('.hero-head')) { travel = 0; return; }

    const dt = Math.max(8, now - prev.t);
    const vx = clampV(((x - prev.x) / dt) * 1000), vy = clampV(((y - prev.y) / dt) * 1000);
    travel += Math.hypot(x - prev.x, y - prev.y);
    let n = 0;
    while (travel >= SPACING && n < MAX_PER_MOVE) { travel -= SPACING; n++; drop(x, y, vx, vy); }
    if (n === MAX_PER_MOVE) travel = 0;
  };
  const onLeave = () => { last = null; travel = 0; };

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    ScrollTrigger.create({
      trigger: track, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { live = self.progress < STOP_AT; }
    });
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(tiles);
      gsap.set(tiles, { opacity: 0 });
      onLeave();
    };
  });
}
