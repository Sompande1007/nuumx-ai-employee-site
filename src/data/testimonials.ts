// Testimonials (source: ../../content/testimonials.md).
//
// PLACEHOLDER DATA. Every client below is invented sample content, made so the section could be designed before real
// clients were collected. While SAMPLE is true, each card shows a "Sample" tag and the section is left out of
// production builds entirely (see Testimonials.astro), so these can never go live as real testimonials.
// To launch: replace every item with a real client (exact words, written permission), then set SAMPLE to false.

export const SAMPLE = true;

export type Tint = 'mist' | 'sage' | 'sand';
export type Receipt =
  | { kind: 'wa'; time: string; msgs: { text: string; mine?: boolean; stamp?: string }[] }
  | { kind: 'call'; length: string; time: string; note: string }
  | { kind: 'cal'; time: string; month: string; day: string; title: string; when: string }
  | { kind: 'crm'; time: string; from: string; to: string; bar?: { pct: number; note: string } }
  | { kind: 'mail'; time: string; subject: string; body: string };

export type Testimonial = {
  industry: string;
  result: string;
  resultLabel: string;
  receipt: Receipt;
  chips: [Tint, string][];
  quote: string;
  role: string;
  business: string;
  initials: string;
};

export const TESTIMONIALS_HEAD = {
  title: 'Businesses that stopped losing leads.',
  titleSoft: 'In their words.',
  pill: '12 businesses · 8 industries',
  lede: 'Owners on what changed once every lead was worked to the end.'
};

export const TESTIMONIALS: Testimonial[] = [
  { industry: 'Home & interiors', result: '2 min', resultLabel: 'call-back time, was next morning',
    receipt: { kind: 'wa', time: '11:47 pm', msgs: [{ text: 'Here are 3 slots for your free design consultation.' }, { text: 'Saturday 11 am, please', mine: true, stamp: '11:47 pm ✓✓' }] },
    chips: [['mist', 'Called in 2 min'], ['sage', 'Visit booked']],
    quote: '“Our Instagram enquiries come after 9 pm. Now the visits are on my calendar by morning.”', role: 'Founder', business: 'Interior design studio · Pune', initials: 'ID' },
  { industry: 'Real estate', result: '600', resultLabel: 'launch leads called in one weekend',
    receipt: { kind: 'crm', time: 'Sun 8:10 pm', from: 'New lead', to: 'Called', bar: { pct: 100, note: '600 of 600 called · 84 site visits' } },
    chips: [['mist', 'Every lead called'], ['sand', 'Hot leads to sales']],
    quote: '“My team only spoke to the people ready to visit.”', role: 'Sales head', business: 'Residential developer · Bengaluru', initials: 'RD' },
  { industry: 'Education', result: '−30%', resultLabel: 'counselling no-shows',
    receipt: { kind: 'call', length: '6 min', time: '9:18 pm', note: 'Fees, scholarships and intake dates answered.' },
    chips: [['mist', 'Hindi + English'], ['sage', 'Slot booked']],
    quote: '“Riya answers the same ten questions and books the slot.”', role: 'Admissions director', business: 'Business school · Mumbai', initials: 'BS' },
  { industry: 'Clinics', result: '3 h', resultLabel: 'a day back for the front desk',
    receipt: { kind: 'cal', time: 'Mon 6:02 pm', month: 'TUE', day: '14', title: 'Physiotherapy session', when: 'Tue 9:00 am · reminder sent' },
    chips: [['sage', 'Reminder sent'], ['mist', 'Rescheduled']],
    quote: '“Reminders and reschedules used to take a whole morning.”', role: 'Owner', business: 'Physiotherapy clinics · Delhi', initials: 'PC' },
  { industry: 'Home loans', result: '4×', resultLabel: 'applications started per week',
    receipt: { kind: 'mail', time: 'Fri 7:31 pm', subject: 'Your home-loan application link', body: 'Documents checklist attached. Takes about 10 minutes.' },
    chips: [['mist', 'Same-evening call'], ['sage', 'Application started']],
    quote: '“Ad leads used to wait till Monday. Now they’re called that evening.”', role: 'Branch head', business: 'Home-loan advisors · Hyderabad', initials: 'HL' },
  { industry: 'Insurance', result: '24×7', resultLabel: 'renewal reminders, never missed',
    receipt: { kind: 'wa', time: 'Diwali week', msgs: [{ text: 'Your policy renews on 14 Nov. Shall I send the renewal link?' }, { text: 'Yes please', mine: true, stamp: '8:02 pm ✓✓' }] },
    chips: [['sand', 'Renewal due'], ['sage', 'Renewed']],
    quote: '“Renewals used to slip in festival weeks.”', role: 'Partner', business: 'Insurance advisory · Ahmedabad', initials: 'IA' },
  { industry: 'Home & interiors', result: '35', resultLabel: 'consultations booked in a month',
    receipt: { kind: 'crm', time: 'Thu 10:12 pm', from: 'Enquiry', to: 'Consultation booked' },
    chips: [['mist', 'Budget ₹6–8 L'], ['sage', 'Qualified']],
    quote: '“Our designers now only meet people with a budget and a date.”', role: 'Co-founder', business: 'Modular kitchens · Chennai', initials: 'MK' },
  { industry: 'Real estate', result: '11 pm', resultLabel: 'when most visits now get booked',
    receipt: { kind: 'cal', time: 'Sat 11:04 pm', month: 'SUN', day: '9', title: 'Site visit · Villa 3B', when: 'Sun 11:00 am · directions on WhatsApp' },
    chips: [['mist', 'Booked at 11 pm'], ['sage', 'Visit booked']],
    quote: '“Buyers browse late at night. Riya is the only one awake.”', role: 'Director', business: 'Villa projects · Goa', initials: 'VP' },
  { industry: 'Education', result: '1,200', resultLabel: 'parent enquiries answered in admission week',
    receipt: { kind: 'crm', time: 'Admission week', from: 'Missed call', to: 'Called back', bar: { pct: 100, note: '1,200 of 1,200 parents called back' } },
    chips: [['mist', 'Every parent called']],
    quote: '“This year every parent got a call back, not a missed call.”', role: 'Principal', business: 'K-12 school · Jaipur', initials: 'KS' },
  { industry: 'Coaching', result: '2', resultLabel: 'languages in one call, as students switch',
    receipt: { kind: 'call', length: '5 min', time: '8:40 pm', note: 'Switches Hindi ↔ English mid-sentence, like the student.' },
    chips: [['mist', 'Hindi'], ['mist', 'English'], ['sage', 'Demo class booked']],
    quote: '“Students switch languages mid-call. Riya keeps up.”', role: 'Founder', business: 'Test-prep institute · Kota', initials: 'TP' },
  { industry: 'Dental', result: '−40%', resultLabel: 'missed appointments',
    receipt: { kind: 'wa', time: 'Day before', msgs: [{ text: 'Reminder: your appointment is tomorrow at 10:30 am. Reply 1 to confirm.' }, { text: '1', mine: true, stamp: '6:15 pm ✓✓' }] },
    chips: [['sage', 'Confirmed'], ['mist', 'Reminder sent']],
    quote: '“The day-before reminder alone changed our mornings.”', role: 'Owner', business: 'Dental clinics · Kochi', initials: 'DC' },
  { industry: 'Diagnostics', result: '5 min', resultLabel: 'from web booking to confirmation call',
    receipt: { kind: 'call', length: '2 min', time: '7:05 am', note: 'Home sample pickup confirmed for 8:30 am.' },
    chips: [['mist', 'Called in 5 min'], ['sage', 'Pickup confirmed']],
    quote: '“Patients get a call before they’ve closed the tab.”', role: 'Operations head', business: 'Diagnostics lab · Lucknow', initials: 'DL' }
];
