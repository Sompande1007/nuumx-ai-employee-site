/**
 * Site-wide settings. Edit here, not in the components.
 *
 * leads.formEndpoint   URL that stores leads (Google Apps Script, CRM webhook, n8n, Zapier...).
 * leads.callMeEndpoint URL that makes Riya call the visitor (your voice platform's outbound-call hook).
 * While an endpoint is empty, that form hands the lead off to WhatsApp instead,
 * so no visitor is ever told something happened when it did not.
 */
export const SITE = {
  name: 'nuumx AI Employee',
  description:
    'Your chatbot, dialer, WhatsApp, inbox and CRM, replaced by one AI Employee that works every lead, day and night. Book a free demo.',
  ogTitle: 'Five apps. One AI Employee.',
  ogDescription:
    'One AI Employee that chats, calls, follows up on WhatsApp and email, and updates your CRM. Book a free demo.',
  // Only sections that exist, in page order. Add Pricing (and Testimonials, once real clients replace the samples)
  // when they are built.
  nav: [
    { label: 'What it replaces', href: '#replaces', track: 'nav_replaces' },
    { label: 'How it works', href: '#how', track: 'nav_how' },
    { label: 'Benefits', href: '#helps', track: 'nav_helps' },
    { label: 'Industries', href: '#industries', track: 'nav_industries' },
    { label: 'FAQ', href: '#faq', track: 'nav_faq' }
  ]
} as const;

export const LEADS = {
  formEndpoint: '',
  callMeEndpoint: '',
  whatsapp: '918808102108',
  bookingUrl: 'https://www.nuumx.ai/calendar'
};
