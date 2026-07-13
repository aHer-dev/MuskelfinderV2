import { Icon } from '../../ui/Icon';
import type { Palpation } from '../../../types';

/** Reihenfolge = Ablauf am Menschen: erst lagern, dann orientieren, dann tasten. */
const ROWS: ReadonlyArray<{ key: keyof Palpation; label: string }> = [
  { key: 'position', label: 'Lagerung' },
  { key: 'landmarks', label: 'Orientierungspunkte' },
  { key: 'technique', label: 'Aufsuchen & Aktivieren' },
  { key: 'confusion', label: 'Verwechslungsgefahr' },
];

interface PalpationSectionProps {
  /** Fehlt der Eintrag, steht hier ein bewusster Platzhalter — kein Nichts. */
  palpation?: Palpation;
}

/**
 * Palpation (9d) — wo man den Muskel am lebenden Körper findet.
 *
 * Steht in **beiden** Detailtiefen: Palpation ist kein „Einfach"-Thema, sondern
 * Prüfungsstoff („Zeig mir den M. supraspinatus"). Eingeklappt, weil sie nur zählt,
 * wenn man sie gerade braucht — `<details>` ist von Haus aus tastaturbedienbar.
 *
 * **Ohne Eintrag steht hier ein Platzhalter, kein leerer Raum** (Entscheidung des
 * Projektinhabers, 2026-07-13). Dieselbe Haltung wie bei der Bildlücke aus 8f: Die
 * Lücke soll absichtlich aussehen. Die Texte kommen aus dem Skript und werden von Hand
 * eingetragen — sie werden **nicht** erfunden (siehe `docs/palpation-erfassen.md`).
 */
export function PalpationSection({ palpation }: PalpationSectionProps) {
  const rows = palpation ? ROWS.filter(({ key }) => palpation[key]) : [];

  if (rows.length === 0) {
    return (
      <p className="palpation-empty">
        <Icon name="icTarget" size={16} />
        <span>Noch kein Palpationshinweis hinterlegt.</span>
      </p>
    );
  }

  return (
    <details className="palpation">
      <summary className="palpation__summary">
        <Icon name="icTarget" size={16} />
        <span>Am Körper finden</span>
        <Icon name="icChevD" size={16} className="palpation__chev" />
      </summary>

      <dl className="palpation__list">
        {rows.map(({ key, label }) => (
          <div key={key} className="palpation__row">
            <dt>{label}</dt>
            <dd>{palpation?.[key]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
