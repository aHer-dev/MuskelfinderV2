import type { ReactNode } from 'react';
import { nichtLeer } from '../../../data/muscle-fields';
import type { LabeledValue } from '../../../types';
import { Fachangabe } from '../../ui/Fachangabe';

/**
 * Detailseiten-Zeile: eine `LabeledValue`, optional mit einem `zusatz` unter dem Wert —
 * die aufklappbare Funktionsbeschreibung gehoert unter die Kurzform, nicht ans Listenende.
 */
export interface DataRow extends LabeledValue {
  zusatz?: ReactNode;
}

/** Definitionsliste — Zeilen mit leerem Wert werden ausgelassen. */
export function DataList({ rows }: { rows: DataRow[] }) {
  const visible = nichtLeer(rows);
  return (
    <dl className="datalist">
      {visible.map((row) => (
        <div key={row.label} className="datalist__row">
          <dt className="datalist__label">{row.label}</dt>
          <dd className="datalist__value">
            <div className="datalist__text"><Fachangabe {...row} /></div>
            {row.zusatz}
          </dd>
        </div>
      ))}
    </dl>
  );
}
