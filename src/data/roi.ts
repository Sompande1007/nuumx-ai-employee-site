// Copy, slider ranges and maths for the ROI calculator (section 6). The maths and prices follow the reference page's
// "What your AI Employee is worth" calculator. Change the words or numbers here, not in the component or script.

export const ROI = {
  eyebrow: 'What Riya is worth',
  title: 'See what one AI Employee',
  titleSoft: 'adds to your month.',
  lede: 'Move the sliders to match your business. It starts with conservative numbers for a growing business.',
  fineTune: 'Fine-tune: team time and tele-caller cost',
  receipt: {
    head: 'Your month with Riya',
    rev: 'Revenue from recovered leads',
    staff: 'Team time freed up',
    net: 'Net gain, every month',
    cta: 'Book a free demo',
    fine: 'Estimates, not a guarantee. Excludes 18% GST.',
    how: 'How we calculate this'
  },
  dock: { label: 'Net gain, every month', cta: 'See the breakdown' },
  calcTitle: 'How we calculate this',
  calc: [
    ['Recovered revenue', '= enquiries not followed up × half your normal conversion × average deal value. We halve it to stay conservative.'],
    ['Team time freed up:', 'Riya takes over 80% of the follow-up work per enquiry. Hours saved ÷ 160 × monthly cost of one tele-caller.'],
    ['Plan', 'assumes about 8 call minutes per enquiry: Growth up to about 430 enquiries a month, Pro up to 1,000, Enterprise above that, with extra minutes at ₹5 each.'],
    ['Return', '= (recovered revenue + team time freed) ÷ plan. Payback = standard setup of ₹85,000 (setup, one role, WhatsApp onboarding) ÷ daily net gain.']
  ]
} as const;

/** fmt: how the slider's value is shown ('num' 1,234 · 'pct' 25% · 'inr' ₹2 lakh · 'min' 20 min). more: sits under Fine-tune. */
export const ROI_SLIDERS = [
  { key: 'leads', label: 'Enquiries per month', min: 100, max: 3000, step: 50, value: 400, fmt: 'num' },
  { key: 'missed', label: 'Enquiries not followed up properly', hint: 'Missed calls, after-hours leads, slow follow-ups', min: 5, max: 60, step: 5, value: 25, fmt: 'pct' },
  { key: 'conv', label: 'Your enquiry-to-sale conversion', min: 0.5, max: 50, step: 0.5, value: 3, fmt: 'pct' },
  { key: 'deal', label: 'Average deal value', min: 5000, max: 1000000, step: 5000, value: 200000, fmt: 'inr' },
  { key: 'mins', label: 'Team time per enquiry', hint: 'Calls, call-backs, WhatsApp, email and CRM entry', min: 5, max: 60, step: 5, value: 20, fmt: 'min', more: true },
  { key: 'sal', label: 'Monthly cost of one tele-caller', min: 10000, max: 60000, step: 1000, value: 22000, fmt: 'inr', more: true }
] as const;

export const ROI_MATHS = {
  recoveredShare: 0.5, // half the normal conversion, to stay conservative
  takeover: 0.8, // share of follow-up work Riya takes over
  fteHours: 160,
  callMinPerEnquiry: 8,
  plans: [
    { name: 'Growth', upTo: 437, fee: 30000 },
    { name: 'Pro', upTo: 1000, fee: 50000 },
    { name: 'Enterprise', upTo: Infinity, fee: 75000, includedMin: 15000, perExtraMin: 5 }
  ],
  setup: 85000 // ₹40,000 setup + ₹30,000 one role + ₹15,000 WhatsApp onboarding
} as const;
