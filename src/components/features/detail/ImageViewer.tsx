import { useState } from 'react';
import type { Muscle } from '../../../types';
import { Icon } from '../../ui/Icon';
import { ImageLightbox } from '../../ui/ImageLightbox';
import { MusclePlaceholder } from './MusclePlaceholder';

function assetUrl(url: string): string {
  return `${import.meta.env.BASE_URL}${url}`;
}

/** Bild-„Fenster" mit Ansichts-Umschaltung und sichtbarer Attribution (CC BY 4.0 Pflicht). */
export function ImageViewer({ muscle }: { muscle: Muscle }) {
  const [index, setIndex] = useState(0);
  const [vollansicht, setVollansicht] = useState(false);
  const { images, nameLatin: alt } = muscle;

  // 47 von 150 Muskeln haben kein Bild. Die Luecke soll absichtlich aussehen, nicht kaputt (8f).
  if (images.length === 0) return <MusclePlaceholder muscle={muscle} />;

  const safeIndex = Math.min(index, images.length - 1);
  const current = images[safeIndex];
  const go = (delta: number) =>
    setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <figure className="image-viewer">
      <div className="image-viewer__stage">
        <span className="image-viewer__badge">{current.view}</span>
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
        {/* Die Pfeile liegen absolut UEBER dem Bild und fangen ihre Klicks selbst ab —
            wer blaettern will, loest keine Vollansicht aus. */}
        <button
          type="button"
          className="bild-lupe"
          aria-label={`${alt} — ${current.view} groß anzeigen`}
          onClick={() => setVollansicht(true)}
        >
          <img
            src={assetUrl(current.url)}
            alt={`${alt} — ${current.view}`}
            loading="lazy"
            decoding="async"
            className="image-viewer__img"
          />
          <span className="bild-lupe__zeichen" aria-hidden="true">
            <Icon name="icSearch" size={17} />
          </span>
        </button>
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

      {images.length > 1 && (
        <div className="image-viewer__thumbs" role="tablist" aria-label="Ansichten">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              className={`image-viewer__thumb${i === safeIndex ? ' image-viewer__thumb--active' : ''}`}
              aria-label={image.view}
              onClick={() => setIndex(i)}
            >
              <img src={assetUrl(image.url)} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

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

      <ImageLightbox
        open={vollansicht}
        src={assetUrl(current.url)}
        alt={`${alt} — ${current.view}`}
        caption={
          <>
            {alt} — {current.view} · {current.attribution} ·{' '}
            {current.licenseUrl ? (
              <a href={current.licenseUrl} target="_blank" rel="noreferrer noopener">
                {current.license}
              </a>
            ) : (
              current.license
            )}
          </>
        }
        onClose={() => setVollansicht(false)}
      />
    </figure>
  );
}
