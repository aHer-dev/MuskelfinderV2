/* =========================================================================
   Sheet — Bottom-Sheet (mobil). COMPONENTS.md · Teil A.
   src/components/ui/Sheet.tsx
   Grabber, Backdrop-Klick + Esc schließen, Initial-Fokus + Fokus-Rückgabe,
   Body-Scroll-Lock, zyklischer Fokus-Trap (Tab/Shift+Tab bleiben im Panel).
   ========================================================================= */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement as HTMLElement | null;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus?.();
    };
  }, [open, onClose]);

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
