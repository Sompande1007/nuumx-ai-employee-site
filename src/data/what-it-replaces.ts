// Approved copy for "What it replaces" (source: ../../content/what-it-replaces.md). Change the words here, not in the component.
// A calm spec comparison: each row has one figure and a short caption for Today and for With Riya.

export const REPLACES = {
  title: 'It replaces the busywork.',
  titleSoft: 'Not your people.',
  lede: 'Your team spends its day dialling, chasing and typing. Here is the same work, compared.',
  today: 'Today',
  riya: 'With Riya',
  rows: [
    { label: 'Hours', today: ['9 h', 'One shift, 10 to 7'], riya: ['24 h', 'Every day of the year'] },
    { label: 'Calls at once', today: ['1', 'One at a time'], riya: ['30', 'Together'] },
    { label: 'Follow-ups', today: ['Some', 'When someone remembers'], riya: ['Every one', 'On schedule'] },
    { label: 'CRM', today: ['Day’s end', 'Typed late, if at all'], riya: ['Instant', 'After every conversation'] },
    { label: 'Tools', today: ['5', 'Vendors, logins, bills'], riya: ['1', 'Partner, dashboard, invoice'] },
    { label: 'Hiring', today: ['Again', 'Hire and retrain'], riya: ['Once', 'Trained once, keeps improving'] }
  ]
} as const;
