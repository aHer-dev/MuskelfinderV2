import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  GroupDataError,
  getGroups,
  getGroupById,
  groupsOf,
  indexByMuscle,
  readGroups,
} from './groups';
import { getMuscles } from './loader';

const MUSCLES = getMuscles();
const NAMES = new Set(MUSCLES.map((m) => m.nameLatin));

describe('readGroups — die Validierung hat Zähne', () => {
  it('nimmt eine saubere Gruppe an', () => {
    const groups = readGroups(
      { gruppen: [{ id: 'g', label: 'G', muscles: ['M. supraspinatus'] }] },
      NAMES,
    );
    expect(groups).toEqual([{ id: 'g', label: 'G', muscles: ['M. supraspinatus'] }]);
  });

  it('LÄSST EINEN UNBEKANNTEN MUSKEL SCHEITERN — er verschwindet nicht still', () => {
    /* Der wichtigste Test der Datei: Ein Tippfehler in groups.json würde die Gruppe
       sonst still verkleinern. Eine unvollständige Rotatorenmanschette ist schlimmer
       als gar keine — und niemand würde es merken. */
    expect(() =>
      readGroups({ gruppen: [{ id: 'g', label: 'G', muscles: ['M. supraspinatuz'] }] }, NAMES),
    ).toThrow(GroupDataError);
  });

  it('lässt eine doppelte Gruppen-id scheitern', () => {
    expect(() =>
      readGroups({
        gruppen: [
          { id: 'g', label: 'A', muscles: [] },
          { id: 'g', label: 'B', muscles: [] },
        ],
      }),
    ).toThrow(GroupDataError);
  });

  it('lässt eine kaputte Gruppe scheitern, statt sie zu schlucken', () => {
    expect(() => readGroups({ gruppen: [{ id: 'g' }] })).toThrow(GroupDataError);
  });

  it('verträgt eine leere oder fehlende Datei', () => {
    expect(readGroups({})).toEqual([]);
    expect(readGroups(null)).toEqual([]);
    expect(readGroups({ gruppen: [] })).toEqual([]);
  });

  it('entfernt Namensdubletten innerhalb einer Gruppe (ADR 0002 §2)', () => {
    const [g] = readGroups({
      gruppen: [{ id: 'g', label: 'G', muscles: ['M. nasalis', 'M. nasalis'] }],
    });
    expect(g.muscles).toEqual(['M. nasalis']);
  });
});

describe('indexByMuscle — Many-to-Many, keine Partition', () => {
  it('ein Muskel kann in mehreren Gruppen stecken', () => {
    const index = indexByMuscle([
      { id: 'a', label: 'A', muscles: ['M. gracilis'] },
      { id: 'b', label: 'B', muscles: ['M. gracilis'] },
    ]);
    expect(index.get('M. gracilis')?.map((g) => g.id)).toEqual(['a', 'b']);
  });
});

describe('Der echte Gruppenbestand', () => {
  it('lädt und ist gegen den Muskelbestand geprüft', () => {
    expect(getGroups().length).toBe(14); // Abnahme 2026-07-13: 15 minus Hypothenar
  });

  it('jeder genannte Muskel existiert wirklich', () => {
    const fehlend = getGroups().flatMap((g) =>
      g.muscles.filter((n) => !NAMES.has(n)).map((n) => `${g.id}: ${n}`),
    );
    expect(fehlend).toEqual([]);
  });

  it('die Rotatorenmanschette ist vollständig und enthält nichts Fremdes', () => {
    expect(getGroupById('rotatorenmanschette')?.muscles.sort()).toEqual(
      [
        'M. infraspinatus',
        'M. subscapularis',
        'M. supraspinatus',
        'M. teres minor',
      ].sort(),
    );
  });

  it('ES GIBT KEINEN HYPOTHENAR — er ist mit nameLatin-Schlüsseln nicht darstellbar', () => {
    /* Drei seiner vier Mitglieder (abductor/flexor brevis/opponens digiti minimi) tragen
       einen nameLatin, den es ZWEIMAL gibt: Hand und Fuß. Karten sind nach nameLatin
       geschlüsselt (ADR 0002 §2), also lösen sie auf die FUSS-Muskeln auf — die
       Gruppenseite zeigte „Untere Extremität", und das Abzeichen „Hypothenar komplett"
       hätte man mit den Fußkarten verdient. Am 2026-07-13 entfernt. Nicht wieder anlegen. */
    expect(getGroupById('hypothenar')).toBeUndefined();

    const doppelt = ['M. abductor digiti minimi', 'M. flexor digiti minimi brevis', 'M. opponens digiti minimi'];
    for (const name of doppelt) {
      expect(groupsOf(name), `${name} ist mehrdeutig und darf in keiner Gruppe stehen`).toEqual([]);
    }
  });

  it('der Thenar bleibt — die pollicis-Namen sind eindeutig', () => {
    expect(getGroupById('thenar')?.muscles).toContain('M. adductor pollicis');
  });

  it('die Hüft-Adduktoren enthalten NICHT den M. adductor pollicis (Hand)', () => {
    expect(getGroupById('adduktoren-huefte')?.muscles).not.toContain('M. adductor pollicis');
  });

  it('ein Muskel ohne Gruppe ist kein Fehler', () => {
    expect(groupsOf('M. deltoideus')).toEqual([]);
    expect(groupsOf('gibt es nicht')).toEqual([]);
  });

  it('keine Gruppe ist leer oder ein Einzelmuskel mit Anhang', () => {
    /* Zwei ist das Minimum: Der M. triceps surae besteht nach der Abnahme vom
       2026-07-13 nur noch aus Gastrocnemius und Soleus (der M. plantaris steht in
       Klammern). Eine Gruppe mit zwei Mitgliedern taugt fuer Gruppenseite und
       Abzeichen — fuer eine 4-Optionen-Quizfrage nicht, sie wird dort uebersprungen. */
    for (const g of getGroups()) {
      expect(g.muscles.length, `${g.id} hat nur ${g.muscles.length} Muskeln`).toBeGreaterThanOrEqual(2);
    }
  });
});

/* ⚠️ Die Falle aus dem Rahmen-Briefing — als Test, nicht als Kommentar. */
describe('Die Gruppen überleben eine Neu-Migration', () => {
  it('liegen NICHT in src/data/generated/ (das schreibt migrate:data neu)', () => {
    const script = readFileSync('scripts/migrate-v1-data.mjs', 'utf8');
    expect(script).toContain('src/data/generated');
    expect(script).not.toContain('editorial');
    expect(() => readFileSync('src/data/editorial/groups.json', 'utf8')).not.toThrow();
  });
});

/* ── „In Klammern": mitgelernt, aber kein Mitglied (Abnahme 2026-07-13) ──── */

describe('related — was mitgelernt wird, ohne dazuzugehören', () => {
  it('liest die Klammer-Muskeln, hält sie aber aus `muscles` heraus', () => {
    const [g] = readGroups(
      {
        gruppen: [
          {
            id: 'g',
            label: 'G',
            muscles: ['M. rectus abdominis'],
            related: ['M. quadratus lumborum'],
          },
        ],
      },
      NAMES,
    );
    expect(g.muscles).toEqual(['M. rectus abdominis']);
    expect(g.related).toEqual(['M. quadratus lumborum']);
  });

  it('prüft auch die Klammer-Namen gegen den Bestand', () => {
    expect(() =>
      readGroups(
        { gruppen: [{ id: 'g', label: 'G', muscles: [], related: ['M. gibt-es-nicht'] }] },
        NAMES,
      ),
    ).toThrow(GroupDataError);
  });

  it('ein echtes Mitglied schlägt die Klammer — es steht nicht doppelt da', () => {
    const [g] = readGroups({
      gruppen: [
        { id: 'g', label: 'G', muscles: ['M. nasalis'], related: ['M. nasalis'] },
      ],
    });
    expect(g.muscles).toEqual(['M. nasalis']);
    expect(g.related).toBeUndefined();
  });

  it('KLAMMER-MUSKELN SIND KEINE MITGLIEDER — sonst wäre das Gruppen-Quiz falsch', () => {
    /* Der M. quadratus lumborum steht bei der Bauchwand in Klammern. Zählte er als
       Mitglied, wäre er im Quiz „Welcher gehört NICHT dazu?" plötzlich eine falsche
       Antwort — obwohl er fachlich sehr wohl NICHT dazugehört. */
    const bauchwand = getGroupById('bauchwand');
    expect(bauchwand?.muscles).not.toContain('M. quadratus lumborum');
    expect(bauchwand?.related).toContain('M. quadratus lumborum');
    expect(groupsOf('M. quadratus lumborum')).toEqual([]);
  });

  it('die Abnahme vom 2026-07-13 steckt in den echten Daten', () => {
    // Wade: ohne M. plantaris (er steht jetzt in Klammern).
    const wade = getGroupById('wade-oberflaechlich');
    expect(wade?.muscles.sort()).toEqual(['M. gastrocnemius', 'M. soleus']);
    expect(wade?.related).toEqual(['M. plantaris']);
  });
});

/* ── Die Wache gegen den Hypothenar-Fehler (2026-07-13) ─────────────────── */

describe('Kein mehrdeutiger Name darf eine Gruppe verfälschen', () => {
  it('ein doppelt vergebener nameLatin ist nur erlaubt, wenn BEIDE dieselbe Region haben', () => {
    /* Genau hieran ist der Hypothenar gescheitert: „M. abductor digiti minimi" gibt es
       an der Hand UND am Fuß. Karten sind nach nameLatin geschlüsselt (ADR 0002 §2),
       also löste die Gruppe still auf die Fußmuskeln auf — sichtbar an der Regionszeile,
       und niemandem fiel es auf.

       „M. nasalis" und „M. occipitofrontalis" sind ebenfalls doppelt, aber beide Hälften
       liegen im Kopf. Sie sind darum unbedenklich — die Regel unterscheidet genau das. */
    const proName = new Map<string, Set<string>>();
    for (const m of MUSCLES) {
      const regionen = proName.get(m.nameLatin) ?? new Set<string>();
      regionen.add(m.region);
      proName.set(m.nameLatin, regionen);
    }

    const gefaehrlich: string[] = [];
    for (const g of getGroups()) {
      for (const name of g.muscles) {
        if ((proName.get(name)?.size ?? 0) > 1) gefaehrlich.push(`${g.id}: ${name}`);
      }
    }
    expect(gefaehrlich).toEqual([]);
  });
});
