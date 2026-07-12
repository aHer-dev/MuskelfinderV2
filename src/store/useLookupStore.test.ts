import { beforeEach, describe, expect, it } from 'vitest';
import { useLookupStore } from './useLookupStore';
import { lookupSuggestions } from '../data/lookups';
import type { FlashcardCard } from '../persistence/types';

function card(): FlashcardCard {
  return {
    fach: 1,
    nextDue: '2026-07-12T00:00:00.000Z',
    totalCorrect: 0,
    totalWrong: 0,
    lastSeen: null,
    difficult: false,
  };
}

describe('useLookupStore — Nachschlagen zählen', () => {
  beforeEach(() => {
    localStorage.clear();
    useLookupStore.getState().resetLookups();
  });

  it('zählt jeden Aufruf und merkt sich den letzten Zeitpunkt', () => {
    const { record } = useLookupStore.getState();
    record('M. deltoideus', new Date('2026-07-10T10:00:00.000Z'));
    record('M. deltoideus', new Date('2026-07-12T09:00:00.000Z'));
    record('M. soleus', new Date('2026-07-11T08:00:00.000Z'));

    const { entries } = useLookupStore.getState().lookups;
    expect(entries['M. deltoideus']).toEqual({
      count: 2,
      lastLookup: '2026-07-12T09:00:00.000Z',
    });
    expect(entries['M. soleus'].count).toBe(1);
  });

  it('vergisst einen Muskel, sobald er im Karteikasten liegt', () => {
    const store = useLookupStore.getState();
    store.record('M. deltoideus');
    store.record('M. soleus');

    store.forget(['M. deltoideus']);

    expect(useLookupStore.getState().lookups.entries['M. deltoideus']).toBeUndefined();
    expect(useLookupStore.getState().lookups.entries['M. soleus']).toBeDefined();
  });

  it('liefert die Aufrufzahlen flach — so nimmt die Empfehlungs-Engine sie entgegen (7a)', () => {
    const store = useLookupStore.getState();
    store.record('M. deltoideus');
    store.record('M. deltoideus');

    expect(useLookupStore.getState().getCounts()).toEqual({ 'M. deltoideus': 2 });
  });
});

describe('lookupSuggestions — „nachgeschlagen = noch nicht gewusst"', () => {
  beforeEach(() => {
    localStorage.clear();
    useLookupStore.getState().resetLookups();
  });

  it('sortiert die häufigsten zuerst und blendet aus, was schon im Kasten liegt', () => {
    const store = useLookupStore.getState();
    for (let i = 0; i < 3; i++) store.record('M. supraspinatus');
    store.record('M. soleus');
    for (let i = 0; i < 5; i++) store.record('M. deltoideus'); // liegt schon im Kasten

    const gaps = lookupSuggestions({
      lookups: useLookupStore.getState().lookups,
      cards: { 'M. deltoideus': card() },
    });

    expect(gaps.map((g) => g.name)).toEqual(['M. supraspinatus', 'M. soleus']);
    expect(gaps[0].count).toBe(3);
  });

  it('deckelt die Liste, damit der Heute-Screen nicht zur Aufgabenliste wird', () => {
    const store = useLookupStore.getState();
    for (const name of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) store.record(name);

    expect(lookupSuggestions({ lookups: useLookupStore.getState().lookups, cards: {} })).toHaveLength(5);
  });

  it('ohne Nachschlagen gibt es nichts vorzuschlagen', () => {
    expect(lookupSuggestions({ lookups: useLookupStore.getState().lookups, cards: {} })).toEqual([]);
  });
});
