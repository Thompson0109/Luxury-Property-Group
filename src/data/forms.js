/**
 * Ported from the Contact Form 7 definitions in wp_postmeta (`_form`).
 * Field names match the originals exactly so existing mail templates and
 * any CRM integrations keep working.
 */
export const forms = {
  // "Contact form 1" — used on /contact
  6: {
    id: 'contact',
    submitLabel: 'Send Enquiry',
    fields: [
      { name: 'your-name',    label: 'Name',         type: 'text',     required: true, placeholder: 'Name',            width: 'half', autoComplete: 'name' },
      { name: 'your-number',  label: 'Phone number', type: 'tel',      required: true, placeholder: 'Phone Number',    width: 'half', autoComplete: 'tel' },
      { name: 'your-email',   label: 'Email address', type: 'email',   required: true, placeholder: 'Email Address',   autoComplete: 'email' },
      { name: 'your-subject', label: 'Subject',      type: 'text',     required: true, placeholder: "What is it you'd like to discuss" },
      { name: 'your-message', label: 'Message',      type: 'textarea', required: false, placeholder: 'Type your message here...', rows: 4 },
    ],
  },

  // "Property Enquiry Form" — used on individual portfolio items
  38811: {
    id: 'property-enquiry',
    submitLabel: 'Submit',
    fields: [
      { name: 'your-name',      label: 'Your name',              type: 'text',  required: true, autoComplete: 'name' },
      { name: 'your-email',     label: 'Your email',             type: 'email', required: true, autoComplete: 'email' },
      { name: 'your-arrival',   label: 'Preferred arrival date',   type: 'date',  required: true },
      { name: 'your-departure', label: 'Preferred departure date', type: 'date',  required: true },
      { name: 'your-guests',    label: 'Number of guests',       type: 'text',  required: true },
    ],
  },
}

export default forms
