// "It doesn't replace your team. It frees them." (its own section, right after What it replaces).
// A calendar defrag: one salesperson's week, packed with busywork, is cleared into Riya and refills with selling time.
// The week is illustrative (labelled as such on the page), not client data.

export const FREES = {
  title: 'It doesn’t replace your team.',
  titleSoft: 'It frees them.',
  weekBefore: ['One salesperson’s week', 'Packed with busywork'],
  weekAfter: ['The same week, with Riya', 'Selling time'],
  riyaTitle: 'Riya · 24×7',
  riyaSub: 'Takes the busywork off the calendar',
  totalLabel: 'Handled by Riya this week',
  note: 'Illustrative week.',
  summaryRiya: 'Riya does',
  summaryRiyaText: 'the calling back, qualifying, following up, booking and reminding, and keeps the CRM up to date.',
  summaryTeam: 'Your team keeps',
  summaryTeamText: 'the consulting, the relationships, the negotiation and the close.',
  start: 10,
  end: 19,
  days: [['Mon', '13'], ['Tue', '14'], ['Wed', '15'], ['Thu', '16'], ['Fri', '17']],
  tasks: [
    { id: 'call', label: 'Calls back every enquiry' },
    { id: 'qual', label: 'Qualifies' },
    { id: 'follow', label: 'Follows up' },
    { id: 'remind', label: 'Books and reminds' },
    { id: 'crm', label: 'Updates the CRM' }
  ],
  // [day index, start hour, duration in hours, label, task id]
  busy: [
    [0, 10, 1, 'Dialling new enquiries', 'call'], [0, 11.5, 0.5, 'Follow-ups', 'follow'], [0, 14, 1, 'Typing CRM notes', 'crm'], [0, 16, 1, 'Callbacks', 'call'],
    [1, 10.5, 1, 'Chasing leads', 'follow'], [1, 13, 1.5, 'Dialling', 'call'], [1, 15, 1, 'Qualifying calls', 'qual'], [1, 17, 1, 'CRM notes', 'crm'],
    [2, 10, 0.5, 'Reminders', 'remind'], [2, 11, 1, 'Callbacks', 'call'], [2, 15, 1.5, 'Follow-ups', 'follow'],
    [3, 10, 1.5, 'Dialling', 'call'], [3, 12, 0.5, 'Qualifying', 'qual'], [3, 13.5, 1, 'Chasing', 'follow'], [3, 16.5, 1, 'CRM notes', 'crm'],
    [4, 10.5, 1, 'Follow-ups', 'follow'], [4, 12, 0.5, 'Reminders', 'remind'], [4, 14, 1, 'Dialling', 'call']
  ] as [number, number, number, string, string][],
  // [day index, start hour, duration in hours, title, detail]
  human: [
    [0, 11, 2, 'Client meeting', 'The Mehtas · 3BHK'], [0, 15, 1.5, 'Consult', 'New enquiry, qualified'],
    [1, 11, 3, 'Site visit', 'Villa 3B'], [2, 12, 1.5, 'Consult', 'Kitchen redesign'], [2, 16, 1.5, 'Key account', 'Quarterly review'],
    [3, 11, 2, 'Negotiation', 'Rahul M. · 2BHK'], [4, 15, 1.5, 'Closing call', 'Signing']
  ] as [number, number, number, string, string][]
};
