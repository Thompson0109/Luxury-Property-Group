import { useParams, Navigate } from 'react-router-dom'
import Section from '@/components/Section'
import { getPage } from '@/data/pages'
import { emptyPages } from '@/data/stubs'
import '@/styles/page-styles/page.scss'

/**
 * Renders any of the ported WordPress pages from the extracted content
 * model. `slug` comes from the route; the home page passes it explicitly.
 */
export default function Page({ slug: fixedSlug }) {
  const params = useParams()
  const slug = fixedSlug ?? params.slug ?? ''
  const page = getPage(slug)

  if (page) {
    return (
      <article className="page">
        {page.sections.map((section, i) => (
          <div key={i} id={`band-${i}`}>
            <Section section={section} index={i} isHero={i === 0} />
          </div>
        ))}
      </article>
    )
  }

  // Published in WordPress but with empty content. Rendering a titled
  // shell keeps the URL alive (and the nav honest) instead of 404ing on a
  // page that does exist.
  const stub = emptyPages.find((p) => p.slug === slug)
  if (stub) {
    return (
      <article className="page page--stub">
        <div className="container container--narrow">
          <h1>{stub.title}</h1>
          <p className="page__stub-note">
            This page is still to be written.
          </p>
        </div>
      </article>
    )
  }

  return <Navigate to="/404" replace />
}
