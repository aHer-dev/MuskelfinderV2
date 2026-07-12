/* =========================================================================
   HeaderSearch — Nachschlagen von überall (Etappe 7d).
   src/components/layout/HeaderSearch.tsx

   Der neue Einstieg (`/heute`) darf das Nachschlagen nicht teurer machen: Suche
   verliert den Startbildschirm, nicht die Erreichbarkeit. Darum sitzt das Feld
   in der Kopfzeile jeder Route und springt beim ersten Tastendruck in die
   Trefferliste. Eine laufende Lernsitzung übersteht das — sie liegt seit 7d im
   `useSessionStore` und nicht mehr in der Seite.
   ========================================================================= */

import { useLocation, useNavigate } from 'react-router-dom';
import { SearchField } from '../features/search/SearchField';
import '../features/search/search.css';

export function HeaderSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    // Eigene Landmark: sonst läge das Feld außerhalb jeder Region (axe „region") und wäre
    // für Screenreader-Nutzer nur über den Fließtext zu finden, nicht über die Landmarken.
    <div className="header-search" role="search" aria-label="Muskelsuche">
      <SearchField
        onActivate={() => {
          if (pathname !== '/suche') navigate('/suche');
        }}
      />
    </div>
  );
}
