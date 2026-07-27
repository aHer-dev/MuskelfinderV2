import { describe, expect, it } from 'vitest';
import {
  JOINT_GROUP_DEFS,
  getJointGroup,
  getJointGroups,
  neueKarten,
  neueKartenDerAuswahl,
  orderedJointGroups,
} from './joint-groups';
import { CARD_MUSCLES, getMuscleByCardKey, getMuscles } from './loader';
import { cardKey } from './card-key';
import { PROFESSIONS } from './profession';

/* Gegen den ECHTEN Bestand, nicht gegen Fixtures (AGENTS.md): Eine Gruppendefinition ist eine
   Behauptung ÜBER die Daten — ein Fixture wäre per Konstruktion passend und verstecke genau
   den Tippfehler, den diese Tests fangen sollen. */

describe('Gelenkgruppen — Abdeckung', () => {
  it('JEDE Karte liegt in mindestens einer Gruppe', () => {
    /* Das ist die Invariante, die die Gruppenzahl bestimmt hat: Mit den ursprünglich
       gewünschten 9 Gruppen fielen 19 Karten heraus — darunter Zungenbein und Kehlkopf, also
       das Fachgebiet der Logopädie. Fällt dieser Test, ist ein Muskel über den Gelenk-Weg
       nicht mehr lernbar, und niemand würde es an der Oberfläche sehen. */
    const drin = new Set(getJointGroups().flatMap((g) => g.muscles));
    /* `cardKey`, NICHT `nameLatin`: Über den Anzeigenamen wäre dieser Test für die drei
       Handmuskeln vacuously grün — ihr Name steht ja über den Fußeintrag längst in `drin`,
       während ihre eigene Karte fehlen könnte, ohne dass es auffällt. */
    const ohneHeimat = CARD_MUSCLES.map((m) => cardKey(m)).filter((k) => !drin.has(k));
    expect(ohneHeimat).toEqual([]);
  });

  it('keine Gruppe ist leer', () => {
    for (const g of getJointGroups()) {
      expect(g.muscles.length, `Gruppe „${g.label}" ist leer`).toBeGreaterThan(0);
    }
  });

  it('jedes genannte Gelenk-Etikett kommt im Bestand wirklich vor', () => {
    /* Ein Tippfehler in einem Etikett („Art. cubitii") erzeugt keinen Fehler, sondern eine
       stillschweigend KLEINERE Gruppe. Genau das fällt sonst niemandem auf. */
    const echte = new Set(getMuscles().flatMap((m) => m.joints));
    const tote = JOINT_GROUP_DEFS.flatMap((g) =>
      g.joints.filter((j) => !echte.has(j)).map((j) => `${g.id}: ${j}`),
    );
    expect(tote).toEqual([]);
  });

  it('jede genannte Subregion kommt im Bestand wirklich vor', () => {
    const echte = new Set(getMuscles().map((m) => m.subregion));
    const tote = JOINT_GROUP_DEFS.flatMap((g) =>
      g.subregions.filter((s) => !echte.has(s)).map((s) => `${g.id}: ${s}`),
    );
    expect(tote).toEqual([]);
  });

  it('die Kennungen sind eindeutig', () => {
    const ids = JOINT_GROUP_DEFS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Gelenkgruppen — Zuschnitt', () => {
  it('jede Gruppe passt in eine überschaubare Zahl von Sitzungen', () => {
    /* Der Grund für die Gelenkgruppen: „Obere Extremität" legte 53 Karten an — mehr als das
       Anderhalbfache der Tagesdosis (20), also stufte `getTodayPlan` den frischen Kasten
       sofort als `backlog` ein. Bleibt eine Gruppe unter 30, passiert das nicht mehr. */
    for (const g of getJointGroups()) {
      expect(g.muscles.length, `„${g.label}" ist mit ${g.muscles.length} Karten zu groß`).toBeLessThan(30);
    }
  });

  it('ein Muskel darf in mehreren Gruppen liegen — M. biceps brachii ist der Beleg', () => {
    /* Many-to-many, keine Partition (dieselbe Regel wie bei den funktionellen Gruppen, 9a).
       Der Biceps überspannt Ellenbogen UND Schultergelenk; wer ihn nur einmal einsortiert,
       macht eine der beiden Gruppen fachlich falsch. */
    const drin = getJointGroups()
      .filter((g) => g.muscles.includes('M. biceps brachii'))
      .map((g) => g.id);
    expect(drin).toContain('ellenbogen');
    expect(drin).toContain('schultergelenk');
  });

  it('die tiefen Rückenmuskeln liegen an der Wirbelsäule, NICHT im Gesicht', () => {
    /* Die Falle, die diese Datei fast gekostet hätte: Das Gelenk-Etikett `Kopf` klingt nach
       Kopfmuskulatur, trägt aber `M. semispinalis`, `Mm. longissimi` und `Mm. splenii` —
       Nackenstrecker. Wer `Kopf` naiv zu „Mimik & Kopf" nimmt, legt sie ins Gesicht. */
    const wirbel = getJointGroup('wirbelsaeule')!;
    const mimik = getJointGroup('mimik-kopf')!;
    for (const name of ['M. semispinalis', 'Mm. longissimi', 'Mm. splenii']) {
      expect(wirbel.muscles, `${name} gehört zur Wirbelsäule`).toContain(name);
      expect(mimik.muscles, `${name} gehört NICHT ins Gesicht`).not.toContain(name);
    }
  });

  it('M. psoas minor liegt an der Hüfte, nicht im Beckenboden', () => {
    /* Das Etikett `Becken` trägt der Psoas minor UND die vier Beckenbodenmuskeln. Darum
       kommt „Bauchwand & Beckenboden" über die Subregion, nicht über `Becken`. */
    expect(getJointGroup('hueftgelenk')!.muscles).toContain('M. psoas minor');
    expect(getJointGroup('bauchwand-beckenboden')!.muscles).not.toContain('M. psoas minor');
  });

  it('fängt auch die Muskeln ohne jedes Gelenk-Etikett', () => {
    /* `M. palmaris brevis` und `M. quadratus plantae` haben ein LEERES `joints`-Feld. Ohne
       den Subregion-Weg wären sie über Gelenkgruppen unerreichbar. */
    expect(getJointGroup('hand')!.muscles).toContain('M. palmaris brevis');
    expect(getJointGroup('sprunggelenk-fuss')!.muscles).toContain('M. quadratus plantae');
  });

  it('die Logopädie-Gruppe trägt Zungenbein UND Kehlkopf', () => {
    const g = getJointGroup('zungenbein-kehlkopf')!;
    expect(g.muscles).toContain('M. sternohyoideus');
    expect(g.muscles).toContain('M. thyrohyoideus');
    expect(g.muscles.length).toBeGreaterThanOrEqual(6);
  });

  it('KEIN Eintrag zeigt Fakten eines anderen Körperteils', () => {
    /* Die harte Regel aus `isCardMuscle`: „Alles, was von Karten auf Muskeln schliesst, geht
       hier durch." Der erste Wurf dieser Datei lief über alle 150 Muskeln und schlüsselte nach
       ANZEIGENAME — und die Gruppe „Hand" enthielt dann `M. abductor digiti minimi`,
       `M. flexor digiti minimi brevis` und `M. opponens digiti minimi`, deren Schlüssel auf die
       FUSS-Muskeln auflösten. Ein Ergo, der „Hand" klickte, bekam drei Karten mit
       Kleinzehen-Fakten.

       Dieser Test vergleicht die Gruppe nicht mit dem Muskel, der ihre Bedingung erfüllt,
       sondern mit dem, den die KARTE rendert. Er ist die Prüfzeile für dieselbe Wurzel, an
       der `seedDeck` (ADR 0009), die Gruppe Hypothenar und die Kasten-Tabelle gestorben sind. */
    const falsch: string[] = [];
    for (const g of getJointGroups()) {
      for (const name of g.muscles) {
        const gerendert = getMuscleByCardKey(name);
        if (gerendert === undefined) {
          falsch.push(`${g.label}: „${name}" hat keinen Muskel-Datensatz`);
          continue;
        }
        const passt =
          g.subregions.includes(gerendert.subregion) ||
          gerendert.joints.some((j) => g.joints.includes(j));
        if (!passt) {
          falsch.push(`${g.label}: „${name}" rendert ${gerendert.subregion} (${gerendert.region})`);
        }
      }
    }
    expect(falsch).toEqual([]);
  });

  it('die drei Hand/Fuß-Doppelnamen liegen in BEIDEN Gruppen — jeder mit seinem Schlüssel', () => {
    /* Bis ADR 0012 hiess dieser Test „liegen NUR beim Fuß": Beide Namen lösten auf den
       Fussmuskel auf, also war der Handeintrag eine Lüge und musste raus — der Handmuskel
       war über Karten unlernbar. Jetzt trägt die Hand einen eigenen Kartenschlüssel und
       gehört wieder in ihre Gruppe.

       Geprüft wird nicht die Mitgliedschaft, sondern was der Schlüssel RENDERT. Ein Test
       auf den blossen Namen wäre hier vacuously gruen: `not.toContain('M. abductor digiti
       minimi')` stimmt auch dann noch, wenn „Hand" den Schlüssel `…#manus` gar nicht hat. */
    for (const name of [
      'M. abductor digiti minimi',
      'M. flexor digiti minimi brevis',
      'M. opponens digiti minimi',
    ]) {
      const hand = getJointGroup('hand')!.muscles.filter(
        (key) => getMuscleByCardKey(key)?.nameLatin === name,
      );
      const fuss = getJointGroup('sprunggelenk-fuss')!.muscles.filter(
        (key) => getMuscleByCardKey(key)?.nameLatin === name,
      );

      expect(hand, `„${name}" fehlt in „Hand"`).toHaveLength(1);
      expect(fuss, `„${name}" fehlt in „Sprunggelenk & Fuß"`).toHaveLength(1);
      expect(hand[0]).not.toBe(fuss[0]); // zwei Karten, nicht eine
      expect(getMuscleByCardKey(hand[0])!.subregion).toBe('Hand & Finger');
      expect(getMuscleByCardKey(fuss[0])!.subregion).toBe('Fuß & Sprunggelenk');
    }
  });

  it('Mitglieder sind nach Kartenschlüssel entdoppelt (ADR 0002 §2, ADR 0012)', () => {
    /* Ein Muskel kann über sein Gelenk UND über seine Subregion in dieselbe Gruppe passen.
       Ohne die Entdopplung verspräche der Knopf mehr Karten, als `addCards` anlegt. */
    for (const g of getJointGroups()) {
      expect(new Set(g.muscles).size, `„${g.label}" enthält Dubletten`).toBe(g.muscles.length);
    }
  });
});

describe('Gelenkgruppen — Vorsortierung nach Beruf', () => {
  it('sortiert, versteckt aber NICHTS', () => {
    /* Entscheidung 2026-07-26: Ein Ergo, der die Hüfte lernen will, soll sie nicht suchen
       müssen. Fällt dieser Test, ist eine Gruppe für einen Beruf unerreichbar geworden. */
    const alle = getJointGroups().length;
    for (const p of PROFESSIONS) {
      const { typisch, weitere } = orderedJointGroups(p);
      expect(typisch.length + weitere.length, `${p} erreicht nicht alle Gruppen`).toBe(alle);
      const ids = [...typisch, ...weitere].map((g) => g.id);
      expect(new Set(ids).size, `${p}: Gruppe doppelt`).toBe(alle);
    }
  });

  it('jeder Beruf bekommt sein eigenes Fach zuerst', () => {
    expect(orderedJointGroups('ergo').typisch[0].id).toBe('hand');
    expect(orderedJointGroups('physio').typisch[0].id).toBe('hueftgelenk');
    expect(orderedJointGroups('logo').typisch.map((g) => g.id)).toContain('zungenbein-kehlkopf');
  });

  it('ohne Profil gibt es keine Vorsortierung, nur die anatomische Ordnung', () => {
    const { typisch, weitere } = orderedJointGroups(null);
    expect(typisch).toEqual([]);
    expect(weitere.map((g) => g.id)).toEqual(JOINT_GROUP_DEFS.map((g) => g.id));
  });
});

describe('neueKarten — die Zahl am Knopf ist ein Versprechen', () => {
  it('zählt nur, was noch NICHT im Kasten liegt', () => {
    /* Weil Muskeln in mehreren Gruppen liegen, ist die Mitgliederzahl nach dem ersten Klick
       nicht mehr die Zahl der neuen Karten. „Ellenbogen 17" + „Schultergelenk 11" ergeben
       nicht 28 Karten — und ein Knopf, der 11 verspricht und 6 anlegt, lügt. */
    const ellenbogen = getJointGroup('ellenbogen')!;
    const schulter = getJointGroup('schultergelenk')!;

    expect(neueKarten(ellenbogen, {})).toBe(ellenbogen.muscles.length);

    // Nach dem Ellenbogen liegen die Zweigelenker schon im Kasten.
    const nachEllenbogen = Object.fromEntries(ellenbogen.muscles.map((n) => [n, {}]));
    const neu = neueKarten(schulter, nachEllenbogen);
    expect(neu).toBeLessThan(schulter.muscles.length);
    expect(neu).toBe(schulter.muscles.filter((n) => !ellenbogen.muscles.includes(n)).length);
  });

  it('eine vollständig vorhandene Gruppe legt 0 neue Karten an', () => {
    const g = getJointGroup('kniegelenk')!;
    expect(neueKarten(g, Object.fromEntries(g.muscles.map((n) => [n, {}])))).toBe(0);
  });
});

describe('neueKartenDerAuswahl — die Mehrfachwahl zählt die Vereinigung, nicht die Summe', () => {
  const ellenbogen = getJointGroup('ellenbogen')!;
  const schulter = getJointGroup('schultergelenk')!;
  const hand = getJointGroup('hand')!;

  it('addierte Einzelzahlen wären eine LÜGE — der Beleg steht in den echten Daten', () => {
    /* `M. biceps brachii` und das Caput longum des Triceps überspannen Ellenbogen UND
       Schultergelenk. Wer „17 + 11 = 28" an den Knopf schreibt, verspricht Karten, die
       `addCards` nie anlegt — genau der Fehler, den `neueKarten` für die Einzelwahl schon
       verhindert, nur eine Ebene höher. */
    const summe = neueKarten(ellenbogen, {}) + neueKarten(schulter, {});
    const vereinigung = neueKartenDerAuswahl([ellenbogen, schulter], {});

    expect(vereinigung.length).toBeLessThan(summe); // es gibt wirklich eine Überlappung
    expect(new Set(vereinigung).size).toBe(vereinigung.length);
    expect(vereinigung).toEqual(
      [...new Set([...ellenbogen.muscles, ...schulter.muscles])].sort((a, b) =>
        a.localeCompare(b, 'de'),
      ),
    );
  });

  it('liefert die Kartenschlüssel selbst, nicht nur ihre Zahl', () => {
    /* Die Leiste zeigt die Zahl UND legt die Karten an. Kämen Zahl und Nutzlast aus zwei
       getrennten Rechnungen, könnten sie auseinanderlaufen — dieselbe Wurzel wie bei
       `applyWrong`/`applyExamMiss` (ADR 0011). */
    const gewaehlt = neueKartenDerAuswahl([hand, ellenbogen], {});
    for (const key of [...hand.muscles, ...ellenbogen.muscles]) {
      expect(gewaehlt, `„${key}" fehlt in der Auswahl`).toContain(key);
    }
  });

  it('zieht ab, was schon im Kasten liegt — auch quer über die gewählten Gruppen', () => {
    const kasten = Object.fromEntries(ellenbogen.muscles.map((n) => [n, {}]));
    const neu = neueKartenDerAuswahl([ellenbogen, schulter], kasten);

    expect(neu).toEqual(
      schulter.muscles.filter((n) => !ellenbogen.muscles.includes(n)).sort((a, b) =>
        a.localeCompare(b, 'de'),
      ),
    );
  });

  it('ohne Auswahl ist nichts anzulegen', () => {
    expect(neueKartenDerAuswahl([], {})).toEqual([]);
  });
});
