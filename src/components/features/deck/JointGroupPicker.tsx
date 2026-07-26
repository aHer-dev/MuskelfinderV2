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

   Die Gruppen selbst kommen aus `data/joint-groups.ts` (abgeleitet aus `joints`/`subregion`,
   nichts erfunden). Diese Komponente rendert nur.
   ========================================================================= */

import { useMemo } from 'react';
import {
  neueKarten,
  orderedJointGroups,
  type JointGroup,
} from '../../../data/joint-groups';
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

export function JointGroupPicker({ headingId, title = 'Nach Gelenk', hint }: JointGroupPickerProps) {
  const profession = useProfileStore((s) => s.profession);
  const cards = useProgressStore((s) => s.flashcards.cards);
  const addCards = useProgressStore((s) => s.addCards);

  /* Nach Beruf vorsortiert, aber NICHTS versteckt (Entscheidung 2026-07-26): Ein Ergo, der
     die Hüfte lernen will, soll sie nicht suchen müssen. */
  const { typisch, weitere } = useMemo(() => orderedJointGroups(profession), [profession]);

  const waehlen = (group: JointGroup) => {
    const neu = neueKarten(group, cards);
    addCards(group.muscles);
    /* Ohne diese Meldung war der einzige Hinweis, dass der Klick etwas getan hat, das
       Umbauen der ganzen Seite — und auf dem Handy blieb die Scrollposition dabei stehen,
       sodass man den neuen Zustand nicht einmal sah (gemessen im UX-Review 2026-07-26). */
    notifyToast(
      neu === 0
        ? `${group.label}: liegt schon vollständig in deinem Kasten`
        : `${neu} ${neu === 1 ? 'Karte' : 'Karten'} angelegt — ${group.label}`,
    );
  };

  const liste = (gruppen: JointGroup[], bandId: string) => (
    <ul className="jgp__list" aria-labelledby={bandId}>
      {gruppen.map((group) => {
        const neu = neueKarten(group, cards);
        const schonDrin = group.muscles.length - neu;
        return (
          <li key={group.id}>
            <button
              type="button"
              className="jgp__group"
              onClick={() => waehlen(group)}
              disabled={neu === 0}
              /* Die Zahl allein sagt einem Screenreader nicht, WAS sie zählt. */
              aria-label={
                neu === 0
                  ? `${group.label} — alle ${group.muscles.length} Karten liegen schon im Kasten`
                  : `${group.label} — ${neu} neue ${neu === 1 ? 'Karte' : 'Karten'} hinzufügen`
              }
            >
              <span className="jgp__label">
                {group.label}
                <span className="jgp__hint">{group.hint}</span>
              </span>
              <span className="jgp__count">
                {neu}
                {schonDrin > 0 && (
                  <span className="jgp__count-note">{neu === 0 ? 'alle da' : `+${schonDrin} da`}</span>
                )}
              </span>
            </button>
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
        {hint ?? 'So wie es unterrichtet und geprüft wird. Die Zahl ist, was der Klick anlegt.'}
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
    </section>
  );
}
