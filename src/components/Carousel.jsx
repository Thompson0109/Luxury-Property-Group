import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { assetUrl } from '@/lib/assets'
import '@/styles/component-styles/carousel.scss'

/**
 * The two carousels Salient runs on these pages, as one component.
 *
 * `flickity` — `.nectar-flickity`, used on /cannes-congress. Its whole
 * configuration lives in data attributes on the wrapper, which is the
 * only record of it anywhere:
 *
 *   row 1  1/1/1/1 columns, overflow hidden, autoplay 2500, controls none
 *   row 4  3/3/2/1 columns, 10px spacing, overflow visible, autoplay 2500
 *
 * `slider` — `.nectar-slider-wrap`, used on /approach rows 1 and 3. A
 * swiper-backed slide deck: one fixed-height frame, 5.5s rotation,
 * looping, with bullet navigation.
 *
 * Neither is worth a dependency. Flickity is 25KB for a horizontal
 * translate, a wrap and a timer, and Salient's own build ships both
 * libraries on every page whether a carousel is present or not.
 *
 * Looping is done by rendering the cells twice and snapping back without
 * a transition at the seam, which is what makes the wrap invisible.
 */

/**
 * WordPress titles these cards from the attachment's own title, which on
 * this site is the unedited filename ("South-of-France-1"). Without
 * supplied captions the filename is still the closest thing to a title
 * the content model holds.
 */
const fallbackTitle = (src) =>
  src.split('/').pop().replace(/\.[^.]+$/, '').replace(/-/g, ' ')

const TIERS = [
  { min: 1301, key: 'desktop' },
  { min: 1000, key: 'smallDesktop' },
  { min: 691, key: 'tablet' },
  { min: 0, key: 'phone' },
]

function useColumns(columns) {
  const read = useCallback(() => {
    if (typeof window === 'undefined') return columns.desktop ?? 1
    const w = window.innerWidth
    const tier = TIERS.find((t) => w >= t.min) ?? TIERS[TIERS.length - 1]
    return columns[tier.key] ?? columns.desktop ?? 1
  }, [columns])

  const [cols, setCols] = useState(read)

  useEffect(() => {
    const onResize = () => setCols(read())
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [read])

  return cols
}

export default function Carousel({ images = [], config = {}, inverse = false }) {
  const {
    kind = 'flickity',
    columns = { desktop: 1 },
    spacing = 0,
    autoplay,
    autorotate,
    overflow = 'hidden',
    captions = false,
    height,
    peek = 0,
    bulletsInside = false,
  } = config

  const captionList = Array.isArray(captions) ? captions : null

  const cols = useColumns(kind === 'slider' ? { desktop: 1 } : columns)
  const count = images.length
  const interval = autorotate ?? autoplay ?? 0
  // The nectar slider ships `classic` controls: a chevron either side and
  // a row of bullets under it. Flickity's rows are `controls="none"` —
  // autoplay and drag only.
  const showBullets = kind === 'slider'
  const showArrows = kind === 'slider'

  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef(null)

  // Enough cells to loop through without ever showing a gap: one full
  // extra copy covers the widest viewport.
  const cells = useMemo(
    () => (count > cols ? [...images, ...images] : images),
    [images, count, cols],
  )

  const pages = Math.max(1, count)

  const advance = useCallback(() => setIndex((i) => i + 1), [])

  // Stepping back past the first cell would need a matching set of clones
  // in front, so it wraps to the end of the current set instead.
  const retreat = useCallback(
    () => setIndex((i) => (i <= 0 ? Math.max(0, count - 1) : i - 1)),
    [count],
  )

  useEffect(() => {
    if (!interval || paused || count <= cols) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(advance, interval)
    return () => window.clearInterval(id)
  }, [interval, paused, advance, count, cols])

  // At the seam, jump back a whole set with the transition off so the
  // wrap reads as continuous motion rather than a rewind.
  useEffect(() => {
    if (index < pages) return
    const el = trackRef.current
    if (!el) return
    const onEnd = () => {
      setAnimate(false)
      setIndex((i) => i - pages)
    }
    el.addEventListener('transitionend', onEnd, { once: true })
    return () => el.removeEventListener('transitionend', onEnd)
  }, [index, pages])

  useEffect(() => {
    if (animate) return
    // Re-enable on the next frame, after the snapped position has painted.
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [animate])

  if (!count) return null

  // Cell width and travel are expressed as one custom property so the two
  // layouts share the same track maths:
  //
  //   columns  n cells fill the frame edge to edge
  //   peek     one cell sits centred at `peek`% of the frame, with its
  //            neighbours showing either side and clipped at the edges
  //
  // The old shift was `index * (100 / cols)%`, which ignored the gap and
  // so drifted by a cell's worth over a long strip.
  const style = {
    '--carousel-cols': cols,
    '--carousel-gap': `${spacing}px`,
    '--carousel-index': index,
  }
  if (peek) style['--carousel-cell'] = `${peek}%`
  if (height) style['--carousel-height'] = `${height}px`

  return (
    <div
      className={[
        'carousel',
        `carousel--${kind}`,
        peek ? 'carousel--peek' : '',
        bulletsInside ? 'carousel--bullets-inside' : '',
        overflow === 'visible' ? 'carousel--bleed' : '',
        inverse ? 'carousel--inverse' : '',
      ].filter(Boolean).join(' ')}
      style={style}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="group"
      aria-roledescription="carousel"
    >
      <div className="carousel__viewport">
        <div
          ref={trackRef}
          className={`carousel__track${animate ? '' : ' is-snapping'}`}
        >
          {cells.map((src, i) => {
            const clone = i >= count
            return (
              <figure
                className="carousel__cell"
                key={`${src}-${i}`}
                aria-hidden={clone || undefined}
              >
                <img src={assetUrl(src)} alt="" loading={i < cols ? 'eager' : 'lazy'} />
                {captions && (
                  <figcaption className="carousel__caption">
                    <span className="carousel__caption-title">
                      {captionList?.[i % count]?.title ?? fallbackTitle(src)}
                    </span>
                    {captionList?.[i % count]?.text && (
                      <span className="carousel__caption-text">
                        {captionList[i % count].text}
                      </span>
                    )}
                  </figcaption>
                )}
              </figure>
            )
          })}
        </div>
      </div>

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            className="carousel__arrow carousel__arrow--prev"
            aria-label="Previous slide"
            onClick={retreat}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className="carousel__arrow carousel__arrow--next"
            aria-label="Next slide"
            onClick={advance}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </>
      )}

      {showBullets && count > 1 && (
        <ul className="carousel__bullets">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={`carousel__bullet${index % pages === i ? ' is-active' : ''}`}
                aria-label={`Slide ${i + 1} of ${count}`}
                aria-current={index % pages === i || undefined}
                onClick={() => setIndex(i)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
