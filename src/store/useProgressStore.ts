/* =========================================================================
   useProgressStore — Leitner-7-Karteikasten + XP/Level (ADR 0002 §2–§4).
   src/store/useProgressStore.ts

   Persistierter Zustand hat GENAU die V1-Backup-Form (`flashcards`, `xp`), damit
   der Backup-Round-Trip verlustfrei bleibt. Karten sind nach Muskelname
   geschlüsselt (nicht nach Routing-id). Level wird stets aus totalXP abgeleitet.
   Eigener sauberer V2-Key `mf.progress` (ADR 0002 §5).
   ========================================================================= */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CardRating } from '../types';
import {
  applyCorrect,
  applyUnsure,
  applyWrong,
  endOfDay,
  isDue,
  MASTERED_FACH,
  newCard,
} from '../persistence/leitner';
import {
  createEmptyFlashcardsSection,
  createEmptyXpSection,
} from '../persistence/sanitize';
import {
  DAILY_BONUS_XP,
  type FlashcardRating,
  flashcardXp,
  levelFromXP,
  streakXp,
  xpView,
  type XpView,
} from '../persistence/xp';
import type { FlashcardCard, FlashcardsSection, XpSection } from '../persistence/types';

/** Domänen-Rating → V1-XP-Vokabular. */
const RATING_TO_XP: Record<CardRating, FlashcardRating> = {
  correct: 'richtig',
  unsure: 'unsicher',
  wrong: 'falsch',
};

export interface XpAward {
  xpAdded: number;
  levelBefore: number;
  levelAfter: number;
  levelUp: boolean;
}

const NO_AWARD: XpAward = { xpAdded: 0, levelBefore: 1, levelAfter: 1, levelUp: false };

export interface DeckStats {
  total: number;
  dueToday: number;
  /** Anzahl je Fach, Index 1..7 (Index 0 ungenutzt). */
  byFach: number[];
}

interface ProgressState {
  flashcards: FlashcardsSection;
  xp: XpSection;

  /* Deck-Verwaltung (Schlüssel = Muskelname). */
  addCard: (name: string) => void;
  addCards: (names: string[]) => void;
  removeCard: (name: string) => void;
  isInDeck: (name: string) => boolean;
  getAddedCardNames: () => string[];
  getCardState: (name: string) => FlashcardCard | null;

  /* Lernen — Leitner-Transition + XP-Vergabe in einem Schritt. */
  reviewCard: (name: string, rating: CardRating) => XpAward;
  toggleDifficult: (name: string) => boolean;

  /* Weitere XP-Quellen. */
  awardStreak: (count: number) => XpAward;
  awardDailyBonus: () => XpAward & { alreadyClaimed?: boolean };
  awardXp: (amount: number) => XpAward;

  /* Abfragen / Selektoren. */
  getDueCards: (names?: string[]) => string[];
  getStats: (names?: string[]) => DeckStats;
  getLevel: () => number;
  getXpView: () => XpView;

  /* Persistenz-Bridge (Backup-Import / Reset). */
  replaceProgress: (sections: { flashcards: FlashcardsSection; xp: XpSection }) => void;
  resetProgress: () => void;
}

function deckNames(cards: Record<string, FlashcardCard>, names?: string[]): string[] {
  return names ? names.filter((n) => n in cards) : Object.keys(cards);
}

/** Interne XP-Vergabe: totalXP erhöhen, Level vorher/nachher zurückgeben. */
function awardXpInternal(state: ProgressState, amount: number): XpAward {
  if (amount <= 0) {
    const level = levelFromXP(state.xp.totalXP);
    return { xpAdded: 0, levelBefore: level, levelAfter: level, levelUp: false };
  }
  const levelBefore = levelFromXP(state.xp.totalXP);
  const totalXP = state.xp.totalXP + amount;
  const levelAfter = levelFromXP(totalXP);
  return { xpAdded: amount, levelBefore, levelAfter, levelUp: levelAfter > levelBefore };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      flashcards: createEmptyFlashcardsSection(),
      xp: createEmptyXpSection(),

      addCard: (name) => {
        if (get().flashcards.cards[name]) return;
        set((s) => ({
          flashcards: { ...s.flashcards, cards: { ...s.flashcards.cards, [name]: newCard() } },
        }));
      },

      addCards: (names) => {
        set((s) => {
          const cards = { ...s.flashcards.cards };
          let changed = false;
          for (const name of names) {
            if (!cards[name]) {
              cards[name] = newCard();
              changed = true;
            }
          }
          return changed ? { flashcards: { ...s.flashcards, cards } } : {};
        });
      },

      removeCard: (name) => {
        set((s) => {
          if (!(name in s.flashcards.cards)) return {};
          const cards = { ...s.flashcards.cards };
          delete cards[name];
          return { flashcards: { ...s.flashcards, cards } };
        });
      },

      isInDeck: (name) => name in get().flashcards.cards,
      getAddedCardNames: () => Object.keys(get().flashcards.cards),
      getCardState: (name) => {
        const card = get().flashcards.cards[name];
        return card ? { ...card } : null;
      },

      reviewCard: (name, rating) => {
        const card = get().flashcards.cards[name];
        if (!card) return NO_AWARD;

        const updated =
          rating === 'correct'
            ? applyCorrect(card)
            : rating === 'wrong'
              ? applyWrong(card)
              : applyUnsure(card);

        // XP nach Fach VOR der Bewertung (V1-Regel).
        const award = awardXpInternal(get(), flashcardXp(RATING_TO_XP[rating], card.fach));

        set((s) => ({
          flashcards: { ...s.flashcards, cards: { ...s.flashcards.cards, [name]: updated } },
          xp: { ...s.xp, totalXP: s.xp.totalXP + award.xpAdded },
        }));
        return award;
      },

      toggleDifficult: (name) => {
        const card = get().flashcards.cards[name];
        if (!card) return false;
        const difficult = !card.difficult;
        set((s) => ({
          flashcards: {
            ...s.flashcards,
            cards: { ...s.flashcards.cards, [name]: { ...card, difficult } },
          },
        }));
        return difficult;
      },

      awardStreak: (count) => {
        const award = awardXpInternal(get(), streakXp(count));
        if (award.xpAdded > 0) set((s) => ({ xp: { ...s.xp, totalXP: s.xp.totalXP + award.xpAdded } }));
        return award;
      },

      awardDailyBonus: () => {
        const today = new Date().toISOString().slice(0, 10);
        if (get().xp.lastDailyBonus === today) {
          const level = get().getLevel();
          return { xpAdded: 0, levelBefore: level, levelAfter: level, levelUp: false, alreadyClaimed: true };
        }
        const award = awardXpInternal(get(), DAILY_BONUS_XP);
        set((s) => ({
          xp: { ...s.xp, totalXP: s.xp.totalXP + award.xpAdded, lastDailyBonus: today },
        }));
        return award;
      },

      awardXp: (amount) => {
        const award = awardXpInternal(get(), amount);
        if (award.xpAdded > 0) set((s) => ({ xp: { ...s.xp, totalXP: s.xp.totalXP + award.xpAdded } }));
        return award;
      },

      getDueCards: (names) => {
        const { cards } = get().flashcards;
        const now = new Date();
        return deckNames(cards, names).filter((n) => isDue(cards[n], now));
      },

      getStats: (names) => {
        const { cards } = get().flashcards;
        const eod = endOfDay();
        const byFach = Array<number>(8).fill(0);
        let dueToday = 0;
        const relevant = deckNames(cards, names);
        for (const n of relevant) {
          const c = cards[n];
          byFach[c.fach]++;
          if (new Date(c.nextDue) <= eod) dueToday++;
        }
        return { total: relevant.length, dueToday, byFach };
      },

      getLevel: () => levelFromXP(get().xp.totalXP),
      getXpView: () => xpView(get().xp.totalXP),

      replaceProgress: ({ flashcards, xp }) => set({ flashcards, xp }),

      resetProgress: () =>
        set({ flashcards: createEmptyFlashcardsSection(), xp: createEmptyXpSection() }),
    }),
    {
      name: 'mf.progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ flashcards: state.flashcards, xp: state.xp }),
    },
  ),
);

/** Anteil gemeisterter Karten (Fach ≥ 5) — für Statistik/Region-Mastery. */
export function masteredCount(cards: Record<string, FlashcardCard>): number {
  return Object.values(cards).filter((c) => c.fach >= MASTERED_FACH).length;
}
