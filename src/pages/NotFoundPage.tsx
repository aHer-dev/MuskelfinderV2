import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <section className="page">
      <EmptyState
        headingLevel={1}
        icon="icInfo"
        title="Seite nicht gefunden"
        description="Diese Adresse gibt es nicht (mehr). Vielleicht ein alter Link oder ein Tippfehler."
        action={
          <Link to="/suche" className="btn btn--primary">
            Zur Muskelsuche
          </Link>
        }
      />
    </section>
  )
}
