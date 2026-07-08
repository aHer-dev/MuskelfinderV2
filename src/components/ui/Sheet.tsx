/* =========================================================================
   Sheet — Bottom-Sheet (mobil). COMPONENTS.md · Teil A.
   src/components/ui/Sheet.tsx
   Grabber, Backdrop-Klick + Esc schließen, Initial-Fokus + Fokus-Rückgabe,
   Body-Scroll-Lock. (Vollständiger Fokus-Trap: Etappe-4-Rest.)
   ========================================================================= */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
