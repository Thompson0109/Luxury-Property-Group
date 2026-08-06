import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Page from './pages/Page'
import { redirects } from './data/navigation'
import './styles/main.scss'

const BlogIndex = lazy(() => import('./pages/BlogIndex'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<div className="route-fallback" aria-busy="true" />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Page slug="" />} />

            {/* Slugs that changed in the move keep working. */}
            {redirects.map(({ from, to }) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}

            {/* The blog is its own shape: WordPress rendered /blog from a
                template, and the posts are classic-editor HTML rather than
                the section model the pages use. */}
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            {/* Flat slugs, matching the old /%postname%/ permalinks. */}
            <Route path="/:slug" element={<Page />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  )
}
