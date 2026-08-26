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
  } = config

  const cols = useColumns(kind === 'slider' ? { desktop: 1 } : columns)
  const count = images.length
  const interval = autorotate ?? autoplay ?? 0
  const showBullets = kind === 'slider'

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

  const step = 100 / cols
  const style = {
    '--carousel-cols': cols,
    '--carousel-gap': `${spacing}px`,
    '--carousel-shift': `${index * step}%`,
  }
  if (height) style['--carousel-height'] = `${height}px`

  return (
    <div
      className={[
        'carousel',
        `carousel--${kind}`,
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
                    {src.split('/').pop().replace(/\.[^.]+$/, '').replace(/-/g, ' ')}
                  </figcaption>
                )}
              </figure>
            )
          })}
        </div>
      </div>

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
