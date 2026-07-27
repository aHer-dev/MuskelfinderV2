import { nichtLeer } from '../../../data/muscle-fields';
import type { LabeledValue } from '../../../types';

/** Detailseiten-Zeile. Alias auf `LabeledValue` — der Name sagt am Aufruf mehr. */
export type DataRow = LabeledValue;

/** Definitionsliste — Zeilen mit leerem Wert werden ausgelassen. */
export function DataList({ rows }: { rows: DataRow[] }) {
  const visible = nichtLeer(rows);
  return (
    <dl className="datalist">
      {visible.map((row) => (
        <div key={row.label} className="datalist__row">
          <dt className="datalist__label">{row.label}</dt>
          <dd className="datalist__value">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
