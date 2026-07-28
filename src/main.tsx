import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './styles/fonts.css'
import './styles/base.css'
import './styles/components.css'
// Seiten-Primitives (Eyebrow/Titel/Body) global laden — werden von allen Seiten
// genutzt; ohne globalen Import blieben die Kopf-Stile unwirksam.
import './pages/pages.css'
/* MUSS hier stehen, nicht erst in der Seite, die den Knopf zeigt.
   `pwa/install.ts` registriert beim Import einen `beforeinstallprompt`-Hoerer und
   puffert das Ereignis — Chrome feuert es einmal, kurz nach dem Laden. Der Hoerer
   hing aber am Import von `InstallSection`, und die steckt in `GuidePage`: einem
   LAZY-Chunk, der erst beim Aufruf von `/anleitung` geladen wird. Bis dahin war das
   Ereignis lange durch, der Puffer leer, und die Seite zeigte statt des
   Installationsknopfes den Menue-Hinweis — auf einem Chrome, das installieren
   WOLLTE. Ein Seiteneffekt-Import in der Seite selbst hebt sich durch das
   Code-Splitting auf; `check:pwa` prueft jetzt, dass der Hoerer im Start-Bundle liegt. */
import './pwa/install'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
