import { Icon } from './Icon';
import './funktions-beschreibung.css';

/**
 * Der ausformulierte Funktionstext, eingeklappt (Etappe 15).
 *
 * Unter „Funktion" steht die Kurzform — Gelenk und Bewegung, auf einen Blick. Der Text
 * erklaert das WARUM und die Bedingungen („bei fixiertem Femur …") und steht darum
 * darunter, fuer wen ihn braucht. `<details>` ist von Haus aus tastaturbedienbar und
 * braucht kein Aufklapp-JS (dieselbe Form wie die Palpation, 9d).
 *
 * Leerer Text → nichts. Eine Ueberschrift ohne Inhalt liest sich wie ein Fehler der App.
 */
export function FunktionsBeschreibung({ text }: { text: string }) {
  if (text.trim() === '') return null;
  return (
    <details className="funktions-beschreibung">
      <summary className="funktions-beschreibung__summary">
        <span>Funktionsbeschreibung</span>
        <Icon name="icChevD" size={16} className="funktions-beschreibung__chev" />
      </summary>
      <p className="funktions-beschreibung__text">{text}</p>
    </details>
  );
}
