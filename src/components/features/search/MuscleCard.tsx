import { Link } from 'react-router-dom';
import type { Muscle } from '../../../types';
import { highlightName } from '../../../data/search';
import { movementLabel, regionLabel } from '../../../data/labels';
import { DifficultyDots } from '../../ui/DifficultyDots';

const MAX_CHIPS = 4;

/** Ergebniskarte: verlinkt auf das Detail, zeigt Kernfakten (funktional, un-poliert). */
export function MuscleCard({ muscle, query = '' }: { muscle: Muscle; query?: string }) {
  const chips = muscle.functions.slice(0, MAX_CHIPS);
  const overflow = muscle.functions.length - chips.length;
  const segments = highlightName(muscle.nameLatin, query);

  return (
    <li className="muscle-card">
      <Link to={`/muskel/${muscle.id}`} className="muscle-card__link">
        <div className="muscle-card__head">
          <h2 className="muscle-card__name">
            {segments.map((segment, i) =>
              segment.match ? (
                <mark key={i} className="muscle-card__match">
                  {segment.text}
                </mark>
              ) : (
                <span key={i}>{segment.text}</span>
              ),
            )}
          </h2>
          <DifficultyDots level={muscle.difficulty} />
        </div>
        <p className="muscle-card__meta">
          {regionLabel(muscle.region)} · {muscle.subregion}
        </p>
        {chips.length > 0 && (
          <ul className="muscle-card__chips">
            {chips.map((fn) => (
              <li key={fn} className="chip">
                {movementLabel(fn)}
              </li>
            ))}
            {overflow > 0 && <li className="chip chip--muted">+{overflow}</li>}
          </ul>
        )}
      </Link>
    </li>
  );
}
