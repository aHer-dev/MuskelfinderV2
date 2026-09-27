import type { MuscleImage } from '../../types';

/**
 * Bildnachweis eines Muskelbilds: Urheber · Lizenz (als Link, wenn es einen gibt).
 *
 * Die Bilder stehen unter CC BY 4.0 — der Nachweis ist Pflicht, ueberall wo ein Bild
 * gross oder klein erscheint. Er stand zweimal zeichengleich im Bildbetrachter und
 * fehlte auf der Lernkarte ganz; jetzt steht er einmal.
 */
export function BildNachweis({ bild }: { bild: MuscleImage }) {
  return (
    <>
      {bild.attribution} ·{' '}
      {bild.licenseUrl ? (
        <a href={bild.licenseUrl} target="_blank" rel="noreferrer noopener">
          {bild.license}
        </a>
      ) : (
        bild.license
      )}
    </>
  );
}
