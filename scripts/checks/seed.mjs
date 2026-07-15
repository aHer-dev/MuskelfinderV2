/* =========================================================================
   Geteilter Seed fuer die Browser-Pruefungen.
   scripts/checks/seed.mjs

   Wird per `page.addInitScript(SEED)` VOR jedem Seitenskript ausgefuehrt —
   sonst hydriert `zustand` leer: Die App laeuft auf HashRouter, ein
   Routenwechsel laedt das Dokument NICHT neu, und ein nach dem Laden
   geschriebener localStorage-Wert kommt nie an.

   Die Formen treffen EXAKT `src/persistence/types.ts` (version: 2) und die
   Store-Keys (`partialize`). Ein falsch geformter Store liess `/heute` frueher
   weiss werden (`Object.entries(undefined)`). Wer hier ein Feld aendert, gleicht
   es gegen `persistence/types.ts` ab.

   Die 24 Muskelnamen sind ECHTE `nameLatin` aus dem Bestand — drei hiessen beim
   ersten Versuch anders (z. B. „M. triceps brachii" existiert nur mit „– Caput …").
   ========================================================================= */

export function SEED() {
  const iso = (ms) => new Date(ms).toISOString();
  const tag = (ms) => new Date(ms).toISOString().slice(0, 10);
  const now = Date.now();
  const day = 86400000;

  // mf.profile — partialize: { profession, examDate } (flach, KEINE Sektion)
  localStorage.setItem('mf.profile', JSON.stringify({
    state: { profession: 'physio', examDate: null }, version: 0,
  }));

  // mf.progress — { flashcards: FlashcardsSection, xp: XpSection }
  const namen = [
    'M. trapezius – Pars descendens', 'M. deltoideus', 'M. biceps brachii',
    'M. triceps brachii – Caput longum', 'M. brachialis', 'M. brachioradialis',
    'M. pectoralis major', 'M. latissimus dorsi', 'M. serratus anterior',
    'M. rhomboideus major', 'M. supraspinatus', 'M. infraspinatus', 'M. teres minor',
    'M. subscapularis', 'M. gluteus maximus', 'M. rectus femoris', 'M. vastus lateralis',
    'M. biceps femoris – Caput longum', 'M. semitendinosus', 'M. gastrocnemius', 'M. soleus',
    'M. tibialis anterior', 'M. rectus abdominis', 'M. sternocleidomastoideus',
  ];
  const cards = {};
  namen.forEach((n, i) => {
    const faellig = i % 3 !== 0; // zwei Drittel faellig, ein Drittel nicht
    cards[n] = {
      fach: (i % 7) + 1,
      nextDue: iso(now + (faellig ? -2 * day : 5 * day)),
      totalCorrect: i % 5,
      totalWrong: i % 3,
      lastSeen: iso(now - 3 * day),
      difficult: i % 8 === 0,
    };
  });
  localStorage.setItem('mf.progress', JSON.stringify({
    state: {
      flashcards: { version: 2, cards },
      xp: { version: 2, totalXP: 1480, lastDailyBonus: null },
    },
    version: 0,
  }));

  // mf.quizSeries — Record<key, QuizSeriesEntry>
  localStorage.setItem('mf.quizSeries', JSON.stringify({
    state: {
      quizSeries: {
        'name-origin': { rounds: 4, answers: 40, correct: 31,
          history: [{ pct: 70, correct: 7, answered: 10 }, { pct: 80, correct: 8, answered: 10 }] },
        'origin-insertion': { rounds: 2, answers: 22, correct: 12,
          history: [{ pct: 55, correct: 6, answered: 11 }] },
      },
    },
    version: 0,
  }));

  // mf.lookups — LookupsSection mit `entries` (NICHT flach!)
  localStorage.setItem('mf.lookups', JSON.stringify({
    state: {
      lookups: {
        version: 2,
        entries: {
          'M. piriformis': { count: 3, lastLookup: iso(now - day) },
          'M. psoas major': { count: 2, lastLookup: iso(now - 2 * day) },
        },
      },
    },
    version: 0,
  }));

  // mf.streak — StreakSection
  localStorage.setItem('mf.streak', JSON.stringify({
    state: {
      streak: {
        version: 2, current: 4, best: 9, lastCompletedDay: tag(now - day),
        freezes: 2, day: tag(now), reviewedToday: 0, earnedFreezeToday: false,
      },
    },
    version: 0,
  }));
}

/** Die 24 Namen des Seeds — Skripte, die die Zahl gegenchecken, lesen sie hier. */
export const SEED_CARD_COUNT = 24;
