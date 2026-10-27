/**
 * How it works: one moment at a time.
 *
 * Desktop and landscape tablets (min 1024 x 640): the section pins for five screens of scroll and the phone is the hero
 * (see setupPinned below). Each change is triggered at a scroll point and plays at a fixed speed, so it never looks mushy
 * when someone scrolls slowly. Scrolling back uses simple cross-fades. Reduced motion swaps frames instantly.
 * Phones and tablets in portrait (min 600 tall): the same stage, stacked (see setupPortrait). The phone pins under a
 * progress bar and a time chip and plays the same moments; a short note below it changes with each step.
 * Landscape phones, short screens and reduced motion on a phone: a normal list (no pinning) with a sticky five-segment
 * progress bar. Each step plays its own short version of the moment once as it arrives: clock rolls from the previous
 * time, words rise line by line, the phone rises and plays its moment (call slides down, notification then app, wake at
 * 9:00 am). Only transform and opacity are animated.
 */
import { gsap, ScrollTrigger } from './motion/scroll';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const CH = [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const OVERNIGHT = 3; // the change from step 4 (index 3) to step 5 crosses midnight

function clock(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24, mm = minutes % 60, h12 = h24 % 12 || 12;
  return { s: `${h12 < 10 ? ' ' : ''}${h12}:${mm < 10 ? '0' : ''}${mm}`, ap: h24 >= 12 ? 'pm' : 'am' };
}

/** Markup for an odometer: four digit columns around a colon, plus a two-state am/pm. */
export const ODO_HTML =
  '<span class="hw-digits" aria-hidden="true">' +
  [0, 1, 2, 3, 4].map((c) => (c === 2 ? '<span class="hw-colon">:</span>'
    : `<span class="hw-col"><span class="hw-stk">${CH.map((ch) => `<span>${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</span></span>`)).join('') +
  '</span><span class="hw-ap" aria-hidden="true"><span>pm</span><span>am</span></span>';

/**
 * Rolls the digit columns inside `host` to a time. Only changed digits move, right to left.
 * A one-digit hour leaves the first column blank, so the whole host slides left to keep "9:00 am" flush
 * (or half a column, when the host is centred).
 */
export function makeOdometer(host: HTMLElement, align: 'left' | 'center' = 'left') {
  const stacks = Array.from(host.querySelectorAll<HTMLElement>('.hw-stk'));
  const ap = Array.from(host.querySelectorAll<HTMLElement>('.hw-ap span'));
  const slots = [0, 1, 3, 4];
  let curAp = 'pm';
  const colWidth = () => { // the space one digit takes in the line (its box minus the negative side margins)
    const col = stacks[0].parentElement as HTMLElement, cs = getComputedStyle(col);
    return col.offsetWidth + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
  };
  const odo = {
    min: 0,
    set(m: number, dur = 0) {
      const t = clock(Math.round(m));
      for (let k = 0; k < 4; k++) {
        const y = -CH.indexOf(t.s[slots[k]]) * (100 / CH.length);
        if (dur) gsap.to(stacks[k], { yPercent: y, duration: dur, ease: 'expo.out', delay: (3 - k) * 0.05, overwrite: true });
        else gsap.set(stacks[k], { yPercent: y });
      }
      const x = t.s[0] === ' ' ? -colWidth() * (align === 'center' ? 0.5 : 1) : 0;
      if (dur) gsap.to(host, { x, duration: dur, ease: 'expo.out', overwrite: 'auto' }); else gsap.set(host, { x });
      if (t.ap !== curAp) {
        curAp = t.ap;
        const on = t.ap === 'pm' ? 0 : 1;
        if (dur) {
          gsap.to(ap[on], { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' });
          gsap.to(ap[1 - on], { opacity: 0, y: -8, duration: 0.3 });
        } else {
          gsap.set(ap[on], { opacity: 1, y: 0 });
          gsap.set(ap[1 - on], { opacity: 0 });
        }
      }
      odo.min = m;
    },
    /** Tick through every minute in between, e.g. overnight. */
    fastForward(to: number, duration: number) {
      const o = { m: odo.min };
      return gsap.to(o, { m: to, duration, ease: 'power2.inOut', onUpdate: () => odo.set(o.m) });
    }
  };
  return odo;
}

/** The one phone on the pinned stage: its five screens and the overlays used between them. */
type Phone = { screens: HTMLElement[]; banners: HTMLElement[]; black: HTMLElement; glint: HTMLElement };

function phoneParts(box: HTMLElement): Phone | null {
  const screens = Array.from(box.querySelectorAll<HTMLElement>('.hw-sc')), banners = Array.from(box.querySelectorAll<HTMLElement>('.hw-banner'));
  const black = box.querySelector<HTMLElement>('.hw-black'), glint = box.querySelector<HTMLElement>('.hw-glint');
  return screens.length === 5 && black && glint ? { screens, banners, black, glint } : null;
}

/** Show screen i with no motion. */
function phoneShow(p: Phone, i: number) {
  gsap.set(p.banners, { yPercent: -170, autoAlpha: 1 });
  gsap.set(p.black, { autoAlpha: 0 });
  gsap.set(p.glint, { opacity: 0 });
  p.screens.forEach((el, j) => gsap.set(el, { autoAlpha: j === i ? 1 : 0, xPercent: 0, yPercent: 0, scale: 1, zIndex: j === i ? 2 : 1 }));
}

/**
 * The phone's moment from one screen to the next, added to t: notification then app; the call from the top; sleep and
 * wake overnight; one glint going forwards. Backwards is a simple cross-fade. Returns when the new screen has settled.
 */
function phoneMoment(p: Phone, t: gsap.core.Timeline, from: number, to: number, fwd: boolean) {
  const { screens, banners, black, glint } = p;
  const inc = screens[to], out = screens[from];
  gsap.set(inc, { zIndex: 3 }); gsap.set(out, { zIndex: 2 });
  let settled: number;
  if (!fwd) {
    t.fromTo(inc, { autoAlpha: 0, scale: 1.02, xPercent: 0, yPercent: 0 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0)
      .to(out, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, 0);
    return 0.6;
  }
  if (to === 1) { // the call takes over the screen from the top
    t.fromTo(inc, { autoAlpha: 1, yPercent: -100 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, 0)
      .to(out, { scale: 0.94, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 0.1);
    settled = 0.8;
  } else if (to === 4) { // overnight: the phone sleeps, then wakes on Rahul's lock screen
    t.to(black, { autoAlpha: 1, duration: 0.45, ease: 'power2.in' }, 0)
      .add(() => { gsap.set(out, { autoAlpha: 0 }); gsap.set(inc, { autoAlpha: 1, xPercent: 0, yPercent: 0, scale: 1 }); }, 0.45)
      .to(black, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 1.6)
      .from(inc.querySelector('.hw-note'), { y: 24, opacity: 0, duration: 0.7, ease: 'expo.out' }, 1.95);
    settled = 2.6;
  } else {
    const banner = banners.find((b) => b.dataset.for === String(to));
    if (banner) t.fromTo(banner, { yPercent: -170 }, { yPercent: 0, duration: 0.55, ease: 'expo.out' }, 0).to(banner, { yPercent: -170, duration: 0.45, ease: 'power2.in' }, 0.8);
    t.fromTo(inc, { autoAlpha: 1, yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: 'expo.out' }, banner ? 0.75 : 0)
      .to(out, { scale: 0.94, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, banner ? 0.8 : 0.05);
    settled = banner ? 1.55 : 0.8;
  }
  const g = Math.max(0, settled - 0.9);
  t.fromTo(glint, { xPercent: -60 }, { xPercent: 60, duration: 1.2, ease: 'power2.inOut' }, g)
    .fromTo(glint, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 1 }, g);
  return settled;
}

/** When the new screen lands, for the time and progress to change with it (after a notification; while asleep overnight). */
function landsAt(p: Phone, to: number, fwd: boolean, overnight: boolean) {
  return !fwd ? 0.1 : overnight ? 0.5 : p.banners.some((b) => b.dataset.for === String(to)) ? 0.75 : 0.15;
}

export function startHowItWorks() {
  const found = document.getElementById('how');
  if (!found) return;
  const root: HTMLElement = found;
  const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const qa = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => Array.from(from.querySelectorAll<T>(sel));

  const pin = q('.hw-pin'), close = q('.hw-close');
  const steps = qa('.hw-step');
  if (!pin || !close || steps.length !== 5) return;
  const minutes = steps.map((s) => Number(s.dataset.min));

  // gsap.matchMedia only runs the setup while at least one condition matches, so "stacked" is listed explicitly.
  const mm = gsap.matchMedia();
  mm.add(
    {
      pinned: '(min-width: 1024px) and (min-height: 640px) and (orientation: landscape)',
      portrait: '(orientation: portrait) and (min-height: 600px) and (prefers-reduced-motion: no-preference)',
      stacked: '(max-width: 1023px), (max-height: 639px), (orientation: portrait)',
      reduce: '(prefers-reduced-motion: reduce)'
    },
    (ctx) => {
      const { pinned, portrait, reduce } = ctx.conditions as { pinned: boolean; portrait: boolean; reduce: boolean };
      revealClose(close, reduce);
      return pinned ? setupPinned(reduce) : portrait ? setupPortrait() : setupStacked(reduce);
    }
  );

  /* ---------------- phones, portrait tablets, short screens ---------------- */
  // Option A: no pinning; each step plays its own short version of the desktop moment, once, as it arrives.
  function setupStacked(reduce: boolean) {
    const segs = qa('.hw-mbar i'), label = q('.hw-mbar-t');
    const setBar = (i: number) => {
      segs.forEach((s, j) => { s.classList.toggle('is-on', j === i); s.classList.toggle('is-done', j < i); });
      if (label) label.textContent = `${clock(minutes[i]).s.trim()} ${clock(minutes[i]).ap}`;
    };
    steps.forEach((step, i) => {
      ScrollTrigger.create({ trigger: step, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => self.isActive && setBar(i) });
    });
    if (reduce) return () => setBar(0);

    const undo: (() => void)[] = [];
    steps.forEach((step, i) => {
      const time = step.querySelector<HTMLElement>('.hw-time')!, labelEl = step.querySelector<HTMLElement>('.hw-label')!;
      const title = step.querySelector<HTMLElement>('.hw-title')!, body = step.querySelector<HTMLElement>('.hw-body')!;
      const mem = step.querySelector<HTMLElement>('.hw-mem')!, shot = step.querySelector<HTMLElement>('.hw-shot')!;

      // The time becomes an odometer that starts at the previous step's time (step 1 starts ten minutes earlier).
      const originalTime = time.innerHTML;
      time.setAttribute('aria-label', time.textContent?.replace(/\s+/g, ' ').trim() || '');
      time.innerHTML = ODO_HTML;
      time.classList.add('is-odo');
      const odo = makeOdometer(time);
      odo.set(i === 0 ? minutes[0] - 10 : minutes[i - 1]);

      // Words wait hidden until the step arrives, then rise line by line.
      gsap.set([labelEl, mem], { opacity: 0, y: 12 });
      gsap.set([title, body], { opacity: 0 });
      const splits: SplitText[] = [];
      const words = ScrollTrigger.create({
        trigger: step, start: 'top 72%', once: true,
        onEnter: () => {
          if (i === 4) odo.fastForward(minutes[i], 1.5); else odo.set(minutes[i], 0.9);
          const t = SplitText.create(title, { type: 'lines', mask: 'lines' }), b = SplitText.create(body, { type: 'lines', mask: 'lines' });
          splits.push(t, b);
          gsap.set([title, body], { opacity: 1 });
          gsap.timeline()
            .to(labelEl, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0.05)
            .from(t.lines, { yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, 0.1)
            .from(b.lines, { yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 0.2)
            .to(mem, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0.4);
        }
      });

      // The phone rises as it enters the screen; its moment plays once it is well in view.
      const phoneEl = shot.querySelector<HTMLElement>('.hw-phone')!, sc = shot.querySelector<HTMLElement>('.hw-sc')!;
      const banner = shot.querySelector<HTMLElement>('.hw-banner'), black = shot.querySelector<HTMLElement>('.hw-black');
      const rise = gsap.timeline({ paused: true })
        .fromTo(phoneEl, { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out' });
      const moment = gsap.timeline({ paused: true });
      if (i === 1) moment.from(sc, { yPercent: -100, duration: 0.8, ease: 'expo.out' }, 0); // the call takes over from the top
      if (banner) {
        gsap.set(banner, { autoAlpha: 1 });
        moment.fromTo(banner, { yPercent: -170 }, { yPercent: 0, duration: 0.55, ease: 'expo.out' }, 0)
          .from(sc, { yPercent: 12, opacity: 0, duration: 0.7, ease: 'expo.out' }, 0.5) // the app opens under the notification
          .to(banner, { yPercent: -170, duration: 0.45, ease: 'power2.in' }, 0.9);
      }
      if (black) {
        gsap.set(black, { autoAlpha: 1 });
        moment.to(black, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 0.2) // the phone wakes at 9:00 am
          .from(sc.querySelector('.hw-note'), { y: 24, opacity: 0, duration: 0.7, ease: 'expo.out' }, 0.5);
      }
      const riseTrigger = ScrollTrigger.create({ trigger: shot, start: 'top 92%', once: true, onEnter: () => rise.play() });
      const momentTrigger = ScrollTrigger.create({ trigger: shot, start: 'top 60%', once: true, onEnter: () => { rise.progress(1); moment.play(); } });

      undo.push(() => {
        words.kill(); riseTrigger.kill(); momentTrigger.kill(); rise.kill(); moment.kill();
        splits.forEach((s) => s.revert());
        time.innerHTML = originalTime;
        time.classList.remove('is-odo');
        time.removeAttribute('aria-label');
        gsap.set([time, labelEl, title, body, mem, phoneEl, sc], { clearProps: 'all' });
        if (banner) gsap.set(banner, { clearProps: 'all' });
        if (black) gsap.set(black, { clearProps: 'all' });
      });
    });
    return () => { setBar(0); undo.forEach((u) => u()); };
  }

  /* ---------------- desktop, pinned ---------------- */
  // The phone is the main event; everything else follows it, gently. Each change is one sequence at a fixed speed:
  //   1. the phone plays its moment (notification then app; the call from the top; sleep and wake overnight), then one glint
  //   2. as the new screen lands, the watermark time rolls slowly to the new time with a slight dip in brightness
  //      (overnight it fast-forwards while the phone sleeps), and the chip and dots change
  //   3. once the phone has settled, the callout rises in and a hairline draws from it to the edge of the phone, level with
  //      the part of the screen it describes, which gets a soft mist ring
  // Scrolling back uses simple cross-fades. Reduced motion swaps frames instantly.
  function setupPinned(reduce: boolean) {
    const stage = q('.hx-stage'), box = q('.hx-phone-box'), phone = q('.hx-phone-box .hw-phone'), odoEl = q('.hx-odo');
    if (!stage || !box || !phone || !odoEl) return;
    const ph = phoneParts(box);
    const notes = qa('.hx-note', stage), chips = qa('.hx-chip span', stage), dots = qa('.hx-dots i', stage);
    const line = stage.querySelector<SVGSVGElement>('.hx-line'), path = line?.querySelector('path'), dot = line?.querySelector('circle');
    if (!ph || notes.length !== 5 || !line || !path || !dot) return;
    const { screens, banners, black, glint } = ph;
    const targets = notes.map((n, i) => screens[i].querySelector<HTMLElement>(n.dataset.target!) || screens[i]);

    root.classList.add('is-pinned');

    odoEl.innerHTML = ODO_HTML;
    const odo = makeOdometer(odoEl, 'center');
    const rollTime = (i: number, overnight: boolean) => {
      gsap.fromTo(odoEl, { opacity: 0.055 }, { opacity: 0.032, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1, overwrite: 'auto' });
      if (overnight) odo.fastForward(minutes[i], 1.6); else odo.set(minutes[i], 1.4);
    };
    const showPassive = (i: number) => [chips, dots].forEach((list) => list.forEach((el, k) => el.classList.toggle('is-on', k === i)));

    /** Place callout i level with its target and lay the hairline out from beside its title to the phone's edge. */
    const layoutLine = (i: number) => {
      const note = notes[i], s = stage.getBoundingClientRect(), p = box.getBoundingClientRect(), t = targets[i].getBoundingClientRect();
      const right = note.classList.contains('hx-r');
      const y2 = t.top + t.height / 2 - s.top;
      const h0 = note.querySelector('h3')!.getBoundingClientRect(), n0 = note.getBoundingClientRect();
      note.style.top = `${Math.max(84, Math.min(s.height - note.offsetHeight - 40, y2 - (h0.top - n0.top) - h0.height / 2))}px`;
      const h = note.querySelector('h3')!.getBoundingClientRect();
      const y1 = h.top + h.height / 2 - s.top;
      const x1 = (right ? h.left - 18 : h.right + 18) - s.left;
      const x2 = (right ? p.right + 6 : p.left - 6) - s.left;
      path.setAttribute('d', Math.abs(y1 - y2) < 2 ? `M${x1} ${y1} L${x2} ${y2}` : `M${x1} ${y1} L${x1 + (x2 - x1) * 0.5} ${y1} L${x2} ${y2}`);
      dot.setAttribute('cx', String(x2)); dot.setAttribute('cy', String(y2));
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      return len;
    };

    let cur = -1;
    let tl: gsap.core.Timeline | null = null;

    const instant = (i: number) => {
      tl?.kill(); tl = null;
      phoneShow(ph, i);
      notes.forEach((n, j) => gsap.set(n, { autoAlpha: j === i ? 1 : 0, y: 0 }));
      targets.forEach((t, j) => t.classList.toggle('hx-hl', j === i));
      showPassive(i);
      odo.set(minutes[i]);
      layoutLine(i);
      gsap.set(path, { strokeDashoffset: 0 }); gsap.set(dot, { opacity: 1, scale: 1 });
      cur = i;
    };

    const go = (to: number) => {
      if (to === cur) return;
      const from = cur;
      if (reduce || from < 0) { instant(to); return; }
      tl?.progress(1).kill();
      cur = to;
      const fwd = to > from;
      const overnight = Math.min(from, to) === OVERNIGHT && Math.abs(to - from) === 1;
      const t = (tl = gsap.timeline());

      // the old callout, line and highlight leave first, quickly and quietly
      t.to(notes[from], { autoAlpha: 0, y: -6, duration: 0.3, ease: 'power2.in' }, 0)
        .to(dot, { opacity: 0, duration: 0.2 }, 0)
        .to(path, { strokeDashoffset: () => -path.getTotalLength(), duration: 0.35, ease: 'power2.in' }, 0)
        .add(() => targets[from].classList.remove('hx-hl'), 0.1);

      // 1. the phone
      const settled = phoneMoment(ph, t, from, to, fwd);

      // 2. the time, as the new screen lands (after the notification; at the wake overnight)
      const lands = overnight && fwd ? 1.2 : landsAt(ph, to, fwd, false);
      t.add(() => showPassive(to), lands)
        .add(() => rollTime(to, overnight && fwd), overnight && fwd ? 0.4 : lands);

      // 3. once the phone has settled: callout, hairline, highlight
      const at = Math.max(0.45, settled - 0.15);
      t.add(() => {
        const len = layoutLine(to);
        gsap.set(path, { strokeDashoffset: len });
        gsap.set(dot, { opacity: 0, scale: 0.4, transformOrigin: 'center' });
      }, at)
        .fromTo(notes[to], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, at)
        .to(path, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, at + 0.2)
        .to(dot, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, at + 0.8)
        .add(() => targets[to].classList.add('hx-hl'), at + 0.75);
    };

    requestAnimationFrame(() => instant(0));
    ScrollTrigger.create({
      trigger: pin, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => go(Math.min(4, Math.floor(self.progress * 5)))
    });

    // Arrival: the phone rises a little and the first callout follows; after that the layout never moves.
    if (!reduce) {
      gsap.from(phone, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
    }
    const onResize = () => { if (cur >= 0) instant(cur); };
    addEventListener('resize', onResize);

    return () => {
      removeEventListener('resize', onResize);
      tl?.kill();
      root.classList.remove('is-pinned');
      gsap.set([...screens, ...banners, ...notes, black, glint, phone, path, dot, odoEl], { clearProps: 'all' });
      targets.forEach((t) => t.classList.remove('hx-hl'));
      odoEl.innerHTML = '';
    };
  }

  /* ---------------- phones and tablets in portrait, pinned ---------------- */
  // The desktop stage, stacked: progress bar and time chip on top, the phone, then one short note below it.
  // Each change: the old note and ring leave, the phone plays its moment, the progress and chip change as the new screen
  // lands (the chip's time rolls; overnight it fast-forwards while the phone sleeps), then the note rises and the ring
  // lands. A change that arrives mid-animation waits for the current one to finish, so a quick flick never skips a beat.
  // The Book / WhatsApp bar steps aside while the phone is pinned (html.how-pinned, see MobileBar).
  function setupPortrait() {
    const stage = q('.hx-stage'), box = q('.hx-phone-box'), phone = q('.hx-phone-box .hw-phone');
    const odoEl = q('.hm-odo'), chWrap = q('.hm-ch');
    if (!stage || !box || !phone || !odoEl || !chWrap) return;
    const ph = phoneParts(box);
    const notes = qa('.hx-note', stage), segs = qa('.hm-prog i', stage), channels = qa('.hm-ch span', stage);
    if (!ph || notes.length !== 5 || segs.length !== 5 || channels.length !== 5) return;
    const targets = notes.map((n, i) => ph.screens[i].querySelector<HTMLElement>(n.dataset.target!) || ph.screens[i]);

    root.classList.add('is-mpinned');
    // the stage starts right under the site header, whose height depends on the device
    const nav = document.getElementById('nav');
    const fitNav = () => { if (nav) stage.style.setProperty('--nav-h', `${nav.offsetHeight}px`); };
    fitNav();
    addEventListener('resize', fitNav);
    odoEl.innerHTML = ODO_HTML;
    const odo = makeOdometer(odoEl);

    const showPassive = (i: number) => {
      segs.forEach((s, j) => { s.classList.toggle('is-on', j === i); s.classList.toggle('is-done', j < i); });
      channels.forEach((c, j) => c.classList.toggle('is-on', j === i));
      chWrap.style.width = `${channels[i].offsetWidth}px`; // the chip hugs the current channel
    };

    let cur = -1, pending = -1;
    let tl: gsap.core.Timeline | null = null;

    const instant = (i: number) => {
      tl?.kill(); tl = null;
      phoneShow(ph, i);
      notes.forEach((n, j) => gsap.set(n, { autoAlpha: j === i ? 1 : 0, y: 0 }));
      targets.forEach((t, j) => t.classList.toggle('hx-hl', j === i));
      showPassive(i);
      odo.set(minutes[i]);
      cur = i;
    };

    const go = (to: number) => {
      if (to === cur) { pending = -1; return; }
      if (cur < 0) { instant(to); return; }
      if (tl?.isActive()) { pending = to; return; } // let the current moment finish first

      const from = cur, fwd = to > from;
      const overnight = fwd && from === OVERNIGHT && to === OVERNIGHT + 1;
      cur = to;
      const t = (tl = gsap.timeline({
        onComplete: () => { tl = null; if (pending >= 0 && pending !== cur) { const p = pending; pending = -1; go(p); } }
      }));

      // the old note and ring leave first, quickly and quietly
      t.to(notes[from], { autoAlpha: 0, y: -6, duration: 0.3, ease: 'power2.in' }, 0)
        .add(() => targets[from].classList.remove('hx-hl'), 0.05);

      // 1. the phone
      const settled = phoneMoment(ph, t, from, to, fwd);

      // 2. progress, channel and time, as the new screen lands
      t.add(() => {
        showPassive(to);
        if (overnight) odo.fastForward(minutes[to], 1.6); else odo.set(minutes[to], 1.1);
      }, landsAt(ph, to, fwd, overnight));

      // 3. once the phone has settled: the note, then the ring, then a short beat before the next change may start
      const at = Math.max(0.45, settled - 0.15);
      t.fromTo(notes[to], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, at)
        .add(() => targets[to].classList.add('hx-hl'), at + 0.45)
        .to({}, { duration: 0.35 }, at + 0.45);
    };

    instant(0);
    const st = ScrollTrigger.create({
      trigger: pin, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => go(Math.min(4, Math.floor(self.progress * 5))),
      onToggle: (self) => document.documentElement.classList.toggle('how-pinned', self.isActive)
    });
    // Arrival: the phone rises into place as the stage comes up the screen.
    const rise = gsap.from(phone, { y: 70, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: pin, start: 'top 75%', once: true } });

    return () => {
      st.kill(); rise.scrollTrigger?.kill(); rise.kill(); tl?.kill();
      removeEventListener('resize', fitNav);
      stage.style.removeProperty('--nav-h');
      document.documentElement.classList.remove('how-pinned');
      root.classList.remove('is-mpinned');
      gsap.set([...ph.screens, ...ph.banners, ...notes, ph.black, ph.glint, phone], { clearProps: 'all' });
      targets.forEach((t) => t.classList.remove('hx-hl'));
      segs.forEach((s) => s.classList.remove('is-on', 'is-done'));
      channels.forEach((c) => c.classList.remove('is-on'));
      chWrap.style.width = '';
      odoEl.innerHTML = '';
    };
  }

  /* proof and buttons: a gentle reveal in every layout */
  function revealClose(el: HTMLElement, reduce: boolean) {
    if (reduce) return;
    gsap.from(el.querySelectorAll('.hw-after, .hw-stats li, .hw-cta'), {
      opacity: 0, y: 24, duration: 0.8, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 80%', once: true }
    });
  }
}
