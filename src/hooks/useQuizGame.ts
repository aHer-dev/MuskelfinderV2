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
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';
import type { QuizMode, QuizPhase, QuizQuestion, QuizResult } from '../types';

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
  answer: (optionId: string) => void;
  next: () => void;
  result: QuizResult | null;
}

export function useQuizGame(mode: QuizMode, count = 10): QuizGameApi {
  const awardXp = useProgressStore((s) => s.awardXp);
  const awardStreak = useProgressStore((s) => s.awardStreak);
  const commitRound = useQuizStore((s) => s.commitRound);

  const questions = useMemo(() => generateQuiz(MUSCLES, mode, count), [mode, count]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<QuizPhase>('answering');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const question = questions[index] ?? null;

  function answer(optionId: string) {
    if (phase !== 'answering' || !question) return;
    setSelectedId(optionId);
    setPhase('revealed');

    if (optionId === question.correctId) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((best) => Math.max(best, newStreak));
      setCorrectCount((c) => c + 1);
      setScore((s) => s + POINTS_PER_CORRECT);
      const gained = awardXp(XP_PER_CORRECT).xpAdded + awardStreak(newStreak).xpAdded;
      setXpEarned((xp) => xp + gained);
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
      commitRound(quizSeriesKey(mode), correctCount, questions.length);
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
    answer,
    next,
    result,
  };
}
