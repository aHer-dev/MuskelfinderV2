/* =========================================================================
   Brücke B3 (Etappe 9c): Prüfungsfehler → Karteikasten → laufende Sitzung.
   src/store/exam-bridge.test.ts

   Das ist der Test, an dem der Prüfungsmodus hängt. Ohne ihn ist der ganze Task Deko:
   Der Primärbutton des Debriefs verspricht eine Sitzung mit den verpassten Karten —
   und `buildQueue` filtert erbarmungslos auf **fällig**. Eine verpasste Karte, die in
   Fach 5 sitzt und erst in 30 Tagen dran wäre, fiele heraus, und der Knopf führte in
   eine leere Sitzung (die Regel aus 8c).
   ========================================================================= */

import { beforeEach, describe, expect, it } from 'vitest';
import { applyExamMiss, FACH_INTERVALS, isDue, newCard } from '../persistence/leitner';
import { createEmptyFlashcardsSection, createEmptyXpSection } from '../persistence/sanitize';
import { useProgressStore } from './useProgressStore';
import { buildQueue } from './useSessionStore';
import type { FlashcardCard } from '../persistence/types';

/** Eine Karte, die tief im Kasten sitzt und darum lange NICHT fällig ist. */
function reifeKarte(fach: number): FlashcardCard {
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + FACH_INTERVALS[fach]);
  return { ...newCard(), fach, nextDue: nextDue.toISOString(), totalCorrect: fach };
}

function seedDeck(cards: Record<string, FlashcardCard>) {
  useProgressStore.setState({
    flashcards: { ...createEmptyFlashcardsSection(), cards },
    xp: createEmptyXpSection(),
  });
}

beforeEach(() => {
  seedDeck({});
});

describe('applyExamMiss — die Transition, die es vorher nicht gab', () => {
  it('stuft eine Box zurück', () => {
    expect(applyExamMiss(reifeKarte(5)).fach).toBe(4);
  });

  it('kommt unter Fach 1 nicht weiter', () => {
    expect(applyExamMiss(reifeKarte(1)).fach).toBe(1);
  });

  it('MACHT DIE KARTE SOFORT FÄLLIG — sonst startet die Debrief-Sitzung leer', () => {
    const karte = reifeKarte(6);
    expect(isDue(karte), 'Vorbedingung: die Karte ist gerade NICHT fällig').toBe(false);
    expect(isDue(applyExamMiss(karte))).toBe(true);
  });

  it('zählt den Fehler, ohne die Karte als schwierig zu markieren', () => {
    /* Der naheliegende Weg wäre das Schwierig-Flag (eine schwierige Karte ist immer
       fällig). Er wäre falsch: Das Flag ist klebrig — die Karte bliebe für immer
       „immer fällig", bis sie jemand von Hand entmarkiert. */
    const nachher = applyExamMiss(reifeKarte(3));
    expect(nachher.totalWrong).toBe(1);
    expect(nachher.difficult).toBe(false);
    expect(nachher.lastSeen).not.toBeNull();
  });
});

describe('registerExamMisses — was der Debrief-Knopf tut', () => {
  it('legt Muskeln an, die noch NICHT im Kasten waren', () => {
    useProgressStore.getState().registerExamMisses(['M. deltoideus', 'M. soleus']);

    const { cards } = useProgressStore.getState().flashcards;
    expect(Object.keys(cards).sort()).toEqual(['M. deltoideus', 'M. soleus']);
    expect(cards['M. deltoideus'].fach).toBe(1);
    expect(cards['M. deltoideus'].totalWrong).toBe(1);
  });

  it('stuft vorhandene Karten zurück, statt sie zu überschreiben', () => {
    seedDeck({ 'M. deltoideus': reifeKarte(5) });

    useProgressStore.getState().registerExamMisses(['M. deltoideus']);

    const karte = useProgressStore.getState().flashcards.cards['M. deltoideus'];
    expect(karte.fach).toBe(4);
    expect(karte.totalCorrect).toBe(5); // die Historie bleibt stehen
    expect(isDue(karte)).toBe(true);
  });

  it('vergibt KEINE XP — die Prüfung bewertet, sie belohnt nicht', () => {
    useProgressStore.getState().registerExamMisses(['M. deltoideus']);
    expect(useProgressStore.getState().xp.totalXP).toBe(0);
  });
});

describe('B3: der Knopf startet eine Sitzung mit GENAU diesen Karten', () => {
  it('alle verpassten Karten landen in der Warteschlange — auch die tief einsortierten', () => {
    // Ausgangslage: eine reife Karte (nicht fällig), eine junge, ein Muskel ohne Karte.
    seedDeck({
      'M. deltoideus': reifeKarte(6), // nicht fällig — die Falle
      'M. soleus': newCard(),
      'M. gracilis': reifeKarte(7), // nicht verpasst, nicht fällig
    });

    const verpasst = ['M. deltoideus', 'M. soleus', 'M. biceps brachii'];
    useProgressStore.getState().registerExamMisses(verpasst);

    // Die Gegenprobe wie in 8c: dieselbe Funktion fragen, die die Sitzung startet.
    const queue = buildQueue(
      { names: verpasst, limit: 0, scope: 'all' },
      useProgressStore.getState().flashcards.cards,
    );

    expect(queue.sort()).toEqual([...verpasst].sort());
  });

  it('OHNE registerExamMisses wäre die Sitzung leer — das ist die Falle, die der Knopf umgeht', () => {
    seedDeck({ 'M. deltoideus': reifeKarte(6) });

    const queue = buildQueue(
      { names: ['M. deltoideus'], limit: 0, scope: 'all' },
      useProgressStore.getState().flashcards.cards,
    );
    expect(queue).toEqual([]);
  });

  it('zieht keine fremden Karten mit — nur die verpassten', () => {
    seedDeck({ 'M. soleus': newCard() }); // fällig, aber nicht verpasst

    useProgressStore.getState().registerExamMisses(['M. deltoideus']);

    const queue = buildQueue(
      { names: ['M. deltoideus'], limit: 0, scope: 'all' },
      useProgressStore.getState().flashcards.cards,
    );
    expect(queue).toEqual(['M. deltoideus']);
  });
});
