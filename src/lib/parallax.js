import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Salient's row-background parallax.
 *
 * Measured on the hosted site: a parallax row renders its ground on a
 * `.row-bg` layer sized *taller than the row* — 1150px against a 907px
 * row, a ratio of 1.27 — and translates it as the row crosses the
 * viewport. The oversize is what makes it read as a zoom: the image is
 * cover-fitted to a box a quarter taller than the opening it shows
 * through, so you only ever see a moving window onto it.
 *
 * The shift is computed in pixels from the actual overshoot rather than
 * as a percentage, because a percentage translate resolves against the
 * layer's height, not the row's, and the two differ by exactly the
 * amount being animated.
 *
 * Unlike the column reveals, Salient deliberately keeps parallax on
 * below 1000px, so there is no mobile kill switch here — only the
 * reduced-motion one, which the theme doesn't have and should.
 */
export function useParallax() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const layers = [...document.querySelectorAll('[data-parallax]')]
    if (!layers.length) return

    let frame = 0

    const update = () => {
      frame = 0
      const vh = window.innerHeight

      for (const layer of layers) {
        const row = layer.parentElement
        if (!row) continue
        const rect = row.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > vh) continue

        // -1 as the row enters from the bottom, +1 as it leaves the top.
        const progress = 1 - 2 * ((rect.top + rect.height / 2) / (vh + rect.height))
        const overshoot = layer.offsetHeight - rect.height
        layer.style.setProperty(
          '--parallax-shift',
          `${(overshoot / 2) * progress}px`,
        )
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pathname])
}

export default useParallax
