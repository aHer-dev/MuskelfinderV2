import { useState } from 'react';
import { useInstallAngebot } from '../../../hooks/useInstallAngebot';
import { Icon } from '../../ui/Icon';
import './install.css';

/**
 * „Als App aufs Handy" — vier Fälle, vier verschiedene Antworten.
 *
 * Ein einzelner Knopf würde hier bei der Hälfte der Nutzer ins Leere zeigen:
 * iOS kennt kein Installationsereignis, und in einem eingebetteten Webview
 * (Link aus Instagram, WhatsApp, Teams) ist Installieren gar nicht möglich.
 * Deshalb entscheidet `useInstallAngebot`, was hier steht — die Logik samt
 * Begründung der Reihenfolge liegt in `src/pwa/install.ts`.
 */
export function InstallSection() {
  const { angebot, install } = useInstallAngebot();
  const [ergebnis, setErgebnis] = useState<'angenommen' | 'abgelehnt' | null>(null);

  async function klick() {
    const r = await install();
    if (r === 'angenommen' || r === 'abgelehnt') setErgebnis(r);
  }

  return (
    <section className="guide__section install" aria-labelledby="guide-install">
      <h2 className="guide__subtitle" id="guide-install">
        Als App aufs Handy
      </h2>

      {angebot === 'laeuft-als-app' && (
        <p className="guide__body install__ok">
          <Icon name="icCheck" />
          Läuft schon als installierte App. Nichts zu tun.
        </p>
      )}

      {angebot === 'knopf' && (
        <>
          <p className="guide__body">
            Danach liegt der Muskelfinder mit eigenem Symbol auf dem Startbildschirm,
            startet ohne Browserleiste und funktioniert <strong>offline</strong> — die
            Karteikarten und alle bereits geladenen Bilder bleiben verfügbar.
          </p>
          {ergebnis === null && (
            <button type="button" className="btn btn--primary install__button" onClick={klick}>
              <Icon name="icPlus" />
              Jetzt installieren
            </button>
          )}
          {ergebnis === 'angenommen' && (
            <p className="guide__body install__ok">
              <Icon name="icCheck" />
              Fertig — du findest den Muskelfinder jetzt auf dem Startbildschirm.
            </p>
          )}
          {ergebnis === 'abgelehnt' && (
            <p className="guide__note">
              Abgebrochen. Du kannst es jederzeit über das Browsermenü nachholen.
            </p>
          )}
        </>
      )}

      {angebot === 'ios-anleitung' && (
        <>
          <p className="guide__body">
            Auf iPhone und iPad gibt es dafür keinen Knopf — Apple lässt nur den Weg
            über das Teilen-Menü zu. Am verlässlichsten klappt es in <strong>Safari</strong>:
          </p>
          <ol className="guide__list install__steps">
            <li>Unten (oder oben) auf das <strong>Teilen-Symbol</strong> tippen — das Quadrat mit dem Pfeil nach oben.</li>
            <li>In der Liste nach unten wischen bis <strong>„Zum Home-Bildschirm"</strong>.</li>
            <li>Oben rechts <strong>„Hinzufügen"</strong> bestätigen.</li>
          </ol>
          <p className="guide__note">
            Findest du „Zum Home-Bildschirm" nicht, bist du wahrscheinlich nicht in
            Safari. Öffne die Seite dort noch einmal.
          </p>
        </>
      )}

      {angebot === 'in-app-browser' && (
        <>
          <p className="guide__body">
            Du siehst die Seite gerade in einem <strong>eingebetteten Browser</strong> —
            das passiert, wenn man einen Link direkt aus WhatsApp, Instagram oder Teams
            öffnet. Dort ist Installieren technisch nicht möglich, egal wie lange man sucht.
          </p>
          <ol className="guide__list install__steps">
            <li>Oben oder unten das Menü öffnen (<strong>⋮</strong> oder <strong>···</strong>).</li>
            <li><strong>„In Chrome öffnen"</strong> bzw. „In Safari öffnen" wählen.</li>
            <li>Diese Seite dort erneut aufrufen — dann steht hier der Knopf.</li>
          </ol>
        </>
      )}

      {angebot === 'menue-hinweis' && (
        <>
          <p className="guide__body">
            Dein Browser bietet gerade keinen Installationsknopf an. Über das
            Browsermenü geht es trotzdem:
          </p>
          <ol className="guide__list install__steps">
            <li>Das Browsermenü öffnen (<strong>⋮</strong> oben rechts).</li>
            <li><strong>„App installieren"</strong> oder „Zum Startbildschirm hinzufügen" wählen.</li>
          </ol>
          <p className="guide__note">
            Der Eintrag fehlt in privaten Fenstern und in älteren Browsern.
          </p>
        </>
      )}
    </section>
  );
}
