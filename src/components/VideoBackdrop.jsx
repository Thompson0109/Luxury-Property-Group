import { useEffect, useState } from 'react'

/**
 * Muted, looping YouTube backdrop, matching the video rows in the
 * original Salient build.
 *
 * The iframe is only mounted once the section is near the viewport and
 * never when the visitor prefers reduced motion — the WordPress version
 * loaded all of them on page load, which cost several seconds on mobile.
 */
export default function VideoBackdrop({ id }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(max-width: 690px)').matches) return

    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 300))
    const handle = idle(() => setEnabled(true))
    return () => window.cancelIdleCallback?.(handle)
  }, [])

  if (!enabled) return null

  const src =
    `https://www.youtube-nocookie.com/embed/${id}` +
    `?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}` +
    `&playsinline=1&modestbranding=1&rel=0&disablekb=1`

  return (
    <div className="video-backdrop" aria-hidden="true">
      <iframe
        src={src}
        title=""
        tabIndex={-1}
        allow="autoplay; encrypted-media"
        frameBorder="0"
      />
    </div>
  )
}
