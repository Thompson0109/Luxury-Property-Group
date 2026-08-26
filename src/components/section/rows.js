/**
 * Salient row heuristics.
 *
 * WPBakery records its layout in shortcode attributes the content
 * extractor cannot see, so the shape of a group's blocks is what tells us
 * which inner-row Salient used. Each of these is matched on shape rather
 * than page slug, which keeps the renderer independent of the routes.
 */

const MEDIA_TYPES = new Set(['gallery', 'image'])

/**
 * A group that repeats image → heading → text is Salient's feature-tile
 * row: an inner vc_row of vc_col-sm-4 columns, not a vertical stack.
 * Rendering it as a stack made /approach 4,825px too tall at desktop.
 *
 * Shape-based rather than slug-based: it matches approach §4 groups 1
 * and 2 and nothing else in pages.json.
 */
function asTiles(blocks) {
  if (blocks.length < 6 || blocks.length % 3 !== 0) return null

  const tiles = []
  for (let i = 0; i < blocks.length; i += 3) {
    const [image, heading, text] = blocks.slice(i, i + 3)
    if (image?.type !== 'image') return null
    if (heading?.type !== 'heading') return null
    if (text?.type !== 'text') return null
    tiles.push({ image, heading, text })
  }
  return tiles
}

/**
 * Salient sets two consecutive text blocks side by side in a 6|6 inner
 * row rather than stacking them. Measured on /barbados at a 1890px
 * client: two 653px columns spanning the 1305px row, each carrying the
 * usual 30px of inline padding, so each measure is 593px.
 *
 * Every run of adjacent text blocks in the content model is exactly two
 * long and corresponds to one of these rows — checked across all eight
 * pages, eight runs, no exceptions.
 */
function withTextPairs(blocks) {
  const out = []
  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i].type === 'text' && blocks[i + 1]?.type === 'text') {
      out.push({ pair: [blocks[i], blocks[i + 1]] })
      i += 1
      continue
    }
    out.push({ block: blocks[i] })
  }
  return out
}

/**
 * Salient pairs copy with media across a two-column inner row rather than
 * stacking them, and the order of the blocks says which side the media
 * takes — a group that leads with a gallery puts the media on the left.
 *
 * Measured on the home page: two 653px columns, each carrying Salient's
 * 30px of inline padding, vertically centred against each other, with
 * 35px between two stacked rows.
 *
 * Returns null for any other group shape, and the caller falls back to
 * the ordinary stacked group.
 */
function asSplit(blocks) {
  const media = blocks.filter((b) => MEDIA_TYPES.has(b.type))
  if (media.length !== 1) return null

  const copy = blocks.filter((b) => !MEDIA_TYPES.has(b.type))
  if (!copy.length) return null

  return { media: media[0], copy, mediaFirst: MEDIA_TYPES.has(blocks[0].type) }
}

/**
 * The closing call to action, which appears on five of the eight pages
 * and is the same row every time: an 8|4 inner row with the heading and
 * copy in the wide column and the two buttons stacked in the narrow one,
 * the two vertically centred against each other.
 *
 * The extractor flattens all four blocks into one group, so without this
 * they stack in the span-8 column and the row renders 131px taller than
 * the live site — measured identically on /about, /contact, /approach
 * and /featured-properties, which is what gave the shape away.
 *
 * Matched on shape: a two-track row that fills both tracks, with no
 * media, whose group ends in buttons preceded by something else. Checked
 * across all eight pages — it matches the five call-to-action rows and
 * nothing else. The 6|6 copy rows are all `fill: left` or `fill: right`,
 * so they are excluded by the fill test rather than by luck.
 */
function asCta(blocks, layout = {}) {
  const { cols = [12], fill = 'both' } = layout
  if (cols.length !== 2 || fill !== 'both') return null
  if (blocks.some((b) => MEDIA_TYPES.has(b.type))) return null

  let split = blocks.length
  while (split > 0 && blocks[split - 1].type === 'button') split -= 1
  if (split === blocks.length || split === 0) return null

  return { copy: blocks.slice(0, split), actions: blocks.slice(split) }
}

export { asTiles, withTextPairs, asSplit, asCta }
