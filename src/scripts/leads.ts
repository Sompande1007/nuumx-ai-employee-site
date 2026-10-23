/**
 * Lead capture for "Book a free demo" and "Get a call from Riya".
 * Any element with data-open="demo" or data-open="call" opens the dialog.
 * With an endpoint set in src/config/site.ts the lead is posted there; without one, the visitor
 * continues on WhatsApp with their details pre-filled, so they are never told something happened when it did not.
 */
import { LEADS } from '../config/site';
import { track, campaignSource } from './analytics';

type Mode = 'demo' | 'call';
const COPY: Record<Mode, { title: string; lede: string; btn: string; fine: string; company: boolean }> = {
  demo: { title: 'Book your free demo', lede: '30 minutes on your own use case. No obligation.', btn: 'Book my demo', fine: 'We only use your number to arrange your demo.', company: true },
  call: { title: 'Get a call from Riya', lede: 'Enter your number and Riya will call you, the way she would call your customers.', btn: 'Call me', fine: 'One demo call. We will not add you to any list.', company: false }
};

export const waNumber = String(LEADS.whatsapp || '').replace(/\D/g, '');
export const waLink = (text: string) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
const prettyNumber = () => '+' + waNumber.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3');

export function initLeadDialog() {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const dlg = $('dlg'), form = $<HTMLFormElement>('leadForm'), done = $('doneState'), btn = $<HTMLButtonElement>('submitBtn');
  if (!dlg || !form) return;
  const source = campaignSource();
  let mode: Mode = 'demo';
  let lastFocus: HTMLElement | null = null;

  const clearErrors = () => (['name', 'phone'] as const).forEach((k) => { $('e-' + k).hidden = true; $('f-' + k).removeAttribute('aria-invalid'); });
  const showError = (k: 'name' | 'phone') => { $('e-' + k).hidden = false; $('f-' + k).setAttribute('aria-invalid', 'true'); $('f-' + k).focus(); };

  const open = (m: Mode) => {
    mode = m; lastFocus = document.activeElement as HTMLElement;
    const c = COPY[m];
    $('dlgTitle').textContent = c.title; $('dlgLede').textContent = c.lede; btn.textContent = c.btn; $('dlgFine').textContent = c.fine;
    $('companyField').hidden = !c.company;
    form.hidden = false; done.hidden = true; clearErrors();
    dlg.hidden = false; document.body.style.overflow = 'hidden'; dispatchEvent(new Event('nx:scroll-lock'));
    setTimeout(() => $('f-name').focus(), 30);
    track('lead_form_open', { mode: m });
  };
  const close = () => { dlg.hidden = true; document.body.style.overflow = ''; dispatchEvent(new Event('nx:scroll-unlock')); lastFocus?.focus(); };

  document.addEventListener('click', (e) => {
    const t = (e.target as Element | null)?.closest?.('[data-open]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-open') as Mode); }
  });
  $('dlgClose').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  document.addEventListener('keydown', (e) => {
    if (dlg.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const f = [...dlg.querySelectorAll<HTMLElement>('button, input:not([tabindex="-1"]), a[href]')].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  (['f-name', 'f-phone'] as const).forEach((id) => $(id).addEventListener('input', () => { const k = id.slice(2); $('e-' + k).hidden = true; $(id).removeAttribute('aria-invalid'); }));

  const addButton = (cls: string, text: string, href?: string, onClick?: () => void) => {
    const el = document.createElement(href ? 'a' : 'button');
    el.className = cls; el.textContent = text;
    if (href && el instanceof HTMLAnchorElement) { el.href = href; el.target = '_blank'; el.rel = 'noopener'; }
    if (el instanceof HTMLButtonElement) el.type = 'button';
    if (onClick) el.addEventListener('click', onClick);
    $('doneActs').appendChild(el);
  };

  const finish = (sent: boolean, lead: Record<string, string>) => {
    btn.disabled = false; btn.textContent = COPY[mode].btn;
    form.hidden = true; done.hidden = false; $('doneActs').innerHTML = '';
    const first = lead.name.split(' ')[0];
    if (sent && mode === 'call' && LEADS.callMeEndpoint) {
      $('doneTitle').textContent = 'Riya is calling you';
      $('doneText').textContent = `Thanks, ${first}. Keep your phone close; the call comes in within a minute.`;
    } else if (sent) {
      $('doneTitle').textContent = 'Request received';
      $('doneText').textContent = `Thanks, ${first}. Our team will call you within one business day to confirm your demo. You can also pick an exact time now.`;
      if (LEADS.bookingUrl) addButton('btn-primary', 'Pick a time on our calendar', LEADS.bookingUrl);
    } else {
      $('doneTitle').textContent = 'One last step';
      $('doneText').textContent = `Send these details to our team on WhatsApp and we will confirm ${mode === 'demo' ? 'your demo slot' : 'a call from Riya'} there.`;
      if (waNumber) {
        const intro = mode === 'demo' ? 'Hi, I would like to book a free nuumx AI Employee demo.' : 'Hi, I would like a call from Riya, the nuumx AI Employee.';
        addButton('btn-wa', 'Continue on WhatsApp', waLink(`${intro}\n\nName: ${lead.name}\nPhone: ${lead.phone}${lead.company ? `\nCompany: ${lead.company}` : ''}`));
        const p = document.createElement('p'); p.className = 'fine';
        p.innerHTML = `Or message us directly: <span class="num">${prettyNumber()}</span>`;
        $('doneActs').appendChild(p);
      }
    }
    addButton('btn-ghost', 'Close', undefined, close);
    track('generate_lead', { mode, connected: sent });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault(); clearErrors();
    if (($('f-website') as HTMLInputElement).value) return;
    const name = ($('f-name') as HTMLInputElement).value.trim();
    const phone = ($('f-phone') as HTMLInputElement).value.trim();
    const digits = phone.replace(/\D/g, '');
    if (!name) return showError('name');
    if (digits.length < 10 || digits.length > 13) return showError('phone');
    const lead = {
      type: mode === 'demo' ? 'Demo request' : 'Call me request', name, phone,
      company: mode === 'demo' ? ($('f-company') as HTMLInputElement).value.trim() : '',
      source, page: location.href.split('#')[0], submitted: new Date().toISOString()
    };
    const endpoint = mode === 'call' ? LEADS.callMeEndpoint || LEADS.formEndpoint : LEADS.formEndpoint;
    if (!endpoint) return finish(false, lead);
    btn.disabled = true; btn.textContent = 'Sending…';
    fetch(endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(lead) })
      .then(() => finish(true, lead))
      .catch(() => finish(false, lead));
  });
}
