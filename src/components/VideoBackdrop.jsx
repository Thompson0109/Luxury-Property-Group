import { useEffect, useRef, useState } from 'react'

// How far the iframe overshoots its container. This is not a nicety: a
// YouTube embed paints its own chrome inside the frame — the title bar and
// its gradient across the top ~14%, the watch/share buttons across the
// bottom — and `controls=0` and `modestbranding` do not remove them. The
// only reliable way to be rid of them is to push them outside the clip, so
// the bleed has to be large enough to swallow both bands.
const BLEED = 1.42

// The handshake budget. If the player has not reported itself playing by
// the time the first one is up, we rebuild the frame on the plain
// youtube.com host — the -nocookie host is the one that most often lands
// on the "sign in to confirm you're not a bot" wall. If the second is up
// too, we stop and leave the poster in place.
const RETRY_AFTER = 4000
const GIVE_UP_AFTER = 9000

const HOSTS = ['www.youtube-nocookie.com', 'www.youtube.com']

function embedSrc(host, id) {
  const params = new URLSearchParams({
    playlist: id,          // what makes loop=1 work on a single video
    loop: '1',
    autoplay: '1',
    mute: '1',
    controls: '0',
    iv_load_policy: '3',   // no annotation cards
    enablejsapi: '1',
    disablekb: '1',
    showinfo: '0',
    rel: '0',
    playsinline: '1',
    modestbranding: '1',
    fs: '0',
    cc_load_policy: '0',
    origin: window.location.origin,
  })
  return `https://${host}/embed/${id}?${params}`
}

export default function VideoBackdrop({ id, poster }) {
  const wrapRef = useRef(null)
  const frameRef = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [attempt, setAttempt] = useState(0)   // index into HOSTS
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
  }, [enabled, attempt])

  // Reveal ONLY on a confirmed playing state. The previous version
  // revealed on a blind timer, which is what put YouTube's spinner and its
  // "sign in to confirm you're not a bot" panel on screen whenever the
  // embed was slow or refused — the two failures this is here to hide.
  useEffect(() => {
    if (!enabled) return
    const frame = frameRef.current
    if (!frame) return

    const send = (payload) =>
      frame.contentWindow?.postMessage(JSON.stringify(payload), '*')

    // The API handshake is a `listening` postMessage the player answers
    // with `onReady`. Sending it once on `load` loses the race whenever
    // the iframe finished loading before this effect ran — and a missed
    // handshake means we never learn the video started, so it would stay
    // hidden behind the poster forever. Ping until it answers.
    const onLoad = () => send({ event: 'listening', id: 1 })
    const ping = setInterval(() => send({ event: 'listening', id: 1 }), 300)

    const start = () => {
      setPlaying(true)
      clearInterval(ping)
      clearTimeout(retry)
      clearTimeout(giveUp)
    }

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
      // Any reply at all means this host served us a working player, so
      // the retry below would only be throwing away a video that is
      // merely slow to buffer.
      acked = true

      if (data.event === 'onReady') {
        clearInterval(ping)
        send({ event: 'command', func: 'mute', args: [] })
        send({ event: 'command', func: 'playVideo', args: [] })
      }
      // PLAYING arrives as onStateChange on first play and inside
      // infoDelivery on every subsequent tick — accept either.
      if (data.event === 'onStateChange' && data.info === 1) start()
      if (data.event === 'infoDelivery' && data.info?.playerState === 1) start()
      // A refused or unplayable embed. Don't wait out the clock.
      if (data.event === 'onError') {
        clearInterval(ping)
        clearTimeout(retry)
        if (attempt < HOSTS.length - 1) setAttempt((a) => a + 1)
        else clearTimeout(giveUp)
      }
    }

    // No player at all? Rebuild on the other host once, then stop trying.
    // Whatever happens, the poster and the row colour stay put — an
    // unstarted video must never be visible as a video.
    let acked = false
    const retry = setTimeout(() => {
      if (!acked && attempt < HOSTS.length - 1) setAttempt((a) => a + 1)
    }, RETRY_AFTER)
    const giveUp = setTimeout(() => clearInterval(ping), GIVE_UP_AFTER)

    frame.addEventListener('load', onLoad)
    window.addEventListener('message', onMessage)

    return () => {
      frame.removeEventListener('load', onLoad)
      window.removeEventListener('message', onMessage)
      clearInterval(ping)
      clearTimeout(retry)
      clearTimeout(giveUp)
    }
  }, [enabled, attempt])

  return (
    <div className="video-backdrop" ref={wrapRef} aria-hidden="true">
      {poster && <div className="video-backdrop__poster" style={{ backgroundImage: `url(${poster})` }} />}
      {enabled && (
        <iframe
          // Remounting on `attempt` is deliberate: changing an iframe's src
          // in place leaves the refused document in session history.
          key={attempt}
          ref={frameRef}
          className={`video-backdrop__frame${playing ? ' is-playing' : ''}`}
          src={embedSrc(HOSTS[attempt], id)}
          title=""
          tabIndex={-1}
          allow="autoplay; encrypted-media"
          frameBorder="0"
        />
      )}
    </div>
  )
}
