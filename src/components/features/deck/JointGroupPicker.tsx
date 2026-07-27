/* =========================================================================
   JointGroupPicker — Karten nach Gelenk in den Kasten legen.
   src/components/features/deck/JointGroupPicker.tsx

   **Warum eigenständig und nicht im `DeckStarter`:** Dort saß die Gruppenwahl zuerst — und
   der `DeckStarter` rendert nur, solange der Kasten LEER ist (`plan.kind === 'needsOnboarding'`).
   Beim Prüflauf fiel auf: Nach der ersten Gruppe war die Wahl **weg**, und wer im nächsten
   Kursabschnitt „Ellenbogen" dazunehmen wollte, musste sich die Muskeln einzeln aus 145
   Kästchen zusammenklicken. Ein Schüler füllt seinen Kasten aber über ein ganzes Semester,
   nicht in einer Sitzung. Die Wahl steht darum an BEIDEN Stellen: beim Erststart und
   dauerhaft auf `/karteikasten`.

   ## MEHRFACHWAHL (2026-07-27) — ein Klick war eine Einbahnstraße
   Bis hierher legte **jeder** Klick sofort Karten an. Auf dem Erststart-Bildschirm war das
   eine Falle: Sobald die erste Gruppe im Kasten lag, war der Kasten nicht mehr leer — also
   ersetzte `/heute` den ganzen `DeckStarter` durch den Tagesplan. Wer „Hand **und**
   Ellenbogen" lernt (der Regelfall im Kurs), konnte die zweite Gruppe dort gar nicht mehr
   wählen; er musste erst den Weg nach `/karteikasten` finden.

   Jetzt kreuzt man an und legt EINMAL an. Das kostet einen Klick mehr und bringt drei
   Dinge, die vorher fehlten:
   - Die Zahl am Knopf ist die **Vereinigung**, nicht die Summe (`neueKartenDerAuswahl`).
     26 Muskeln liegen in mehreren Gruppen — addierte Einzelzahlen würden lügen.
   - Der Bildschirm baut sich **einmal** um, nicht nach jeder Gruppe.
   - Eine Mehrfachwahl kann groß werden (alle elf Gruppen = 148 Karten). Ab
     {@link NACHFRAGE_AB} fragt sie nach — die Regel aus dem UX-Review: „Eine Handlung, die
     121 Karten anlegt, braucht eine Zahl, eine Rückfrage und einen Rückweg."

   **Zur Rahmen-Invariante 2 (ADR 0009):** Der leere Kasten hat weiter **keinen**
   Primärbutton — solange nichts angekreuzt ist, gibt es die Aktionsleiste nicht. Sie
   erscheint erst als Folge einer Wahl, die der Schüler getroffen hat, und dann mit genau
   EINEM Primärbutton. Zwei Prüfzeilen halten beide Richtungen fest.

   Die Gruppen selbst kommen aus `data/joint-groups.ts` (abgeleitet aus `joints`/`subregion`,
   nichts erfunden). Diese Komponente rendert nur.
   ========================================================================= */

import { useMemo, useState } from 'react';
import {
  neueKarten,
  neueKartenDerAuswahl,
  orderedJointGroups,
  type JointGroup,
} from '../../../data/joint-groups';
import { MAX_DAILY_DOSE } from '../../../data/today';
import { useProfileStore } from '../../../store/useProfileStore';
import { useProgressStore } from '../../../store/useProgressStore';
import { notifyToast } from '../../../store/useToastStore';
import { Icon } from '../../ui/Icon';
import './joint-groups.css';

interface JointGroupPickerProps {
  /** Überschrift-Ebene: auf `/heute` steht darüber ein `h2`, auf `/karteikasten` ein `h2`. */
  headingId: string;
  /** Ohne Titel, wenn die Seite schon einen gesetzt hat. */
  title?: string;
  hint?: string;
}

/* Ab so vielen Karten fragt das Anlegen nach. **Die Schwelle ist nicht geraten, sie ist die
   eigene Obergrenze der App:** `MAX_DAILY_DOSE` ist die größte Tagesdosis, die `getTodayPlan`
   je ansetzt („Mehr wird nicht gelernt, nur abgebrochen"). Darüber legt man sich mehr als
   einen vollen Lerntag auf einmal hin — die Menge, für die die UX-Review-Regel 3 eine
   Rückfrage verlangt. Zwei benachbarte Gruppen (Hand + Ellenbogen = 35) bleiben darunter und
   laufen ohne Reibung durch; alle elf auf einmal (148) nicht. */
const NACHFRAGE_AB = MAX_DAILY_DOSE;

/** Für Toast und Rückfrage: bis drei Gruppen beim Namen, danach nur ihre Zahl. */
function woher(auswahl: readonly JointGroup[]): string {
  if (auswahl.length <= 3) return auswahl.map((g) => g.label).join(' + ');
  return `${auswahl.length} Gruppen`;
}

export function JointGroupPicker({ headingId, title = 'Nach Gelenk', hint }: JointGroupPickerProps) {
  const profession = useProfileStore((s) => s.profession);
  const cards = useProgressStore((s) => s.flashcards.cards);
  const addCards = useProgressStore((s) => s.addCards);

  /** Angekreuzte Gruppen-Kennungen. Lokal: eine Wahl, die noch nicht getroffen wurde,
      gehört in keinen persistierten Store — sonst überlebt sie den Neustart als Zombie. */
  const [gewaehlt, setGewaehlt] = useState<ReadonlySet<string>>(() => new Set());

  /* Nach Beruf vorsortiert, aber NICHTS versteckt (Entscheidung 2026-07-26): Ein Ergo, der
     die Hüfte lernen will, soll sie nicht suchen müssen. */
  const { typisch, weitere } = useMemo(() => orderedJointGroups(profession), [profession]);

  const auswahl = useMemo(
    () => [...typisch, ...weitere].filter((g) => gewaehlt.has(g.id)),
    [typisch, weitere, gewaehlt],
  );
  const neu = useMemo(() => neueKartenDerAuswahl(auswahl, cards), [auswahl, cards]);
  /* Die Differenz zur Summe der Einzelzahlen wird BENANNT, nicht verschluckt: Wer „Hand 26"
     und „Ellenbogen 17" ankreuzt und dann 41 statt 43 liest, hält sonst die Zahl für falsch. */
  const doppelt = auswahl.reduce((n, g) => n + neueKarten(g, cards), 0) - neu.length;

  const umschalten = (id: string) =>
    setGewaehlt((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const anlegen = () => {
    if (neu.length === 0) return;
    if (
      neu.length >= NACHFRAGE_AB &&
      !confirm(
        `${neu.length} Karten aus ${woher(auswahl)} in den Karteikasten legen? Das ist eine ganze `
          + `Weile Lernstoff — du kannst sie unter „Karteikasten" wieder herausnehmen.`,
      )
    ) {
      return;
    }
    addCards(neu);
    /* Ohne diese Meldung war der einzige Hinweis, dass der Klick etwas getan hat, das
       Umbauen der ganzen Seite — und auf dem Handy blieb die Scrollposition dabei stehen,
       sodass man den neuen Zustand nicht einmal sah (gemessen im UX-Review 2026-07-26). */
    notifyToast(
      `${neu.length} ${neu.length === 1 ? 'Karte' : 'Karten'} angelegt — ${woher(auswahl)}`,
    );
    setGewaehlt(new Set());
  };

  const liste = (gruppen: JointGroup[], bandId: string) => (
    <ul className="jgp__list" aria-labelledby={bandId}>
      {gruppen.map((group) => {
        const neuHier = neueKarten(group, cards);
        const schonDrin = group.muscles.length - neuHier;
        const erledigt = neuHier === 0;
        const an = gewaehlt.has(group.id);
        return (
          <li key={group.id}>
            {/* `label` um das Kästchen, damit die ganze Zeile das Klickziel ist — dasselbe
                Muster wie die Auswahlliste auf `/karteikasten` (`.deck-check`). Ein 17-px-
                Kästchen allein verfehlt jedes Daumenmaß. */}
            <label
              className={`jgp__group${an ? ' jgp__group--an' : ''}${erledigt ? ' jgp__group--erledigt' : ''}`}
            >
              <input
                type="checkbox"
                className="jgp__box"
                checked={an}
                disabled={erledigt}
                onChange={() => umschalten(group.id)}
                /* Die Zahl allein sagt einem Screenreader nicht, WAS sie zählt. */
                aria-label={
                  erledigt
                    ? `${group.label} — alle ${group.muscles.length} Karten liegen schon im Kasten`
                    : `${group.label} — ${neuHier} neue ${neuHier === 1 ? 'Karte' : 'Karten'} auswählen`
                }
              />
              <span className="jgp__label">
                {group.label}
                <span className="jgp__hint">{group.hint}</span>
              </span>
              <span className="jgp__count">
                {neuHier}
                {schonDrin > 0 && (
                  <span className="jgp__count-note">
                    {erledigt ? 'alle da' : `+${schonDrin} da`}
                  </span>
                )}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className="jgp" aria-labelledby={headingId}>
      <h3 className="jgp__title" id={headingId}>
        <Icon name="icCards" size={18} />
        {title}
      </h3>
      <p className="jgp__lead">
        {hint ??
          'So wie es unterrichtet und geprüft wird. Kreuze an, was du brauchst — auch mehrere auf einmal.'}
      </p>

      {typisch.length > 0 ? (
        <>
          {/* Die Bandzeile sagt, WARUM diese oben stehen — sonst wirkt die Reihenfolge
              willkürlich, und niemand erkennt, dass darunter noch mehr kommt. */}
          <h4 className="jgp__band" id={`${headingId}-typisch`}>
            Typisch für dich
          </h4>
          {liste(typisch, `${headingId}-typisch`)}
          <h4 className="jgp__band" id={`${headingId}-weitere`}>
            Alle weiteren
          </h4>
          {liste(weitere, `${headingId}-weitere`)}
        </>
      ) : (
        liste(weitere, headingId)
      )}

      {/* Erst mit einer Wahl gibt es eine Aktion — und dann klebt sie am unteren Rand:
          Die elf Zeilen sind auf dem Handy höher als ein Bildschirm, und eine Leiste am
          Listenende hätte niemand gesehen, der oben ankreuzt. */}
      {auswahl.length > 0 && (
        <div className="jgp__bar">
          <p className="jgp__bar-text" role="status">
            {auswahl.length === 1 ? '1 Gruppe' : `${auswahl.length} Gruppen`} gewählt
            {doppelt > 0 && (
              <span className="jgp__bar-note">
                {doppelt === 1
                  ? '1 Muskel liegt in mehreren davon und wird einmal angelegt.'
                  : `${doppelt} Muskeln liegen in mehreren davon und werden einmal angelegt.`}
              </span>
            )}
          </p>
          <div className="jgp__bar-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={anlegen}
              disabled={neu.length === 0}
            >
              {neu.length} {neu.length === 1 ? 'Karte' : 'Karten'} anlegen
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setGewaehlt(new Set())}
            >
              Auswahl aufheben
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
