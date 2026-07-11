/**
 * Suspense-Fallback fürs Route-Code-Splitting (Etappe 5). Bewusst minimal:
 * dezenter, per aria-live angekündigter Ladehinweis, respektiert prefers-reduced-motion (CSS).
 */
export function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback__spinner" aria-hidden="true" />
      <span className="route-fallback__label">Wird geladen …</span>
    </div>
  )
}
