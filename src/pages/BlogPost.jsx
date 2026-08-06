import { useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getPost, allPosts } from '@/data/posts'
import { assetUrl } from '@/lib/assets'
import '@/styles/page-styles/blog.scss'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

/**
 * The extractor rewrites surviving image srcs to `@asset/<path>`, because
 * JSON can't hold an ES import and Vite needs to see the real module to
 * hash and emit the file. We swap those placeholders for the built URLs
 * here, once per post.
 */
function resolveAssets(html) {
  return html.replace(/src="@asset\/([^"]+)"/g, (whole, path) => {
    const url = assetUrl(path)
    return url ? `src="${url}"` : whole
  })
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)

  const html = useMemo(
    () => (post ? resolveAssets(post.html) : ''),
    [post]
  )

  if (!post) return <Navigate to="/404" replace />

  const index = allPosts.findIndex((p) => p.slug === slug)
  const next = allPosts[index - 1]
  const previous = allPosts[index + 1]

  return (
    <article className="post">
      <header className="post__header">
        <div className="container container--narrow">
          <Link to="/blog" className="post__back">← Journal</Link>
          <time className="post__date" dateTime={post.date}>
            {formatDate(post.date)}
          </time>
          <h1 className="post__title">{post.title}</h1>
        </div>
      </header>

      {post.cover && (
        <div className="post__cover">
          <img src={assetUrl(post.cover)} alt="" />
        </div>
      )}

      <div className="container container--narrow">
        {/* Trusted build-time content from the site's own database. */}
        <div
          className="post__body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {(previous || next) && (
        <nav className="post__pagination container container--narrow">
          {previous && (
            <Link to={`/blog/${previous.slug}`} className="post__nav post__nav--prev">
              <span className="post__nav-label">Previous</span>
              <span className="post__nav-title">{previous.title}</span>
            </Link>
          )}
          {next && (
            <Link to={`/blog/${next.slug}`} className="post__nav post__nav--next">
              <span className="post__nav-label">Next</span>
              <span className="post__nav-title">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  )
}
