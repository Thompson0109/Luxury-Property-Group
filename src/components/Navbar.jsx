import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { primaryNav } from '@/data/navigation'
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

  // Salient served a transparent header with the white logo over the
  // full-height hero (redux: header-starting-logo = the white variant),
  // switching to the solid white header once scrolled.
  const overHero = location.pathname === '/'
  const isTransparent = overHero && !isScrolled && !isOpen

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation. Adjusting state during render
  // (rather than in an effect) avoids a cascading second render, and
  // still catches back/forward navigation that no click handler sees.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setIsOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <header
      className={[
        'navbar',
        isScrolled ? 'is-scrolled' : '',
        isTransparent ? 'is-transparent' : '',
        isOpen ? 'is-open' : '',
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
