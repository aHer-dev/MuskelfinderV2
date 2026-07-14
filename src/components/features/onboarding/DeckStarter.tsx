/* =========================================================================
   DeckStarter — die drei Wege, den Karteikasten zu füllen (Etappe 10c).
   src/components/features/onboarding/DeckStarter.tsx

   Bis ADR 0009 legte die App 20 Karten von selbst an. Jetzt wählt der Schüler — und
   damit er das kann, muss hier stehen, **wie** er es tut. Drei Wege, in der Reihenfolge,
   in der ein Schüler sie braucht:

   1. **Kursabschnitt** — der Weg, den er wirklich geht. Fehlt noch (der Projektinhaber
      trägt die Abschnitte ein, `docs/curriculum-erfassen.md`), darum bis dahin ein
      **bewusster Platzhalter** statt eines leeren Menüs.
   2. **Bereich** — funktioniert heute, aus den vorhandenen Daten.
   3. **Einzeln nachschlagen** — für alles, was er im Unterricht aufschnappt.

   Die Zahl an jedem Knopf ist die Zahl der Karten, die er bekommt: nach `nameLatin`
   entdoppelt (ADR 0002 §2 — fünf Namen gibt es zweimal, Hand und Fuß, und das ist je
   EINE Karte).
   ========================================================================= */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMuscles, getRegions } from '../../../data';
import { getSections } from '../../../data/curriculum';
import { useProfileStore } from '../../../store/useProfileStore';
import { useProgressStore } from '../../../store/useProgressStore';
import { Icon } from '../../ui/Icon';
import type { RegionId } from '../../../types';
import './deck-starter.css';

/** Muskelnamen einer Region — entdoppelt, weil zwei gleichnamige Muskeln EINE Karte sind. */
function regionMuscleNames(region: RegionId): string[] {
  return [...new Set(getMuscles().filter((m) => m.region === region).map((m) => m.nameLatin))];
}

export function DeckStarter() {
  const profession = useProfileStore((s) => s.profession);
  const addCards = useProgressStore((s) => s.addCards);

  const sections = useMemo(() => getSections(profession), [profession]);
  const regions = useMemo(
    () => getRegions().map((r) => ({ ...r, names: regionMuscleNames(r.id as RegionId) })),
    [],
  );

  /* Der Kursabschnitt ist der Weg, den ein Schüler wirklich geht — SOBALD es Abschnitte gibt.
     Solange `curriculum.json` leer ist, war er trotzdem die erste und größte Karte auf dem
     Erststart-Bildschirm: Die allererste Wahl, die eine Schülerin traf, führte in einen
     Platzhalter. Auf dem Handy stand über der ersten benutzbaren Option (Bereich) fast ein
     ganzer Bildschirm Text.

     Der Platzhalter BLEIBT (er erklärt, was hier einmal stehen wird — das ist bewusst so, ADR
     0009). Er rutscht nur hinter den Weg, der heute trägt. Sobald der Projektinhaber Abschnitte
     einträgt, steht er wieder vorn: Dann ist er die Antwort auf „womit fange ich an?". */
  const kursZuerst = sections.length > 0;

  /* Die Reihenfolge steht im DOM, nicht in der CSS-`order`: Sonst läse ein Screenreader (und
     die Tabulatortaste) eine andere Reihenfolge als das Auge sieht — WCAG 2.4.3. */
  const wegKurs = (
    <section className="deck-starter__way" aria-labelledby="way-kurs">
        <h3 className="deck-starter__way-title" id="way-kurs">
          <Icon name="icList" size={18} />
          Nach Kursabschnitt
        </h3>

        {sections.length === 0 ? (
          <p className="deck-starter__placeholder">
            Noch keine Kursabschnitte hinterlegt. Sobald sie da sind, holst du dir hier mit einem
            Klick genau den Stoff, der im nächsten Kurs drankommt.
          </p>
        ) : (
          <ul className="deck-starter__sections">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className="deck-starter__section"
                  onClick={() => addCards(section.muscles)}
                >
                  <span className="deck-starter__section-label">{section.label}</span>
                  <span className="deck-starter__count">{section.muscles.length}</span>
                </button>
              </li>
            ))}
          </ul>
      )}
    </section>
  );

  const wegBereich = (
    <section className="deck-starter__way" aria-labelledby="way-bereich">
        <h3 className="deck-starter__way-title" id="way-bereich">
          <Icon name="icCards" size={18} />
          Nach Bereich
        </h3>
        <p className="deck-starter__way-hint">
          Ein ganzer Körperbereich auf einmal. Viel — aber der Tagesplan teilt es dir ein.
        </p>
        <ul className="deck-starter__regions">
          {regions.map((region) => (
            <li key={region.id}>
              <button
                type="button"
                className="deck-starter__section"
                onClick={() => addCards(region.names)}
              >
                <span className="deck-starter__section-label">{region.label}</span>
                <span className="deck-starter__count">{region.names.length}</span>
              </button>
            </li>
        ))}
      </ul>
    </section>
  );

  const wegEinzeln = (
    <section className="deck-starter__way" aria-labelledby="way-einzeln">
        <h3 className="deck-starter__way-title" id="way-einzeln">
          <Icon name="icSearch" size={18} />
          Einzeln aussuchen
        </h3>
        <p className="deck-starter__way-hint">
          Du weißt genau, welche Muskeln du brauchst? Such sie und leg sie einzeln ab.
        </p>
      <div className="deck-starter__links">
        <Link to="/suche" className="btn btn--ghost">
          Muskel suchen
        </Link>
        <Link to="/karteikasten" className="btn btn--ghost">
          Karteikasten verwalten
        </Link>
      </div>
    </section>
  );

  return (
    <div className="deck-starter">
      {kursZuerst ? (
        <>
          {wegKurs}
          {wegBereich}
        </>
      ) : (
        <>
          {wegBereich}
          {wegKurs}
        </>
      )}
      {wegEinzeln}
    </div>
  );
}
