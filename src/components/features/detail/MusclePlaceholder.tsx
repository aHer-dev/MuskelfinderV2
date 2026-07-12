import { regionLabel } from '../../../data/labels';
import type { Muscle } from '../../../types';

/**
 * Der typografische Platzhalter für die 47 Muskeln ohne Bild (Etappe 8f, Stufe 2b).
 *
 * Vorher klaffte dort eine Lücke, die aussah wie ein Fehler. Sie sieht jetzt
 * **absichtlich** aus: Name, Region, Subregion — gesetzt, nicht leer.
 *
 * Ehrlich beschriftet, keine Attrappe: Es wird nicht so getan, als wäre hier ein
 * Bild, das gerade nicht lädt. Nur Design-Tokens, **kein Fremd-Asset** — und
 * bewusst **kein** Bild im Sinne der Bildquiz-Modi (`eligible` in `data/quiz.ts`
 * schließt Muskeln ohne echtes Bild weiterhin aus).
 */
export function MusclePlaceholder({ muscle }: { muscle: Muscle }) {
  return (
    <figure className="muscle-placeholder">
      <div className="muscle-placeholder__stage">
        <span className="muscle-placeholder__eyebrow">
          {regionLabel(muscle.region)} · {muscle.subregion}
        </span>
        <span className="muscle-placeholder__name">{muscle.nameLatin}</span>
      </div>
      <figcaption className="muscle-placeholder__caption">
        Für diesen Muskel liegt kein lizenzfreies Bild vor.
      </figcaption>
    </figure>
  );
}
