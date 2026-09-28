import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFlashcardSession } from './useFlashcardSession';
import {
  advanceQueue,
  buildQueue,
  readSessionHandoff,
  useSessionStore,
} from '../store/useSessionStore';
import { useProgressStore } from '../store/useProgressStore';
import { useStreakStore } from '../store/useStreakStore';

describe('advanceQueue (rein)', () => {
  it('richtig/falsch entfernen die aktuelle Karte', () => {
    expect(advanceQueue(['A', 'B', 'C'], 'correct')).toEqual(['B', 'C']);
    expect(advanceQueue(['A', 'B'], 'wrong')).toEqual(['B']);
  });

  it('unsicher schiebt die Karte ans Ende', () => {
    expect(advanceQueue(['A', 'B', 'C'], 'unsure')).toEqual(['B', 'C', 'A']);
    expect(advanceQueue(['A'], 'unsure')).toEqual(['A']);
  });

  it('leere Warteschlange bleibt leer', () => {
    expect(advanceQueue([], 'correct')).toEqual([]);
  });
});

describe('useFlashcardSession (gegen useProgressStore)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useSessionStore.getState().exit();
  });

  it('beginnt im Setup (nicht gestartet) und startet erst über start()', () => {
    useProgressStore.getState().addCards(['A', 'B']);
    const { result } = renderHook(() => useFlashcardSession());
    expect(result.current.started).toBe(false);
    expect(result.current.current).toBeNull();

    act(() => result.current.start({ limit: 0, scope: 'all' }));
    expect(result.current.started).toBe(true);
    expect(result.current.total).toBe(2);
    expect(result.current.current).toBe('A');
    expect(result.current.done).toBe(false);
  });

  it('Kartenlimit kürzt die Sitzung', () => {
    useProgressStore.getState().addCards(['A', 'B', 'C', 'D']);
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 2, scope: 'all' }));
    expect(result.current.total).toBe(2);
  });

  it('Bewertung verschiebt Fach + vergibt XP, unsicher re-queued', () => {
    useProgressStore.getState().addCards(['A', 'B']);
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 0, scope: 'all' }));

    act(() => result.current.rate('correct')); // A: Fach 1→2 (+3 XP)
    expect(result.current.reviewed).toBe(1);
    expect(result.current.correct).toBe(1);
    expect(result.current.current).toBe('B');

    act(() => result.current.rate('unsure')); // B bleibt, ans Ende (+2 XP)
    expect(result.current.reviewed).toBe(1);
    expect(result.current.unsure).toBe(1);
    expect(result.current.current).toBe('B');

    act(() => result.current.rate('correct')); // B: Fach 1→2 (+3 XP)
    expect(result.current.done).toBe(true);
    expect(result.current.reviewed).toBe(2);

    const store = useProgressStore.getState();
    expect(store.getCardState('A')?.fach).toBe(2);
    expect(store.getCardState('B')?.fach).toBe(2);
    expect(store.xp.totalXP).toBe(8); // 3 + 2 + 3
    expect(result.current.xpEarned).toBe(8);
  });

  it('exit() kehrt ins Setup zurück', () => {
    useProgressStore.getState().addCards(['A']);
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 0, scope: 'all' }));
    expect(result.current.started).toBe(true);
    act(() => result.current.exit());
    expect(result.current.started).toBe(false);
    expect(result.current.current).toBeNull();
  });
});

describe('readSessionHandoff (Übergabe von /heute, 7b)', () => {
  it('nimmt eine gültige Auswahl an und ergänzt die Voreinstellungen', () => {
    expect(readSessionHandoff({ start: { names: ['A', 'B'] } })).toEqual({
      names: ['A', 'B'],
      limit: 0,
      scope: 'all',
      filter: 'all',
      lernform: 'karten',
    });
  });

  it('nimmt die Lernform mit (Etappe 16) — Unbekanntes wird zur Lernkarte', () => {
    expect(readSessionHandoff({ start: { names: ['A'], lernform: 'quiz' } })?.lernform).toBe('quiz');
    expect(readSessionHandoff({ start: { names: ['A'], lernform: 'raten' } })?.lernform).toBe('karten');
    expect(readSessionHandoff({ start: { names: ['A'] } })?.lernform).toBe('karten');
  });

  it('nimmt einen Filter mit, weist aber Unsinn zurück (8b)', () => {
    expect(readSessionHandoff({ start: { names: ['A'], filter: 'wrong' } })?.filter).toBe('wrong');
    expect(readSessionHandoff({ start: { names: ['A'], filter: 'kaputt' } })?.filter).toBe('all');
  });

  it('weist alles zurück, was nicht wie eine Auswahl aussieht', () => {
    // Der Router-State kommt aus der History — er kann beliebig sein.
    expect(readSessionHandoff(null)).toBeNull();
    expect(readSessionHandoff('los')).toBeNull();
    expect(readSessionHandoff({})).toBeNull();
    expect(readSessionHandoff({ start: {} })).toBeNull();
    expect(readSessionHandoff({ start: { names: [] } })).toBeNull();
    expect(readSessionHandoff({ start: { names: [1, 2] } })).toBeNull();
  });

  it('übernimmt nur bekannte Bereiche, sonst „alle"', () => {
    expect(readSessionHandoff({ start: { names: ['A'], scope: 'head' } })?.scope).toBe('head');
    expect(readSessionHandoff({ start: { names: ['A'], scope: 'bein' } })?.scope).toBe('all');
  });
});

describe('buildQueue mit vorgegebener Auswahl (7b)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useSessionStore.getState().exit();
  });

  it('behält die Reihenfolge des Tagesplans bei', () => {
    useProgressStore.getState().addCards(['A', 'B', 'C']);
    expect(buildQueue({ names: ['C', 'A', 'B'], limit: 0, scope: 'all' })).toEqual(['C', 'A', 'B']);
  });

  it('lässt Namen weg, die nicht (mehr) fällig oder gar nicht im Kasten sind', () => {
    useProgressStore.getState().addCards(['A']);
    expect(buildQueue({ names: ['A', 'Unbekannt'], limit: 0, scope: 'all' })).toEqual(['A']);
  });
});

describe('Sitzung überlebt die Navigation (7d)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useSessionStore.getState().exit();
  });

  it('bleibt bestehen, wenn die Seite aushängt — Nachschlagen kostet die Sitzung nicht', () => {
    useProgressStore.getState().addCards(['A', 'B', 'C']);

    const first = renderHook(() => useFlashcardSession());
    act(() => first.result.current.start({ limit: 0, scope: 'all' }));
    act(() => first.result.current.rate('correct'));
    expect(first.result.current.reviewed).toBe(1);

    // Die Nutzerin schlägt etwas nach: /lernkarten hängt aus, die Detailseite kommt.
    first.unmount();

    // Zurück auf /lernkarten — die Sitzung läuft weiter, mit Zähler und Warteschlange.
    const second = renderHook(() => useFlashcardSession());
    expect(second.result.current.started).toBe(true);
    expect(second.result.current.reviewed).toBe(1);
    expect(second.result.current.total).toBe(3);
    expect(second.result.current.current).toBe('B');
  });

  it('exit() beendet sie wirklich — kein Zombie beim nächsten Besuch', () => {
    useProgressStore.getState().addCards(['A']);
    const { result, unmount } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 0, scope: 'all' }));
    act(() => result.current.exit());
    unmount();

    const again = renderHook(() => useFlashcardSession());
    expect(again.result.current.started).toBe(false);
  });
});

/* ── Quiz-Mix (Etappe 16, ADR 0014) ──────────────────────────────────────────
   Die zweite Lernform muss in den Kasten zaehlen, sonst ist sie keine Alternative fuer die
   Tagesdosis — aber STRENGER als die Lernkarte: Eine Karte rueckt erst nach ZWEI richtigen
   Antworten vor (Projektinhaber, 2026-09-28), ein Fehler schickt sie sofort zurueck. */
describe('Quiz-Mix — zweimal richtig, bevor die Karte vorrückt', () => {
  const A = 'M. deltoideus';
  const B = 'M. soleus';

  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().clearProgress();
    useStreakStore.getState().resetStreak();
    useSessionStore.getState().exit();
  });

  function starteQuiz(names: string[], fach = 1) {
    useProgressStore.getState().addCards(names);
    useProgressStore.setState((s) => {
      const cards = { ...s.flashcards.cards };
      for (const n of names) cards[n] = { ...cards[n], fach };
      return { flashcards: { ...s.flashcards, cards } };
    });
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 0, scope: 'all', lernform: 'quiz' }));
    return result;
  }

  /** Die aktuelle Frage richtig oder falsch beantworten — und weiter. */
  function antworte(result: { current: ReturnType<typeof useFlashcardSession> }, richtig: boolean) {
    const frage = result.current.frage!;
    const option = richtig ? frage.correctId : frage.options.find((o) => o.id !== frage.correctId)!.id;
    act(() => result.current.beantworte(option));
    const aufgedeckt = result.current.aufgedeckt!;
    act(() => result.current.weiter());
    return aufgedeckt;
  }

  const fach = (name: string) => useProgressStore.getState().getCardState(name)?.fach;

  it('jede Karte kommt zweimal dran — der Fortschritt zählt Fragen, die Zusammenfassung Karten', () => {
    const result = starteQuiz([A, B]);
    expect(result.current.lernform).toBe('quiz');
    expect(useSessionStore.getState().queue).toEqual([A, B, A, B]);
    expect(result.current.frage?.muscleId).toBe('deltoideus');
    expect(result.current.gesamt).toBe(4);
    expect(result.current.erledigt).toBe(0);
    expect(result.current.total).toBe(2);
  });

  it('die erste richtige Antwort bewegt die Karte NICHT — erst die zweite schiebt sie ein Fach weiter', () => {
    const result = starteQuiz([A, B]);

    const a1 = antworte(result, true);
    expect(a1).toMatchObject({ name: A, wirkung: 'halb', richtigBisher: 1, fachVorher: 1, fachNachher: 1 });
    expect(fach(A)).toBe(1);
    expect(useProgressStore.getState().getCardState(A)?.lastSeen).toBeNull();
    expect(result.current.xpEarned).toBe(0);
    expect(result.current.reviewed).toBe(0);

    antworte(result, true); // B, erste Frage

    const a2 = antworte(result, true);
    expect(a2).toMatchObject({ name: A, wirkung: 'hoch', richtigBisher: 2, fachVorher: 1, fachNachher: 2 });
    expect(fach(A)).toBe(2);
    expect(result.current.reviewed).toBe(1);
    expect(result.current.correct).toBe(1);
    expect(result.current.xpEarned).toBe(3); // dieselbe Regel wie `rate('correct')` in Fach 1
  });

  it('ein Fehler schickt die Karte SOFORT zurück (ADR 0011) — die zweite Frage ist nur noch Übung', () => {
    const result = starteQuiz([A, B], 5);

    const a1 = antworte(result, false);
    expect(a1).toMatchObject({ name: A, wirkung: 'zurueck', fachVorher: 5, fachNachher: 2 });
    expect(fach(A)).toBe(2);
    expect(result.current.wrong).toBe(1);

    antworte(result, true); // B
    const a2 = antworte(result, true);
    // Richtig, aber die Karte ist schon verbucht: kein zweiter Fachwechsel, keine XP, kein Zähler.
    expect(a2).toMatchObject({ name: A, wirkung: 'uebung', fachNachher: 2 });
    expect(fach(A)).toBe(2);
    expect(result.current.reviewed).toBe(1);
  });

  it('erst richtig, dann falsch: zurück — einmal richtig genügt im Quiz-Mix nicht', () => {
    const result = starteQuiz([A], 4);
    expect(antworte(result, true).wirkung).toBe('halb');
    expect(antworte(result, false)).toMatchObject({ wirkung: 'zurueck', fachVorher: 4, fachNachher: 2 });
    expect(fach(A)).toBe(2);
  });

  it('die Tagesdosis zählt KARTEN, nicht Fragen', () => {
    /* Zaehlte jede Frage, waere die Tagesdosis im Quiz-Mix nach der halben Arbeit „geschafft". */
    const result = starteQuiz([A, B]);
    for (let i = 0; i < 4; i++) antworte(result, true);
    expect(useStreakStore.getState().streak.reviewedToday).toBe(2);
  });

  it('ein Doppelklick wertet einmal — der zweite trifft nicht die nächste Frage', () => {
    /* Nach der ersten Antwort ist die Warteschlange schon weitergerueckt. Eine zweite Antwort
       mit derselben Option darf B nicht beruehren: Die Option gehoert zur Frage von A. */
    const result = starteQuiz([A, B]);
    const frage = result.current.frage!;
    act(() => {
      result.current.beantworte(frage.correctId);
      useSessionStore.getState().beantworte(frage.correctId);
    });
    expect(result.current.erledigt).toBe(1);
    expect(useSessionStore.getState().quizStand[B]).toBeUndefined();
  });

  it('solange die Antwort aufgedeckt ist, wertet nichts — auch keine Antwort auf die nächste Frage', () => {
    /* Der zweite Riegel. Ohne ihn liesse sich B beantworten, waehrend noch A's Ergebnis auf dem
       Schirm steht — per Taste, bevor die Seite neu gezeichnet hat. */
    const result = starteQuiz([A, B], 3);
    act(() => result.current.beantworte(result.current.frage!.options.find((o) => o.id !== result.current.frage!.correctId)!.id));
    const frageB = useSessionStore.getState().fragen[0]!;
    act(() => useSessionStore.getState().beantworte(frageB.options.find((o) => o.id !== frageB.correctId)!.id));
    expect(result.current.erledigt).toBe(1);
    expect(fach(B)).toBe(3);
    expect(useProgressStore.getState().getCardState(B)?.lastSeen).toBeNull();
  });

  it('fertig erst, wenn die letzte Antwort gelesen ist', () => {
    const result = starteQuiz([A]);
    antworte(result, true);
    act(() => result.current.beantworte(result.current.frage!.correctId));
    expect(result.current.current).toBeNull();
    expect(result.current.done).toBe(false);
    act(() => result.current.weiter());
    expect(result.current.done).toBe(true);
  });

  it('eine Karte in Fach 7 ist auch im Quiz-Mix Freitext — EINMAL, und dort genügt einmal richtig', () => {
    useProgressStore.getState().addCards([A, B]);
    useProgressStore.setState((s) => ({
      flashcards: { ...s.flashcards, cards: { ...s.flashcards.cards, [A]: { ...s.flashcards.cards[A], fach: 7 } } },
    }));
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 0, scope: 'all', lernform: 'quiz' }));
    expect(useSessionStore.getState().queue).toEqual([A, B, B]);
    expect(result.current.current).toBe(A);
    expect(result.current.frage).toBeNull();

    act(() => result.current.rate('correct')); // die Freitext-Karte bewertet sich selbst
    expect(result.current.frage?.muscleId).toBe('soleus');
    expect(result.current.erledigt).toBe(1);
  });

  it('in einer Karteikarten-Sitzung gibt es keine Fragen, und `beantworte` tut nichts', () => {
    useProgressStore.getState().addCards([A]);
    const { result } = renderHook(() => useFlashcardSession());
    act(() => result.current.start({ limit: 0, scope: 'all' }));
    expect(result.current.lernform).toBe('karten');
    expect(result.current.frage).toBeNull();
    act(() => result.current.beantworte('egal'));
    expect(result.current.reviewed).toBe(0);
    // Die Lernkarte bleibt bei EINER Bewertung: richtig = ein Fach weiter.
    act(() => result.current.rate('correct'));
    expect(fach(A)).toBe(2);
  });
});
