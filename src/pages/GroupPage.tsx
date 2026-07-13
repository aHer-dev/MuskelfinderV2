import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMuscleByLatinName } from '../data';
import { getGroupById } from '../data/groups';
import { regionLabel } from '../data/labels';
import { useProgressStore } from '../store/useProgressStore';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import '../components/features/detail/detail.css';

/**
 * Eine funktionelle Gruppe als Lerneinheit (9a): „Nenne die Rotatorenmanschette."
 *
 * Kein CTA ins Leere (Regel aus 8c): Der Knopf legt die fehlenden Muskeln in den
 * Kasten — sind schon alle drin, sagt er das, statt nichts zu tun.
 */
export function GroupPage() {
  const { id } = useParams();
  const group = id ? getGroupById(id) : undefined;
  const navigate = useNavigate();

  const cards = useProgressStore((s) => s.flashcards.cards);
  const addCards = useProgressStore((s) => s.addCards);

  if (!group) {
    return (
      <section className="page">
        <EmptyState
          icon="icList"
          title="Unbekannte Gruppe"
          headingLevel={1}
          description="Diese funktionelle Gruppe gibt es nicht."
          action={
            <Link to="/suche" className="btn btn--primary">
              Zur Suche
            </Link>
          }
        />
      </section>
    );
  }

  const fehlend = group.muscles.filter((name) => !(name in cards));

  return (
    <section className="page detail">
      <Link to="/suche" className="detail__back">
        <Icon name="icArrowL" size={18} /> Zur Suche
      </Link>

      <header className="detail__header">
        <p className="page__eyebrow">Funktionelle Gruppe</p>
        <h1 className="page__title detail__name">{group.label}</h1>
        {group.note && <p className="detail__meta">{group.note}</p>}

        <div className="detail__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={fehlend.length === 0}
            onClick={() => {
              addCards(fehlend);
              navigate('/lernkarten', {
                state: { start: { names: group.muscles, limit: 0, scope: 'all' } },
              });
            }}
          >
            <Icon name="icCards" size={18} />
            {fehlend.length === 0
              ? 'Alle im Karteikasten'
              : `${fehlend.length} fehlende ${fehlend.length === 1 ? 'Karte' : 'Karten'} anlegen und üben`}
          </button>
        </div>
      </header>

      <ul className="group-members">
        {group.muscles.map((name) => {
          const muscle = getMuscleByLatinName(name);
          const card = cards[name];
          return (
            <li key={name} className="group-member">
              {muscle ? (
                <Link to={`/muskel/${muscle.id}`} className="group-member__link">
                  <span className="group-member__name">{name}</span>
                  <span className="group-member__meta">
                    {regionLabel(muscle.region)} · {muscle.subregion}
                  </span>
                </Link>
              ) : (
                <span className="group-member__name">{name}</span>
              )}
              <span className="group-member__box">
                {card ? `Fach ${card.fach}` : 'nicht im Kasten'}
              </span>
            </li>
          );
        })}
      </ul>

      {/* „In Klammern": wird mitgelernt, gehoert aber nicht dazu. Sichtbar getrennt —
          sonst waere die Gruppe im Quiz („Welcher gehoert NICHT dazu?") falsch. */}
      {group.related && group.related.length > 0 && (
        <section className="group-related" aria-labelledby="group-related">
          <h2 className="group-related__title" id="group-related">
            Wird mitgelernt — gehört aber nicht dazu
          </h2>
          <ul className="group-members group-members--related">
            {group.related.map((name) => {
              const muscle = getMuscleByLatinName(name);
              return (
                <li key={name} className="group-member group-member--related">
                  {muscle ? (
                    <Link to={`/muskel/${muscle.id}`} className="group-member__link">
                      <span className="group-member__name">({name})</span>
                      <span className="group-member__meta">
                        {regionLabel(muscle.region)} · {muscle.subregion}
                      </span>
                    </Link>
                  ) : (
                    <span className="group-member__name">({name})</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
  );
}
