/**
 * Industries: the sentence plays like one looping film.
 *
 * One GSAP timeline runs the whole loop. At each beat Riya "deletes" the current phrase in the first tile and types the
 * next at a slightly uneven, human rhythm with a blinking mist cursor; the second tile follows partway through. The
 * loop pauses with the small corner button and while the section is off screen.
 * The sentence shrinks just enough that the longest phrase always fits its line. Reduced motion: one still frame,
 * "every enquiry into a customer", and no pause button.
 */
import { gsap, prefersReducedMotion } from './motion/scroll';
import { INDUSTRIES } from '../data/industries';

const BEAT = 3.2;          // seconds each phrase stays readable
const TYPE_EXTRA = 1.6;   // extra time per beat for deleting and typing

export function startIndustries() {
  const sec = document.getElementById('industries');
  if (!sec) return;
  const sent = sec.querySelector<HTMLElement>('.ind-sent')!;
  const pp = document.getElementById('indPP') as HTMLButtonElement;
  const beats = INDUSTRIES.beats;

  const meas = document.createElement('span');
  meas.className = 'ind-measure';
  meas.setAttribute('aria-hidden', 'true');
  sent.appendChild(meas);
  const widthOf = (t: string) => { meas.textContent = t; return meas.getBoundingClientRect().width; };

  // the typing runs in its own short timelines, so pausing has to reach those too
  const typing = new Set<gsap.core.Timeline>();

  class Slot {
    el: HTMLElement; text: string;
    constructor(el: HTMLElement, text: string) { this.el = el; this.text = text; this.set(text); }
    set(t: string) {
      this.text = t;
      this.el.innerHTML = '';
      const ph = document.createElement('span');
      ph.className = 'ind-ph';
      ph.textContent = t;
      this.el.appendChild(ph);
      this.el.style.width = `calc(${widthOf(t)}px + .52em)`;
    }
    type(t: string, delay = 0) {
      const old = this.text;
      const tl = gsap.timeline({ delay, onComplete: () => { typing.delete(tl); this.set(t); } });
      typing.add(tl);
      this.text = t;
      const ph = document.createElement('span'), caret = document.createElement('span');
      ph.className = 'ind-ph'; caret.className = 'ind-caret';
      tl.add(() => { this.el.innerHTML = ''; ph.textContent = old; this.el.append(ph, caret); this.el.style.width = 'auto'; }, 0);
      let at = 0;
      for (let k = old.length - 1; k >= 0; k--) { at += 0.016; tl.add(() => { ph.textContent = old.slice(0, k); }, at); }
      at += 0.18;
      for (let j = 1; j <= t.length; j++) {
        tl.add(() => { ph.textContent = t.slice(0, j); }, at);
        at += (t[j - 1] === ' ' ? 0.09 : 0.034) + Math.random() * 0.03;
      }
      tl.add(() => {}, at + 0.5);
      return tl;
    }
  }

  const a = new Slot(document.getElementById('indA')!, beats[0].enquiry);
  const b = new Slot(document.getElementById('indB')!, beats[0].outcome);

  // the longest phrase must fit its line: shrink the sentence just enough if it wouldn't
  const fit = () => {
    sent.style.fontSize = '';
    const fs = parseFloat(getComputedStyle(sent).fontSize), pad = fs * 0.52, phone = innerWidth < 768;
    const avail = sent.clientWidth * 0.97;
    let widest = 0;
    for (const d of beats) widest = Math.max(widest, widthOf(d.enquiry) + pad, widthOf(`${phone ? '' : `${INDUSTRIES.joiner} `}${d.outcome}.`) + pad);
    if (widest > avail) sent.style.fontSize = `${((fs * avail) / widest).toFixed(2)}px`;
    if (!typing.size) { a.set(a.text); b.set(b.text); } // never interrupt a phrase mid-typing
  };

  let film: gsap.core.Timeline | null = null, paused = false, onScreen = false;
  const sync = () => {
    if (!film || prefersReducedMotion()) return;
    const hold = paused || !onScreen;
    for (const tl of [film, ...typing]) hold ? tl.pause() : tl.resume();
  };
  const build = () => {
    film?.kill();
    typing.forEach((tl) => tl.kill()); typing.clear();
    a.set(beats[0].enquiry); b.set(beats[0].outcome);
    pp.hidden = prefersReducedMotion();
    if (prefersReducedMotion()) {
      const last = beats[beats.length - 1];
      a.set(last.enquiry); b.set(last.outcome);
      return;
    }
    // The tiles start empty and Riya types the first phrase the moment the section comes into view; each beat
    // then holds for BEAT seconds before she deletes it and types the next.
    a.set(''); b.set('');
    const per = BEAT + TYPE_EXTRA;
    film = gsap.timeline({ repeat: -1, paused: true });
    film.to({}, { duration: per * beats.length }, 0);
    beats.forEach((n, j) => {
      film!.add(() => {
        const ta = a.type(n.enquiry);
        b.type(n.outcome, ta.duration() * 0.35);
        sync();
      }, j * per + 0.05);
    });
    sync();
  };

  pp.addEventListener('click', () => {
    paused = !paused;
    pp.setAttribute('aria-pressed', String(paused));
    pp.setAttribute('aria-label', paused ? 'Play the animation' : 'Pause the animation');
    sync();
  });
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0.25 }).observe(sent);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', build);
  let rT = 0;
  addEventListener('resize', () => { clearTimeout(rT); rT = window.setTimeout(fit, 120); });
  fit();
  build();
  document.fonts?.ready.then(fit);
}
