/* =========================================================================
   useDialogVerhalten — was JEDER modale Kasten koennen muss.
   src/hooks/useDialogVerhalten.ts

   WARUM ES DAS GIBT: Esc, Fokus-Falle, Scroll-Sperre und Fokus-Rueckgabe standen
   als eine Effekt-Funktion in `Sheet.tsx`. Mit der Bild-Vollansicht (2026-08-20)
   haette dieselbe Funktion ein zweites Mal danebengestanden — und die zweite Kopie
   ist erfahrungsgemaess die, in der spaeter die Fokus-Rueckgabe fehlt oder der
   Scroll-Lock den vorherigen Wert nicht wiederherstellt. Solche Doppelungen fallen
   nicht auf, solange sie uebereinstimmen; genau das ist die Gefahr.

   Vier Regeln, die zusammengehoeren:
   - **Esc schliesst.** Ein modaler Kasten ohne Tastaturausgang ist eine Falle.
   - **Tab bleibt drin** (zyklisch, vorwaerts wie rueckwaerts). Sonst tabbt man in die
     Seite dahinter, die man nicht sieht und nicht bedienen soll.
   - **Die Seite dahinter scrollt nicht.** Sonst wandert der Inhalt unter dem Kasten weg.
   - **Der Fokus kommt zurueck**, wohin er beim Oeffnen zeigte. Ohne das steht der
     Tastaturnutzer nach dem Schliessen wieder am Seitenanfang.
   ========================================================================= */

import { useEffect, type RefObject } from 'react';

const FOKUSSIERBAR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),'
  + ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Haengt das Modal-Verhalten an `panelRef`, solange `offen` gilt.
 *
 * @param offen     Ist der Kasten sichtbar?
 * @param panelRef  Das Panel selbst — es braucht `tabIndex={-1}`, damit der
 *                  Anfangsfokus darauf landen kann.
 * @param onClose   Wird bei Esc gerufen.
 */
export function useDialogVerhalten(
  offen: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!offen) return;
    const vorherAktiv = document.activeElement as HTMLElement | null;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const fokussierbare = panel.querySelectorAll<HTMLElement>(FOKUSSIERBAR);
      if (fokussierbare.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const erstes = fokussierbare[0];
      const letztes = fokussierbare[fokussierbare.length - 1];
      const aktiv = document.activeElement;
      if (event.shiftKey && (aktiv === erstes || aktiv === panel)) {
        event.preventDefault();
        letztes.focus();
      } else if (!event.shiftKey && aktiv === letztes) {
        event.preventDefault();
        erstes.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const vorherOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = vorherOverflow;
      vorherAktiv?.focus?.();
    };
  }, [offen, onClose, panelRef]);
}
