import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRegions } from '../data';
import { regionLabel } from '../data/labels';
import { milestonePractice, weakCardsPractice, weakestRegionPractice } from '../data/practice';
import { weakestQuizMode } from '../data/stats';
import { useStats } from '../hooks/useStats';
import { useProgressStore } from '../store/useProgressStore';
import { useLookupStore } from '../store/useLookupStore';
import { BackupPanel } from '../components/features/stats/BackupPanel';
import { CardBreakdown } from '../components/features/stats/CardBreakdown';
import { PracticeCta } from '../components/features/stats/PracticeCta';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Icon } from '../components/ui/Icon';
import type { RegionId } from '../types';
import '../components/features/stats/stats.css';

const REGION_ORDER = getRegions().map((r) => r.id) as RegionId[];

export function StatsPage() {
  const stats = useStats();
  const navigate = useNavigate();

  const cards = useProgressStore((s) => s.flashcards.cards);
  const lookups = useLookupStore((s) => s.lookups.entries);

  /* Die Auswahl hinter den Knöpfen. Sie kommt aus `data/practice.ts` und trifft
     dieselbe Priorisierung wie der Tagesplan — hier wird nichts gefiltert. */
  const practice = useMemo(() => {
    const lookupCounts: Record<string, number> = {};
    for (const [name, entry] of Object.entries(lookups)) lookupCounts[name] = entry.count;

    /* Nicht die Nummer des Meilensteins, sondern wie viele Karten bis dahin FEHLEN —
       der Knopf verspricht sonst mehr Arbeit, als der Satz darüber nennt. */
    const missing =
      stats.masteryNext === null ? null : stats.masteryNext - stats.breakdown.mastered;

    const input = { cards, lookupCounts };
    return {
      region: weakestRegionPractice(input),
      weakCards: weakCardsPractice(input),
      milestone: milestonePractice(input, missing),
    };
  }, [cards, lookups, stats.masteryNext, stats.breakdown.mastered]);

  /* Eine Sitzung mit genau diesen Karten — der Weg ist seit 7b gebaut. */
  const startSession = (names: string[]) => {
    navigate('/lernkarten', { state: { start: { names, limit: 0, scope: 'all' } } });
  };

  // Beste Quote (nach Genauigkeit, Antwortzahl als Tiebreak); nur bei ≥2 gespielten Modi.
  const bestMode =
    stats.quizByMode.length >= 2
      ? stats.quizByMode.reduce((best, m) =>
          m.accuracy > best.accuracy || (m.accuracy === best.accuracy && m.answers > best.answers)
            ? m
            : best,
        )
      : null;

  const weakMode = weakestQuizMode(stats.quizByMode);

  return (
    <section className="page stats">
      <header className="stats__header">
        <p className="page__eyebrow">Dein Fortschritt</p>
        <h1 className="page__title">Statistik</h1>
        {/* Der Karteikasten liegt unter „Fortschritt" (ADR 0007) — er hat keinen
            eigenen Tab mehr, muss von hier aus aber in einem Klick erreichbar sein. */}
        <div className="stats__links">
          <Link to="/karteikasten" className="stats__manage">
            <Icon name="icList" size={16} />
            <span>
              Karteikasten verwalten{stats.deckSize > 0 ? ` (${stats.deckSize})` : ''}
            </span>
            <Icon name="icArrow" size={16} />
          </Link>
          {/* Das Lernprofil (Beruf, Prüfungstermin) steuert Startdeck und Tagesdosis —
              es muss änderbar bleiben, ohne den Speicher zu löschen (7c). */}
          <Link to="/start" className="stats__manage">
            <Icon name="icTarget" size={16} />
            <span>Lernprofil ändern</span>
            <Icon name="icArrow" size={16} />
          </Link>
        </div>
      </header>

      {/* Vier verschiedene Kennzahlen — Level und XP standen hier doppelt, sie haben
          ihren Platz in der Level-Karte darunter. */}
      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.deckSize}</span>
          <span className="stat-tile__label">Karten im Kasten</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.breakdown.mastered}</span>
          <span className="stat-tile__label">Gemeistert</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.quiz.accuracy}%</span>
          <span className="stat-tile__label">Quiz-Trefferquote</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.quiz.rounds}</span>
          <span className="stat-tile__label">
            {stats.quiz.rounds === 1 ? 'Quiz-Runde' : 'Quiz-Runden'}
          </span>
        </div>
      </div>

      <div className="stats__bento">
        <section className="stats__panel level-card">
          <ProgressRing
            value={stats.xp.progress}
            size={120}
            stroke={9}
            centerLabel="Level"
            centerValue={String(stats.level)}
          />
          <div className="level-card__body">
            {/* Der Ring nennt das Level bereits — hier steht die XP-Bilanz, nicht dasselbe nochmal. */}
            <h2>{stats.xp.totalXP} XP gesamt</h2>
            <p className="stats__panel-sub">
              {stats.level < 99
                ? `Noch ${stats.xp.xpNeeded - stats.xp.xpThisLevel} XP bis Level ${stats.level + 1}`
                : 'Höchstlevel erreicht'}
            </p>
          </div>
        </section>

        <section className="stats__panel">
          <h2>Lernkarten</h2>
          <CardBreakdown breakdown={stats.breakdown} deckSize={stats.deckSize} />
          <PracticeCta
            label="Die schwachen Karten üben"
            selection={practice.weakCards}
            onStart={startSession}
          />
        </section>

        <section className="stats__panel stats__panel--wide">
          <h2>Beherrschung nach Region</h2>
          <ul className="stats__regions">
            {REGION_ORDER.map((region) => (
              <li key={region} className="stats__region">
                <span className="stats__region-label">{regionLabel(region)}</span>
                <div className="stat-bar">
                  <div
                    className="stat-bar__fill"
                    style={{ width: `${stats.regionMastery[region]}%` }}
                  />
                </div>
                <span className="stats__region-pct">{stats.regionMastery[region]}%</span>
              </li>
            ))}
          </ul>
          {/* Nüchtern, nicht anklagend: „hier lohnt sich Zeit", nicht „Schwachstelle". */}
          {practice.region.region !== null && (
            <p className="stats__cta-line">
              {regionLabel(practice.region.region)} {stats.regionMastery[practice.region.region]} %
              — hier lohnt sich Zeit.
            </p>
          )}
          <PracticeCta
            label={
              practice.region.region !== null
                ? `${regionLabel(practice.region.region)} üben`
                : 'Region üben'
            }
            selection={practice.region.selection}
            onStart={startSession}
          />
        </section>

        <section className="stats__panel stats__panel--wide">
          <h2>Quiz-Bilanz je Modus</h2>
          {stats.quizByMode.length === 0 ? (
            /* Auch der leere Block bekommt einen Knopf — sonst ist er eine Sackgasse. */
            <div className="stats__cta">
              <Link to="/quiz" className="btn btn--ghost">
                Erstes Quiz spielen
              </Link>
              <span className="stats__cta-note">Noch keine Runde gespielt</span>
            </div>
          ) : (
            <>
              <p className="stats__quiz-line">
                {stats.quiz.rounds} Runden · {stats.quiz.correct}/{stats.quiz.answers} richtig ·{' '}
                {stats.quiz.accuracy}% Gesamtquote
              </p>
              <ul className="stats__modes">
                {stats.quizByMode.map((m) => (
                  <li key={m.mode} className="stats__mode">
                    <span className="stats__mode-label">
                      {m.label}
                      {bestMode?.mode === m.mode && (
                        <span className="stats__mode-best">Beste Quote</span>
                      )}
                    </span>
                    <div className="stat-bar">
                      <div className="stat-bar__fill" style={{ width: `${m.accuracy}%` }} />
                    </div>
                    <span className="stats__mode-pct">
                      {m.accuracy}% · {m.correct}/{m.answers}
                    </span>
                  </li>
                ))}
              </ul>
              {/* „Der schwächste Modus" ergibt erst ab zwei gespielten Modi Sinn (stats.ts). */}
              {weakMode !== null && (
                <div className="stats__cta">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => navigate('/quiz', { state: { mode: weakMode.mode } })}
                  >
                    {weakMode.label} üben
                  </button>
                  <span className="stats__cta-note">
                    {weakMode.accuracy} % — dein schwächster Modus
                  </span>
                </div>
              )}
            </>
          )}
        </section>

        <section className="stats__panel">
          <h2>Ziele</h2>
          <ul className="stats__goals">
            <li className="stats__goal">
              <Icon name="icTrophy" size={18} className="stats__goal-icon" />
              <span className="stats__goal-text">
                {stats.masteryNext == null ? (
                  <>
                    <strong>{stats.breakdown.mastered} Karten</strong> gemeistert (F5–F7) — alle
                    Meilensteine erreicht.
                  </>
                ) : (
                  <>
                    Noch{' '}
                    <strong>
                      {stats.masteryNext - stats.breakdown.mastered}{' '}
                      {stats.masteryNext - stats.breakdown.mastered === 1 ? 'Karte' : 'Karten'}
                    </strong>{' '}
                    bis zum Meilenstein <strong>{stats.masteryNext} gemeistert</strong> (F5–F7).
                  </>
                )}
              </span>
            </li>
            <li className="stats__goal">
              <Icon name="icFlame" size={18} className="stats__goal-icon" />
              <span className="stats__goal-text">
                {stats.level < 99 ? (
                  <>
                    Noch <strong>{stats.xp.xpNeeded - stats.xp.xpThisLevel} XP</strong> bis Level{' '}
                    {stats.level + 1}.
                  </>
                ) : (
                  <>Höchstlevel erreicht.</>
                )}
              </span>
            </li>
          </ul>
          {/* Der Meilenstein ist die einzige Zahl hier, die man gezielt angehen kann:
              die Karten, die ihm am nächsten stehen (Fach 4 vor Fach 1). */}
          <PracticeCta
            label="Die Karten kurz vor dem Ziel üben"
            selection={practice.milestone}
            onStart={startSession}
          />
        </section>

        <BackupPanel />
      </div>
    </section>
  );
}
