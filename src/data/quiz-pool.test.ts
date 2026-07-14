import { describe, expect, it } from 'vitest';
import { quizPool, quizPoolSize } from './quiz-pool';
import { createRng, generateQuizFrom, quizSeriesKey, type QuizScope } from './quiz';
import { getMuscleByLatinName, getMuscles } from './loader';
import { newCard } from '../persistence/leitner';
import type { FlashcardCard } from '../persistence/types';

const MUSCLES = getMuscles();

function card(over: Partial<FlashcardCard> = {}): FlashcardCard {
  return { ...newCard(), ...over };
}

/* Ein kleiner, sprechender Kasten:
   - falsch beantwortet:  M. deltoideus
   - nie gesehen:         M. soleus
   - schwierig markiert:  M. gracilis
   - unauffaellig:        M. masseter                                        */
const DECK: Record<string, FlashcardCard> = {
  'M. deltoideus': card({ totalWrong: 2, lastSeen: new Date().toISOString() }),
  'M. soleus': card({ lastSeen: null }),
  'M. gracilis': card({ difficult: true, lastSeen: new Date().toISOString() }),
  'M. masseter': card({ lastSeen: new Date().toISOString() }),
};

function pool(scope: QuizScope, cards = DECK, regions: Parameters<typeof quizPool>[0]['regions'] = []) {
  return quizPool({ muscles: MUSCLES, cards, regions, scope });
}

function names(scope: QuizScope) {
  return pool(scope).questions.map((m) => m.nameLatin).sort();
}

describe('quizPool — zwei Töpfe, und sie sind nicht derselbe', () => {
  it('„alle" ist der ganze Bestand — wie bisher', () => {
    const p = pool('all');
    expect(p.questions).toHaveLength(MUSCLES.length);
    expect(p.blocker).toBeNull();
  });

  it('„Karteikasten" fragt nur, was im Kasten liegt', () => {
    expect(names('deck')).toEqual(Object.keys(DECK).sort());
  });

  it('„falsch beantwortete" nimmt nur Karten mit totalWrong > 0', () => {
    expect(names('wrong')).toEqual(['M. deltoideus']);
  });

  it('„nie gesehen" nimmt nur Karten ohne lastSeen', () => {
    expect(names('unseen')).toEqual(['M. soleus']);
  });

  it('„schwierig" nimmt nur die markierten', () => {
    expect(names('difficult')).toEqual(['M. gracilis']);
  });

  it('DIE DISTRAKTOREN BLEIBEN DER GANZE BESTAND — das ist der ganze Punkt', () => {
    /* Entscheidung vom 2026-07-13. Kaemen die falschen Antworten aus demselben Topf,
       braeuchte „nur falsch beantwortete" mindestens VIER Karten, um ueberhaupt eine
       Frage zu ergeben. Mit EINER geht es jetzt. */
    for (const scope of ['deck', 'wrong', 'unseen', 'difficult'] as QuizScope[]) {
      expect(pool(scope).distractors).toHaveLength(MUSCLES.length);
    }
  });

  it('EINE einzige Karte ergibt eine vollständige Frage mit vier Optionen', () => {
    const p = pool('wrong');
    expect(p.questions).toHaveLength(1);

    const fragen = generateQuizFrom(p.questions, p.distractors, 'innervation', 10, createRng(7));
    expect(fragen).toHaveLength(1);
    expect(fragen[0].options).toHaveLength(4);
    expect(new Set(fragen[0].options.map((o) => o.label)).size).toBe(4);
    // Gefragt wird die eine Karte, geantwortet wird aus dem ganzen Bestand.
    expect(fragen[0].muscleId).toBe(p.questions[0].id);
  });

  it('der Bereichsfilter grenzt BEIDE Töpfe ein — ein Fußmuskel als falsche Antwort wäre albern', () => {
    const p = pool('deck', DECK, ['upper']);
    expect(p.distractors.every((m) => m.region === 'upper')).toBe(true);
    expect(p.questions.every((m) => m.region === 'upper')).toBe(true);
  });

  it('sagt, WARUM es keine Fragen gibt', () => {
    expect(pool('wrong', {}).blocker).toBe('emptyDeck');
    // Karten da, aber keine passt: niemand ist als schwierig markiert.
    expect(pool('difficult', { 'M. masseter': card() }).blocker).toBe('nothingMatches');
  });

  it('quizPoolSize zählt, was am Knopf steht', () => {
    expect(quizPoolSize({ muscles: MUSCLES, cards: DECK, scope: 'wrong' })).toBe(1);
    expect(quizPoolSize({ muscles: MUSCLES, cards: DECK, scope: 'deck' })).toBe(4);
  });
});

describe('ADR 0002: der bestehende Serien-Schlüssel bleibt BITGLEICH', () => {
  it('ohne Einschränkung exakt der bisherige Text', () => {
    expect(quizSeriesKey('innervation')).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
    expect(quizSeriesKey('image')).toBe('image::{"deckOnly":false,"regions":[],"subgroups":[]}');
    // Auch explizit mit scope „all" — die Vorgabe darf nichts veraendern.
    expect(quizSeriesKey('innervation', [], 'all')).toBe(quizSeriesKey('innervation'));
  });

  it('„nur mein Karteikasten" benutzt V1s eigenes Feld `deckOnly` — kein neues Format', () => {
    expect(quizSeriesKey('innervation', [], 'deck')).toBe(
      'innervation::{"deckOnly":true,"regions":[],"subgroups":[]}',
    );
  });

  it('die feineren Filter erzeugen einen ZUSÄTZLICHEN Schlüssel, keinen veränderten', () => {
    expect(quizSeriesKey('innervation', [], 'wrong')).toBe(
      'innervation::{"deckOnly":true,"regions":[],"subgroups":[],"filter":"wrong"}',
    );
    expect(quizSeriesKey('image', ['upper'], 'difficult')).toBe(
      'image::{"deckOnly":true,"regions":["upper"],"subgroups":[],"filter":"difficult"}',
    );
  });

  it('jeder Umfang hat seinen eigenen Schlüssel — eine Lückenrunde verschmutzt die Bilanz nicht', () => {
    const keys = (['all', 'deck', 'wrong', 'unseen', 'difficult'] as QuizScope[]).map((s) =>
      quizSeriesKey('innervation', [], s),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});

/* Der Karteikasten zaehlte 56, die Sitzung 53 — fuer denselben Kasten. Grund: `questions`
   lief ueber die 150 Muskeln, und fuenf `nameLatin` gibt es zweimal (Hand/Fuss). Eine Karte
   ist EIN Schluessel, also auch EINE Frage. */
describe('ein doppelter nameLatin ergibt EINE Frage, nicht zwei', () => {
  const ZWILLING = 'M. abductor digiti minimi'; // Hand UND Fuss

  it('zaehlt den Zwilling einmal — nicht zweimal', () => {
    const cards = { [ZWILLING]: card({ lastSeen: null }) };
    const p = quizPool({ muscles: MUSCLES, cards, regions: [], scope: 'deck' });

    expect(MUSCLES.filter((m) => m.nameLatin === ZWILLING)).toHaveLength(2); // die Falle
    expect(p.questions).toHaveLength(1);
    expect(quizPoolSize({ muscles: MUSCLES, cards, regions: [], scope: 'deck' })).toBe(1);
  });

  it('fragt nach dem Muskel, den die Karte auch rendert', () => {
    const cards = { [ZWILLING]: card({ lastSeen: null }) };
    const [frage] = quizPool({ muscles: MUSCLES, cards, regions: [], scope: 'deck' }).questions;

    expect(frage).toBe(getMuscleByLatinName(ZWILLING));
  });

  it('laesst die Distraktoren unangetastet — sie kommen aus dem ganzen Bestand (8b)', () => {
    const cards = { [ZWILLING]: card({ lastSeen: null }) };
    const p = quizPool({ muscles: MUSCLES, cards, regions: [], scope: 'deck' });

    expect(p.distractors).toHaveLength(MUSCLES.length);
    expect(p.blocker).toBeNull();
  });
});
