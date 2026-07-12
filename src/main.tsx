import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './styles/fonts.css'
import './styles/base.css'
import './styles/components.css'
// Seiten-Primitives (Eyebrow/Titel/Body) global laden — werden von allen Seiten
// genutzt; ohne globalen Import blieben die Kopf-Stile unwirksam.
import './pages/pages.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
