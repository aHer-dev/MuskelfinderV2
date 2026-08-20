/* =========================================================================
   Sheet — Bottom-Sheet (mobil). COMPONENTS.md · Teil A.
   src/components/ui/Sheet.tsx
   Grabber, Backdrop-Klick schließt. Esc, Initial-Fokus + Fokus-Rückgabe,
   Body-Scroll-Lock und der zyklische Fokus-Trap kommen aus
   `hooks/useDialogVerhalten` — dieselben vier Regeln trägt die Bild-Vollansicht.
   ========================================================================= */

import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogVerhalten } from '../../hooks/useDialogVerhalten';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  /** Klebt unten am Panel — für Abschluss-Aktionen (z. B. „Zurücksetzen“ + Ergebnis-CTA). */
  footer?: ReactNode;
}

export function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogVerhalten(open, panelRef, onClose);

  if (!open) return null;

  return createPortal(
    <div className="sheet" role="presentation" onClick={onClose}>
      <div
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet__grabber" aria-hidden="true" />
        {title && (
          <div className="sheet__head">
            <h2 className="sheet__title">{title}</h2>
            <button
              type="button"
              className="sheet__close"
              aria-label="Schließen"
              onClick={onClose}
            >
              <Icon name="icClose" size={20} />
            </button>
          </div>
        )}
        {/* Der Inhalt scrollt. Ohne `tabIndex` käme man per Tastatur nicht an den
            unteren Teil heran (axe „scrollable-region-focusable") — wer nicht mausen
            kann, sähe die Hälfte des Vergleichs nie. */}
        <div className="sheet__body" tabIndex={0}>
          {children}
        </div>
        {footer && <div className="sheet__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
