/**
 * "It frees them": the calendar defrag. Plays once when the board scrolls into view.
 *
 * A soft mist band sweeps across the visible days. Each busywork block it reaches lights up, lifts out and flies into
 * Riya's panel, landing on its task row, which glows and counts up (as does the weekly total). Blocks in days hidden on
 * phones still count. Then .is-free swaps the week to "The same week, with Riya", the white blocks of selling time grow
 * in, "It frees them." whitens and the summary appears. Reduced motion: the final state straight away.
 */
import { gsap, prefersReducedMotion } from './motion/scroll';

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

  const play = () => {
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
    const tl = gsap.timeline();
    tl.set(sweep, { opacity: 1, left: cols[0].offsetLeft - 10, width: cols[0].offsetWidth + 20 });
    cols.forEach((col, ci) => {
      const at = 0.35 + ci * STEP;
      if (ci) tl.to(sweep, { left: col.offsetLeft - 10, duration: 0.5, ease: 'power2.inOut' }, at - 0.3);
      Array.from(col.querySelectorAll<HTMLElement>('.fr-busy')).forEach((b, bi) => {
        const t = b.dataset.t!, row = rows.get(t)!, at2 = at + bi * 0.08;
        tl.to(b, { scale: 1.04, backgroundColor: 'rgba(140,154,200,.35)', borderColor: 'rgba(160,172,214,.6)', duration: 0.18, ease: 'power2.out' }, at2)
          .to(b, {
            x: () => { const a = b.getBoundingClientRect(), r = row.getBoundingClientRect(); return r.left + r.width * 0.55 - (a.left + a.width / 2) + (gsap.getProperty(b, 'x') as number); },
            y: () => { const a = b.getBoundingClientRect(), r = row.getBoundingClientRect(); return r.top + r.height / 2 - (a.top + a.height / 2) + (gsap.getProperty(b, 'y') as number); },
            scale: 0.35, autoAlpha: 0, duration: 0.75, ease: 'power3.inOut'
          }, at2 + 0.16)
          .add(() => bump(t), at2 + 0.85);
      });
    });
    const end = 0.35 + cols.length * STEP + 0.6;
    tl.to(sweep, { opacity: 0, duration: 0.4 }, end - 0.3)
      .add(() => {
        // days hidden on phones still count
        grid.querySelectorAll<HTMLElement>('.fr-col').forEach((c) => { if (!c.offsetParent) c.querySelectorAll<HTMLElement>('.fr-busy').forEach((b) => bump(b.dataset.t!)); });
        wt.textContent = wt.dataset.after!;
        ws.textContent = ws.dataset.after!;
        fr.classList.add('is-free');
        gsap.from(fr.querySelectorAll('.fr-col:not([style*="none"]) .fr-human'), { scaleY: 0, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.09 });
      }, end);
  };

  gsap.timeline({ scrollTrigger: { trigger: board, start: 'top 70%', once: true, onEnter: play } });
}
