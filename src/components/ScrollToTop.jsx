import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * WordPress served a fresh document per page, so every navigation started
 * at the top. React Router preserves scroll position, which feels broken
 * on a content site — this restores the old behaviour.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }, [pathname])

  return null
}
