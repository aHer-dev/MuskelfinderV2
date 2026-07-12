import type { PracticeBlocker, PracticeSelection } from '../../../data/practice';

/**
 * Warum es nichts zu tun gibt — nüchtern und schuldfrei. Der Selektor liefert den
 * Code, der Satz gehört hierher (Rahmen-Invariante: das UI rendert, es rechnet nicht).
 */
const BLOCKER_TEXT: Record<PracticeBlocker, string> = {
  noCards: 'Dazu liegt keine Karte im Kasten',
  nothingDue: 'Heute nichts fällig — schon erledigt',
  nothingToFix: 'Hier ist nichts zu verbessern',
};

interface PracticeCtaProps {
  /** Was der Knopf verspricht, z. B. „Schultergürtel üben". */
  label: string;
  selection: PracticeSelection;
  onStart: (names: string[]) => void;
}

/**
 * Der Knopf neben der Zahl (Brücke B4). Gibt es nichts zu tun, ist er **deaktiviert
 * und sagt warum** — ein Klick, der ins Leere greift, ist schlimmer als kein Knopf.
 */
export function PracticeCta({ label, selection, onStart }: PracticeCtaProps) {
  const count = selection.names.length;

  return (
    <div className="stats__cta">
      <button
        type="button"
        className="btn btn--ghost"
        disabled={selection.blocker !== null}
        onClick={() => onStart(selection.names)}
      >
        {label}
      </button>
      <span className="stats__cta-note">
        {selection.blocker
          ? BLOCKER_TEXT[selection.blocker]
          : `${count} ${count === 1 ? 'Karte' : 'Karten'}`}
      </span>
    </div>
  );
}
