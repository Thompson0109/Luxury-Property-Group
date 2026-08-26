import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Driver for the scroll reveals in styles/_animations.scss.
 *
 * The stylesheet supports two drivers. Where the browser has
 * scroll-driven animations it needs no JavaScript at all — the
 * `@supports (animation-timeline: view())` block does the work. Where it
 * doesn't, `data-reveal-js` on <html> switches the rules over to a
 * transition that this observer triggers by adding `.is-visible`.
 *
 * Picking between them at runtime rather than shipping the observer
 * unconditionally means Chrome pays nothing for it.
 *
 * Salient hard-disables all of this below 1000px
 * (`column_animation_mobile = disable`), and the stylesheet's media query
 * does the same — so there is no point observing anything down there.
 */

const NATIVE = () =>
  typeof CSS !== 'undefined' &&
  CSS.supports &&
  CSS.supports('animation-timeline', 'view()')

export function useScrollReveal() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (NATIVE()) return
    if (window.matchMedia('(max-width: 999px)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    document.documentElement.setAttribute('data-reveal-js', '')

    const targets = document.querySelectorAll('[data-reveal]:not(.is-visible)')
    if (!targets.length) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Above the viewport counts too: a page opened already scrolled
          // past an element would otherwise leave it hidden for good.
          if (!entry.isIntersecting && entry.boundingClientRect.bottom >= 0) continue
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )

    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // Re-scan on navigation: the router swaps the tree without a reload.
  }, [pathname])
}

export default useScrollReveal
