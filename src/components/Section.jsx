import { Link } from 'react-router-dom'
import VideoBackdrop from './VideoBackdrop'
import EnquiryForm from './EnquiryForm'
import { assetUrl } from '@/lib/assets'
import '@/styles/component-styles/section.scss'

/**
 * Renders one band of a page from the extracted WordPress content model.
 *
 * The WPBakery pages all share the same grammar: a `vc_row` with a
 * background (colour, image or YouTube video) containing one or more
 * inner groups of headings, copy, buttons and galleries. Rather than hand-
 * writing eight near-identical page components, we render that grammar
 * directly — so re-running the extractor picks up content edits for free.
 */

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

/** A group leading with a gallery gets the media on the left. */
const leadsWithMedia = (blocks) => blocks[0]?.type === 'gallery'

export default function Section({ section, index, isHero }) {
  const { background = {}, groups = [] } = section
  const { color, image, overlay, video } = background

  // Text has to invert on dark and photographic backgrounds.
  const onDark = Boolean(video || image || (color && color !== '#ffffff'))

  const style = {}
  if (color) style.backgroundColor = color
  if (image) style.backgroundImage = `url(${assetUrl(image)})`

  // A row with exactly two groups is a media/copy split.
  const isSplit = groups.length === 2 && groups.some(leadsWithMedia)

  return (
    <section
      className={[
        'section',
        isHero ? 'section--hero' : '',
        onDark ? 'section--on-dark' : '',
        image ? 'section--has-image' : '',
        isSplit ? 'section--split' : '',
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {video && <VideoBackdrop id={video} />}
      {overlay && (
        <div className="section__overlay" style={{ background: overlay }} aria-hidden="true" />
      )}

      <div className="container section__inner">
        {groups.map((blocks, gi) => (
          <div
            key={gi}
            className={[
              'section__group',
              leadsWithMedia(blocks) ? 'section__group--media-first' : '',
            ].filter(Boolean).join(' ')}
          >
            {blocks.map((block, bi) => (
              <Block key={`${gi}-${bi}`} block={block} inverse={onDark} />
            ))}
          </div>
        ))}
      </div>

      {isHero && (
        <a className="section__scroll-cue" href={`#band-${index + 1}`} aria-label="Scroll to content">
          <span aria-hidden="true" />
        </a>
      )}
    </section>
  )
}
