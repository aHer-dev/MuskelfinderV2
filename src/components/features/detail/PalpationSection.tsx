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
  palpation: Palpation;
}

/**
 * Palpation (9d) — wo man den Muskel am lebenden Körper findet.
 *
 * Steht in **beiden** Detailtiefen: Palpation ist kein „Einfach"-Thema, sondern
 * Prüfungsstoff („Zeig mir den M. supraspinatus"). Eingeklappt, weil sie nur zählt,
 * wenn man sie gerade braucht — `<details>` ist von Haus aus tastaturbedienbar.
 *
 * Leere Felder erzeugen keine Zeile: Wo nichts Gesichertes steht, steht nichts.
 */
export function PalpationSection({ palpation }: PalpationSectionProps) {
  const rows = ROWS.filter(({ key }) => palpation[key]);
  if (rows.length === 0) return null;

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
            <dd>{palpation[key]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
