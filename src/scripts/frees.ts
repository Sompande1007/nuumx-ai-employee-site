/**
 * "It frees them": the calendar defrag. Plays every time the board comes on screen: once it has scrolled fully out of
 * view (either way), the week quietly resets to its busy "before" state, ready to play again on the way back.
 *
 * A soft mist band sweeps across the visible days. Each busywork block it reaches lights up, lifts out and flies into
 * Nia's panel, landing on its task row, which glows and counts up (as does the weekly total). Blocks in days hidden on
 * phones still count. Then .is-free swaps the week to "The same week, with Nia", the white blocks of selling time grow
 * in, "It frees them to close deals." whitens and the summary appears. Reduced motion: the final state straight away.
 */
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion/scroll';

export function startFrees() {
  const fr = document.getElementById('frees');
  if (!fr) return;
  const board = fr.querySelector<HTMLElement>('.fr-board')!;
  const grid = fr.querySelector<HTMLElement>('.fr-grid')!, sweep = fr.querySelector<HTMLElement>('.fr-sweep')!;
  const rows = new Map(Array.from(fr.querySelectorAll<HTMLElement>('.fr-task')).map((r) => [r.dataset.t!, r]));
  const total = fr.querySelector<HTMLElement>('.fr-tot')!;
  const wt = fr.querySelector<HTMLElement>('.fr-wt')!, ws = fr.querySelector<HTMLElement>('.fr-ws')!;

  const finish = () => {
    rows.forEach((r) => { r.classList.add('hit'); r.querySelector('.fr-n')!.textContent = r.dataset.n!; });
    total.textContent = total.dataset.n!;
    wt.textContent = wt.dataset.after!;
    ws.textContent = ws.dataset.after!;
    fr.classList.add('is-free');
  };
  if (prefersReducedMotion()) { finish(); return; }

  let tl: gsap.core.Timeline | null = null;
  /** Back to the busy week, with nothing counted. Only runs while the board is off screen. */
  const reset = () => {
    tl?.kill(); tl = null;
    const busy = fr.querySelectorAll<HTMLElement>('.fr-busy'), human = fr.querySelectorAll<HTMLElement>('.fr-human');
    gsap.killTweensOf([...busy, ...human, ...rows.values(), sweep]);
    // only what the animation itself sets: each block's place on the calendar (--s, --d) is an inline style too
    gsap.set([...busy, ...human, ...rows.values()], { clearProps: 'transform,opacity,visibility,backgroundColor,borderColor' });
    gsap.set(sweep, { clearProps: 'opacity,left,width' });
    rows.forEach((r) => { r.classList.remove('hit'); r.querySelector('.fr-n')!.textContent = '0'; });
    total.textContent = '0';
    wt.textContent = wt.dataset.before!;
    ws.textContent = ws.dataset.before!;
    fr.classList.remove('is-free');
  };

  const play = () => {
    reset();
    const counts: Record<string, number> = {};
    let n = 0;
    const bump = (t: string) => {
      counts[t] = (counts[t] || 0) + 1; n++;
      const r = rows.get(t)!;
      r.classList.add('hit');
      r.querySelector('.fr-n')!.textContent = String(counts[t]);
      total.textContent = String(n);
      gsap.fromTo(r, { scale: 1.03 }, { scale: 1, duration: 0.35, ease: 'power2.out' });
    };
    const cols = Array.from(grid.querySelectorAll<HTMLElement>('.fr-col')).filter((c) => c.offsetParent);
    const STEP = 0.75;
    const run = (tl = gsap.timeline());
    run.set(sweep, { opacity: 1, left: cols[0].offsetLeft - 10, width: cols[0].offsetWidth + 20 });
    cols.forEach((col, ci) => {
      const at = 0.35 + ci * STEP;
      if (ci) run.to(sweep, { left: col.offsetLeft - 10, duration: 0.5, ease: 'power2.inOut' }, at - 0.3);
      Array.from(col.querySelectorAll<HTMLElement>('.fr-busy')).forEach((b, bi) => {
        const t = b.dataset.t!, row = rows.get(t)!, at2 = at + bi * 0.08;
        run.to(b, { scale: 1.04, backgroundColor: 'rgba(140,154,200,.35)', borderColor: 'rgba(160,172,214,.6)', duration: 0.18, ease: 'power2.out' }, at2)
          .to(b, {
            x: () => { const a = b.getBoundingClientRect(), r = row.getBoundingClientRect(); return r.left + r.width * 0.55 - (a.left + a.width / 2) + (gsap.getProperty(b, 'x') as number); },
            y: () => { const a = b.getBoundingClientRect(), r = row.getBoundingClientRect(); return r.top + r.height / 2 - (a.top + a.height / 2) + (gsap.getProperty(b, 'y') as number); },
            scale: 0.35, autoAlpha: 0, duration: 0.75, ease: 'power3.inOut'
          }, at2 + 0.16)
          .add(() => bump(t), at2 + 0.85);
      });
    });
    const end = 0.35 + cols.length * STEP + 0.6;
    run.to(sweep, { opacity: 0, duration: 0.4 }, end - 0.3)
      .add(() => {
        // days hidden on phones still count
        grid.querySelectorAll<HTMLElement>('.fr-col').forEach((c) => { if (!c.offsetParent) c.querySelectorAll<HTMLElement>('.fr-busy').forEach((b) => bump(b.dataset.t!)); });
        wt.textContent = wt.dataset.after!;
        ws.textContent = ws.dataset.after!;
        fr.classList.add('is-free');
        gsap.from(fr.querySelectorAll('.fr-col:not([style*="none"]) .fr-human'), { scaleY: 0, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.09 });
      }, end);
  };

  // play on the way in from either direction; reset only once the board is completely off screen
  ScrollTrigger.create({ trigger: board, start: 'top 70%', end: 'bottom 30%', onEnter: play, onEnterBack: play });
  ScrollTrigger.create({ trigger: board, start: 'top bottom', end: 'bottom top', onLeave: reset, onLeaveBack: reset });
}
