// Approved copy for "How it helps your business" (source: ../../content/how-it-helps.md). Change the words here, not in the component.

export const HELPS = {
  title: 'What your business gains.',
  titleSoft: 'Every lead, worked to the end.',
  lede: 'One AI Employee with one connected system behind it: more leads converted, less effort for your team, a better experience for your customers, and full visibility for you.',
  cta: 'Calculate your ROI',
  gains: [
    {
      short: 'More revenue',
      title: 'More revenue',
      line: 'Every lead, followed through.',
      points: [
        ['Never miss a lead.', 'Every enquiry answered, day or night, Sundays and holidays included.'],
        ['Reach leads first.', 'A call back within minutes, before they talk to a competitor.'],
        ['Follow up until they decide.', 'Calls, WhatsApp and email on schedule, until it’s a yes or a no.']
      ]
    },
    {
      short: 'Lower cost',
      title: 'Lower cost and effort',
      line: 'Grow without adding headcount.',
      points: [
        ['Costs less than one hire.', 'Plans from ₹15,000/month + GST, against a full salary per caller.'],
        ['Frees your team.', 'No more dialling, chasing and data entry. Your people focus on closing.'],
        ['Handles spikes.', 'Up to 30 calls at the same time when a campaign takes off.']
      ]
    },
    {
      short: 'Better experience',
      title: 'Better customer experience',
      line: 'Fast, personal, in their language.',
      points: [
        ['No repeating their story.', 'One memory across chat, call, WhatsApp and email.'],
        ['Their language, their channel.', 'Hindi, English and regional languages, on the channel they prefer.'],
        ['A human when it matters.', 'Warm handoff to your team, with the full conversation history.']
      ]
    },
    {
      short: 'Full control',
      title: 'Full control and visibility',
      line: 'Know exactly what is happening.',
      points: [
        ['Complete CRM data.', 'Every conversation, summary and next step recorded automatically.'],
        ['One dashboard, chat to deal.', 'The whole funnel, not five separate reports.'],
        ['Consistent quality.', 'The same approved script and tone on every call.']
      ]
    }
  ]
} as const;
