import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMuscleById } from '../data';
import { movementLabel, regionLabel } from '../data/labels';
import { DataList } from '../components/features/detail/DataList';
import type { DataRow } from '../components/features/detail/DataList';
import { ImageViewer } from '../components/features/detail/ImageViewer';
import { DifficultyDots } from '../components/ui/DifficultyDots';
import { Icon } from '../components/ui/Icon';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useCollectionStore } from '../store/useCollectionStore';
import { useProgressStore } from '../store/useProgressStore';
import type { Muscle } from '../types';
import '../components/features/detail/detail.css';

type DetailMode = 'expert' | 'easy';

function buildRows(muscle: Muscle, mode: DetailMode): DataRow[] {
  const src = mode === 'easy' && muscle.easy ? muscle.easy : muscle;
  return [
    { label: 'Ursprung', value: src.origin },
    { label: 'Ansatz', value: src.insertion },
    { label: 'Funktion', value: src.functionDescription },
    { label: 'Innervation', value: src.innervation },
    { label: 'Segmente', value: src.segments },
    { label: 'Gelenke', value: muscle.joints.join(', ') },
    ...(muscle.taCode ? [{ label: 'TA-Code', value: muscle.taCode }] : []),
    { label: 'Klinik', value: muscle.clinicalNote ?? '' },
  ];
}

export function MuscleDetailPage() {
  const { id } = useParams();
  const muscle = id ? getMuscleById(id) : undefined;
  const [mode, setMode] = useState<DetailMode>('expert');

  const inCollection = useCollectionStore((s) => (muscle ? s.muscleIds.includes(muscle.id) : false));
  const toggleCollection = useCollectionStore((s) => s.toggle);
  const inDeck = useProgressStore((s) => (muscle ? muscle.nameLatin in s.flashcards.cards : false));
  const addCard = useProgressStore((s) => s.addCard);
  const removeCard = useProgressStore((s) => s.removeCard);

  if (!muscle) {
    return (
      <section className="page">
        <p className="page__eyebrow">Nicht gefunden</p>
        <h1 className="page__title">Unbekannter Muskel</h1>
        <p>
          Kein Muskel mit der Kennung <code>{id}</code>. Zurück zur{' '}
          <Link to="/suche">Suche</Link>.
        </p>
      </section>
    );
  }

  return (
    <article className="page detail">
      <Link to="/suche" className="detail__back">
        <Icon name="icArrowL" size={18} /> Zur Suche
      </Link>

      <header className="detail__header">
        <div className="detail__title-row">
          <h1 className="page__title detail__name">{muscle.nameLatin}</h1>
          <DifficultyDots level={muscle.difficulty} />
        </div>
        <p className="detail__meta">
          {regionLabel(muscle.region)} · {muscle.subregion}
        </p>

        <div className="detail__actions">
          <button
            type="button"
            className={`btn btn--ghost${inCollection ? ' btn--active' : ''}`}
            aria-pressed={inCollection}
            onClick={() => toggleCollection(muscle.id)}
          >
            <Icon name="icBookmark" size={18} /> {inCollection ? 'Gemerkt' : 'Merken'}
          </button>
          <button
            type="button"
            className={`btn btn--ghost${inDeck ? ' btn--active' : ''}`}
            aria-pressed={inDeck}
            onClick={() => (inDeck ? removeCard(muscle.nameLatin) : addCard(muscle.nameLatin))}
          >
            <Icon name="icCards" size={18} /> {inDeck ? 'In Lernkarten' : 'Zu Lernkarten'}
          </button>
        </div>
      </header>

      <div className="detail__grid">
        <section className="detail__facts">
          {muscle.easy && (
            <SegmentedControl<DetailMode>
              ariaLabel="Detailtiefe"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'expert', label: 'Fachlich' },
                { value: 'easy', label: 'Einfach' },
              ]}
            />
          )}

          <DataList rows={buildRows(muscle, mode)} />

          {muscle.functions.length > 0 && (
            <ul className="detail__chips">
              {muscle.functions.map((fn) => (
                <li key={fn} className="chip">
                  {movementLabel(fn)}
                </li>
              ))}
            </ul>
          )}

          {muscle.tags.length > 0 && (
            <ul className="detail__chips detail__chips--tags">
              {muscle.tags.map((tag) => (
                <li key={tag} className="chip chip--muted">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail__media">
          <ImageViewer images={muscle.images} alt={muscle.nameLatin} />
        </section>
      </div>
    </article>
  );
}
