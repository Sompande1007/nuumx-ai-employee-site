// Approved copy for "How it works" (source: ../../content/how-it-works.md). Change the words here, not in the component.

export type HowStep = {
  n: string;
  key: string;
  channel: string;
  icon: string;
  /** Minutes since midnight of the first day; 9:00 am the next day is 33 * 60. Drives the rolling clock. */
  minutes: number;
  title: string;
  body: string;
  remembers: string;
  viewer: string;
  /** Desktop callout: a one-line note, and the part of the phone screen its hairline points at. */
  note: string;
  target: string;
};

export const HOW = {
  title: 'One lead. Five channels.',
  titleSoft: 'One memory.',
  lede: 'One enquiry, start to finish: a late-night chat on your website that becomes a booked site visit by morning. Riya carries every detail from one channel to the next, so your customer never has to repeat herself.',
  steps: [
    {
      n: '01', key: 'Capture', channel: 'Website chat', icon: 'chat-outline', minutes: 23 * 60 + 40,
      title: 'Answers in seconds.',
      body: 'Priya asks what a 3BHK would cost. Riya answers from your own price list, then takes her name, number and what she needs.',
      remembers: '3BHK interiors, Pune', viewer: 'What Priya sees',
      note: 'Answers from your own price list, then takes her name and number.', target: '.hw-mb--them'
    },
    {
      n: '02', key: 'Qualify', channel: 'Phone call', icon: 'call-outline', minutes: 23 * 60 + 42,
      title: 'Calls back in two minutes, already briefed.',
      body: 'No "how can I help you?". Riya opens with Priya\'s own question, then confirms budget, timeline and style in a natural voice, in any of 16+ languages. Hot leads can be transferred to your team mid-call.',
      remembers: '₹6-8 lakh, moving in by March', viewer: 'What Priya sees',
      note: 'Opens with her own question, then confirms budget, timeline and style.', target: '.hw-cc'
    },
    {
      n: '03', key: 'Nurture', channel: 'WhatsApp', icon: 'sms-outline', minutes: 23 * 60 + 47,
      title: 'Sends what was promised.',
      body: 'The brochure, three past projects and three slots for a free site visit. Priya picks Saturday, 11 am.',
      remembers: 'Site visit, Sat 11:00 am', viewer: 'What Priya sees',
      note: 'The brochure and three visit slots, exactly as promised. She picks Saturday.', target: '.hw-slots'
    },
    {
      n: '04', key: 'Confirm', channel: 'Email', icon: 'mail-outline', minutes: 23 * 60 + 48,
      title: 'Puts it in writing.',
      body: 'An indicative estimate and a calendar invite. On Friday evening, a reminder call and the location pin.',
      remembers: 'Estimate sent, reminder set', viewer: 'What Priya sees',
      note: 'An estimate and a calendar invite. A reminder call on Friday.', target: '.hw-inv'
    },
    {
      n: '05', key: 'Convert', channel: 'CRM', icon: 'database-outline', minutes: 33 * 60,
      title: 'Your team walks in to a booked visit.',
      body: 'Every message, call recording and next step is already logged, scored and assigned to Rahul, in your CRM, Google Sheets or CR-X. He starts with the whole story, not a name and a number.',
      remembers: 'Visit booked, owner Rahul', viewer: 'What Rahul sees at 9:00 am',
      note: 'Rahul starts with the whole story, already logged in your CRM.', target: '.hw-note'
    }
  ] satisfies HowStep[],
  afterwards: 'After the visit, Riya sends the proposal the same evening and follows up on day 2 and day 5, until Priya is ready to decide.',
  stats: [
    { big: '2 min', label: 'First call back, at any hour' },
    { big: '0', label: 'Follow-ups your team has to remember' },
    { big: '24/7', label: 'Including the 11:40 pm enquiries' }
  ],
  closing: 'See this running on your own leads.'
};

/** "11:40" and "pm" for a minutes value; hours are not zero-padded. */
export function clockParts(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24, mm = minutes % 60, h12 = h24 % 12 || 12;
  return { time: `${h12}:${String(mm).padStart(2, '0')}`, ap: h24 >= 12 ? 'pm' : 'am' };
}
