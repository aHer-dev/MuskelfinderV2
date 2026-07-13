/* =========================================================================
   StandRail — „Dein Stand", die rechte Schiene auf `/heute` (Etappe 12).
   src/components/features/today/StandRail.tsx

   Bei 1440 px lagen auf `/heute` **444 px rechts brach** (gemessen), waehrend Level, Serie
   und Fortschritt als winziger Textlink unten am Seitenende klebten. Diese Schiene raeumt
   beides auf.

   Sie erfindet keine Geometrie: **320 px, `radius: 20px`, Glas, rechts** ist exakt das, was
   das Design-Handoff (§7) fuer die Filter-Sidebar der Suche vorgibt — spiegelbildlich zur
   Icon-Rail links. Sie ist die Fortsetzung des bestehenden Entwurfs, keine neue Idee.

   **Sie erfindet auch keine Daten.** Jede Zahl hier kommt aus einem Selektor, den es laengst
   gibt: `getTodayPlan` (7a), `badges` (9b), `xpView` (Etappe 2), `useStreakStore` (7f). Kein
   neuer Zustand, kein neuer Backup-Schluessel.

   **Nur auf `/heute`.** Lernkarten, Quiz und Statistik nutzen bereits 1096 px — dort muesste
   man Inhalt wegnehmen, um Platz zu schaffen. Und der Guide bleibt schmal, weil Fliesstext auf
   ~68 Zeichen gehoert. Eine Box, die nur existiert, damit rechts nichts fehlt, ist schlimmer
   als der leere Platz.
   ========================================================================= */

import { useMemo } from 'react';
import { badges } from '../../../data/badges';
import { groupPractice } from '../../../data/practice';
import { getGroupById } from '../../../data/groups';
import type { TodayPlan } from '../../../data/today';
import { xpView } from '../../../persistence/xp';
import { useProgressStore } from '../../../store/useProgressStore';
import { useStreakStore } from '../../../store/useStreakStore';
import { useThemeStore } from '../../../store/useThemeStore';
import { Icon } from '../../ui/Icon';
import { ProgressRing } from '../../ui/ProgressRing';
import './stand-rail.css';

interface StandRailProps {
  plan: TodayPlan;
  /** Karten anlegen (falls noetig) und Sitzung starten — dieselbe Handlung wie in der Statistik. */
  onPractice: (names: string[]) => void;
}

/** „5 Tage in Folge" — Nominativ. */
function tage(n: number): string {
  return n === 1 ? 'Tag' : 'Tage';
}

/** „Prüfung in 10 Tagen" — Dativ. Nicht dasselbe Wort, auch wenn es so aussieht. */
function tagenDativ(n: number): string {
  return n === 1 ? 'Tag' : 'Tagen';
}

export function StandRail({ plan, onPractice }: StandRailProps) {
  const theme = useThemeStore((s) => s.theme);
  const cards = useProgressStore((s) => s.flashcards.cards);
  const totalXP = useProgressStore((s) => s.xp.totalXP);
  const streak = useStreakStore((s) => s.streak);

  const xp = xpView(totalXP);
  const logo = `${import.meta.env.BASE_URL}logo/${theme === 'dark' ? 'af-logo.png' : 'af-logo-dark.png'}`;

  /* Das naechste Abzeichen = das, dem man am naechsten ist. `badges()` sortiert bereits so:
     unverdiente zuerst, danach nach Anteil absteigend. Der erste Unverdiente ist also genau
     der, an dem sich Arbeit am ehesten lohnt. */
  const naechstes = useMemo(() => badges(cards).find((b) => !b.earned) ?? null, [cards]);

  /* Ein Gruppenmuskel ohne Karte hat kein Fach — kein Faelligkeitsfilter faende ihn, und das
     Abzeichen bliebe ewig bei „3 von 4" stehen. `groupPractice` nimmt ihn trotzdem mit; der
     Knopf legt die Karte an (9b). */
  const uebung = useMemo(() => {
    if (!naechstes) return null;
    const gruppe = getGroupById(naechstes.id);
    return gruppe ? groupPractice({ cards }, gruppe.muscles) : null;
  }, [naechstes, cards]);

  return (
    <aside className="stand-rail" aria-label="Dein Stand">
      <div className="stand-rail__brand">
        <img src={logo} alt="" width={34} height={34} aria-hidden="true" />
        <span className="stand-rail__brand-text">
          <strong>Muskelfinder</strong>
          <em>Anatomie Fokus</em>
        </span>
      </div>

      {/* ── Level ──────────────────────────────────────────────────────── */}
      <section className="stand-rail__block" aria-labelledby="stand-level">
        <h2 className="stand-rail__title" id="stand-level">
          Dein Stand
        </h2>
        <div className="stand-rail__level">
          <ProgressRing value={xp.progress} size={56} stroke={5} centerValue={String(xp.level)} />
          <div className="stand-rail__level-text">
            <strong>Level {xp.level}</strong>
            <span>
              noch {xp.xpNeeded - xp.xpThisLevel} XP bis Level {xp.level + 1}
            </span>
          </div>
        </div>

        <ul className="stand-rail__facts">
          <li>
            <Icon name="icCards" size={15} />
            <span>
              <strong>{plan.deckSize}</strong> {plan.deckSize === 1 ? 'Karte' : 'Karten'} im Kasten
            </span>
          </li>
          {streak.current > 0 && (
            <li>
              <Icon name="icFlame" size={15} />
              <span>
                <strong>{streak.current}</strong> {tage(streak.current)} in Folge
              </span>
            </li>
          )}
          {/* Freezes sind der Grund, warum ein Fehltag nicht das Ende ist — also zeigen (7f). */}
          {streak.freezes > 0 && (
            <li title="Ein Freeze überbrückt automatisch einen Fehltag.">
              <Icon name="icCheck" size={15} />
              <span>
                <strong>{streak.freezes}</strong> {streak.freezes === 1 ? 'Freeze' : 'Freezes'}
              </span>
            </li>
          )}
          {plan.daysUntilExam !== null && (
            <li className="stand-rail__exam">
              <Icon name="icTarget" size={15} />
              <span>
                Prüfung in <strong>{plan.daysUntilExam}</strong> {tagenDativ(plan.daysUntilExam)}
              </span>
            </li>
          )}
        </ul>
      </section>

      {/* ── Nächstes Abzeichen ─────────────────────────────────────────────
          Nur mit Karten im Kasten. Mit einem leeren Kasten waere man jedem Abzeichen
          gleich fern — „das naechste" waere dann eine willkuerliche Behauptung. */}
      {naechstes && plan.deckSize > 0 && (
        <section className="stand-rail__block" aria-labelledby="stand-badge">
          <h2 className="stand-rail__title" id="stand-badge">
            Nächstes Abzeichen
          </h2>
          <p className="stand-rail__badge-label">{naechstes.label}</p>
          <div
            className="stand-rail__bar"
            role="progressbar"
            aria-valuenow={naechstes.mastered}
            aria-valuemin={0}
            aria-valuemax={naechstes.total}
            aria-label={`${naechstes.label}: ${naechstes.mastered} von ${naechstes.total} beherrscht`}
          >
            <span style={{ width: `${(naechstes.mastered / naechstes.total) * 100}%` }} />
          </div>
          <p className="stand-rail__badge-count">
            {naechstes.mastered} von {naechstes.total} beherrscht
          </p>
          {uebung && uebung.names.length > 0 && (
            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => onPractice(uebung.names)}
            >
              Die fehlenden Karten üben
            </button>
          )}
        </section>
      )}

      {/* Bewusst KEINE Navigation hier. „Schnell starten" stand kurz in dieser Schiene und ist
          zurueck in den Inhalt gewandert — aus zwei Gruenden: Die linke Spalte brach sonst nach
          dem einen Knopf ab und liess unten ein Loch, und Navigation hat links schon eine
          Heimat (die Icon-Rail). Diese Schiene sagt, WO DU STEHST. Sie fuehrt nicht. */}
    </aside>
  );
}
