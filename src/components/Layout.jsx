import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * Persistent chrome around every route.
 *
 * NOTE — this is a deliberate departure from SouthEat, which mounts
 * <Navbar /> inside each page. SouthEat has four pages; this site has a
 * header and footer that must appear on every page including the dynamic
 * destination route, so a layout route avoids repeating them and keeps
 * the header mounted across navigations (no scroll/animation reset).
 */
export default function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
