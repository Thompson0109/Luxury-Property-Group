import VideoBackdrop from './VideoBackdrop'
import { Block, Heading, Text } from './section/blocks'
import { asTiles, withTextPairs, asSplit } from './section/rows'
import { assetUrl } from '@/lib/assets'
import '@/styles/component-styles/section.scss'

// salient's row padding values, observed across the eight pages.
const PAD_CLASS = {
  0: 'none', 4: 'sm', 5: 'base', 6: 'md', 9: 'lg', 13: 'xl', 24: 'xxl',
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
