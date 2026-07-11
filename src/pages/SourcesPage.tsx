import { LegalPage } from './LegalPage'

/**
 * Quellen & Lizenzen (Etappe 5). Inhalt aus V1 `quellen-lizenzen.html` übernommen.
 * Pflicht: BodyParts3D/DBCLS CC BY 4.0 sichtbar halten (ADR 0002, CLAUDE.md-Verbote).
 */
export function SourcesPage() {
  return (
    <LegalPage
      eyebrow="Transparenz"
      title="Quellen & Lizenzen"
      lead="Bildquellen, Datengrundlagen und verwendete Bibliotheken im Muskelfinder."
    >
      <section className="legal-card">
        <h2>Bildquellen</h2>
        <p>
          Die im Muskelfinder eingebundenen anatomischen Muskelbilder basieren projektweit auf{' '}
          <strong>BodyParts3D</strong> der{' '}
          <strong>Database Center for Life Science (DBCLS)</strong>.
        </p>
        <p>
          Diese Inhalte werden unter{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY 4.0
          </a>{' '}
          genutzt. Die Detailseite jedes Muskels zeigt zusätzlich die konkrete Bildattribution an.
        </p>
        <p>
          Die Bilder wurden für den Unterricht didaktisch ausgewählt, umbenannt, gruppiert und in
          die App-Struktur eingebunden. Soweit Bearbeitungen vorgenommen wurden, bleiben die
          Ursprungsrechte der Quelle unberührt.
        </p>
      </section>

      <section className="legal-card">
        <h2>Empfohlene Namensnennung</h2>
        <p>
          Für die Bildquelle wird im Projekt die folgende Namensnennung verwendet:{' '}
          <strong>BodyParts3D, © DBCLS, CC BY 4.0</strong>.
        </p>
        <p>Offizielle Lizenz- und Archivseiten:</p>
        <ul className="legal-list">
          <li>
            <a
              href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              BodyParts3D Archiv-Lizenzseite
            </a>
          </li>
          <li>
            <a
              href="https://lifesciencedb.jp/bp3d/info_en/userGuide/faq/credit.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              BodyParts3D FAQ / Credit-Hinweis
            </a>
          </li>
          <li>
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Creative Commons BY 4.0
            </a>
          </li>
        </ul>
      </section>

      <section className="legal-card">
        <h2>App-Inhalte</h2>
        <p>
          Die fachlichen Texte, Filterstrukturen, Quizlogik und didaktische Aufbereitung dieser App
          wurden für den Einsatz im Lern- und Unterrichtskontext zusammengestellt. Die anatomischen
          und funktionellen Inhalte wurden unter Heranziehung fachlicher Literatur eigenständig
          formuliert und in die App-Struktur übertragen.
        </p>
      </section>

      <section className="legal-card">
        <h2>Fachliche Textquellen</h2>
        <p>Die theoretischen Inhalte orientieren sich unter anderem an folgenden Lehrwerken:</p>
        <ul className="legal-list">
          <li>
            Schulte, Erik; Schumacher, Udo; Schünke, Michael:{' '}
            <strong>
              PROMETHEUS Allgemeine Anatomie und Bewegungssystem: LernAtlas der Anatomie
            </strong>
            . Thieme.
          </li>
          <li>
            Zalpour, Christoff:{' '}
            <strong>Anatomie Physiologie für die Physiotherapie</strong>. Urban &amp; Fischer.
          </li>
          <li>
            Neumann, Donald A.:{' '}
            <strong>Neumann&rsquo;s Kinesiology of the Musculoskeletal System</strong>. Elsevier.
          </li>
        </ul>
        <p>
          Diese Angaben dienen der fachlichen Transparenz. Die angezeigten Beschreibungen wurden
          nicht wörtlich übernommen, sondern für den Lernkontext eigenständig zusammengefasst und
          formuliert.
        </p>
      </section>

      <section className="legal-card">
        <h2>Verwendete Software</h2>
        <ul className="legal-list">
          <li>
            Der Muskelfinder ist eine statische Web-App auf Basis von React, TypeScript und Vite.
          </li>
          <li>
            Bei öffentlicher Bereitstellung über GitHub Pages gelten zusätzlich die Hosting- und
            Datenschutzbedingungen des Anbieters.
          </li>
        </ul>
      </section>
    </LegalPage>
  )
}
