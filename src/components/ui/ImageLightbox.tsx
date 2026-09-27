/* =========================================================================
   ImageLightbox — ein Bild formatfuellend ueber der Seite.
   src/components/ui/ImageLightbox.tsx

   WARUM ES DAS GIBT: Im Rahmen ist ein Muskelbild rund 360 px breit (Desktop) bzw.
   183 px (390-px-Handy) — bei 600x800 Quellmass zeigt der Rahmen also weniger als ein
   Drittel der vorhandenen Bildflaeche. Wer den Ansatz erkennen soll, sieht ihn dort
   nicht. Ein Tipp/Klick legt das Bild jetzt so gross ueber die Seite, wie das Geraet es
   hergibt.

   NICHT groesser als die Quelle: `max-width`/`max-height` sind bei 600 x 800 gedeckelt.
   Alles darueber waere vergroesserte Pixelmatsche, die Genauigkeit vortaeuscht, die das
   Bild nicht hat.

   KEINE prozentuale Hoehe gegen `aspect-ratio` (2026-08-20): Genau diese Bauform hat im
   Quiz 40 % jedes Bildes abgeschnitten, sobald WebKit sie rendern sollte. Hier stehen
   Viewport-Einheiten und feste Pixel — beides ist eindeutig, in jeder Engine.
   ========================================================================= */

import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogVerhalten } from '../../hooks/useDialogVerhalten';
import { Icon } from './Icon';
import './image-lightbox.css';

interface ImageLightboxProps {
  open: boolean;
  src: string;
  /** Beschreibt das Bild — dient zugleich als Name des Dialogs. */
  alt: string;
  /**
   * Zeile unter dem Bild — auf der Detailseite die Ansicht PLUS die Attribution.
   * Die Muskelbilder stehen unter CC BY 4.0, und die Vollansicht legt sich ueber die
   * `figcaption`, die den Nachweis sonst traegt. Darum `ReactNode`: Der Lizenzlink
   * soll ein Link bleiben. Im Quiz bleibt die Zeile leer — dort waere jeder Zusatz
   * ein Hinweis auf die Loesung.
   */
  caption?: ReactNode;
  onClose: () => void;
}

export function ImageLightbox({ open, src, alt, caption, onClose }: ImageLightboxProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogVerhalten(open, panelRef, onClose);

  if (!open) return null;

  return createPortal(
    <div className="lightbox" role="presentation" onClick={onClose}>
      <div
        className="lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        tabIndex={-1}
        ref={panelRef}
        /* Ein Klick AUF das Bild schliesst absichtlich nicht: Man tippt beim Betrachten
           leicht daneben, und die Ansicht wieder zu verlieren, nur weil man hinsehen
           wollte, ist aergerlich. Zum Schliessen gibt es drei klare Wege: der Knopf,
           die Flaeche daneben und Esc. */
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="lightbox__close"
          aria-label="Vollansicht schließen"
          onClick={onClose}
        >
          <Icon name="icClose" size={22} />
        </button>

        <img className="lightbox__img" src={src} alt={alt} />

        {caption && <p className="lightbox__caption">{caption}</p>}
      </div>
    </div>,
    document.body,
  );
}
