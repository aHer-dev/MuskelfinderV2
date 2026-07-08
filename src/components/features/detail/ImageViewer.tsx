import { useState } from 'react';
import type { MuscleImage } from '../../../types';
import { Icon } from '../../ui/Icon';

function assetUrl(url: string): string {
  return `${import.meta.env.BASE_URL}${url}`;
}

/** Bild-„Fenster" mit Ansichts-Umschaltung und sichtbarer Attribution (CC BY 4.0 Pflicht). */
export function ImageViewer({ images, alt }: { images: MuscleImage[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="image-viewer image-viewer--empty">
        <Icon name="icImage" size={28} />
        <p>Für diesen Muskel liegt kein Bild vor.</p>
      </div>
    );
  }

  const safeIndex = Math.min(index, images.length - 1);
  const current = images[safeIndex];
  const go = (delta: number) =>
    setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <figure className="image-viewer">
      <div className="image-viewer__stage">
        {images.length > 1 && (
          <button
            type="button"
            className="image-viewer__nav image-viewer__nav--prev"
            aria-label="Vorheriges Bild"
            onClick={() => go(-1)}
          >
            <Icon name="icArrowL" size={22} />
          </button>
        )}
        <img
          src={assetUrl(current.url)}
          alt={`${alt} — ${current.view}`}
          loading="lazy"
          className="image-viewer__img"
        />
        {images.length > 1 && (
          <button
            type="button"
            className="image-viewer__nav image-viewer__nav--next"
            aria-label="Nächstes Bild"
            onClick={() => go(1)}
          >
            <Icon name="icArrow" size={22} />
          </button>
        )}
      </div>

      <figcaption className="image-viewer__caption">
        <span className="image-viewer__view">
          {current.view}
          {images.length > 1 && (
            <span className="image-viewer__count">
              {' '}
              · {safeIndex + 1}/{images.length}
            </span>
          )}
        </span>
        <span className="image-viewer__attribution">
          {current.attribution} ·{' '}
          {current.licenseUrl ? (
            <a href={current.licenseUrl} target="_blank" rel="noreferrer noopener">
              {current.license}
            </a>
          ) : (
            current.license
          )}
        </span>
      </figcaption>
    </figure>
  );
}
