/**
 * How it works: one moment at a time.
 *
 * Desktop and landscape tablets (min 1024 x 640): the section pins for five screens of scroll. Each frame change is triggered at a scroll
 * point and plays at a fixed speed, so it never looks mushy when someone scrolls slowly:
 *   - clock: digits roll like an odometer; overnight it fast-forwards from 11:48 pm to 9:00 am while the phone sleeps
 *   - words: old words lift away, new title and copy rise line by line from behind a mask (GSAP SplitText)
 *   - phone: a notification drops in and the app opens from it; the call takes over from the top; at midnight the
 *     screen goes dark and wakes on Rahul's lock screen
 *   - glass glint once per change; the progress bar fills to the end of the active step's column in step with the content
 * Scrolling back uses simple cross-fades. Reduced motion swaps frames instantly.
 * Phones, portrait tablets and short screens: a normal list (no pinning) with a sticky five-segment progress bar.
 * Each step plays its own short version of the desktop moment once as it arrives: clock rolls from the previous time,
 * words rise line by line, the phone rises and plays its moment (call slides down, notification then app, wake at 9:00 am).
 * Only transform and opacity are animated.
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
const ODO_HTML =
  '<span class="hw-digits" aria-hidden="true">' +
  [0, 1, 2, 3, 4].map((c) => (c === 2 ? '<span class="hw-colon">:</span>'
    : `<span class="hw-col"><span class="hw-stk">${CH.map((ch) => `<span>${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</span></span>`)).join('') +
  '</span><span class="hw-ap" aria-hidden="true"><span>pm</span><span>am</span></span>';

/**
 * Rolls the digit columns inside `host` to a time. Only changed digits move, right to left.
 * A one-digit hour leaves the first column blank, so the whole host slides left to keep "9:00 am" flush.
 */
function makeOdometer(host: HTMLElement) {
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
      const x = t.s[0] === ' ' ? -colWidth() : 0;
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
  const viewers = steps.map((s) => s.dataset.viewer || '');

  // gsap.matchMedia only runs the setup while at least one condition matches, so "stacked" is listed explicitly.
  const mm = gsap.matchMedia();
  mm.add(
    {
      pinned: '(min-width: 1024px) and (min-height: 640px) and (orientation: landscape)',
      stacked: '(max-width: 1023px), (max-height: 639px), (orientation: portrait)',
      reduce: '(prefers-reduced-motion: reduce)'
    },
    (ctx) => {
      const { pinned, reduce } = ctx.conditions as { pinned: boolean; reduce: boolean };
      revealClose(close, reduce);
      return pinned ? setupPinned(reduce) : setupStacked(reduce);
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
  function setupPinned(reduce: boolean) {
    const device = q('.hw-device'), box = q('.hw-phone-box'), phone = q('.hw-phone-box .hw-phone');
    const clockEl = q('.hw-clock'), cap = q('.hw-cap--device'), fill = q('.hw-fill'), labels = qa('.hw-pl');
    if (!device || !box || !phone || !clockEl || !cap || !fill) return;
    // The phone images in the stacked list have their own banners and overlay, so look only inside the pinned phone.
    const screens = qa('.hw-sc', device), banners = qa('.hw-banner', device);
    const black = device.querySelector<HTMLElement>('.hw-black'), glint = device.querySelector<HTMLElement>('.hw-glint');
    const stacks = qa('.hw-stk', clockEl), apSpans = qa('.hw-ap span', clockEl);
    if (screens.length !== 5 || !black || !glint || stacks.length !== 4) return;

    root.classList.add('is-pinned');

    // Phone is drawn at 332 x 684 and scaled to the height the layout gives it.
    const fitPhone = () => phone.style.setProperty('--ps', (box.clientHeight / 684).toFixed(4));
    const ro = new ResizeObserver(fitPhone);
    ro.observe(box);
    fitPhone();

    const parts = steps.map((s) => ({
      label: s.querySelector<HTMLElement>('.hw-label')!, title: s.querySelector<HTMLElement>('.hw-title')!,
      body: s.querySelector<HTMLElement>('.hw-body')!, mem: s.querySelector<HTMLElement>('.hw-mem')!
    }));
    const all = (i: number) => [parts[i].label, parts[i].title, parts[i].body, parts[i].mem];
    // autoSplit re-splits when fonts load or the column width changes, so lines always match what is on screen.
    const splits = parts.map((p) => ({
      title: SplitText.create(p.title, { type: 'lines', mask: 'lines', autoSplit: true }),
      body: SplitText.create(p.body, { type: 'lines', mask: 'lines', autoSplit: true })
    }));

    /* clock */
    const odo = makeOdometer(clockEl);
    const setClock = (m: number, dur = 0) => odo.set(m, dur);

    /* frames */
    let cur = -1;
    let tl: gsap.core.Timeline | null = null, wordsTl: gsap.core.Timeline | null = null;

    const setLabels = (i: number) => labels.forEach((l, j) => { l.classList.toggle('is-on', j === i); l.classList.toggle('is-done', j < i); });
    // The bar fills to the end of the active step's column, so it always lines up with the labels beneath it.
    const fillTo = (i: number, dur = 0) => {
      const x = (i + 1) / labels.length;
      if (dur) gsap.to(fill, { scaleX: x, duration: dur, ease: 'expo.out', overwrite: true }); else gsap.set(fill, { scaleX: x });
    };
    const showScreen = (i: number) => screens.forEach((el, j) => gsap.set(el, { autoAlpha: j === i ? 1 : 0, xPercent: 0, yPercent: 0, scale: 1, zIndex: j === i ? 2 : 1 }));
    const showStep = (i: number) => steps.forEach((s, j) => gsap.set(s, { opacity: j === i ? 1 : 0, pointerEvents: j === i ? 'auto' : 'none' }));

    const instant = (i: number) => {
      tl?.kill(); wordsTl?.kill(); tl = wordsTl = null;
      gsap.set(banners, { yPercent: -170, autoAlpha: 1 });
      gsap.set(black, { autoAlpha: 0 });
      gsap.set(glint, { opacity: 0 });
      parts.forEach((_, j) => gsap.set(all(j), { clearProps: 'opacity,transform' }));
      showStep(i); showScreen(i); setClock(minutes[i]); setLabels(i); fillTo(i);
      cap.textContent = viewers[i];
      cur = i;
    };

    const wordsIn = (i: number) => {
      const p = parts[i], sp = splits[i];
      wordsTl = gsap.timeline()
        .from(p.label, { opacity: 0, y: 10, duration: 0.6, ease: 'expo.out' }, 0)
        .from(sp.title.lines, { yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, 0.05)
        .from(sp.body.lines, { yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 0.14)
        .from(p.mem, { opacity: 0, y: 10, duration: 0.6, ease: 'expo.out' }, 0.3);
    };

    const screenTo = (t: gsap.core.Timeline, from: number, to: number, fwd: boolean) => {
      const inc = screens[to], out = screens[from];
      gsap.set(inc, { zIndex: 3 }); gsap.set(out, { zIndex: 2 });
      if (!fwd) {
        t.fromTo(inc, { autoAlpha: 0, scale: 1.02, xPercent: 0, yPercent: 0 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0)
          .to(out, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, 0);
        return 0.6;
      }
      if (to === 1) { // the call takes over the screen from the top
        t.fromTo(inc, { autoAlpha: 1, yPercent: -100 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, 0)
          .to(out, { scale: 0.94, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 0.1);
        return 0.8;
      }
      if (to === 4) { // overnight: the phone sleeps, then wakes on Rahul's lock screen
        t.to(black, { autoAlpha: 1, duration: 0.45, ease: 'power2.in' }, 0)
          .add(() => { gsap.set(out, { autoAlpha: 0 }); gsap.set(inc, { autoAlpha: 1, xPercent: 0, yPercent: 0, scale: 1 }); }, 0.45)
          .to(black, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 1.6)
          .from(inc.querySelector('.hw-note'), { y: 24, opacity: 0, duration: 0.7, ease: 'expo.out' }, 1.95);
        return 2.6;
      }
      const banner = banners.find((b) => b.dataset.for === String(to));
      if (banner) t.fromTo(banner, { yPercent: -170 }, { yPercent: 0, duration: 0.55, ease: 'expo.out' }, 0).to(banner, { yPercent: -170, duration: 0.45, ease: 'power2.in' }, 0.8);
      t.fromTo(inc, { autoAlpha: 1, yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: 'expo.out' }, 0.75)
        .to(out, { scale: 0.94, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 0.8);
      return 1.55;
    };

    const go = (to: number) => {
      if (to === cur) return;
      const from = cur;
      if (reduce || from < 0) { instant(to); return; }
      tl?.progress(1).kill();
      wordsTl?.progress(1).kill();
      cur = to;
      const fwd = to > from;
      const overnight = Math.min(from, to) === OVERNIGHT && Math.abs(to - from) === 1;
      const wordsAt = overnight && fwd ? 1.9 : 0.32;
      const t = (tl = gsap.timeline());

      // The labels and the bar change at the moment the new content arrives (the new words, or the clock landing on 9:00 am
      // overnight), not ahead of it, so what you read and what the bar says never disagree.
      t.add(() => { setLabels(to); fillTo(to, 0.7); }, overnight && fwd ? 1.6 : wordsAt);

      // words: lift the old ones away, then bring the new step in line by line
      t.to(all(from), { opacity: 0, y: -10, duration: 0.25, ease: 'power2.in', stagger: 0.02 }, 0)
        .add(() => {
          gsap.set(all(from), { clearProps: 'opacity,transform' });
          showStep(to);
          wordsIn(to);
        }, wordsAt);

      // clock: roll, or fast-forward through the night
      if (overnight) {
        t.add(odo.fastForward(minutes[to], 1.6), fwd ? 0.3 : 0);
      } else {
        t.add(() => setClock(minutes[to], 0.8), 0.05);
      }

      // phone, then one glint across the glass
      const end = screenTo(t, from, to, fwd);
      if (fwd) {
        const g = Math.max(0, end - 0.9);
        t.fromTo(glint, { xPercent: -60 }, { xPercent: 60, duration: 1.2, ease: 'power2.inOut' }, g)
          .fromTo(glint, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 1 }, g);
      }

      if (cap.textContent !== viewers[to]) {
        t.to(cap, { opacity: 0, duration: 0.25 }, 0)
          .add(() => { cap.textContent = viewers[to]; }, 0.26)
          .to(cap, { opacity: 1, duration: 0.5 }, wordsAt);
      }
    };

    instant(0);
    ScrollTrigger.create({
      trigger: pin, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        go(Math.min(4, Math.floor(self.progress * 5)));
      }
    });

    // Arrival: the phone rises a little and the first words fade in; after that the layout never moves.
    if (!reduce) {
      gsap.from(phone, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
      gsap.from([clockEl, ...all(0)], { opacity: 0, y: 14, duration: 0.8, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: pin, start: 'top 60%', once: true } });
    }

    return () => {
      ro.disconnect();
      tl?.kill(); wordsTl?.kill();
      splits.forEach((s) => { s.title.revert(); s.body.revert(); });
      root.classList.remove('is-pinned');
      gsap.set([...steps, ...screens, ...banners, black, glint, clockEl, cap, fill, ...stacks, ...apSpans], { clearProps: 'all' });
      parts.forEach((_, j) => gsap.set(all(j), { clearProps: 'all' }));
      setLabels(-1);
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
