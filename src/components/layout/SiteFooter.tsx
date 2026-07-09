import { NavLink } from 'react-router-dom'

/**
 * Globaler Footer (Etappe 5): Attribution (CC BY 4.0 Pflicht, ADR 0002) + Zugang zu den
 * Rechts-/Transparenz-Seiten. Auf jeder Route sichtbar, unter dem Seiteninhalt.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer__attr">
        Bilder: BodyParts3D, © DBCLS, CC BY 4.0
      </p>
      <nav className="site-footer__links" aria-label="Rechtliches">
        <NavLink to="/quellen" className="site-footer__link">
          Quellen &amp; Lizenzen
        </NavLink>
        <span className="site-footer__sep" aria-hidden="true">
          ·
        </span>
        <NavLink to="/datenschutz" className="site-footer__link">
          Datenschutz
        </NavLink>
      </nav>
    </footer>
  )
}
