import { Link } from 'react-router-dom'
import { PlaceholderPage } from './PlaceholderPage'

export function NotFoundPage() {
  return (
    <PlaceholderPage title="Seite nicht gefunden">
      <p>
        Diese Route existiert nicht. Zurück zur <Link to="/suche">Suche</Link>.
      </p>
    </PlaceholderPage>
  )
}
