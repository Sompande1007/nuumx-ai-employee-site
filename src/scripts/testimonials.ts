/**
 * Testimonials: a concave ring of cards that turns continuously, like a looping video.
 *
 * One number drives everything: `pos`, the ring position measured in cards. Each frame, every card's angle on the ring,
 * depth and fade come from it (a concave ring, so neighbours come slightly closer as they turn toward you); far cards
 * fade out and are hidden. Phones get a flat row that drifts the same way. Speed eases toward a target, so hovering,
 * focusing the ribbon or scrolling it off screen glides it to a stop rather than freezing it (Motion's slow-on-hover
 * ticker). Drag or flick moves it and it settles on the nearest card; arrow keys move one card at a time.
 * Every card takes the height of the tallest card, and on short laptop screens the ribbon scales down a little so the
 * whole section fits on one screen. Reduced motion: no automatic turning; drag and the arrow keys still work.
 */
import { gsap, prefersReducedMotion } from './motion/scroll';

const HEADER = 72;   // the site's fixed header
const GAP = 18;      // space between neighbouring cards, in px

export function startTestimonials() {
  const section = document.getElementById('testimonials');
  const stage = document.getElementById('tsStage');
  if (!section || !stage) return;
  const rib = stage.querySelector<HTMLElement>('.ts-rib')!;
  const cards = Array.from(rib.querySelectorAll<HTMLElement>('.ts-card'));
  const pp = document.getElementById('tsPP') as HTMLButtonElement, hint = document.getElementById('tsHint')!;
  const n = cards.length;

  const geo = { phone: false, cw: 340, r: 575, step: 35, maxA: 84 };
  const measure = () => {
    const phone = innerWidth < 768;
    const cw = phone ? Math.min(300, innerWidth * 0.8) : Math.max(290, Math.min(340, innerWidth * 0.23));
    const room = phone ? 16 : 60; // headroom so the nearer side cards aren't clipped by the stage edge
    section.style.setProperty('--cw', `${cw}px`);
    section.style.setProperty('--chh', 'auto');
    const ch = Math.ceil(Math.max(...cards.map((c) => c.offsetHeight)));
    section.style.setProperty('--chh', `${ch}px`);
    let k = 1;
    if (!phone) {
      const head = section.querySelector<HTMLElement>('.ts-head')!.offsetHeight;
      const foot = section.querySelector<HTMLElement>('.ts-foot .ts-hint')!.offsetHeight + 8;
      k = Math.max(0.74, Math.min(1, (innerHeight - HEADER - head - 12 - foot) / (ch + room * 2)));
    }
    section.style.setProperty('--sh', `${Math.round((ch + room * 2) * k)}px`);
    section.style.setProperty('--rt', `${Math.round(room * k)}px`);
    rib.style.transform = k < 1 ? `scale(${k.toFixed(3)})` : '';
    const r = cw * 1.69;
    Object.assign(geo, { phone, cw, r, step: ((cw + GAP) / r) * (180 / Math.PI) });
    stage.style.perspective = phone ? 'none' : `${cw * 5.2}px`;
  };

  const wrap = (v: number) => ((((v % n) + n + n / 2) % n) - n / 2);
  let front = -1;
  const render = (pos: number) => {
    let best = Infinity, bi = 0;
    for (let j = 0; j < n; j++) {
      const off = wrap(j - pos), c = cards[j];
      if (Math.abs(off) < best) { best = Math.abs(off); bi = j; }
      if (geo.phone) {
        const show = Math.abs(off) <= 2;
        c.style.visibility = show ? 'visible' : 'hidden';
        if (show) { c.style.opacity = '1'; c.style.transform = `translateX(${(off * (geo.cw + 12)).toFixed(1)}px)`; }
        continue;
      }
      const a = off * geo.step;
      if (Math.abs(a) > geo.maxA) { c.style.visibility = 'hidden'; continue; }
      const rad = (a * Math.PI) / 180;
      c.style.visibility = 'visible';
      c.style.transform = `translateX(${(geo.r * Math.sin(rad)).toFixed(1)}px) translateZ(${(geo.r * (1 - Math.cos(rad))).toFixed(1)}px) rotateY(${(-a).toFixed(2)}deg)`;
      c.style.opacity = Math.max(0, 1 - Math.pow(Math.abs(a) / geo.maxA, 2.4)).toFixed(3);
    }
    if (bi !== front) { cards[front]?.classList.remove('is-front'); cards[bi].classList.add('is-front'); front = bi; }
  };

  const s = { pos: 0, vel: 0, base: 1 / 3, hover: false, paused: false, drag: false, onScreen: false, snap: null as number | null };
  const want = () => (prefersReducedMotion() || s.paused || s.hover || !s.onScreen || document.activeElement === stage ? 0 : s.base);
  const frame = (_t: number, dtMs: number) => {
    const dt = Math.min(0.05, dtMs / 1000);
    if (s.snap !== null) {
      s.pos += (s.snap - s.pos) * Math.min(1, dt * 7);
      if (Math.abs(s.snap - s.pos) < 0.002) { s.pos = s.snap; s.snap = null; }
    } else if (!s.drag) {
      const w = want();
      s.vel += (w - s.vel) * Math.min(1, dt * 4);
      if (w === 0 && Math.abs(s.vel) < 0.004) s.vel = 0;
      s.pos += s.vel * dt;
    }
    render(s.pos);
  };
  // run the ticker only while the section is on screen
  let ticking = false;
  new IntersectionObserver(([e]) => {
    s.onScreen = e.isIntersecting;
    if (e.isIntersecting && !ticking) { gsap.ticker.add(frame); ticking = true; }
    if (!e.isIntersecting && ticking) { gsap.ticker.remove(frame); ticking = false; }
  }, { threshold: 0 }).observe(stage);

  // hover (mouse only)
  stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') s.hover = true; });
  stage.addEventListener('pointerleave', () => { s.hover = false; });

  // drag / flick, then settle on the nearest card
  let x0 = 0, pos0 = 0, lastX = 0, lastT = 0, flick = 0, moved = false;
  stage.addEventListener('pointerdown', (e) => {
    s.drag = true; s.snap = null; moved = false; flick = 0;
    x0 = lastX = e.clientX; pos0 = s.pos; lastT = performance.now();
    stage.classList.add('is-drag');
    try { stage.setPointerCapture(e.pointerId); } catch { /* keep dragging without capture */ }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!s.drag) return;
    const pitch = geo.cw + GAP, now = performance.now();
    if (Math.abs(e.clientX - x0) > 4) moved = true;
    s.pos = pos0 - (e.clientX - x0) / pitch;
    flick = -(e.clientX - lastX) / pitch / Math.max(0.008, (now - lastT) / 1000);
    lastX = e.clientX; lastT = now;
  });
  const end = () => {
    if (!s.drag) return;
    s.drag = false; stage.classList.remove('is-drag');
    if (moved) { s.snap = Math.round(s.pos + Math.max(-2, Math.min(2, flick * 0.25))); s.vel = 0; }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  // keyboard: focusing the ribbon stops it on a card; arrows move one card
  stage.addEventListener('focus', () => { s.snap = Math.round(s.pos); });
  stage.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    s.snap = Math.round(s.snap ?? s.pos) + d;
  });

  pp.addEventListener('click', () => {
    s.paused = !s.paused;
    pp.textContent = s.paused ? 'Play' : 'Pause';
    pp.setAttribute('aria-pressed', String(s.paused));
  });
  const syncMotion = () => {
    const rm = prefersReducedMotion();
    pp.hidden = rm;
    const touch = matchMedia('(hover: none)').matches;
    hint.textContent = touch ? 'Swipe to explore' : rm ? 'Drag or use ← → to explore' : 'Hover to pause · drag to explore';
  };
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncMotion);
  syncMotion();

  let rT = 0;
  addEventListener('resize', () => { clearTimeout(rT); rT = window.setTimeout(() => { measure(); render(s.pos); }, 120); });
  measure();
  render(0);
  document.fonts?.ready.then(() => { measure(); render(s.pos); });
}
