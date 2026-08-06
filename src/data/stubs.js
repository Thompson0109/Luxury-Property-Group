/**
 * Pages that are published in WordPress but have completely empty
 * content. They are not extraction failures — post_content is zero bytes
 * in the dump. Kept here so navigation can link honestly instead of 404,
 * and so it's obvious what still needs writing.
 */
export const emptyPages = [
  { slug: 'saint-jean-cap-ferrat',     title: 'Saint Jean Cap Ferrat' },
  { slug: 'cap-dantibes',              title: "Cap d'Antibes" },
  { slug: 'cannes',                    title: 'Cannes' },
  { slug: 'villefranche-and-villages', title: 'Villefranche and Villages' },
  { slug: 'saint-tropez',              title: 'Saint Tropez' },
  { slug: 'mougins-and-villages',      title: 'Mougins and Villages' },
  { slug: 'terms-and-conditions',      title: 'Terms and Conditions' },
]

export const isEmptyPage = (slug) => emptyPages.some((p) => p.slug === slug)

export default emptyPages
