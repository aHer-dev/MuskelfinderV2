/* Quiz-Mix (Etappe 16, ADR 0014) — gegen den ECHTEN Bestand (CLAUDE.md, Pruef-Regel):
   Fixtures teilen sich nie ein Bild und haben nie ein leeres Feld, der Bestand schon. */
import { describe, expect, it } from 'vitest';
import { cardKey } from './card-key';
import { getJointGroups } from './joint-groups';
import { CARD_MUSCLES, getMuscleByCardKey, getMuscles } from './loader';
import { QUIZ_MODE_LABELS } from './mode-labels';
import { createRng } from './quiz';
import {
  baueQuizMix,
  formenFuer,
  FRAGEN_JE_KARTE,
  fragenFuerKarte,
  isLernform,
  LERNFORM_LABELS,
  MIX_FORMEN,
  quizFragenAnzahl,
  quizPortion,
  type MixForm,
  type QuizPlatz,
} from './quiz-mix';
import { newCard } from '../persistence/leitner';
import type { FlashcardCard } from '../persistence/types';

const ALLE_KARTEN = CARD_MUSCLES.map((m) => cardKey(m));

/** Frische Karten (Fach 1) — oder in einem vorgegebenen Fach. */
function kasten(names: readonly string[], fach = 1): Record<string, FlashcardCard> {
  return Object.fromEntries(names.map((n) => [n, { ...newCard(), fach }]));
}

/** Frageart je Quiz-Platz, in der Reihenfolge der Sitzung. */
function formen(plan: readonly QuizPlatz[]): MixForm[] {
  return plan.filter((p) => p.frage).map((p) => p.frage!.concreteMode as MixForm);
}

const plaetzeVon = (plan: readonly QuizPlatz[], name: string) => plan.filter((p) => p.name === name);

describe('Quiz-Mix — jede Karte kommt zweimal, in zwei verschiedenen Arten (echter Bestand)', () => {
  const plan = baueQuizMix({ names: ALLE_KARTEN, cards: kasten(ALLE_KARTEN), rng: createRng(7) });

  it('jede der 148 Karten steht genau FRAGEN_JE_KARTE-mal in der Sitzung, jedes Mal mit Frage', () => {
    expect(FRAGEN_JE_KARTE).toBe(2); // die Hinweistexte sagen „zweimal" und „beide"
    expect(plan).toHaveLength(ALLE_KARTEN.length * FRAGEN_JE_KARTE);
    for (const name of ALLE_KARTEN) {
      const plaetze = plaetzeVon(plan, name);
      expect(plaetze, name).toHaveLength(FRAGEN_JE_KARTE);
      expect(plaetze.every((p) => p.frage !== null), name).toBe(true);
    }
  });

  it('die zwei Fragen zu einem Muskel fragen ihn in zwei VERSCHIEDENEN Arten', () => {
    /* Zweimal dieselbe Art hiesse zweimal Wiedererkennen desselben Merkmals — genau das, was
       die Regel „zweimal richtig" ausgleichen soll. */
    for (const name of ALLE_KARTEN) {
      const arten = plaetzeVon(plan, name).map((p) => p.frage!.concreteMode);
      expect(new Set(arten).size, `${name}: ${arten.join(', ')}`).toBe(FRAGEN_JE_KARTE);
    }
  });

  it('Runde 1 geht die Warteschlange durch, Runde 2 wiederholt sie — mit einer ganzen Runde Abstand', () => {
    expect(plan.slice(0, ALLE_KARTEN.length).map((p) => p.name)).toEqual(ALLE_KARTEN);
    expect(plan.slice(ALLE_KARTEN.length).map((p) => p.name)).toEqual(ALLE_KARTEN);
  });

  it('jede Frage fragt den Muskel ihrer KARTE ab (ADR 0012 — nicht den gleichnamigen Zwilling)', () => {
    for (const platz of plan) {
      expect(platz.frage!.muscleId, platz.name).toBe(getMuscleByCardKey(platz.name)?.id);
    }
  });

  it('vier verschiedene Optionen, genau eine davon richtig', () => {
    for (const { name, frage } of plan) {
      expect(frage!.options, name).toHaveLength(4);
      const signaturen = frage!.options.map((o) => o.imageUrl ?? o.label);
      expect(new Set(signaturen).size, name).toBe(4);
      expect(frage!.options.some((o) => o.id === frage!.correctId), name).toBe(true);
    }
  });

  it('die Kategorie nennt die konkrete Frageart — mit dem Namen aus mode-labels.ts', () => {
    for (const { frage } of plan) {
      expect(frage!.category).toBe(QUIZ_MODE_LABELS[frage!.concreteMode]);
    }
  });

  it('ein Muskel ohne Bild bekommt nie eine Bildfrage', () => {
    for (const { name, frage } of plan) {
      if (getMuscleByCardKey(name)!.images.length > 0) continue;
      expect(['image', 'name-image'], name).not.toContain(frage!.concreteMode);
    }
  });
});

describe('Quiz-Mix — die Fragearten sind durchmischt', () => {
  it('über den ganzen Kasten kommt jede der sieben Arten vor, keine überwiegt', () => {
    const plan = baueQuizMix({ names: ALLE_KARTEN, cards: kasten(ALLE_KARTEN), rng: createRng(3) });
    const zaehler = new Map<MixForm, number>();
    for (const form of formen(plan)) zaehler.set(form, (zaehler.get(form) ?? 0) + 1);

    expect([...zaehler.keys()].sort()).toEqual([...MIX_FORMEN].sort());
    /* Gleichverteilt waeren 296/7 ≈ 42 je Art. Der erste Wurf (die Warteschlange nur von vorn
       nach hinten verteilen) kam gemessen auf Bildfragen 15-mal, alles andere 24-mal (bei
       einer Frage je Karte): Die Muskeln ohne Bild stehen im Bestand am Ende, und danach holte
       niemand mehr auf. */
    const werte = [...zaehler.values()];
    expect(Math.max(...werte) - Math.min(...werte)).toBeLessThanOrEqual(2);
  });

  it('nie zweimal dieselbe Frageart hintereinander', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const plan = baueQuizMix({ names: ALLE_KARTEN, cards: kasten(ALLE_KARTEN), rng: createRng(seed) });
      const folge = formen(plan);
      for (let i = 1; i < folge.length; i++) {
        expect(folge[i], `Seed ${seed}, Position ${i}`).not.toBe(folge[i - 1]);
      }
    }
  });

  it('eine echte Tagesportion (je Gelenkgruppe, höchstens 20 Karten) mischt mindestens fünf Arten', () => {
    /* Die Gelenkgruppen sind die Portionen, mit denen der Kasten wirklich gefuellt wird —
       „Mimik & Kopf" hat fast keine Bilder, die Hand fast nur. Beides muss mischen. */
    for (const gruppe of getJointGroups()) {
      const portion = gruppe.muscles.slice(0, 20);
      const plan = baueQuizMix({ names: portion, cards: kasten(portion), rng: createRng(11) });
      expect(new Set(formen(plan)).size, gruppe.label).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('Quiz-Mix — Fach 7 bleibt Freitext (ADR 0008)', () => {
  it('eine Karte im letzten Fach steht EINMAL da, ohne Frage — die Sitzung zeigt sie als Lernkarte', () => {
    const names = ALLE_KARTEN.slice(0, 6);
    const cards = { ...kasten(names.slice(0, 3), 6), ...kasten(names.slice(3), 7) };
    const plan = baueQuizMix({ names, cards, rng: createRng(1) });

    for (const name of names.slice(3)) {
      expect(plaetzeVon(plan, name), name).toEqual([{ name, frage: null }]);
    }
    for (const name of names.slice(0, 3)) {
      expect(plaetzeVon(plan, name), name).toHaveLength(FRAGEN_JE_KARTE);
    }
    // Die Lernkarten stehen in Runde 1 an ihrem Platz in der Warteschlange.
    expect(plan.slice(0, names.length).map((p) => p.name)).toEqual(names);
  });

  it('eine Karte ohne Muskel (unbekannter Schlüssel) hält die Sitzung nicht auf', () => {
    const names = ['M. gibtsnicht', ALLE_KARTEN[0]];
    const plan = baueQuizMix({ names, cards: kasten(names), rng: createRng(1) });
    expect(plaetzeVon(plan, 'M. gibtsnicht')).toEqual([{ name: 'M. gibtsnicht', frage: null }]);
    expect(plaetzeVon(plan, ALLE_KARTEN[0])).toHaveLength(FRAGEN_JE_KARTE);
  });
});

describe('Quiz-Mix — Regeln am Rand', () => {
  it('deterministisch mit demselben Zufall', () => {
    const a = baueQuizMix({ names: ALLE_KARTEN.slice(0, 20), cards: kasten(ALLE_KARTEN), rng: createRng(5) });
    const b = baueQuizMix({ names: ALLE_KARTEN.slice(0, 20), cards: kasten(ALLE_KARTEN), rng: createRng(5) });
    expect(a).toEqual(b);
  });

  it('die falschen Antworten kommen aus dem ganzen Bestand — schon EINE Karte ergibt ihre Fragen (8b)', () => {
    const eine = [cardKey(getMuscles()[0])];
    const plan = baueQuizMix({ names: eine, cards: kasten(eine), rng: createRng(2) });
    expect(plan).toHaveLength(FRAGEN_JE_KARTE);
    for (const { frage } of plan) expect(frage!.options).toHaveLength(4);
  });

  it('ohne Funktionstext keine Funktionsfrage — in KEINER Richtung', () => {
    /* „Funktion → Muskel" galt bis Etappe 16 fuer jeden Muskel als tauglich; der Fragetext
       waere dann leer gewesen. Im heutigen Bestand hat jeder Muskel eine Funktion — die Regel
       muss trotzdem stehen, sonst stellt der Mix beim ersten Neuzugang eine leere Frage. */
    const ohne = { ...getMuscles()[0], functionDescription: '', funktionKurz: undefined };
    expect(formenFuer(ohne)).not.toContain('function-to-muscle');
    expect(formenFuer(ohne)).not.toContain('muscle-to-function');
    expect(formenFuer(getMuscles()[0])).toContain('function-to-muscle');
  });

  it('die Lernformen haben einen Namen und eine Prüfung für fremde Werte', () => {
    expect(LERNFORM_LABELS).toEqual({ karten: 'Karteikarten', quiz: 'Quiz-Mix' });
    expect(isLernform('quiz')).toBe(true);
    expect(isLernform('toString')).toBe(false);
    expect(isLernform(undefined)).toBe(false);
  });
});

describe('Quiz-Mix — die Portion misst Antworten, nicht Karten', () => {
  /* „20" heisst in beiden Lernformen 20 Antworten (Projektinhaber, 2026-09-28). Eine Quiz-Karte
     kostet zwei, eine Karte in Fach 7 eine (Freitext, ADR 0008). */
  const frisch = ALLE_KARTEN.slice(0, 30);

  it('Budget 20 über frische Karten: die obersten 10, in ihrer Reihenfolge', () => {
    expect(quizPortion(frisch, kasten(frisch), 20)).toEqual(frisch.slice(0, 10));
  });

  it('Budget 0 heißt alle — wie „Alle fälligen" bei den Lernkarten', () => {
    expect(quizPortion(frisch, kasten(frisch), 0)).toEqual(frisch);
  });

  it('eine Karte in Fach 7 kostet eine Antwort, die anderen zwei', () => {
    const [a, b, c] = frisch;
    const cards = { ...kasten([a, b]), ...kasten([c], 7) };
    expect(fragenFuerKarte(a, cards)).toBe(FRAGEN_JE_KARTE);
    expect(fragenFuerKarte(c, cards)).toBe(1);
    expect(quizPortion([c, a, b], cards, 5)).toEqual([c, a, b]);
  });

  it('von vorn und ohne Lücke — keine billigere Karte von weiter hinten wird vorgezogen', () => {
    /* Die Reihenfolge ist die Priorisierung des Tagesplans (7a). Passt die naechste Karte nicht
       mehr, endet die Portion — sonst kaeme eine weniger dringende Karte vor einer dringenden. */
    const [a, b, c] = frisch;
    const cards = { ...kasten([a, b]), ...kasten([c], 7) };
    expect(quizPortion([a, b, c], cards, 3)).toEqual([a]);
  });

  it('mindestens eine Karte, auch wenn das Budget kleiner ist als ihre Fragen', () => {
    expect(quizPortion(frisch, kasten(frisch), 1)).toEqual([frisch[0]]);
  });

  it('die Zahl am Knopf ist genau die Zahl der Plätze, die die Sitzung stellt', () => {
    /* `quizFragenAnzahl` steht auf dem Knopf, `baueQuizMix` baut die Sitzung — zwei Wege zur
       selben Zahl, und hier wird geprueft, dass sie nicht auseinanderlaufen. */
    const gemischt = { ...kasten(frisch), ...kasten(frisch.slice(0, 8), 7) };
    const portion = quizPortion(frisch, gemischt, 20);
    expect(quizFragenAnzahl(portion, gemischt)).toBe(
      baueQuizMix({ names: portion, cards: gemischt, rng: createRng(4) }).length,
    );
    expect(quizFragenAnzahl(portion, gemischt)).toBe(20);
  });
});
