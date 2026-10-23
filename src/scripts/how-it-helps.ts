/**
 * How it helps your business: a four-gain tab list with one glass panel, and an accordion on phones.
 *
 * Desktop: hovering a gain switches it after a 90 ms rest (so sweeping the mouse across the list doesn't flicker);
 * clicking, tapping and the arrow keys (Home, End too) switch it at once. One shared indicator (ink bar + arrow)
 * glides to the active row. The old text leaves fast, the new line and points arrive with a short stagger and a light
 * blur, and the ribs behind the glass drift a little, so the panel reads as one surface. All tweens are interruptible.
 * Phone: tapping a gain opens its glass panel and closes the other.
 * The section rises in once as it scrolls into view. Reduced motion: every change is instant and there is no entrance.
 */
import { gsap, prefersReducedMotion } from './motion/scroll';

export function startHowItHelps() {
  const root = document.getElementById('helps');
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.hb-tab'));
  const panes = Array.from(root.querySelectorAll<HTMLElement>('.hb-panel .hb-pane'));
  const ind = root.querySelector<HTMLElement>('.hb-ind')!, bar = ind.querySelector('i')!, knob = ind.querySelector('b')!;
  const ribs = root.querySelector<HTMLElement>('.hb-body .hb-ribs')!;
  const parts = (p: Element) => p.querySelectorAll('.hb-tag, .hb-line, li');
  let cur = 0;

  const place = (dur: number) => {
    gsap.to(ind, { y: tabs[cur].offsetTop, duration: prefersReducedMotion() ? 0 : dur, ease: 'power3.out', overwrite: true });
  };

  const show = (i: number) => {
    if (i === cur) return;
    const from = panes[cur], to = panes[i], dir = i > cur ? 1 : -1;
    tabs[cur].setAttribute('aria-selected', 'false');
    tabs[cur].tabIndex = -1;
    tabs[i].setAttribute('aria-selected', 'true');
    tabs[i].tabIndex = 0;
    cur = i;
    place(0.55);

    gsap.killTweensOf([...panes, ...panes.flatMap((p) => Array.from(parts(p)))]);
    panes.forEach((p) => { if (p !== to && p !== from) { p.hidden = true; gsap.set(p, { clearProps: 'all' }); } });
    if (prefersReducedMotion()) {
      from.hidden = true;
      to.hidden = false;
      gsap.set([from, to, parts(to)], { clearProps: 'all' });
      return;
    }
    // exit fast, enter slower: tag and line first, then the points
    gsap.to(from, {
      autoAlpha: 0, y: -10 * dir, filter: 'blur(4px)', duration: 0.18, ease: 'power2.in',
      onComplete: () => { from.hidden = true; gsap.set(from, { clearProps: 'all' }); }
    });
    to.hidden = false;
    gsap.set(to, { clearProps: 'all' });
    gsap.fromTo(parts(to), { autoAlpha: 0, y: 14 * dir, filter: 'blur(6px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', stagger: 0.045, delay: 0.1, clearProps: 'filter' });
    gsap.to(ribs, { x: -12 * i, y: 6 * i, duration: 1.2, ease: 'power3.out', overwrite: true });
  };

  let hoverT = 0;
  tabs.forEach((t, i) => {
    t.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(hoverT);
      hoverT = window.setTimeout(() => show(i), 90);
    });
    t.addEventListener('pointerleave', () => clearTimeout(hoverT));
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const n = e.key === 'ArrowDown' ? (i + 1) % tabs.length : e.key === 'ArrowUp' ? (i + tabs.length - 1) % tabs.length
        : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (n === null) return;
      e.preventDefault();
      tabs[n].focus();
      show(n);
    });
  });
  new ResizeObserver(() => place(0)).observe(tabs[0].parentElement!);
  place(0);

  // Phone accordion: one gain open at a time.
  const qs = Array.from(root.querySelectorAll<HTMLButtonElement>('.hb-q'));
  const as = Array.from(root.querySelectorAll<HTMLElement>('.hb-a'));
  qs.forEach((q, i) => {
    q.addEventListener('click', () => {
      const open = q.getAttribute('aria-expanded') === 'true';
      qs.forEach((o, j) => {
        const want = j === i ? !open : false;
        if ((o.getAttribute('aria-expanded') === 'true') === want) return;
        o.setAttribute('aria-expanded', String(want));
        const a = as[j], reduce = prefersReducedMotion();
        gsap.killTweensOf(a);
        if (want) {
          a.classList.add('is-open');
          if (reduce) return;
          gsap.fromTo(a, { height: 0 }, { height: 'auto', duration: 0.55, ease: 'expo.out', clearProps: 'height' });
          gsap.fromTo(a.querySelectorAll('.hb-line, li'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out', stagger: 0.05, delay: 0.12 });
        } else {
          if (reduce) { a.classList.remove('is-open'); return; }
          gsap.to(a, { height: 0, duration: 0.35, ease: 'power3.inOut', onComplete: () => { a.classList.remove('is-open'); gsap.set(a, { clearProps: 'height' }); } });
        }
      });
    });
  });

  // Entrance, once. Desktop and phone each get their own condition, since matchMedia only runs while one matches.
  const mm = gsap.matchMedia();
  mm.add(
    { desktop: '(min-width: 768px)', phone: '(max-width: 767px)', reduce: '(prefers-reduced-motion: reduce)' },
    (ctx) => {
      const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean };
      if (reduce) return;
      const head = root.querySelectorAll('.hb-head h2, .hb-head p');
      const st = { trigger: root, start: 'top 72%', once: true };
      if (!desktop) {
        gsap.from([...head, ...root.querySelectorAll('.hb-acc h3, .hb-a.is-open')], { autoAlpha: 0, y: 20, duration: 0.8, ease: 'expo.out', stagger: 0.06, scrollTrigger: st });
        return;
      }
      gsap.timeline({ scrollTrigger: st })
        .from(head, { autoAlpha: 0, y: 24, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
        .from(tabs, { autoAlpha: 0, y: 28, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, 0.15)
        .from(bar, { scaleX: 0, duration: 0.9, ease: 'expo.inOut' }, 0.35)
        .from(knob, { scale: 0, duration: 0.6, ease: 'back.out(1.4)' }, 0.85)
        .from(root.querySelector('.hb-body .hb-glass'), { autoAlpha: 0, y: 40, duration: 1, ease: 'expo.out' }, 0.3)
        .from(parts(panes[cur]), { autoAlpha: 0, y: 14, filter: 'blur(6px)', duration: 0.6, ease: 'expo.out', stagger: 0.06, clearProps: 'filter' }, 0.6)
        .from(root.querySelector('.hb-cta'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'expo.out' }, 0.9);
    }
  );
}
