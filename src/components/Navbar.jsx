import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { primaryNav } from '@/data/navigation'
import { hasFullHeightHero } from '@/data/pages'
import '@/styles/component-styles/navbar.scss'

import logo from '@/assets/logos/logo-elegant-address-r.png'
import logoWhite from '@/assets/logos/logo-elegant-address-white-r.png'

function NavItem({ item, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickAway = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onEscape = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onClickAway)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', onClickAway)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  if (!item.children) {
    return (
      <li className="navbar__item">
        <NavLink
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
        >
          {item.label}
        </NavLink>
      </li>
    )
  }

  return (
    <li
      ref={ref}
      className={`navbar__item navbar__item--has-children ${open ? 'is-open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="navbar__submenu-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <span className="navbar__caret" aria-hidden="true" />
      </button>

      <ul className="navbar__submenu">
        {item.children.map((child) => (
          <li key={child.to}>
            <NavLink
              to={child.to}
              onClick={() => { setOpen(false); onNavigate?.() }}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {child.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </li>
  )
}

export default function Navbar() {
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  // Salient served a transparent header with the white logo over the
  // full-height hero (redux: header-starting-logo = the white variant),
  // switching to the solid white header once scrolled.
  // Asking the content model rather than the path: any page whose first
  // section is a full-height banner gets the transparent treatment, which
  // is what the theme does.
  const overHero = hasFullHeightHero(location.pathname)
  const isTransparent = overHero && !isScrolled && !isOpen

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hide-on-the-way-down, reveal-on-the-way-up — /barbados only, from the
  // "1,200+ properties" band onward. The band marks itself with
  // `data-nav-autohide` (see overrides.js); every other page has no
  // marker, so this costs one failed lookup and nothing else.
  //
  // The marker is queried inside the handler rather than once on mount:
  // routes are lazily loaded, so on a cold navigation the page is still a
  // fallback when this effect first runs and a single lookup would miss.
  useEffect(() => {
    let last = window.scrollY
    let marker = null

    const onScroll = () => {
      marker = marker?.isConnected ? marker : document.querySelector('[data-nav-autohide]')
      if (!marker) return

      const y = window.scrollY
      // A trackpad emits a stream of sub-pixel deltas either side of a
      // gesture; reacting to those flickers the bar on and off.
      if (Math.abs(y - last) < 4) return
      const down = y > last
      last = y

      const from = marker.getBoundingClientRect().top + y
      setIsHidden(down && y > from)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  // Close the mobile menu on navigation. Adjusting state during render
  // (rather than in an effect) avoids a cascading second render, and
  // still catches back/forward navigation that no click handler sees.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setIsOpen(false)
    // Leaving /barbados with the bar parked off-screen would carry a
    // hidden header onto the next page.
    setIsHidden(false)
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <header
      className={[
        'navbar',
        isTransparent ? '' : 'is-scrolled',
        isOpen ? 'is-open' : '',
        // Never out of reach while the menu it opens is on screen.
        isHidden && !isOpen ? 'is-hidden' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="Elegant Address — home">
          <img
            src={isTransparent ? logoWhite : logo}
            alt="Elegant Address, Luxury Property Group"
            width="601"
            height="260"
          />
        </Link>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsOpen((v) => !v)}
        >
          <span className="visually-hidden">{isOpen ? 'Close menu' : 'Open menu'}</span>
          <span className="navbar__bars" aria-hidden="true" />
        </button>

        <nav id="primary-navigation" className="navbar__nav" aria-label="Primary">
          <ul className="navbar__links">
            {primaryNav.map((item) => (
              <NavItem key={item.label} item={item} onNavigate={() => setIsOpen(false)} />
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
