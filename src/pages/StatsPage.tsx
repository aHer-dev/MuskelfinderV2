import { getRegions } from '../data';
import { regionLabel } from '../data/labels';
import { useStats } from '../hooks/useStats';
import { BackupPanel } from '../components/features/stats/BackupPanel';
import { ProgressRing } from '../components/ui/ProgressRing';
import type { RegionId } from '../types';
import '../components/features/stats/stats.css';

const REGION_ORDER = getRegions().map((r) => r.id) as RegionId[];

export function StatsPage() {
  const stats = useStats();

  return (
    <section className="page stats">
      <header className="stats__header">
        <p className="page__eyebrow">Dein Fortschritt</p>
        <h1 className="page__title">Statistik</h1>
      </header>

      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.level}</span>
          <span className="stat-tile__label">Level</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.xp.totalXP}</span>
          <span className="stat-tile__label">XP gesamt</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.deckSize}</span>
          <span className="stat-tile__label">Karten im Kasten</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.quiz.accuracy}%</span>
          <span className="stat-tile__label">Quiz-Trefferquote</span>
        </div>
      </div>

      <section className="stats__panel level-card">
        <ProgressRing
          value={stats.xp.progress}
          size={120}
          stroke={9}
          centerLabel="Level"
          centerValue={String(stats.level)}
        />
        <div className="level-card__body">
          <h2>Level {stats.level}</h2>
          <p className="level-card__xp">{stats.xp.totalXP} XP gesamt</p>
          <p className="stats__panel-sub">
            {stats.level < 99
              ? `Noch ${stats.xp.xpNeeded - stats.xp.xpThisLevel} XP bis Level ${stats.level + 1}`
              : 'Höchstlevel erreicht'}
          </p>
        </div>
      </section>

      <section className="stats__panel">
        <h2>Lernkarten</h2>
        <div className="stats__breakdown">
          <span className="chip">Gemeistert: {stats.breakdown.mastered}</span>
          <span className="chip">In Arbeit: {stats.breakdown.learning}</span>
          <span className="chip chip--muted">Neu: {stats.breakdown.neu}</span>
        </div>
      </section>

      <section className="stats__panel">
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
      </section>

      <section className="stats__panel">
        <h2>Quiz</h2>
        <p className="stats__quiz-line">
          {stats.quiz.rounds} Runden · {stats.quiz.correct}/{stats.quiz.answers} richtig ·{' '}
          {stats.quiz.accuracy}% Trefferquote
        </p>
      </section>

      <BackupPanel />
    </section>
  );
}
