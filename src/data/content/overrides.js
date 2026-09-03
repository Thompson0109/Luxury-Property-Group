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

/**
 * The three-up featured strip, identical on /, /france and /barbados.
 * ⚠ Titles and description are the placeholder copy WordPress ships —
 * attachment titles nobody edited off the filename, and untouched lorem.
 */
const featuredStrip = (titles) => ({
  kind: 'flickity',
  columns: { desktop: 3, smallDesktop: 3, tablet: 2, phone: 1 },
  spacing: 10,
  autoplay: FLICKITY_AUTOPLAY,
  overflow: 'visible',
  captions: titles.map((title) => ({ title, text: LOREM })),
})

const DESTINATION_TITLES = [
  'Barbados-1', 'South-of-France-1', 'Barbados-1',
  'South-of-France-1', 'Barbados-1', 'South-of-France-1',
]

/**
 * The "1,200+ properties in our portfolio" row on both destination
 * pages. One cell, centred at 66% of the frame with its neighbours
 * showing either side and clipped — measured 396px inside a 603px frame
 * on /france. Advances on its own; no visible controls.
 */
/**
 * The swiper-backed slider on /approach rows 1 and 3. Measured on the
 * local install: a fixed frame (452px at a 958px viewport), `classic`
 * controls, rotating every 5.5s, with the bullets sitting *inside* the
 * frame near the bottom rather than under it.
 */
const approachSlider = { kind: 'slider', height: 400, autorotate: 5500, bulletsInside: true }

const portfolioCarousel = {
  kind: 'flickity',
  columns: { desktop: 1, smallDesktop: 1, tablet: 1, phone: 1 },
  peek: 66,
  spacing: 13,
  autoplay: FLICKITY_AUTOPLAY,
  overflow: 'hidden',
}

/**
 * The closing "Our Story / Get in touch" band, shared by /france,
 * /barbados and /cannes-congress. Centre-aligned throughout on the live
 * site (`text-align: center` on the row), with the opening heading at
 * display scale, its standfirst bold, and a 3px rule between the two
 * halves.
 */
const closingBand = {
  center: true,
  boldLead: [0],
  displayHeading: [0],
  dividerBetween: true,
}

export const sectionOverrides = {
  home: {
    // measured on the local install: the hero's `.video-color-overlay`
    // runs at 0.7 over the #2b323a row. The extractor recorded it as
    // `rgba(0,0,0,1.78)`, which CSS clamps — see `overlayStyle` in
    // Section.jsx — so the value is restated here at the opacity the
    // live row carries.
    0: { background: { overlay: 'rgba(0, 0, 0, 0.7)' } },
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
    // places and the type was getting lost. Centred. The scrim it used to
    // name here is now the shared default every video row gets — see
    // Section.jsx — so it is no longer restated.
    6: { center: true },
  },

  'south-of-france': {
    0: { boldLead: [0] },
    1: { boldLead: [0], carousel: portfolioCarousel },
    // The extractor lost this heading the same way it lost
    // /cannes-congress row 2's — it is wrapped in a split-heading the
    // flattener walks past. The four paragraphs under it are a
    // "Key: value" list.
    2: {
      prepend: [{ type: 'heading', level: 'h3', text: 'Why Choose Elegant Address' }],
      keyValue: [0],
      // measured: 47px of white below the last row of cards at 958px.
      padBottom: 5,
    },
    3: { boldLead: { 0: 'sentence' } },
    4: { carousel: featuredStrip(DESTINATION_TITLES) },
    5: closingBand,
  },

  barbados: {
    0: { boldLead: [0] },
    1: { boldLead: [0], carousel: portfolioCarousel },
    2: { keyValue: [0] },
    // ⚠ Louis's screenshot shows a rule under the call-us button here
    // that /france does not have. I could not confirm it: the local
    // install has no divider element in this row, and the hosted site
    // was behind a certificate error. Added as a quiet 1px rule — adjust
    // or drop the `append` if it should be heavier or is not wanted.
    3: {
      boldLead: { 0: 'sentence' },
      append: [{ type: 'divider', variant: 'thin' }],
    },
    4: { carousel: featuredStrip(DESTINATION_TITLES) },
    5: closingBand,
  },

  // eslint-disable-next-line sort-keys
  'cannes-congress': {
    // `parallax_section nectar-parallax-enabled` on the hero, same as
    // the Our Story band on the home page.
    0: { boldLead: [0], parallax: 'fast' },
    // The same centre-mode carousel as the other destination pages.
    1: { boldLead: [0], carousel: portfolioCarousel },
    // The extractor dropped this row's heading — it is wrapped in a
    // `nectar-split-heading`, which the flattener walks past — and the
    // two trailing spacers with it. Without them the band renders at
    // 376px against the 820px the live site gives it.
    2: {
      prepend: [{ type: 'heading', level: 'h3', text: 'Why Choose Elegant Address' }],
      append: [{ type: 'spacer', height: 30 }],
    },
    // measured: 76px top, 0 bottom on the live site — but with the
    // carousel below now carrying its own 80px viewport inset, dropping
    // to zero here left the call-us button sitting on the strip at
    // narrow widths. A small band keeps the gap at every size.
    3: { boldLead: { 0: 'sentence' }, padBottom: 2 },
    // Same closing band as the destination pages.
    5: closingBand,
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
    // Same 0.7 video scrim as the home hero.
    0: {
      background: { overlay: 'rgba(0, 0, 0, 0.7)' },
      center: true,
      hero: true,
      fullWidth: true,
      reveal: 'fade-in-from-bottom',
      delay: 300,
    },
    // These two rows use the *other* carousel Salient ships — the
    // swiper-backed `.nectar-slider-wrap`, fixed at 400px with a 5.5s
    // rotation and bullet navigation, not Flickity. Both rows run the
    // same configuration, so matching the second to the first is a
    // matter of the shared styling rather than the data.
    1: { boldLead: [0], carousel: approachSlider },
    2: { boldLead: [0], parallax: 'fast' },
    3: { boldLead: [0], carousel: approachSlider },
    // Each of the six tiles is its own `vc_col-sm-4` with the column
    // animation on it, so they reveal as a group rather than in sequence.
    4: { boldLead: [0], tileReveal: 'fade-in-from-bottom' },
  },

  about: {
    // `parallax_section` on both full-height banners, as on the other
    // pages. Not asked for directly, but it is the same one-line flag
    // and the rows carry it on the live site.
    0: { parallax: 'fast' },
    1: { parallax: 'fast', boldLead: { 0: { paragraph: 1 } } },
    2: { boldLead: [0], mediaReveal: 'fade-in-from-right' },
    // The closing band centres, like the home page's.
    3: { center: true },
  },

  contact: {
    // measured: 114px top, 0 bottom. The row ends flush because the form
    // card hangs out of the bottom of it.
    0: {
      center: true,
      hero: true,
      padBottom: 0,
      // The card's intro paragraph, above the form.
      boldLead: { 1: true },
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
    //
    // "Why choose Elegant Address" is centred on the live page — heading,
    // copy and both buttons — the same treatment the other closing bands
    // get. It was the only one ranged left.
    1: { center: true, padBottom: 6 },
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
  /**
   * Louis's call rather than a port: the WordPress row has a 350px
   * *empty* spacer under "Why Choose Elegant Address" — no image, no
   * embed, just a hole. It reads as somewhere a picture was meant to go,
   * so one goes there, as its own full-width parallax band at the height
   * the spacer reserved.
   */
  'cannes-congress': [
    {
      at: 3,
      section: {
        background: { image: 'images/destinations/cannes-harbour.jpeg' },
        parallax: 'fast',
        layout: { pad: 0, cols: [12], fill: 'both', fullWidth: true },
        groups: [[{ type: 'spacer', height: 350 }]],
      },
    },
  ],

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
            // Categories read off `data-project-cat` on the live grid;
            // the sort menu lists exactly these three plus "All".
            items: [
              {
                title: 'Saint Jean Cap Ferrat 6 Bedroom Villa',
                image: 'images/properties/property-12-villa-pool.jpeg',
                href: '/featured-properties',
                category: { slug: 'saint-jean-cap-ferrat', label: 'Saint Jean Cap Ferrat' },
              },
              {
                title: 'Villa Ginger Lily',
                image: 'images/properties/property-01-infinity-pool.jpeg',
                href: '/featured-properties',
                category: { slug: 'parish-of-st-james', label: 'Parish of St James' },
              },
              {
                title: 'Cannes CN-642: 11 Bedroom Villa',
                image: 'images/properties/property-05-terraced-gardens.jpeg',
                href: '/featured-properties',
                category: { slug: 'cannes', label: 'Cannes' },
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
      keyValue, displayHeading, dividerBetween, background, ...rest
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
      const specFor = (gi) => (Array.isArray(boldLead)
        ? (boldLead.includes(gi) ? true : null)
        : (boldLead[gi] ?? null))

      groups = groups.map((g, gi) => {
        const spec = specFor(gi)
        if (!spec) return g
        // `{ mode, paragraph }` where the bold sits on something other
        // than the opening paragraph — /about's "Our aim is to give all
        // of our clients…" is the second one.
        const mode = typeof spec === 'object' ? (spec.mode ?? true) : spec
        const leadAt = typeof spec === 'object' ? (spec.paragraph ?? 0) : 0
        let done = false
        return g.map((b) => {
          if (done || b.type !== 'text') return b
          done = true
          return { ...b, lead: mode, leadAt }
        })
      })
    }

    // The opening heading of a closing band renders at display scale
    // while the one below it keeps the ordinary tier.
    if (displayHeading) {
      groups = groups.map((g, gi) => {
        if (!displayHeading.includes(gi)) return g
        let done = false
        return g.map((b) => {
          if (done || b.type !== 'heading') return b
          done = true
          return { ...b, display: true }
        })
      })
    }

    // A rule between the two halves of the band.
    if (dividerBetween && groups.length > 1) {
      groups = groups.map((g, gi) => (gi === 0 ? [...g, { type: 'divider' }] : g))
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
