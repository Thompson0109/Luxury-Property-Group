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

// The featured cards' description on the live site, verbatim.
const LOREM = 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.'

export const sectionOverrides = {
  home: {
    // Both destination blocks run Salient's swiper-backed slider rather
    // than a stack of images: a fixed 400px frame, `classic` controls —
    // a 50x60 chevron on rgba(0,0,0,.4) either side and a row of bullets
    // under it — rotating every 5.5s. Measured 593x400 in a 653px
    // column on the hosted site.
    //
    // The lead paragraph of each block is a `<strong>` there too.
    1: {
      boldLead: [0, 1],
      carousel: { kind: 'slider', height: 400, autorotate: 5500 },
    },
    // `parallax_section nectar-parallax-enabled` with
    // `data-parallax-speed="fast"` — the Our Story band.
    2: { parallax: 'fast' },
    // One sentence, not the paragraph: the source is
    // `<strong>Indulge ... properties.</strong> Our portfolio ...`.
    3: { boldLead: { 0: 'sentence' } },
    // The featured strip is a Flickity row: three across on desktop, two
    // on tablet, one on phone, 10px between cells, `overflow: visible` so
    // the next cell peeks past the edge, advancing every 2.5s with no
    // visible controls.
    //
    // ⚠ The captions below are the placeholder copy the live site
    // actually ships — WordPress titles each card from the attachment
    // title, which nobody has edited off the filename, and the
    // description is untouched lorem. Reproduced so the card layout
    // matches; replace with real property copy when it exists.
    4: {
      carousel: {
        kind: 'flickity',
        columns: { desktop: 3, smallDesktop: 3, tablet: 2, phone: 1 },
        spacing: 10,
        autoplay: 2500,
        overflow: 'visible',
        captions: [
          { title: 'Barbados-1', text: LOREM },
          { title: 'South-of-France-1', text: LOREM },
          { title: 'Barbados-1', text: LOREM },
          { title: 'South-of-France-1', text: LOREM },
          { title: 'Barbados-1', text: LOREM },
          { title: 'South-of-France-1', text: LOREM },
        ],
      },
    },
    5: { boldLead: [0] },
    // Louis's call rather than a match: the live row is an 8|4 with its
    // copy ranged left, but the wave footage behind it runs bright in
    // places and the type was getting lost. Centred, on a scrim.
    6: { center: true, background: { overlay: '#000000' } },
  },

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
    // The extractor dropped this row's heading — it is wrapped in a
    // `nectar-split-heading`, which the flattener walks past — and the
    // two trailing spacers with it. Without them the band renders at
    // 376px against the 820px the live site gives it.
    2: {
      prepend: [{ type: 'heading', level: 'h3', text: 'Why Choose Elegant Address' }],
      append: [
        { type: 'spacer', height: 30 },
        { type: 'spacer', height: 350 },
      ],
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
        // measured: the row itself is unpadded and the column inside
        // it carries `padding-4-percent`.
        layout: { pad: 4, cols: [12], fill: 'both' },
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

    const {
      padTop, padBottom, center, fullWidth, hero, prepend, append, boldLead,
      keyValue, background, ...rest
    } = o
    const layout = { ...section.layout }
    if (center) layout.center = true
    if (fullWidth) layout.fullWidth = true
    if (padTop !== undefined) layout.padTop = padTop
    if (padBottom !== undefined) layout.padBottom = padBottom

    let groups = section.groups || []

    // The hero flag belongs on the display heading, not the row.
    if (hero) {
      groups = groups.map((g) =>
        g.map((b) => (b.type === 'heading' && b.level === 'h2' ? { ...b, hero: true } : b)))
    }

    // The standfirst of the named groups — the first paragraph of their
    // first text block. `boldLead` is either a list of group indices or
    // an object mapping a group index to the emphasis mode, so a row
    // that bolds one sentence can say so.
    if (boldLead) {
      const modeFor = (gi) => (Array.isArray(boldLead)
        ? (boldLead.includes(gi) ? true : null)
        : (boldLead[gi] ?? null))

      groups = groups.map((g, gi) => {
        const mode = modeFor(gi)
        if (!mode) return g
        let done = false
        return g.map((b) => {
          if (done || b.type !== 'text') return b
          done = true
          return { ...b, lead: mode }
        })
      })
    }

    // "Key: value" lists — every text block in the named groups.
    if (keyValue) {
      groups = groups.map((g, gi) => (
        keyValue.includes(gi)
          ? g.map((b) => (b.type === 'text' ? { ...b, keyValue: true } : b))
          : g
      ))
    }

    // Blocks the extractor lost. Applied to the first group, which is
    // where every instance of this belongs.
    if (prepend || append) {
      groups = groups.map((g, gi) =>
        gi === 0 ? [...(prepend || []), ...g, ...(append || [])] : g)
    }

    return {
      ...section,
      layout,
      groups,
      ...(background ? { background: { ...section.background, ...background } } : {}),
      ...rest,
    }
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
