import { Link } from 'react-router-dom'
import VideoBackdrop from './VideoBackdrop'
import EnquiryForm from './EnquiryForm'
import { assetUrl } from '@/lib/assets'
import '@/styles/component-styles/section.scss'


// salient's row padding values, observed across the eight pages.
const PAD_CLASS = {
  0: 'none', 4: 'sm', 5: 'base', 6: 'md', 9: 'lg', 13: 'xl', 24: 'xxl',
}

function Heading({ block }) {
  const { level, text, color } = block
  const Tag = level === 'h2' ? 'h2' : level === 'h4' ? 'h4' : 'h3'
  return (
    <Tag className={`section__heading section__heading--${level}`} style={color ? { color } : undefined}>
      {text}
    </Tag>
  )
}

function Text({ block }) {
  return (
    <div className="section__text">
      {block.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
  )
}

function Button({ block, inverse }) {
  const cls = `btn ${inverse ? 'btn--inverse' : ''}`.trim()
  const external = /^(https?:|tel:|mailto:|#)/.test(block.href)

  return external
    ? <a className={cls} href={block.href}>{block.label}</a>
    : <Link className={cls} to={block.href}>{block.label}</Link>
}

function Gallery({ block }) {
  const count = block.images.length
  return (
    <div className={`section__gallery section__gallery--${count > 2 ? 'grid' : 'pair'}`}>
      {block.images.map((src, i) => (
        <figure key={`${src}-${i}`} className="section__gallery-item">
          <img src={assetUrl(src)} alt="" loading="lazy" />
        </figure>
      ))}
    </div>
  )
}

function Cards({ block }) {
  return (
    <div className="section__cards">
      {block.items.map(({ label, image, href }) => {
        const inner = (
          <>
            {image && <img className="section__card-image" src={assetUrl(image)} alt="" loading="lazy" />}
            <span className="section__card-label">{label}</span>
          </>
        )
        return (
          <article key={label} className="section__card">
            {href && href !== '/' ? (
              <Link to={href} className="section__card-link">{inner}</Link>
            ) : (
              <div className="section__card-link">{inner}</div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function Image({ block }) {
  return (
    <div className="section__image">
      <img src={assetUrl(block.src)} alt="" loading="lazy" />
    </div>
  )
}

function Block({ block, inverse }) {
  switch (block.type) {
    case 'heading': return <Heading block={block} />
    case 'text':    return <Text block={block} />
    case 'button':  return <Button block={block} inverse={inverse} />
    case 'gallery': return <Gallery block={block} />
    case 'cards':   return <Cards block={block} />
    case 'image':   return <Image block={block} />
    case 'form':    return <EnquiryForm formId={block.formId} />
    default:        return null
  }
}

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

function renderBlocks(blocks, keyPrefix, onDark) {
  return withTextPairs(blocks).map((item, i) => (
    item.pair ? (
      <div key={`${keyPrefix}-pair${i}`} className="section__pair">
        {item.pair.map((block, k) => (
          <Block key={k} block={block} inverse={onDark} />
        ))}
      </div>
    ) : (
      <Block key={`${keyPrefix}-${i}`} block={item.block} inverse={onDark} />
    )
  ))
}

export default function Section({ section, index, isHero }) {
  const { background = {}, groups = [], layout = {} } = section
  const { color, image, overlay, video } = background
  const { pad = 5, fullHeight = false, cols = [12], fill = 'both', center = false } = layout

  // Text inverts on dark and photographic backgrounds.
  const onDark = Boolean(video || image || (color && color !== '#ffffff'))

  const style = {}
  if (color) style.backgroundColor = color
  if (image) style.backgroundImage = `url(${assetUrl(image)})`

  // A split group lays out its own two columns, so the row-level grid has
  // to stand down or the two would nest.
  const splits = groups.map(asSplit)
  const allSplit = splits.length > 0 && splits.every(Boolean)
  const splitRatio = cols.length === 2 ? `section__split--${cols.join('-')}` : ''

  const multiColumn = cols.length > 1 && !allSplit

  return (
    <section
      id={`band-${index}`}
      className={[
        'section',
        `section--pad-${PAD_CLASS[pad] ?? 'base'}`,
        fullHeight ? 'section--full-height' : '',
        isHero ? 'section--hero' : '',
        center ? 'section--center' : '',
        onDark ? 'section--on-dark' : '',
        image ? 'section--has-image' : '',
        multiColumn ? `section--cols-${cols.join('-')}` : '',
        multiColumn && fill !== 'both' ? `section--fill-${fill}` : '',
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {video && <VideoBackdrop id={video} poster={image ? assetUrl(image) : undefined} />}
      {overlay && (
        <div className="section__overlay" style={{ backgroundColor: overlay }} aria-hidden="true" />
      )}

      <div className="container section__inner">
        {groups.map((blocks, gi) => {
          const split = splits[gi]

          const tiles = asTiles(blocks)
          if (tiles) {
            return (
              <div key={gi} className="section__tiles">
                {tiles.map(({ image, heading, text }, ti) => (
                  <article key={ti} className="section__tile">
                    <img
                      className="section__tile-image"
                      src={assetUrl(image.src)}
                      alt=""
                      loading="lazy"
                    />
                    <Heading block={heading} />
                    <Text block={text} />
                  </article>
                ))}
              </div>
            )
          }

          if (split) {
            return (
              <div
                key={gi}
                className={[
                  'section__split',
                  splitRatio,
                  split.mediaFirst ? 'section__split--media-first' : '',
                ].filter(Boolean).join(' ')}
              >
                <div className="section__split-copy">
                  {renderBlocks(split.copy, `${gi}-c`, onDark)}
                </div>
                <div className="section__split-media">
                  <Block block={split.media} inverse={onDark} />
                </div>
              </div>
            )
          }

          return (
            <div key={gi} className="section__group">
              {renderBlocks(blocks, String(gi), onDark)}
            </div>
          )
        })}
      </div>

      {isHero && (
        <a className="section__scroll-cue" href={`#band-${index + 1}`} aria-label="Scroll to content">
          <span aria-hidden="true" />
        </a>
      )}
    </section>
  )
}