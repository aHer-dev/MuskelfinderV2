import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RouteFallback } from './components/layout/RouteFallback'
import { useTheme } from './hooks/useTheme'
import { useDailyBonus } from './hooks/useDailyBonus'

/*
 * Route-Code-Splitting (Etappe 5): jede Seite ist ein eigener Chunk via React.lazy,
 * damit der Erst-Load nur die Shell + Startroute zieht. Suspense-Fallback = RouteFallback.
 */
const TodayPage = lazy(() => import('./pages/TodayPage').then((m) => ({ default: m.TodayPage })))
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
)
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const MuscleDetailPage = lazy(() =>
  import('./pages/MuscleDetailPage').then((m) => ({ default: m.MuscleDetailPage })),
)
const FlashcardsPage = lazy(() =>
  import('./pages/FlashcardsPage').then((m) => ({ default: m.FlashcardsPage })),
)
const DeckManagerPage = lazy(() =>
  import('./pages/DeckManagerPage').then((m) => ({ default: m.DeckManagerPage })),
)
const QuizPage = lazy(() => import('./pages/QuizPage').then((m) => ({ default: m.QuizPage })))
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })))
const SourcesPage = lazy(() =>
  import('./pages/SourcesPage').then((m) => ({ default: m.SourcesPage })),
)
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

/*
 * HashRouter (Etappe 0, ADR 0003): robust auf statischem Hosting — Deep-Link-Reload
 * erzeugt keine 404, ohne Server-Fallback. Routen laut migration-plan.md §E0 + E5.
 */
function App() {
  useTheme()
  useDailyBonus()

  return (
    <HashRouter>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Einstieg ist der Vorschlag, nicht der Katalog (ADR 0007). Die abgestuften
                Routen (/karteikasten, /quiz) bleiben erreichbar — Deep-Links brechen nicht. */}
            <Route path="/" element={<Navigate to="/heute" replace />} />
            <Route path="/heute" element={<TodayPage />} />
            <Route path="/start" element={<OnboardingPage />} />
            <Route path="/suche" element={<SearchPage />} />
            <Route path="/muskel/:id" element={<MuscleDetailPage />} />
            <Route path="/lernkarten" element={<FlashcardsPage />} />
            <Route path="/karteikasten" element={<DeckManagerPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/statistik" element={<StatsPage />} />
            <Route path="/quellen" element={<SourcesPage />} />
            <Route path="/datenschutz" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  )
}

export default App
