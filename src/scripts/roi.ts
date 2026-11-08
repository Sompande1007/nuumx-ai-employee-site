/**
 * ROI calculator: the sliders feed the reference page's maths, and the receipt's numbers glide to their new values
 * (a short GSAP tween on a plain number, so dragging fast never queues animations). The plan badge gives a small bump
 * when the recommended plan changes. "How we calculate this" opens the maths under the section.
 * Phones and small tablets: a dark dock pinned to the bottom shows the net gain while the sliders are on screen and the
 * receipt's own net-gain figure isn't. It hides the site's quick-actions bar meanwhile (html.roi-docked), and its button
 * scrolls to the receipt.
 * The section rises in once. Reduced motion: numbers change instantly and there is no entrance.
 */
import { gsap, lenis, prefersReducedMotion, HEADER_OFFSET } from './motion/scroll';
import { ROI_MATHS as M } from '../data/roi';

type Fmt = 'num' | 'pct' | 'inr' | 'min';
const num = (n: number) => Math.round(n).toLocaleString('en-IN');
const inr = (n: number) => {
  const neg = n < 0;
  n = Math.abs(Math.round(n));
  const s = n >= 1e7 ? `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr`
    : n >= 1e5 ? `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')} lakh` : `₹${n.toLocaleString('en-IN')}`;
  return (neg ? '− ' : '') + s;
};
const show: Record<Fmt, (v: number) => string> = { num, pct: (v) => `${v}%`, inr, min: (v) => `${v} min` };

export function startRoi() {
  const root = document.getElementById('roi');
  if (!root) return;
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[type=range]'));
  const v: Record<string, number> = {};
  const outs = (k: string) => root.querySelectorAll<HTMLElement>(`[data-r="${k}"]`);
  const put = (k: string, t: string) => outs(k).forEach((e) => { e.textContent = t; });

  const calc = () => {
    const rev = v.leads * (v.missed / 100) * (v.conv / 100) * M.recoveredShare * v.deal;
    const hours = (v.leads * v.mins / 60) * M.takeover;
    const staff = hours / M.fteHours * v.sal;
    const plan = M.plans.find((p) => v.leads <= p.upTo)!;
    const extra = 'perExtraMin' in plan ? Math.max(0, v.leads * M.callMinPerEnquiry - plan.includedMin) * plan.perExtraMin : 0;
    const cost = plan.fee + extra, gain = rev + staff, net = gain - cost;
    const days = Math.max(1, Math.ceil(M.setup / (net / 30)));
    return { rev, staff, hours, plan: plan.name, cost, net, roi: gain / cost, payback: net > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : 'over a month' };
  };

  // money figures glide from their last value; text-only figures just swap
  const shown: Record<string, { n: number }> = {};
  const glide = (k: string, to: number) => {
    const o = (shown[k] ??= { n: to });
    gsap.killTweensOf(o);
    if (prefersReducedMotion()) { o.n = to; put(k, inr(to)); return; }
    gsap.to(o, { n: to, duration: 0.42, ease: 'power3.out', onUpdate: () => put(k, inr(o.n)) });
  };

  const badge = root.querySelector<HTMLElement>('[data-r="plan"]')!;
  let lastPlan = '';
  const render = (first = false) => {
    inputs.forEach((r) => {
      v[r.dataset.key!] = parseFloat(r.value);
      r.style.setProperty('--p', `${((+r.value - +r.min) / (+r.max - +r.min)) * 100}%`);
      root.querySelector(`[data-out="${r.dataset.key}"]`)!.textContent = show[r.dataset.fmt as Fmt](+r.value);
    });
    const R = calc();
    put('plan', `${R.plan} plan`);
    put('planRow', `${R.plan} plan`);
    if (lastPlan && lastPlan !== R.plan && !prefersReducedMotion()) {
      gsap.fromTo(badge, { scale: 1.1 }, { scale: 1, duration: 0.5, ease: 'back.out(2)', overwrite: true });
    }
    lastPlan = R.plan;
    if (first) { [['rev', R.rev], ['staff', R.staff], ['cost', -R.cost], ['net', R.net]].forEach(([k, n]) => { shown[k as string] = { n: n as number }; put(k as string, inr(n as number)); }); }
    else { glide('rev', R.rev); glide('staff', R.staff); glide('cost', -R.cost); glide('net', R.net); }
    put('roi', `${R.roi.toFixed(1)}×`);
    put('payback', R.payback);
    put('hours', `${num(R.hours)} hrs`);
  };
  inputs.forEach((r) => r.addEventListener('input', () => render()));
  render(true);

  // the maths
  const how = root.querySelector<HTMLButtonElement>('.roi-how')!, box = root.querySelector<HTMLElement>('.roi-calc')!;
  how.addEventListener('click', () => {
    const open = !box.classList.contains('is-open');
    box.classList.toggle('is-open', open);
    how.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => {
      const r = box.getBoundingClientRect();
      if (r.bottom > innerHeight) lenis.scrollTo(box, { offset: -HEADER_OFFSET, immediate: prefersReducedMotion() });
    }, 300);
  });

  // phone dock
  const dock = root.querySelector<HTMLElement>('.roi-dock')!, rc = root.querySelector<HTMLElement>('.roi-rc')!;
  let insIn = false, netIn = false;
  const sync = () => {
    const on = insIn && !netIn && matchMedia('(max-width: 899px)').matches;
    dock.classList.toggle('is-on', on);
    document.documentElement.classList.toggle('roi-docked', on);
  };
  new IntersectionObserver(([e]) => { insIn = e.isIntersecting; sync(); }, { rootMargin: '-20% 0px -20% 0px' }).observe(root.querySelector('.roi-ins')!);
  new IntersectionObserver(([e]) => { netIn = e.isIntersecting; sync(); }, { threshold: 0.6 }).observe(root.querySelector('.roi-net')!);
  addEventListener('resize', sync);
  dock.querySelector('button')!.addEventListener('click', () => lenis.scrollTo(rc, { offset: -HEADER_OFFSET, immediate: prefersReducedMotion() }));

  // entrance, once
  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean };
    if (reduce) return;
    const st = { trigger: root, start: 'top 72%', once: true };
    const head = root.querySelectorAll('.roi-eyebrow, .roi-head h2, .roi-head p');
    const rows = root.querySelectorAll('.roi-ins > .roi-sl, .roi-more');
    const tl = gsap.timeline({ scrollTrigger: st })
      .from(head, { autoAlpha: 0, y: 24, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
      .from(rows, { autoAlpha: 0, y: 24, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, 0.2);
    if (desktop) tl.from(rc, { autoAlpha: 0, y: 40, duration: 1, ease: 'expo.out' }, 0.3);
    else gsap.from(rc, { autoAlpha: 0, y: 30, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: rc, start: 'top 85%', once: true } });
  });
}
