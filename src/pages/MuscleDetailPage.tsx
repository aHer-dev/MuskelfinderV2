import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMuscleById } from '../data';
import { movementLabel, regionLabel } from '../data/labels';
import { groupsOf } from '../data/groups';
import { isSupportedIn3D, threeDUrl } from '../data/threeD';
import { DataList } from '../components/features/detail/DataList';
import type { DataRow } from '../components/features/detail/DataList';
import { ClinicalNote } from '../components/features/detail/ClinicalNote';
import { ImageViewer } from '../components/features/detail/ImageViewer';
import { MuscleNote } from '../components/features/detail/MuscleNote';
import { PalpationSection } from '../components/features/detail/PalpationSection';
import { DifficultyDots } from '../components/ui/DifficultyDots';
import { Icon } from '../components/ui/Icon';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useCollectionStore } from '../store/useCollectionStore';
import { useLookupStore } from '../store/useLookupStore';
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
  const recordLookup = useLookupStore((s) => s.record);
  const forgetLookup = useLookupStore((s) => s.forget);
  const removeCard = useProgressStore((s) => s.removeCard);

  /* Brücke B1 (7d): Nachschlagen ist ein Lernsignal. Wer denselben Muskel wieder und
     wieder aufschlägt, kann ihn nicht — `/heute` bietet ihn daraufhin als Karte an.
     Gezählt wird der Aufruf, nicht das Rendern. */
  const nameLatin = muscle?.nameLatin;
  useEffect(() => {
    if (nameLatin) recordLookup(nameLatin);
  }, [nameLatin, recordLookup]);

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
            onClick={() => {
              if (inDeck) {
                removeCard(muscle.nameLatin);
                return;
              }
              // Im Kasten ist er keine Lücke mehr — der Zähler hat seine Arbeit getan.
              addCard(muscle.nameLatin);
              forgetLookup([muscle.nameLatin]);
            }}
          >
            <Icon name="icCards" size={18} /> {inDeck ? 'In Lernkarten' : 'Zu Lernkarten'}
          </button>
          {isSupportedIn3D(muscle.nameLatin) && (
            <a
              className="btn btn--ghost"
              href={threeDUrl(muscle.nameLatin, window.location.href)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="icCube" size={18} /> In 3D ansehen
            </a>
          )}
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

          {/* Der Name IST die Funktion — man muss ihn nur lesen koennen (8d). Das gehoert
              ins „Einfach"-Niveau; im Fachlichen bleibt es aus dem Weg. */}
          {mode === 'easy' && (muscle.etymology || muscle.mnemonic) && (
            <section className="name-origin">
              <h2 className="name-origin__title">Den Namen verstehen</h2>
              {muscle.etymology && <p className="name-origin__text">{muscle.etymology}</p>}
              {muscle.mnemonic && <p className="name-origin__mnemonic">{muscle.mnemonic}</p>}
            </section>
          )}

          {/* Palpation (9d) steht in BEIDEN Niveaus: Physio-/Ergo-Schueler werden am
              lebenden Koerper geprueft — das ist kein „Einfach"-Thema, sondern Pruefungsstoff.
              Ohne Eintrag rendert hier gar nichts. */}
          {muscle.palpation && <PalpationSection palpation={muscle.palpation} />}

          {muscle.clinicalNote && <ClinicalNote note={muscle.clinicalNote} />}

          {/* Geprueft wird in Zusammenhaengen (9a). Die Gruppe fuehrt zu den anderen
              Mitgliedern — ein Muskel ohne Gruppe zeigt hier schlicht nichts. */}
          {groupsOf(muscle.nameLatin).length > 0 && (
            <ul className="detail__chips detail__chips--groups">
              {groupsOf(muscle.nameLatin).map((group) => (
                <li key={group.id}>
                  <Link to={`/gruppe/${group.id}`} className="chip chip--link">
                    {group.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

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

          {/* `key`: beim Muskelwechsel startet die Notiz frisch — sonst stünde die
              vorige im Feld, und der Debounce schriebe sie an den falschen Muskel. */}
          <MuscleNote key={muscle.nameLatin} nameLatin={muscle.nameLatin} />
        </section>

        <section className="detail__media">
          <ImageViewer muscle={muscle} />
        </section>
      </div>
    </article>
  );
}
