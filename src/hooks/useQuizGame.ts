/* =========================================================================
   useQuizGame — flüchtiger Quiz-Ablauf über generierten Fragen.
   src/hooks/useQuizGame.ts

   Die Fragen kommen aus der getesteten `data/quiz.ts`. Der Spielzustand ist
   flüchtig (Komponenten-State); nur die ABGESCHLOSSENE Serie wird persistiert
   (`useQuizStore.commitRound`, kompatibles quizSeries-Format). XP läuft über den
   gemeinsamen Fortschritts-Store (Gamification).
   ========================================================================= */

import { useMemo, useState } from 'react';
import { MUSCLES } from '../data';
import { generateQuiz, quizSeriesKey } from '../data/quiz';
import { generateGroupQuiz } from '../data/group-quiz';
import { getGroups } from '../data/groups';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';
import { notifyAward } from '../store/useToastStore';
import type { QuizMode, QuizPhase, QuizQuestion, QuizResult, RegionId } from '../types';

/** XP je richtiger MC-Antwort (V1: multiple-choice = 2). */
const XP_PER_CORRECT = 2;
const POINTS_PER_CORRECT = 10;

export interface QuizGameApi {
  question: QuizQuestion | null;
  index: number;
  total: number;
  phase: QuizPhase;
  selectedId: string | null;
  correctCount: number;
  streak: number;
  bestStreak: number;
  score: number;
  xpEarned: number;
  /** Ergebnis je bereits beantworteter Frage (in Reihenfolge) — für die Fortschrittsleiste. */
  results: boolean[];
  answer: (optionId: string) => void;
  next: () => void;
  result: QuizResult | null;
}

export function useQuizGame(mode: QuizMode, count = 10, regions: RegionId[] = []): QuizGameApi {
  const awardXp = useProgressStore((s) => s.awardXp);
  const awardStreak = useProgressStore((s) => s.awardStreak);
  const commitRound = useQuizStore((s) => s.commitRound);

  // Bereichsfilter (V1 „Quiz-Filter"): leer = alle Muskeln.
  const regionKey = [...regions].sort().join(',');
  const questions = useMemo(() => {
    const pool = regions.length ? MUSCLES.filter((m) => regions.includes(m.region)) : MUSCLES;
    /* Der Gruppen-Modus (9a) fragt nach Zusammenhaengen, nicht nach einem Muskelfeld —
       er hat darum einen eigenen Generator. Alles danach (Antwort, XP, Serie) ist gleich. */
    if (mode === 'group-odd-one-out') {
      return generateGroupQuiz({ groups: getGroups(), muscles: pool, count });
    }
    return generateQuiz(pool, mode, count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, count, regionKey]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>('answering');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  const question = questions[index] ?? null;

  function answer(optionId: string) {
    if (phase !== 'answering' || !question) return;
    setSelectedId(optionId);
    setPhase('revealed');

    const isCorrect = optionId === question.correctId;
    setResults((r) => [...r, isCorrect]);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((best) => Math.max(best, newStreak));
      setCorrectCount((c) => c + 1);
      setScore((s) => s + POINTS_PER_CORRECT);
      const base = awardXp(XP_PER_CORRECT);
      const streakBonus = awardStreak(newStreak);
      const gained = base.xpAdded + streakBonus.xpAdded;
      setXpEarned((xp) => xp + gained);
      // Toast: Level-Up (aus beiden Awards) + gesammelte XP; Serien-Bonus benennen.
      notifyAward(
        { ...base, xpAdded: gained, levelUp: base.levelUp || streakBonus.levelUp,
          levelAfter: Math.max(base.levelAfter, streakBonus.levelAfter) },
        streakBonus.xpAdded > 0 ? `Serie ×${newStreak}` : undefined,
      );
    } else {
      setStreak(0);
    }
  }

  function next() {
    if (phase !== 'revealed') return;
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setPhase('answering');
      setSelectedId(null);
    } else {
      setPhase('finished');
      commitRound(quizSeriesKey(mode, regions), correctCount, questions.length);
    }
  }

  const result: QuizResult | null =
    phase === 'finished'
      ? { total: questions.length, correct: correctCount, bestStreak, score, xpEarned }
      : null;

  return {
    question,
    index,
    total: questions.length,
    phase,
    selectedId,
    correctCount,
    streak,
    bestStreak,
    score,
    xpEarned,
    results,
    answer,
    next,
    result,
  };
}
