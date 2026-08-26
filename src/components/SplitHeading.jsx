import { useEffect, useRef, useState } from 'react'
import '@/styles/component-styles/split-heading.scss'

/**
 * Salient's `nectar-split-heading`, running `line-reveal-by-space` with
 * the `letter-reveal-bottom` text effect.
 *
 * Read off the running site: every section heading on every page carries
 * this, with `data-animation-delay="150"`, `data-stagger="true"` and
 * `data-m-rm-animation="true"`. The theme wraps each word in an
 * overflow-hidden span and each letter in an inner span sitting at
 * `translateY(1.3em)`, then springs the letters up on a stagger once the
 * heading scrolls into view.
 *
 * Two deliberate differences from the original:
 *
 *  * the split markup is `aria-hidden` behind an `aria-label`, so screen
 *    readers get the sentence rather than a letter-by-letter spelling —
 *    Salient ships the raw per-letter spans;
 *  * the split is only built when it will actually animate. Below
 *    1000px (`data-m-rm-animation`) and under `prefers-reduced-motion`
 *    the heading renders as plain text, which is also what the theme's
 *    mobile kill-switch resolves to.
 */

const CAN_ANIMATE = '(min-width: 1000px) and (prefers-reduced-motion: no-preference)'

export default function SplitHeading({
  as: Tag = 'h2',
  text,
  className = '',
  style,
  hero = false,
}) {
  const ref = useRef(null)
  const [split, setSplit] = useState(false)
  const [shown, setShown] = useState(false)

  // Decide after mount so the first paint is always the plain heading —
  // if anything below fails, the text is still there and readable.
  useEffect(() => {
    const mq = window.matchMedia(CAN_ANIMATE)
    const apply = () => setSplit(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!split || shown) return
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        // `isIntersecting` alone leaves a heading hidden forever if the
        // page opens already scrolled past it — a deep link to #band-5, a
        // restored scroll position, or a back-navigation. Anything above
        // the viewport has had its moment and is revealed outright.
        if (entries.some((e) => e.isIntersecting || e.boundingClientRect.bottom < 0)) {
          setShown(true)
          io.disconnect()
        }
      },
      // Salient fires its reveal a little before the heading is fully in
      // view, which is what keeps the motion from feeling late.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [split, shown])

  const cls = ['split-heading', hero ? 'split-heading--hero' : '', className]
    .filter(Boolean)
    .join(' ')

  if (!split) {
    return <Tag ref={ref} className={cls} style={style}>{text}</Tag>
  }

  // Words keep their spaces as real text nodes between spans, so the
  // heading still wraps and copies as a sentence.
  const words = String(text).split(/(\s+)/)
  let letterIndex = 0

  return (
    <Tag
      ref={ref}
      className={`${cls} split-heading--split${shown ? ' is-revealed' : ''}`}
      style={style}
      aria-label={text}
    >
      <span aria-hidden="true">
        {words.map((word, wi) => {
          if (/^\s+$/.test(word)) return word
          return (
            <span key={wi} className="split-heading__word">
              {[...word].map((ch, ci) => (
                <span
                  key={ci}
                  className="split-heading__letter"
                  style={{ '--i': letterIndex++ }}
                >
                  {ch}
                </span>
              ))}
            </span>
          )
        })}
      </span>
    </Tag>
  )
}
