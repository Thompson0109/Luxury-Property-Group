/**
 * site.js — single source of truth for site-wide content.
 *
 * ⚠ PROVENANCE
 * Values marked TODO:DB could not be read from the upload, because the
 * WordPress `public/` folder contains code and media only — every page,
 * menu, option and form definition lives in the MySQL database, which
 * wasn't included. The values below are placeholders taken from the
 * public Elegant Address sites so the app renders; they must be
 * reconciled against the real `wp_options` / `wp_posts` rows.
 */

export const site = {
  name: 'Elegant Address',
  legalName: 'Elegant Address Luxury Property Group Ltd',
  tagline: 'Luxury Property Group',

  // TODO:DB — confirm against wp_options.blogdescription
  description:
    'Independent luxury property consultants finding exceptional villas, ' +
    'apartments and chalets for rental and sale.',
}

export const contact = {
  // TODO:DB — confirm against the live footer / Contact Form 7 recipient
  offices: [
    { label: 'Head Office', tel: '+44 (0) 1244 62 99 63', href: 'tel:+441244629963' },
    { label: 'London Office', tel: '+44 (0) 2037 57 66 09', href: 'tel:+442037576609' },
  ],

  email: 'enquiries@elegant-address.com',

  address: {
    company: 'Elegant Address Luxury Property Group',
    lines: ['Egerton House', '55 Hoole Road', 'Chester', 'CH2 3NJ', 'United Kingdom'],
  },

  openingHours: [
    { days: 'Monday – Friday', hours: '9.00am – 5.30pm' },
  ],

  companyNumber: '5931566',
}

// TODO:DB — the live social URLs are in the Salient theme options
export const social = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'LinkedIn', href: '#' },
]
