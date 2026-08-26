import { Link } from 'react-router-dom'
import EnquiryForm from '../EnquiryForm'
import SplitHeading from '../SplitHeading'
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

export { Heading, Text, Button, Gallery, Cards, Image, Block }
