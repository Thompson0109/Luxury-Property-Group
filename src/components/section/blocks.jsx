import { Link } from 'react-router-dom'
import EnquiryForm from '../EnquiryForm'
import SplitHeading from '../SplitHeading'
import Carousel from '../Carousel'
import { assetUrl } from '@/lib/assets'

/**
 * One component per block type in the extracted content model, plus the
 * switch that dispatches to them. Layout lives in Section and rows.js —
 * these only render a single block.
 */

/**
 * Every h2 and h3 on the WordPress site is a `nectar-split-heading`
 * running the letter reveal — 37 of them across the eight pages. The
 * hero kicker (recorded as `h4` in the extracted model, but an `h1` at
 * 22px in the theme) is one too, so it goes through the same component.
 *
 * `hero` marks the two inner-page display headings that carry Salient's
 * `data-custom-font-size`, which swaps the 45px h2 ramp for 5vw/5.5vw.
 */
function Heading({ block }) {
  const { level, text, color, hero } = block
  const Tag = level === 'h2' ? 'h2' : level === 'h4' ? 'h4' : 'h3'
  return (
    <SplitHeading
      as={Tag}
      text={text}
      hero={Boolean(hero)}
      className={`section__heading section__heading--${level}`}
      style={color ? { color } : undefined}
    />
  )
}

/**
 * `lead` marks the opening paragraph as the section's standfirst.
 *
 * On the WordPress site those paragraphs are wrapped in `<strong>` —
 * confirmed on the hosted install for the two destination blocks, the
 * featured-properties intro and "Why Choose Elegant Address", where the
 * strong renders Open Sans 700 and inherits the row's colour. The
 * extractor flattens `post_content` to plain strings, so every piece of
 * inline markup in the source is lost; the flag puts this one back.
 */
function Text({ block }) {
  return (
    <div className="section__text">
      {block.paragraphs.map((p, i) => (
        <p key={i}>{block.lead && i === 0 ? <strong>{p}</strong> : p}</p>
      ))}
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

/**
 * A gallery is a carousel wherever the row's shortcode configured one —
 * which, on these pages, is everywhere except the six-up tile rows. The
 * static grid stays as the fallback for rows that really are grids.
 */
function Gallery({ block, carousel, inverse }) {
  if (carousel) {
    return <Carousel images={block.images} config={carousel} inverse={inverse} />
  }

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

/**
 * Salient's portfolio grid in `work-item.style-4`, which is what
 * /featured-properties renders between its two copy bands.
 *
 * The interaction is the whole point of the component: the frame clips,
 * and on hover the image lifts 25px while an accent caption bar slides
 * up from underneath it. Straight from the theme's CSS:
 *
 *   .work-item.style-4 { overflow: hidden }
 *   .work-item.style-4 .bottom-meta { transform: translateY(100%) }
 *   .work-item.style-4:hover img { transform: translateY(-25px);
 *                                  transition-delay: .03s }
 *   .work-item.style-4:hover .bottom-meta { transform: translateY(0) }
 *
 * The 30ms delay on the image is deliberate — the bar starts first and
 * the picture follows it up, which is what makes the two read as one
 * movement rather than two.
 */
function Portfolio({ block }) {
  return (
    <div className="portfolio">
      {block.items.map(({ title, image, href }) => (
        <article className="portfolio__item" key={title}>
          <Link className="portfolio__frame" to={href || '/featured-properties'}>
            <img
              className="portfolio__image"
              src={assetUrl(image)}
              alt=""
              loading="lazy"
            />
            <span className="portfolio__meta">
              <span className="portfolio__title">{title}</span>
            </span>
          </Link>
        </article>
      ))}
    </div>
  )
}

/**
 * Salient's `divider-wrap` — a bare vertical spacer at an explicit
 * height. Most instances are the 6px gap under a heading, which the
 * heading's own margin already covers, but a few rows use it at 30px and
 * one on /cannes-congress at 350px, and those are load-bearing.
 */
function Spacer({ block }) {
  return <div className="section__spacer" style={{ height: `${block.height}px` }} aria-hidden="true" />
}

function Image({ block }) {
  return (
    <div className="section__image">
      <img src={assetUrl(block.src)} alt="" loading="lazy" />
    </div>
  )
}

function Block({ block, inverse, carousel }) {
  switch (block.type) {
    case 'heading':   return <Heading block={block} />
    case 'text':      return <Text block={block} />
    case 'button':    return <Button block={block} inverse={inverse} />
    case 'gallery':   return <Gallery block={block} carousel={carousel} inverse={inverse} />
    case 'cards':     return <Cards block={block} />
    case 'image':     return <Image block={block} />
    case 'portfolio': return <Portfolio block={block} />
    case 'spacer':    return <Spacer block={block} />
    case 'form':      return <EnquiryForm formId={block.formId} />
    default:          return null
  }
}

export { Heading, Text, Button, Gallery, Cards, Image, Portfolio, Spacer, Block }
