import { Link } from 'react-router-dom'
import { allPosts } from '@/data/posts'
import { assetUrl } from '@/lib/assets'
import '@/styles/page-styles/blog.scss'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

/**
 * The WordPress /blog page had no content of its own — the theme rendered
 * the post loop. This replaces that template.
 */
export default function BlogIndex() {
  return (
    <div className="blog">
      <header className="blog__masthead">
        <div className="container">
          <span className="eyebrow">Elegant Address</span>
          <h1 className="blog__title">Journal</h1>
          <p className="blog__standfirst">
            Notes on the Côte d’Azur and Barbados from our consultants —
            the regions, the properties and the places worth knowing.
          </p>
        </div>
      </header>

      <div className="container">
        <ul className="blog__list">
          {allPosts.map(({ slug, title, date, excerpt, cover }) => (
            <li key={slug} className="blog__item">
              <Link to={`/blog/${slug}`} className="blog__link">
                {cover && (
                  <div className="blog__thumb">
                    <img src={assetUrl(cover)} alt="" loading="lazy" />
                  </div>
                )}
                <div className="blog__body">
                  <time className="blog__date" dateTime={date}>
                    {formatDate(date)}
                  </time>
                  <h2 className="blog__item-title">{title}</h2>
                  <p className="blog__excerpt">{excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
