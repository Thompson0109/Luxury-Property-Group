import { useEffect, useRef, useState } from 'react'


const BLEED = 1.06

export default function VideoBackdrop({ id, poster }) {
  const wrapRef = useRef(null)
  const frameRef = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [playing, setPlaying] = useState(false)

  // Mount late, and never for reduced-motion or on phones — the WordPress
  // version loaded every embed on page load, which cost seconds on mobile.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(max-width: 690px)').matches) return

    // requestIdleCallback can wait indefinitely on a busy page, and the
    // hero is the first thing anyone sees — so it gets a deadline.
    const handle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setEnabled(true), { timeout: 1200 })
      : setTimeout(() => setEnabled(true), 300)

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(handle)
      else clearTimeout(handle)
    }
  }, [])

  // Cover maths, recomputed whenever the section resizes.
  useEffect(() => {
    if (!enabled) return
    const wrap = wrapRef.current
    if (!wrap) return

    const fit = () => {
      const frame = frameRef.current
      if (!frame) return
      const { width: cw, height: ch } = wrap.getBoundingClientRect()
      if (!cw || !ch) return

      let w = cw * BLEED
      let h = (w * 9) / 16
      if (h < ch * BLEED) {
        h = ch * BLEED
        w = (h * 16) / 9
      }

      frame.style.width = `${w}px`
      frame.style.height = `${h}px`
      frame.style.marginLeft = `${-(w - cw) / 2}px`
      frame.style.marginTop = `${-(h - ch) / 2}px`
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [enabled])

  // Reveal only once the player is actually playing, so the poster covers
  // the load. Falls back to a timeout if the postMessage handshake fails.
  useEffect(() => {
    if (!enabled) return
    const frame = frameRef.current
    if (!frame) return

    const send = (payload) =>
      frame.contentWindow?.postMessage(JSON.stringify(payload), '*')

    const onLoad = () => send({ event: 'listening', id: 1 })

    const onMessage = (event) => {
      // This fires for every message on the window, including ones with
      // an opaque origin that `new URL` throws on — and a throw here
      // would take out the whole handler.
      let host
      try {
        host = new URL(event.origin).hostname
      } catch {
        return
      }
      if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      if (data.event === 'onReady') send({ event: 'command', func: 'mute', args: [] })
      if (data.event === 'onStateChange' && data.info === 1) setPlaying(true)
    }

    frame.addEventListener('load', onLoad)
    window.addEventListener('message', onMessage)
    // If the postMessage handshake never lands — an ad, a blocked embed,
    // a slow network — reveal anyway rather than leaving a dead panel
    // where the hero should be.
    const fallback = setTimeout(() => setPlaying(true), 1200)

    return () => {
      frame.removeEventListener('load', onLoad)
      window.removeEventListener('message', onMessage)
      clearTimeout(fallback)
    }
  }, [enabled])

  // Params matched to the live embed, plus mute/playsinline which the
  // WordPress build got from the Salient player script rather than the URL.
  // `playlist=<same id>` is what makes `loop=1` work on a single video, and
  // `iv_load_policy=3` suppresses annotation cards.
  const src =
    `https://www.youtube-nocookie.com/embed/${id}` +
    `?playlist=${id}&loop=1&autoplay=1&mute=1&controls=0` +
    `&iv_load_policy=3&enablejsapi=1&disablekb=1&showinfo=0&rel=0` +
    `&playsinline=1&modestbranding=1&fs=0&cc_load_policy=0`

  return (
    <div className="video-backdrop" ref={wrapRef} aria-hidden="true">
      {poster && <div className="video-backdrop__poster" style={{ backgroundImage: `url(${poster})` }} />}
      {enabled && (
        <iframe
          ref={frameRef}
          className={`video-backdrop__frame${playing ? ' is-playing' : ''}`}
          src={src}
          title=""
          tabIndex={-1}
          allow="autoplay; encrypted-media"
          frameBorder="0"
        />
      )}
    </div>
  )
}