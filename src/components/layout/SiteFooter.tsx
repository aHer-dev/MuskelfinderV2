import { NavLink } from 'react-router-dom'
import { THREE_D_BASE_URL } from '../../data/threeD'

/**
 * Globaler Footer (Etappe 5): Attribution (CC BY 4.0 Pflicht, ADR 0002) + Zugang zu den
 * Rechts-/Transparenz-Seiten. Etappe 6: externer Link zur 3D-Anatomie-App (V1-Menü-Parität).
 * Auf jeder Route sichtbar, unter dem Seiteninhalt.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer__attr">
        Bilder: BodyParts3D, © DBCLS, CC BY 4.0
      </p>
      <nav className="site-footer__links" aria-label="Rechtliches">
        {/* Der Guide (10b) muss auch dann erreichbar sein, wenn der Kasten laengst voll ist. */}
        <NavLink to="/anleitung" className="site-footer__link">
          So lernst du hier
        </NavLink>
        <span className="site-footer__sep" aria-hidden="true">
          ·
        </span>
        <a
          className="site-footer__link"
          href={THREE_D_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          3D Anatomie ↗
        </a>
        <span className="site-footer__sep" aria-hidden="true">
          ·
        </span>
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
