import { Link } from 'react-router-dom'
import '@/styles/page-styles/not-found.scss'

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="container container--narrow">
        <h2>We can&rsquo;t find that page</h2>
        <p>
          The page you&rsquo;re looking for has moved or no longer exists.
          Our consultants can point you in the right direction.
        </p>
        <p className="not-found__actions">
          <Link className="btn" to="/">Back to home</Link>
          <Link className="btn btn--ghost" to="/contact">Contact us</Link>
        </p>
      </div>
    </div>
  )
}
