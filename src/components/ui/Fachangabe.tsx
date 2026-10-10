import type { LabeledValue } from '../../types';
import './fachangabe.css';

/** Dieselben Listen beim Nachschlagen, Lernen und Vergleichen. */
export function Fachangabe({ value, abschnitte }: Pick<LabeledValue, 'value' | 'abschnitte'>) {
  if (!abschnitte?.length) return <span>{value}</span>;
  return (
    <div className="fachangabe">
      {abschnitte.map((abschnitt, i) => (
        <div className="fachangabe__abschnitt" key={i}>
          {abschnitt.label && <strong className="fachangabe__gruppe">{abschnitt.label}</strong>}
          <ul className="fachangabe__liste">
            {abschnitt.eintraege.map((text, j) => <li key={j}>{text}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
