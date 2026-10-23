// Approved copy for "Industries" (source: ../../content/industries.md, v2). Change the words here, not in the component.
// The sentence plays like one looping film: Riya deletes and retypes the two phrases, beat by beat, then ends on
// "every enquiry into a customer" and starts again.

export const INDUSTRIES = {
  eyebrow: 'Built for your industry',
  lead: 'Riya turns every',
  joiner: 'into',
  beats: [
    { enquiry: 'interior design enquiry', outcome: 'a scheduled design consultation' },
    { enquiry: 'property enquiry', outcome: 'a scheduled site visit' },
    { enquiry: 'admission enquiry', outcome: 'a counselling appointment' },
    { enquiry: 'patient enquiry', outcome: 'a confirmed appointment' },
    { enquiry: 'loan enquiry', outcome: 'a submitted application' },
    { enquiry: 'policy renewal', outcome: 'a renewal on time' },
    { enquiry: 'course enquiry', outcome: 'an enrolment conversation' },
    { enquiry: 'enquiry', outcome: 'a customer' }
  ],
  // what screen readers hear once, instead of the moving phrases
  summary: 'Riya turns every enquiry into a customer: interior design enquiries into scheduled design consultations, property enquiries into scheduled site visits, admission enquiries into counselling appointments, patient enquiries into confirmed appointments, loan enquiries into submitted applications, policy renewals into renewals on time, and course enquiries into enrolment conversations.',
  supporting: 'Whatever you sell, Riya learns your products, prices and scripts during onboarding, then works every lead the same way: chat, call, WhatsApp, email and CRM.',
  call: 'Get a call from Riya',
  callLong: ', as your customer would',
  small: 'Don’t see your industry? Riya is trained on yours during onboarding.'
} as const;
