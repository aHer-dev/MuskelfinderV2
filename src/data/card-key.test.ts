import { describe, expect, it } from 'vitest';
import {
  CARD_KEY_MARK,
  CardKeyError,
  OWN_CARD,
  assertCardKeys,
  cardKey,
} from './card-key';
import { CARD_MUSCLES, getMuscleByCardKey, getMuscles, hasNameTwin } from './loader';
import { checkAnswer } from './answer-check';
import type { Muscle } from '../types';

/* Gegen den ECHTEN Bestand (AGENTS.md): Die Ausnahmeliste ist eine Behauptung ÜBER die
   Daten. Ein Fixture wäre per Konstruktion passend und verstecke genau den Fall, den diese
   Datei fangen soll. Nur die Gegenproben unten bauen synthetische Muskeln — sie prüfen
   Bestände, die es (noch) nicht gibt. */

/** Minimal-Muskel für die Gegenproben — nur die Felder, die `cardKey` liest. */
function muskel(nameLatin: string, subregion: string, id = `${nameLatin}-${subregion}`): Muscle {
  return { id, nameLatin, subregion } as Muscle;
}

const HAND = 'M. abductor digiti minimi';

describe('cardKey — Schlüssel und Anzeigename sind zwei Dinge', () => {
  it('für 145 Muskeln sind beide gleich', () => {
    const abweichend = getMuscles().filter((m) => cardKey(m) !== m.nameLatin);
    expect(abweichend.map((m) => m.nameLatin).sort()).toEqual(
      OWN_CARD.map((e) => e.nameLatin).sort(),
    );
  });

  it('der FUSS behält den historischen Schlüssel — daran hängt der Backup-Vertrag', () => {
    /* ADR 0002 §1 friert das Backup-Format ein. Jede Karte, die je unter
       „M. abductor digiti minimi" angelegt wurde, zeigt den Fußmuskel — auch in V1, das
       noch live ist. Bekäme der Fuß den Zusatz, müssten bestehende Schlüssel beim Import
       umgeschrieben werden. So ist der Import byte-gleich und die Handkarte rein additiv.
       Fällt dieser Test, verlieren Bestandsnutzer beim nächsten Import drei Karten. */
    const alt = getMuscleByCardKey(HAND);
    expect(alt?.subregion).toBe('Fuß & Sprunggelenk');
    expect(alt?.region).toBe('lower');
  });

  it('der HANDmuskel ist über Karten erreichbar und trägt Hand-Fakten', () => {
    /* Der Kern von ADR 0012. Vorher löste sein Name auf den Fuß auf: Wer „Hand" lernte,
       bekam drei Karten mit Kleinzehen-Fakten, und der Handmuskel war gar nicht lernbar. */
    const neu = getMuscleByCardKey(`${HAND}${CARD_KEY_MARK}manus`);
    expect(neu?.subregion).toBe('Hand & Finger');
    expect(neu?.region).toBe('upper');
    expect(neu?.nameLatin).toBe(HAND); // der ANZEIGENAME bleibt unangetastet
  });

  it('jeder Kartenschlüssel löst auf genau einen Muskel auf und zurück', () => {
    for (const muscle of CARD_MUSCLES) {
      expect(getMuscleByCardKey(cardKey(muscle))).toBe(muscle);
    }
    const keys = CARD_MUSCLES.map((m) => cardKey(m));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('Der Zusatz darf NIE in einen Anzeigenamen geraten', () => {
  it('kein `nameLatin` im Bestand trägt das Trennzeichen', () => {
    expect(getMuscles().filter((m) => m.nameLatin.includes(CARD_KEY_MARK))).toEqual([]);
  });

  it('der Zusatz ist keine akzeptierte Antwort — deshalb ist er keine Klammer', () => {
    /* Gemessen 2026-07-26: `acceptedForms` liest einen Klammerzusatz als SYNONYM
       („M. fibularis longus (M. peroneus longus)"). Ein Schlüssel
       „M. abductor digiti minimi (Hand)" im Anzeigefeld hätte in Fach 7 die Eingabe
       **„Hand"** als richtig gewertet — ein Punkt fürs Raten des Körperteils.
       Mit `#` als Trennzeichen ist der Zusatz kein Namensbestandteil. */
    const hand = getMuscleByCardKey(`${HAND}${CARD_KEY_MARK}manus`)!;
    expect(checkAnswer('manus', hand).verdict).toBe('wrong');
    expect(checkAnswer('Hand', hand).verdict).toBe('wrong');
    expect(checkAnswer(HAND, hand).verdict).toBe('correct');
  });

  it('kein Zusatz ist ein Klammerausdruck', () => {
    /* Nicht der NAME darf keine Klammer tragen — „M. fibularis longus (M. peroneus longus)"
       ist ein echtes Synonympaar und soll genau so gelesen werden. Verboten ist die Klammer
       im ZUSATZ, den `cardKey` anhängt: Sie würde aus dem Schlüsselteil ein Synonym machen. */
    for (const entry of OWN_CARD) {
      expect(entry.qualifier, `Zusatz „${entry.qualifier}"`).not.toMatch(/[()]/);
    }
  });
});

describe('hasNameTwin — wer in einer Liste steht, muss unterscheidbar sein', () => {
  it('markiert genau die drei Namen, die es zweimal als Karte gibt', () => {
    const zwillinge = [...new Set(CARD_MUSCLES.filter(hasNameTwin).map((m) => m.nameLatin))];
    expect(zwillinge.sort()).toEqual([
      'M. abductor digiti minimi',
      'M. flexor digiti minimi brevis',
      'M. opponens digiti minimi',
    ]);
  });

  it('markiert NICHT die Funktionszeilen-Paare — die sind nur EINE Karte', () => {
    for (const name of ['M. nasalis', 'M. occipitofrontalis']) {
      const muskeln = CARD_MUSCLES.filter((m) => m.nameLatin === name);
      expect(muskeln, `${name} ist eine Karte`).toHaveLength(1);
      expect(hasNameTwin(muskeln[0])).toBe(false);
    }
  });
});

describe('assertCardKeys — die Ausnahmeliste kann nicht still veralten', () => {
  it('der echte Bestand geht durch', () => {
    expect(() => assertCardKeys(getMuscles())).not.toThrow();
  });

  it('ein NEUES Hand/Fuß-Paar ohne Eintrag lässt den Start scheitern', () => {
    /* Der eigentliche Zweck dieser Prüfung. Ohne sie verschluckt der Namensindex den
       zweiten Muskel still — genau die Vergangenheit, die ADR 0012 beendet. */
    expect(() =>
      assertCardKeys([
        muskel('M. interosseus', 'Hand & Finger'),
        muskel('M. interosseus', 'Fuß & Sprunggelenk'),
      ]),
    ).toThrow(CardKeyError);
  });

  it('ein Eintrag, der einen Funktionszeilen-Zwilling aufspaltet, ebenso', () => {
    /* Die andere Richtung: `M. nasalis` (Pars transversa / Pars alaris) ist EIN Muskel.
       Wer ihn in zwei Karten zerlegt, lässt Studierende denselben Muskel zweimal lernen. */
    expect(() =>
      assertCardKeys([
        muskel(OWN_CARD[0].nameLatin, OWN_CARD[0].subregion, 'a'),
        muskel(OWN_CARD[0].nameLatin, OWN_CARD[0].subregion, 'b'),
      ]),
    ).toThrow(CardKeyError);
  });

  it('ein Eintrag ohne passenden Muskel lässt den Start scheitern', () => {
    /* Ein Tippfehler in der Subregion erzeugt sonst keinen Fehler, sondern eine Ausnahme,
       die nie greift — und der Handmuskel wäre still wieder unlernbar. */
    expect(() => assertCardKeys([muskel('M. deltoideus', 'Schulter')])).toThrow(CardKeyError);
  });

  it('ein `nameLatin` mit Trennzeichen lässt den Start scheitern', () => {
    expect(() =>
      assertCardKeys([muskel(`M. irgendwas${CARD_KEY_MARK}manus`, 'Hand & Finger')]),
    ).toThrow(CardKeyError);
  });
});
