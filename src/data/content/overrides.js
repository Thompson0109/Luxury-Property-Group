/**
 * Facts about the WordPress pages that `scripts/extract.py` cannot see.
 *
 * The extractor reads `wp_posts.post_content` and flattens the WPBakery
 * shortcodes to a section model. That gets the content right, but a
 * shortcode's *attributes* — carousel column counts, per-side padding,
 * column backgrounds, entrance animations — are either dropped on the
 * way through or were never in the markup to begin with, because
 * Salient writes them from JavaScript after paint.
 *
 * Everything here was read off the running install at
 * luxury-property-group.local with `tools/wp-audit`, and is keyed by
 * page slug then section index so it stays legible against a re-run of
 * the extractor. `pages.json` remains generated and unedited.
 *
 * Section keys:
 *   padTop / padBottom  override the symmetric `layout.pad` where the
 *                       row is padded on one side only
 *   center              `data-align="center"` on the row's headings
 *   hero                the heading carries `data-custom-font-size`
 *                       (5vw / 5.5vw rather than the 45px h2 ramp)
 *   fullWidth           `full-width-content`: the row escapes the 1305px
 *                       measure and runs to the viewport
 *   carousel            the gallery in this row is a carousel, with the
 *                       configuration Salient stores in data attributes
 *   reveal / delay      the column entrance animation
 *   card                the column is a floating panel — background,
 *                       radius, depth shadow and the negative margin
 *                       that pulls it over the following row
 */

const FLICKITY_AUTOPLAY = 2500

export const sectionOverrides = {
  'cannes-congress': {
    // `.nectar-flickity` instance-0: one column at every breakpoint,
    // overflow hidden, autoplay 2500. It sits in the span-8 half.
    1: {
      carousel: {
        kind: 'flickity',
        columns: { desktop: 1, smallDesktop: 1, tablet: 1, phone: 1 },
        autoplay: FLICKITY_AUTOPLAY,
        overflow: 'hidden',
      },
    },
    // measured: 76px top, 0 bottom — the row runs straight into the
    // full-bleed carousel below it.
    3: { padBottom: 0 },
    // `.nectar-flickity` instance-1: three across on desktop, two on
    // tablet, one on phone, 10px between cells, overflow visible so the
    // next cell peeks in. `full-width-content`, so the strip is 1894px
    // wide at a 1905px viewport rather than the 1305px row measure.
    4: {
      fullWidth: true,
      carousel: {
        kind: 'flickity',
        columns: { desktop: 3, smallDesktop: 3, tablet: 2, phone: 1 },
        spacing: 10,
        autoplay: FLICKITY_AUTOPLAY,
        overflow: 'visible',
        captions: true,
      },
    },
  },

  approach: {
    // The display heading is 5vw/5.5vw and centred, with the 22px
    // uppercase kicker under it. The whole column enters on
    // `fade-in-from-bottom` at a 300ms delay — the only 300 on the site.
    0: {
      center: true,
      hero: true,
      fullWidth: true,
      reveal: 'fade-in-from-bottom',
      delay: 300,
    },
    // These two rows use the *other* carousel Salient ships — the
    // swiper-backed `.nectar-slider-wrap`, fixed at 400px with a 5.5s
    // rotation and bullet navigation, not Flickity.
    1: { carousel: { kind: 'slider', height: 400, autorotate: 5500 } },
    3: { carousel: { kind: 'slider', height: 400, autorotate: 5500 } },
    // Each of the six tiles is its own `vc_col-sm-4` with the column
    // animation on it, so they reveal as a group rather than in sequence.
    4: { tileReveal: 'fade-in-from-bottom' },
  },

  'featured-properties': {
    1: { padTop: 0, padBottom: 0 },
  },

  about: {
    // The founder portrait comes in from the right while the copy holds.
    2: { mediaReveal: 'fade-in-from-right' },
  },

  contact: {
    // measured: 114px top, 0 bottom. The row ends flush because the form
    // card hangs out of the bottom of it.
    0: {
      center: true,
      hero: true,
      padBottom: 0,
      card: {
        background: '#ffffff',
        radius: 10,
        shadow: 'x-large',
        padding: '8%',
        overlap: '-25%',
        reveal: 'grow-in',
      },
    },
    // 457px of top padding is not a design decision — it is the room the
    // card above needs after its -25% margin has pulled it down. Keeping
    // both reproduces the 131px of real gap the live site shows.
    1: { padBottom: 6 },
  },
}

/**
 * Sections the extractor produced nothing for.
 *
 * `[vc_portfolio]` renders a Salient portfolio grid from a custom post
 * type, so the page content holds a shortcode and no markup — there is
 * nothing for the flattener to walk. The three items below are the ones
 * the live grid renders, in order.
 *
 * ⚠ The source images (`image-12`, `image-3`, `image-4` under
 * `uploads/2023/07`) were not part of the media migration, so each card
 * points at the nearest equivalent already in `src/assets`. Swap the
 * paths once the originals land — nothing else needs to change.
 */
export const insertedSections = {
  'featured-properties': [
    {
      at: 1,
      section: {
        background: {},
        layout: { pad: 0, cols: [12], fill: 'both' },
        groups: [[
          {
            type: 'portfolio',
            items: [
              {
                title: 'Saint Jean Cap Ferrat 6 Bedroom Villa',
                image: 'images/properties/property-12-villa-pool.jpeg',
                href: '/featured-properties',
              },
              {
                title: 'Villa Ginger Lily',
                image: 'images/properties/property-01-infinity-pool.jpeg',
                href: '/featured-properties',
              },
              {
                title: 'Cannes CN-642: 11 Bedroom Villa',
                image: 'images/properties/property-05-terraced-gardens.jpeg',
                href: '/featured-properties',
              },
            ],
          },
        ]],
      },
    },
  ],
}

/**
 * Fold the overrides into a generated page. Returns a new object — the
 * imported JSON is never mutated.
 */
export function applyOverrides(page) {
  const slug = page.slug || 'home'
  const bySection = sectionOverrides[slug]
  const inserts = insertedSections[slug]
  if (!bySection && !inserts) return page

  let sections = (page.sections || []).map((section, i) => {
    const o = bySection?.[i]
    if (!o) return section

    const { padTop, padBottom, center, fullWidth, hero, ...rest } = o
    const layout = { ...section.layout }
    if (center) layout.center = true
    if (fullWidth) layout.fullWidth = true
    if (padTop !== undefined) layout.padTop = padTop
    if (padBottom !== undefined) layout.padBottom = padBottom

    // The hero flag belongs on the display heading, not the row.
    const groups = hero
      ? (section.groups || []).map((g) =>
          g.map((b) => (b.type === 'heading' && b.level === 'h2' ? { ...b, hero: true } : b)))
      : section.groups

    return { ...section, layout, groups, ...rest }
  })

  if (inserts) {
    // Insert back-to-front so earlier indices stay valid.
    for (const { at, section } of [...inserts].sort((a, b) => b.at - a.at)) {
      sections = [...sections.slice(0, at), section, ...sections.slice(at)]
    }
  }

  return { ...page, sections }
}

export default applyOverrides
