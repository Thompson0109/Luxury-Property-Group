/**
 * Content extracted from the WordPress database by scripts/extract.py.
 *
 * pages.json began life as generated output, and the WordPress source is
 * now retired: since the first delivery (28 Sep 2026) copy changes from the
 * client are made directly in pages.json / posts.json. Don't re-run
 * scripts/extract.py over it — that would overwrite them.
 */
import rawPages from './content/pages.json'
import { applyOverrides } from './content/overrides'

/**
 * The generated model, with the WPBakery attributes the extractor cannot
 * reach folded back in. See content/overrides.js.
 */
const pages = rawPages.map(applyOverrides)

export const allPages = pages

export const getPage = (slug) =>
  pages.find((p) => p.slug === (slug ?? '').replace(/^\/|\/$/g, ''))

export const pageTitles = Object.fromEntries(
  pages.map((p) => [p.slug, p.title])
)

export default pages

/**
 * Whether a route opens on a full-height hero.
 *
 * Salient serves a transparent header with the white logo over a
 * full-height first section and a solid white one everywhere else — the
 * port had that hard-coded to `/`, so every other page with a banner
 * (about, cannes-congress, and both destination pages) got a solid
 * header sitting on top of its photograph.
 */
export const hasFullHeightHero = (pathname) => {
  const slug = (pathname ?? '').replace(/^\/|\/$/g, '')
  const page = getPage(slug)
  return Boolean(page?.sections?.[0]?.layout?.fullHeight)
}
