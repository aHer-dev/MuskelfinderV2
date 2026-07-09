import { LegalPage } from './LegalPage'

/**
 * Datenschutz (Etappe 5). Inhalt aus V1 `datenschutz.html` übernommen und an V2 angepasst
 * (V2 nutzt localStorage statt session-/localStorage-Mix; keine Analyse-/Tracking-Funktion).
 */
export function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Rechtliches"
      title="Datenschutz"
      lead="Hinweise zur Nutzung des Muskelfinders als statische Web-App."
    >
      <section className="legal-card">
        <h2>Über diese Seite</h2>
        <p>
          Der Muskelfinder ist eine statische Web-Anwendung. Es gibt keinen Login, kein
          Nutzerkonto und keine integrierte Analyse- oder Werbetracking-Funktion.
        </p>
      </section>

      <section className="legal-card">
        <h2>Funktionale Speicherungen im Browser</h2>
        <p>
          Die App nutzt den lokalen Speicher des Browsers (<strong>localStorage</strong>), um die
          Bedienung angenehmer zu machen. Gespeichert werden ausschließlich:
        </p>
        <ul className="legal-list">
          <li>Anzeigeeinstellungen (z. B. Theme hell/dunkel)</li>
          <li>Lernfortschritt der Lernkarten und XP/Level</li>
          <li>Quiz-Serienstatistik und ausgewählte Muskelpakete</li>
        </ul>
        <p>
          Diese Daten bleiben auf dem jeweiligen Gerät und werden nicht an einen Server des
          Projekts übertragen. Sie können über die Backup-Funktion exportiert und wieder importiert
          werden.
        </p>
      </section>

      <section className="legal-card">
        <h2>Öffentliche Bereitstellung über GitHub Pages</h2>
        <p>
          Wird der Muskelfinder öffentlich über GitHub Pages bereitgestellt, erfolgt das Hosting
          über GitHub. Dabei können technisch notwendige Verbindungsdaten wie IP-Adressen durch den
          Hosting-Anbieter verarbeitet werden. Maßgeblich sind dann zusätzlich die
          Datenschutzinformationen von GitHub.
        </p>
        <ul className="legal-list">
          <li>
            <a
              href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Pages
            </a>
          </li>
          <li>
            <a
              href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Privacy Statement
            </a>
          </li>
        </ul>
      </section>

      <section className="legal-card">
        <h2>Hinweis zum Rechtsstand</h2>
        <p>
          Diese Seite dient der transparenten Projektinformation und ersetzt keine individuelle
          Rechtsberatung. Für einen öffentlichen schulischen oder institutionellen Einsatz sollten
          Impressum, Verantwortlichenangaben und die tatsächlichen Hosting-Umstände zusätzlich
          geprüft und ergänzt werden.
        </p>
      </section>
    </LegalPage>
  )
}
