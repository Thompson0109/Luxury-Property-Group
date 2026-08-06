/**
 * Content extracted from the WordPress database by scripts/extract.py.
 *
 * pages.json is generated — do not hand-edit it. Re-run the extractor
 * against a fresh SQL dump to pick up content changes, then review the
 * diff.
 */
import pages from './content/pages.json'

export const allPages = pages

export const getPage = (slug) =>
  pages.find((p) => p.slug === (slug ?? '').replace(/^\/|\/$/g, ''))

export const pageTitles = Object.fromEntries(
  pages.map((p) => [p.slug, p.title])
)

export default pages
