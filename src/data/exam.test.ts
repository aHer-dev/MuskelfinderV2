import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildExam,
  examDuration,
  gradeExam,
  EXAM_SIZE,
  MIN_EXAM_CARDS,
  SECONDS_PER_ITEM,
  type ExamItem,
} from './exam';
import { getMuscles } from './loader';
import { createRng, quizSeriesKey } from './quiz';

const MUSCLES = getMuscles();
const DECK = MUSCLES.slice(0, 40).map((m) => m.nameLatin);

function exam(deck: readonly string[] = DECK, count = EXAM_SIZE, seed = 11) {
  return buildExam({ muscles: MUSCLES, deck, count, rng: createRng(seed) });
}

/** Alles richtig beantworten — die Gegenprobe zu „alles falsch". */
function allCorrect(items: readonly ExamItem[]): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const item of items) {
    answers[item.id] =
      item.kind === 'recall' ? item.nameLatin : item.question.correctId;
  }
  return answers;
}

describe('buildExam — das Set', () => {
  it('fragt nur Muskeln aus dem Kasten ab', () => {
    const deck = MUSCLES.slice(0, 8).map((m) => m.nameLatin);
    for (const item of exam(deck).items) {
      expect(deck).toContain(item.nameLatin);
    }
  });

  it('zieht die Distraktoren aus dem GANZEN Bestand, nicht nur aus dem Kasten', () => {
    /* Ein Kasten mit 6 Karten böte sonst immer dieselben 4 Optionen — die Frage wäre
       nach zwei Runden auswendig gelernt. */
    const deck = MUSCLES.slice(0, 6).map((m) => m.nameLatin);
    const choices = exam(deck).items.filter((i) => i.kind === 'choice');
    expect(choices.length).toBeGreaterThan(0);

    const fremd = choices.some((item) =>
      item.kind === 'choice' &&
      item.question.options.some((o) => o.muscleId && !deck.includes(o.label) && o.id !== item.question.correctId),
    );
    expect(fremd).toBe(true);
  });

  it('mischt die Abrufformen — Freitext ist dabei die häufigste (E1)', () => {
    const { items } = exam();
    const recall = items.filter((i) => i.kind === 'recall');
    const choice = items.filter((i) => i.kind === 'choice');

    expect(recall.length).toBeGreaterThan(0);
    expect(choice.length).toBeGreaterThan(0);
    // Trainiert wird der freie Abruf; MC ist die Einstiegsstufe, nicht das Ziel.
    expect(recall.length / items.length).toBeGreaterThanOrEqual(0.3);
  });

  it('jede MC-Frage hat vier verschiedene Optionen', () => {
    for (const item of exam().items) {
      if (item.kind !== 'choice') continue;
      expect(item.question.options).toHaveLength(4);
      expect(new Set(item.question.options.map((o) => o.label)).size).toBe(4);
    }
  });

  it('stellt keine Bildfrage ohne Bild', () => {
    for (const item of exam().items) {
      if (item.kind === 'choice' && item.form === 'image') {
        expect(item.question.imageUrl).toBeTruthy();
      }
    }
  });

  it('blockt einen leeren Kasten — statt eine Prüfung über nichts zu bauen', () => {
    expect(exam([])).toEqual({ items: [], blocker: 'emptyDeck' });
  });

  it('blockt einen zu kleinen Kasten (sonst misst die Prüfung Zufall)', () => {
    const deck = MUSCLES.slice(0, MIN_EXAM_CARDS - 1).map((m) => m.nameLatin);
    expect(exam(deck).blocker).toBe('tooFewCards');
  });

  it('ist deterministisch bei gleichem Seed', () => {
    expect(exam(DECK, 10, 42)).toEqual(exam(DECK, 10, 42));
  });

  it('eine Minute pro Frage', () => {
    expect(examDuration(20)).toBe(20 * SECONDS_PER_ITEM);
  });
});

describe('gradeExam — die Auswertung', () => {
  it('zählt alles Richtige als richtig', () => {
    const { items } = exam();
    const report = gradeExam({ items, answers: allCorrect(items), muscles: MUSCLES });

    expect(report.correct).toBe(items.length);
    expect(report.missed).toEqual([]);
    expect(report.missedNames).toEqual([]);
  });

  it('sammelt die verpassten Muskeln — GENAU die, nicht mehr', () => {
    const { items } = exam();
    const answers = allCorrect(items);

    // Die ersten drei absichtlich versemmeln.
    const versemmelt = items.slice(0, 3);
    for (const item of versemmelt) {
      answers[item.id] =
        item.kind === 'recall'
          ? 'völliger unsinn'
          : item.question.options.find((o) => o.id !== item.question.correctId)!.id;
    }

    const report = gradeExam({ items, answers, muscles: MUSCLES });
    expect(report.missedNames.sort()).toEqual(versemmelt.map((i) => i.nameLatin).sort());
    expect(report.correct).toBe(items.length - 3);
  });

  it('unbeantwortet ist nicht falsch — es wird nur nicht mitgezählt', () => {
    /* Abbrechen verliert nichts: Ausgewertet wird, was beantwortet wurde. Eine
       übersprungene Frage landet NICHT im Karteikasten — man weiß ja nicht, warum. */
    const { items } = exam();
    const answers = allCorrect(items);
    delete answers[items[0].id];

    const report = gradeExam({ items, answers, muscles: MUSCLES });
    expect(report.total).toBe(items.length);
    expect(report.answered).toBe(items.length - 1);
    expect(report.missedNames).toEqual([]);
    expect(report.outcomes[0].answered).toBe(false);
  });

  it('ein Tippfehler im Freitext zählt als richtig, wird aber korrigiert', () => {
    const target = MUSCLES.find((m) => m.nameLatin === 'M. deltoideus');
    expect(target).toBeDefined();

    const items: ExamItem[] = [
      { kind: 'recall', id: 'e0', form: 'recall', muscleId: target!.id, nameLatin: target!.nameLatin },
    ];
    const report = gradeExam({ items, answers: { e0: 'M. deltoideos' }, muscles: MUSCLES });

    expect(report.correct).toBe(1);
    expect(report.outcomes[0].check?.verdict).toBe('almost');
    expect(report.outcomes[0].check?.matched).toBe('M. deltoideus');
  });

  it('DER FREITEXT PRÜFT MIT KORPUS — ein fremder Muskel geht nicht als Tippfehler durch', () => {
    /* Die Falle aus 8a: Ohne den Korpus misst `checkAnswer` nur gegen das Ziel und
       winkt „mylohyoideus" als Vertipper von „stylohyoideus" durch. Rund um das
       Zungenbein liegen sieben Namen im Abstand von zwei Zeichen. */
    const target = MUSCLES.find((m) => m.nameLatin === 'M. stylohyoideus');
    expect(target, 'Fixture-Muskel fehlt').toBeDefined();

    const items: ExamItem[] = [
      { kind: 'recall', id: 'e0', form: 'recall', muscleId: target!.id, nameLatin: target!.nameLatin },
    ];
    const report = gradeExam({ items, answers: { e0: 'M. mylohyoideus' }, muscles: MUSCLES });

    expect(report.correct).toBe(0);
    expect(report.missedNames).toEqual(['M. stylohyoideus']);
  });

  it('gliedert nach Region und Abrufform, schwächste zuerst', () => {
    const { items } = exam();
    const answers = allCorrect(items);
    for (const item of items.slice(0, 4)) {
      answers[item.id] =
        item.kind === 'recall'
          ? 'unsinn'
          : item.question.options.find((o) => o.id !== item.question.correctId)!.id;
    }

    const report = gradeExam({ items, answers, muscles: MUSCLES });

    expect(report.byRegion.length).toBeGreaterThan(0);
    expect(report.byForm.length).toBeGreaterThan(0);

    const quote = (t: { answered: number; correct: number }) => t.correct / t.answered;
    for (const list of [report.byRegion, report.byForm]) {
      for (let i = 1; i < list.length; i++) {
        expect(quote(list[i - 1].tally)).toBeLessThanOrEqual(quote(list[i].tally));
      }
    }
  });

  it('erklärt eine falsche MC-Antwort, statt sie nur zu zählen (7e)', () => {
    const { items } = exam();
    const choice = items.find((i) => i.kind === 'choice');
    expect(choice).toBeDefined();

    const falsch = choice!.kind === 'choice'
      ? choice!.question.options.find((o) => o.id !== choice!.question.correctId)!
      : null;

    const report = gradeExam({
      items: [choice!],
      answers: { [choice!.id]: falsch!.id },
      muscles: MUSCLES,
    });

    expect(report.outcomes[0].explanation?.text).toBeTruthy();
  });
});

/**
 * Nur der Code, ohne Kommentare. Die Warnungen in diesen Dateien NENNEN die verbotenen
 * Namen ausdrücklich („kennt useQuizStore nicht") — ein roher Substring-Test würde an
 * der eigenen Dokumentation scheitern und wäre damit wertlos.
 */
function codeOf(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
}

describe('ADR 0002: die Prüfung fasst die Quizserien nicht an', () => {
  it('der V1-Serien-Schlüssel bleibt bitgleich', () => {
    expect(quizSeriesKey('innervation')).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
    expect(quizSeriesKey('image')).toBe('image::{"deckOnly":false,"regions":[],"subgroups":[]}');
  });

  it('KEINE PRÜFUNG SCHREIBT IN EINE QUIZSERIE', () => {
    /* Die zentrale Falle aus dem Briefing, als Test statt als Kommentar: Wer die
       Prüfung bequem auf `useQuizGame` aufsetzt, kippt jedes Ergebnis still in die
       normale Quiz-Bilanz — und verfälscht die Zahl, aus der die Statistik (8c) den
       „schwächster Modus"-Knopf ableitet. */
    expect(codeOf('src/data/exam.ts')).not.toMatch(/useQuizStore|commitRound|quizSeriesKey/);
    expect(codeOf('src/store/useExamStore.ts')).not.toMatch(/useQuizStore|commitRound/);
    expect(codeOf('src/pages/ExamPage.tsx')).not.toMatch(/useQuizGame|commitRound/);
  });

  it('der Prüfungs-Store ist nicht persistiert — eine Prüfung überlebt keinen Neustart', () => {
    expect(codeOf('src/store/useExamStore.ts')).not.toMatch(/\bpersist\b|zustand\/middleware/);
  });
});
