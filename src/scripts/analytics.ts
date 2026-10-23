/**
 * Analytics and attribution. Pushes events to window.dataLayer, which Google Tag Manager or GA4 pick up
 * when their tag is added. Campaign parameters are kept for the whole visit and attached to every lead.
 */
declare global { interface Window { dataLayer: Record<string, unknown>[] } }

export function track(event: string, data: Record<string, unknown> = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

export function campaignSource(): string {
  const q = new URLSearchParams(location.search);
  const now = KEYS.filter((k) => q.get(k)).map((k) => `${k}=${q.get(k)}`).join('&');
  try {
    if (now) sessionStorage.setItem('nx_utm', now);
    return now || sessionStorage.getItem('nx_utm') || 'direct';
  } catch {
    return now || 'direct';
  }
}

export function initClickTracking() {
  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest?.('[data-track]');
    if (el) track('cta_click', { cta: el.getAttribute('data-track') });
  });
}
