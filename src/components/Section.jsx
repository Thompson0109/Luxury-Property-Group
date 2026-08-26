import VideoBackdrop from './VideoBackdrop'
import { Block, Heading, Text } from './section/blocks'
import { asTiles, withTextPairs, asSplit, asCta } from './section/rows'
import { assetUrl } from '@/lib/assets'
import '@/styles/component-styles/section.scss'

// salient's row padding values, observed across the eight pages.
const PAD_CLASS = {
  0: 'none', 4: 'sm', 5: 'base', 6: 'md', 9: 'lg', 13: 'xl', 24: 'xxl',
}

function renderBlocks(blocks, keyPrefix, onDark, carousel) {
  return withTextPairs(blocks).map((item, i) => (
    item.pair ? (
      <div key={`${keyPrefix}-pair${i}`} className="section__pair">
        {item.pair.map((block, k) => (
          <Block key={k} block={block} inverse={onDark} carousel={carousel} />
        ))}
      </div>
    ) : (
      <Block key={`${keyPrefix}-${i}`} block={item.block} inverse={onDark} carousel={carousel} />
    )
  ))
}

export default function Section({ section, index, isHero }) {
  const {
    background = {}, groups = [], layout = {},
    carousel, tileReveal, mediaReveal, reveal, delay, card,
  } = section
  const { color, image, overlay, video } = background
  const {
    pad = 5, fullHeight = false, cols = [12], fill = 'both', center = false,
    fullWidth = false, padTop, padBottom,
  } = layout

  // Text inverts on dark and photographic backgrounds.
  const onDark = Boolean(video || image || (color && color !== '#ffffff'))

  const style = {}
  if (color) style.backgroundColor = color
  if (image) style.backgroundImage = `url(${assetUrl(image)})`

  // A handful of rows are padded on one side only — /contact's hero ends
  // flush so the form card can hang out of it, and the row above the
  // full-bleed carousel on /cannes-congress does the same. The scale is
  // the same viewport-relative one, so a bare number is a vw value.
  if (padTop !== undefined) style['--section-pad-top'] = `${padTop}vw`
  if (padBottom !== undefined) style['--section-pad-bottom'] = `${padBottom}vw`

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
        fullWidth ? 'section--full-width' : '',
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {video && <VideoBackdrop id={video} poster={image ? assetUrl(image) : undefined} />}
      {overlay && (
        <div className="section__overlay" style={{ backgroundColor: overlay }} aria-hidden="true" />
      )}

      <div
        className="container section__inner"
        data-reveal={reveal || undefined}
        style={delay ? { '--reveal-delay': `${delay}ms` } : undefined}
      >
        {groups.map((blocks, gi) => {
          const split = splits[gi]

          const tiles = asTiles(blocks)
          if (tiles) {
            return (
              <div key={gi} className="section__tiles">
                {tiles.map(({ image, heading, text }, ti) => (
                  <article
                    key={ti}
                    className="section__tile"
                    data-reveal={tileReveal || undefined}
                  >
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
                <div className="section__split-media" data-reveal={mediaReveal || undefined}>
                  <Block block={split.media} inverse={onDark} carousel={carousel} />
                </div>
              </div>
            )
          }

          // The closing call to action puts its buttons in the narrow
          // column rather than under the copy.
          const cta = asCta(blocks, layout)
          if (cta) {
            return (
              <div key={gi} className="section__cta">
                <div className="section__cta-copy">
                  {renderBlocks(cta.copy, `${gi}-c`, onDark, carousel)}
                </div>
                <div className="section__cta-actions">
                  {renderBlocks(cta.actions, `${gi}-a`, onDark, carousel)}
                </div>
              </div>
            )
          }

          const isCard = card && blocks.some((b) => b.type === 'form')

          return (
            <div
              key={gi}
              className={isCard ? 'section__group section__card' : 'section__group'}
              data-reveal={isCard ? card.reveal : undefined}
            >
              {renderBlocks(blocks, String(gi), onDark, carousel)}
            </div>
          )
        })}
      </div>

      {isHero && fullHeight && (
        <a className="section__scroll-cue" href={`#band-${index + 1}`} aria-label="Scroll to content">
          <span aria-hidden="true" />
        </a>
      )}
    </section>
  )
}
