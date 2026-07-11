export interface DataRow {
  label: string;
  value: string;
}

/** Definitionsliste — Zeilen mit leerem Wert werden ausgelassen. */
export function DataList({ rows }: { rows: DataRow[] }) {
  const visible = rows.filter((row) => row.value.trim() !== '');
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
