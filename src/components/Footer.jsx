import { Link } from 'react-router-dom'
import { site, contact, social } from '@/data/site'
import { footerNav } from '@/data/navigation'
import '@/styles/component-styles/footer.scss'

import logoWhite from '@/assets/logos/logo-elegant-address-white-r.png'
import awardBadges from '@/assets/images/awards/award-badges.png'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__column footer__column--brand">
          <img
            src={logoWhite}
            alt={`${site.name}, ${site.tagline}`}
            className="footer__logo"
            width="601" height="260" loading="lazy"
          />
          <img
            src={awardBadges}
            alt="Awards and accreditations"
            className="footer__badges"
            loading="lazy"
          />
        </div>

        <div className="footer__column">
          <h2 className="footer__heading">Destinations</h2>
          <ul className="footer__list">
            <li><Link to="/south-of-france">South of France</Link></li>
            <li><Link to="/barbados">Barbados</Link></li>
            <li><Link to="/cannes-congress">Cannes Congress</Link></li>
            <li><Link to="/featured-properties">Featured Properties</Link></li>
          </ul>
        </div>

        <div className="footer__column">
          <h2 className="footer__heading">Speak to a consultant</h2>
          <ul className="footer__list footer__list--spaced">
            {contact.offices.map(({ label, tel, href }) => (
              <li key={label}>
                <span className="footer__label">{label}</span>
                <a href={href}>{tel}</a>
              </li>
            ))}
            <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
          </ul>
          {contact.openingHours.map(({ days, hours }) => (
            <p key={days} className="footer__hours">{days}<br />{hours}</p>
          ))}
        </div>

        <div className="footer__column">
          <h2 className="footer__heading">{contact.address.company}</h2>
          <address className="footer__address">
            {contact.address.lines.map((line) => <span key={line}>{line}</span>)}
          </address>
          <ul className="footer__list">
            {footerNav.map(({ label, to }) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer__copyright">
        <div className="container footer__copyright-inner">
          <p>
            &copy; {year} {site.legalName}. Registered in England no.{' '}
            {contact.companyNumber}.
          </p>
          <ul className="footer__social">
            {social.map(({ label, href }) => (
              <li key={label}>
                <a href={href} rel="noreferrer noopener" target="_blank">{label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
