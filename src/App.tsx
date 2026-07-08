import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useTheme } from './hooks/useTheme'
import { SearchPage } from './pages/SearchPage'
import { MuscleDetailPage } from './pages/MuscleDetailPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { QuizPage } from './pages/QuizPage'
import { StatsPage } from './pages/StatsPage'
import { NotFoundPage } from './pages/NotFoundPage'

/*
 * HashRouter (Etappe 0, ADR 0003): robust auf statischem Hosting — Deep-Link-Reload
 * erzeugt keine 404, ohne Server-Fallback. Routen laut migration-plan.md §E0.
 */
function App() {
  useTheme()

  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/suche" replace />} />
          <Route path="/suche" element={<SearchPage />} />
          <Route path="/muskel/:id" element={<MuscleDetailPage />} />
          <Route path="/lernkarten" element={<FlashcardsPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/statistik" element={<StatsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}

export default App
