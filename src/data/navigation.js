/**
 * Ported from the "Header 1" menu in wp_posts / wp_term_relationships
 * (taxonomy = nav_menu), in the original menu_order.
 *
 * Permalinks were `/%postname%/`, so slugs are flat and are kept as-is to
 * preserve inbound links — with one exception, noted below.
 */
export const primaryNav = [
  {
    label: 'Destinations',
    children: [
      { label: 'South of France', to: '/south-of-france' },
      { label: 'Barbados', to: '/barbados' },
    ],
  },
  { label: 'Cannes Congress', to: '/cannes-congress' },
  { label: 'Approach', to: '/approach' },
  { label: 'Featured Properties', to: '/featured-properties' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

/**
 * The WordPress page slug was `/france`, but every in-page button linked
 * to `/south-of-france` — a broken link on the live site. We standardise
 * on the descriptive slug and 301 the old one.
 */
export const redirects = [
  { from: '/france', to: '/south-of-france' },
  { from: '/home', to: '/' },
]

export const footerNav = [
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
  { label: 'Terms and Conditions', to: '/terms-and-conditions' },
]
