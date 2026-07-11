import type { CardRating } from '../../../types';

const RATINGS: Array<{ value: CardRating; label: string; modifier: string }> = [
  { value: 'wrong', label: 'Falsch', modifier: 'rating-btn--wrong' },
  { value: 'unsure', label: 'Unsicher', modifier: 'rating-btn--unsure' },
  { value: 'correct', label: 'Richtig', modifier: 'rating-btn--correct' },
];

/** Bewertungsleiste. Erst nach dem Aufdecken aktiv (`disabled` sonst). */
export function RatingBar({
  onRate,
  disabled,
}: {
  onRate: (rating: CardRating) => void;
  disabled: boolean;
}) {
  return (
    <div className="rating-bar" role="group" aria-label="Karte bewerten">
      {RATINGS.map((rating) => (
        <button
          key={rating.value}
          type="button"
          className={`rating-btn ${rating.modifier}`}
          disabled={disabled}
          onClick={() => onRate(rating.value)}
        >
          {rating.label}
        </button>
      ))}
    </div>
  );
}
