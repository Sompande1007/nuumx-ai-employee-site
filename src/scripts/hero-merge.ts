/**
 * Hero merge, driven by the shared GSAP + Lenis engine.
 * Desktop: the hero is pinned with CSS sticky, and ScrollTrigger scrubs the merge across the tall track.
 * Phones: plays once when the stage comes into view.
 * Reduced motion: jumps between the "five apps" and "one window" states with no animation in between.
 * Only transform and opacity are animated, and frames are drawn only while the hero is on screen.
 */
import { gsap, ScrollTrigger } from './motion/scroll';

type Pose = { x: number; y: number; z: number; ry: number; rx: number };

const FROM_DESKTOP: Pose[] = [
  { x: -405, y: -62, z: -140, ry: 24, rx: 3 },
  { x: -215, y: 96, z: 70, ry: 12, rx: -3 },
  { x: 0, y: -96, z: -280, ry: 0, rx: 6 },
  { x: 215, y: 96, z: 70, ry: -12, rx: -3 },
  { x: 405, y: -62, z: -140, ry: -24, rx: 3 }
];
const FROM_PHONE: (Pose | null)[] = [
  { x: -34, y: -150, z: -60, ry: 8, rx: 3 },
  null,
  { x: 28, y: 2, z: 0, ry: -6, rx: 0 },
  null,
  { x: -22, y: 150, z: -40, ry: 6, rx: -3 }
];

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
const seg = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

function drawWaves(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-wave]').forEach((el) => {
    const n = Number(el.dataset.wave), seed = Number(el.dataset.seed || 1);
    let html = '';
    for (let i = 0; i < n; i++) {
      const h = 20 + Math.abs(Math.sin(i * 1.3 + seed) * 60 + Math.sin(i * 0.45 + seed) * 20);
      html += `<i style="height:${Math.min(100, h).toFixed(0)}%"></i>`;
    }
    el.innerHTML = html;
  });
}

export function startHeroMerge() {
  const track = document.getElementById('heroTrack');
  const hero = document.getElementById('hero');
  const stage = document.getElementById('stage');
  const scene = document.getElementById('scene');
  const one = document.getElementById('one');
  if (!track || !hero || !stage || !scene || !one) return;

  drawWaves(scene);
  const wins = [0, 1, 2, 3, 4].map((i) => scene.querySelector<HTMLElement>('.w' + i));
  const hover = matchMedia('(hover: hover)');

  const state = { p: 0 };
  let poses: (Pose | null)[] = FROM_DESKTOP;
  let isPhone = false, isReduced = false;
  let tx = 0, ty = 0;
  let pointer: { x: number; y: number } | null = null;

  const fit = () => {
    const sw = isPhone ? 470 : 1240, sh = isPhone ? 560 : 640;
    const w = stage.clientWidth, h = stage.clientHeight || sh;
    scene.style.setProperty('--k', Math.min(isPhone ? 1 : 1.08, w / sw, h / sh).toFixed(3));
  };

  const render = (ms: number) => {
    const p = state.p;
    const m = ease(seg(p, 0.08, 0.78)), bob = (1 - m) * (isReduced ? 0 : 1);
    wins.forEach((w, i) => {
      const f = poses[i];
      if (!w || !f) return;
      const k = 1 - m, by = Math.sin(ms / 1900 + i * 1.3) * 6 * bob;
      w.style.transform = `translate3d(${(f.x * k).toFixed(1)}px,${(f.y * k + by).toFixed(1)}px,${(f.z * k - 60 * m).toFixed(1)}px) rotateY(${(f.ry * k).toFixed(2)}deg) rotateX(${(f.rx * k).toFixed(2)}deg) scale(${(1 - 0.08 * m).toFixed(3)})`;
      w.style.opacity = (1 - seg(p, 0.5, 0.8)).toFixed(3);
      w.style.setProperty('--sx', `${(135 - m * 150 - i * 6).toFixed(1)}%`);
    });
    const o = ease(seg(p, 0.55, 0.92));
    if (pointer && o > 0.9 && hover.matches && !isPhone && !isReduced) {
      tx += ((pointer.x - 0.5) * 7 - tx) * 0.06;
      ty += ((0.5 - pointer.y) * 5 - ty) * 0.06;
    } else { tx -= tx * 0.06; ty -= ty * 0.06; }
    one.style.opacity = o.toFixed(3);
    one.style.transform = `translate3d(0,${(30 * (1 - o)).toFixed(1)}px,${(-120 * (1 - o)).toFixed(1)}px) rotateX(${(10 * (1 - o) + ty).toFixed(2)}deg) rotateY(${tx.toFixed(2)}deg) scale(${(0.9 + 0.1 * o).toFixed(3)})`;
    one.style.setProperty('--sx', `${(140 - o * 120 + tx * 4).toFixed(1)}%`);
    one.classList.toggle('done', p > 0.95);
    hero.style.setProperty('--p', ease(seg(p, 0.3, 0.85)).toFixed(3));
  };
  const frame = (time: number) => render(time * 1000);
  let ticking = false;
  const play = () => { if (!ticking) { gsap.ticker.add(frame); ticking = true; } };
  const pause = () => { if (ticking) { gsap.ticker.remove(frame); ticking = false; } };

  // Each breakpoint gets its own triggers; gsap.matchMedia reverts them automatically when it stops matching.
  const mm = gsap.matchMedia();
  mm.add(
    { desktop: '(min-width: 768px)', phone: '(max-width: 767px)', reduce: '(prefers-reduced-motion: reduce)' },
    (ctx) => {
      const { phone, reduce } = ctx.conditions as { desktop: boolean; phone: boolean; reduce: boolean };
      isPhone = phone; isReduced = reduce;
      poses = phone ? FROM_PHONE : FROM_DESKTOP;
      state.p = 0;
      fit();

      if (!phone && reduce) {
        ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { state.p = self.progress > 0.5 ? 1 : 0; } });
      } else if (!phone) {
        gsap.to(state, { p: 1, ease: 'none', scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
      } else {
        ScrollTrigger.create({
          trigger: stage, start: 'top 75%', once: true,
          onEnter: () => (reduce ? (state.p = 1) : gsap.to(state, { p: 1, duration: 3.4, delay: 0.6, ease: 'none' }))
        });
      }

      // Draw only while the hero is on screen.
      ScrollTrigger.create({
        trigger: track, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => (self.isActive ? play() : pause())
      });
      play();
      return pause;
    }
  );

  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    pointer = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  });
  stage.addEventListener('pointerleave', () => { pointer = null; });
  addEventListener('resize', fit);
  render(0);
}
