import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { allPosts } from '@/data/posts'
import { assetUrl } from '@/lib/assets'
import '@/styles/page-styles/blog.scss'

/**
 * The WordPress /blog page has no content of its own — the theme renders
 * the post loop into `.post-area.masonry.auto_meta_overlaid_spaced`.
 *
 * Measured on the running site at 1905px: a four-track grid 1261px wide
 * with 8px of padding per item (a 16px gutter), every card a fixed 472px
 * tall, and the first post spanning two tracks. The meta is overlaid on
 * the image rather than sitting under it — a flat 30% black over the
 * whole card, a bottom-anchored gradient to rgba(35,35,35,.65) over the
 * lower 75%, and white type anchored to the bottom edge at 30px.
 *
 * Ten posts to a page, then Salient's accent pill pagination.
 *
 * ⚠ The port previously opened with a "Journal" masthead band. The live
 * page has no header of any kind — the grid starts directly under the
 * site header — so it is gone, and the page title is now carried for
 * assistive tech only. Put `.blog__masthead` back if the band is wanted.
 */

const PER_PAGE = 10

// Every post on the live site sits in the "General" category, and the
// extractor doesn't carry taxonomy, so the chip is a constant.
const CATEGORY = 'General'

export default function BlogIndex() {
  const [params, setParams] = useSearchParams()
  const requested = Number.parseInt(params.get('page') ?? '1', 10)
  const pageCount = Math.max(1, Math.ceil(allPosts.length / PER_PAGE))
  const page = Number.isNaN(requested) ? 1 : Math.min(Math.max(requested, 1), pageCount)

  const posts = allPosts.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [page])

  const goTo = (n) => setParams(n === 1 ? {} : { page: String(n) })

  return (
    <div className="blog">
      <div className="container">
        <h1 className="visually-hidden">Journal</h1>

        <div className="blog__grid">
          {posts.map(({ slug, title, cover }, i) => (
            <article
              // The first card of the first page spans two tracks, as on
              // the live grid. Later pages open with a full-width card
              // too — Salient's masonry does the same.
              className={`blog__card${i === 0 ? ' blog__card--wide' : ''}`}
              key={slug}
            >
              <div className="blog__frame">
                <div className={`blog__media${cover ? '' : ' blog__media--empty'}`}>
                  {cover && <img src={assetUrl(cover)} alt="" loading={i < 3 ? 'eager' : 'lazy'} />}
                </div>

                {/* The whole card is the link; the category chip sits
                    above it and takes its own pointer events. */}
                <Link className="blog__cover-link" to={`/blog/${slug}`} aria-label={title} />

                <div className="blog__meta">
                  <span className="blog__category">
                    <Link to="/blog">{CATEGORY}</Link>
                  </span>
                  <h2 className="blog__card-title">
                    <Link to={`/blog/${slug}`} tabIndex={-1}>{title}</Link>
                  </h2>
                </div>
              </div>
            </article>
          ))}
        </div>

        {pageCount > 1 && (
          <nav className="blog__pagination" aria-label="Blog pages">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                type="button"
                key={n}
                className={`blog__page${n === page ? ' is-current' : ''}`}
                aria-current={n === page ? 'page' : undefined}
                onClick={() => goTo(n)}
              >
                {n}
              </button>
            ))}
            {page < pageCount && (
              <button
                type="button"
                className="blog__page blog__page--next"
                onClick={() => goTo(page + 1)}
              >
                Next
              </button>
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
