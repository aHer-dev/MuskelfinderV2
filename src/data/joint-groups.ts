/* =========================================================================
   Gelenkgruppen — der Stoff so gebündelt, wie er unterrichtet und geprüft wird.
   src/data/joint-groups.ts

   Ein Schüler lernt „die Muskeln des Ellenbogens", nicht „die obere Extremität".
   Bis hierher konnte er den Karteikasten nur nach den vier **Regionen** füllen, und
   die sind für einen Anfang zu grob: „Obere Extremität" legt **53 Karten** an. Das ist
   mehr als das Anderhalbfache einer Tagesdosis, also stufte `getTodayPlan` den Kasten
   sofort als `backlog` ein — die App begrüßte einen Schüler, der sich gerade angemeldet
   hatte, mit „Wir holen den Stau in Etappen auf". Eine Gelenkgruppe hat 9–25 Karten und
   passt in eine Sitzung.

   ## Nichts erfunden — abgeleitet, und darum nachprüfbar
   Diese Datei behauptet **keinen** neuen anatomischen Sachverhalt. Sie bündelt nur
   Etiketten, die längst in den migrierten Daten stehen: `joints` (echte Gelenknamen wie
   `Art. cubiti`) und `subregion` (die 15 topographischen Subregionen aus V1). Damit ist
   sie dasselbe Verfahren, das der Projektinhaber für die funktionellen Gruppen schon
   freigegeben hat (**E2**: „automatisch aus den vorhandenen Feldern vorannotiert, vom
   Projektinhaber nur geprüft") — und nicht dasselbe wie `curriculum.json` oder die
   Palpation, wo ein Agent nie etwas erfinden darf.

   **Sie liegt deshalb NICHT in `editorial/`:** Dort steht handgepflegter Fachinhalt.
   Hier steht eine Zuordnungsvorschrift über vorhandene Felder, und ein Test prüft, dass
   jedes genannte Etikett im Bestand wirklich vorkommt.

   ## Warum ZWEI Schlüssel (joints UND subregions)
   Weil weder eines allein trägt:
   - `M. palmaris brevis` und `M. quadratus plantae` haben **gar kein** `joints`-Eintrag.
     Über die Subregion sind sie zu finden.
   - Das Etikett `Becken` tragen **M. psoas minor** (Subregion „Hüfte") *und* die vier
     Beckenbodenmuskeln. Ein Gelenk-Etikett allein hätte den Psoas in den Beckenboden
     gelegt. Darum kommt „Bauchwand & Beckenboden" über die Subregion, nicht über `Becken`.
   - **Die Falle, die diese Datei fast gekostet hätte:** Das Etikett `Kopf` klingt nach
     Kopfmuskulatur, gehört aber zu `M. semispinalis`, `Mm. longissimi` und `Mm. splenii` —
     tiefe Rückenmuskeln, die den Kopf bewegen. Naiv zu „Mimik & Kopf" gezählt wären die
     Nackenstrecker im Gesicht gelandet. Es gehört zur **Wirbelsäule**.

   ## Ein Muskel liegt in MEHREREN Gruppen — das ist Absicht
   `M. biceps brachii` überspannt Ellenbogen und Schultergelenk und steht in beiden.
   Das ist keine Partition, sondern many-to-many (dieselbe Regel wie bei den funktionellen
   Gruppen, 9a). **Folge für die Zahlen am Knopf:** „Ellenbogen 17" und „Schultergelenk 11"
   ergeben zusammen **nicht** 28 Karten. Wer eine Zahl an einen Knopf schreibt, nimmt
   `neueKarten()` — was der Klick wirklich HINZUFÜGT.

   Schlüssel ist überall `nameLatin` (ADR 0002 §2), nicht die Routing-`id`: Fünf Namen gibt
   es zweimal (Hand und Fuß), und das ist je EINE Karte.
   ========================================================================= */

import { CARD_MUSCLES } from './loader';
import type { Profession } from './profession';
import type { Muscle } from '../types';

export interface JointGroupDef {
  /** Stabil, kleingeschrieben — für Deep-Links, Tests und `typicalFor`. */
  id: string;
  /** Was der Schüler liest. */
  label: string;
  /** Ein Satz, der sagt, was drin ist. Kurz — er steht unter dem Knopf. */
  hint: string;
  /** Etiketten aus `muscle.joints`. */
  joints: readonly string[];
  /** Etiketten aus `muscle.subregion` — fängt, was kein passendes Gelenk trägt. */
  subregions: readonly string[];
}

export interface JointGroup extends JointGroupDef {
  /** `nameLatin` der Mitglieder, entdoppelt und alphabetisch. */
  muscles: string[];
}

/**
 * Die elf Gruppen. **Reihenfolge = anatomisch von oben nach unten**, nicht nach Größe:
 * Wer „alle weiteren" durchsieht, soll sie in einer Ordnung finden, die er aus dem
 * Unterricht kennt. Die berufstypische Reihenfolge macht `orderedJointGroups`.
 */
export const JOINT_GROUP_DEFS: readonly JointGroupDef[] = [
  {
    id: 'mimik-kopf',
    label: 'Mimik & Kopfmuskulatur',
    hint: 'Gesicht, Kauen, Platysma',
    /* `Kopf` steht hier ABSICHTLICH nicht — siehe Dateikopf. */
    joints: ['Nase', 'Stirn', 'Galea', 'Mund', 'Augenlid', 'Augenbraue', 'Kopfhaut', 'Kiefergelenk', 'Mandibula', 'Hals'],
    subregions: ['Mimikmuskulatur', 'Kaumuskulatur'],
  },
  {
    id: 'zungenbein-kehlkopf',
    label: 'Zungenbein & Kehlkopf',
    hint: 'Supra- und infrahyoidale Muskeln',
    joints: ['Zungenbein', 'Kehlkopf'],
    subregions: ['Suprahyoidale Muskeln', 'Infrahyoidale Muskeln'],
  },
  {
    id: 'wirbelsaeule',
    label: 'Wirbelsäule',
    hint: 'Autochthone Rückenmuskulatur, Hals- und Kopfgelenke',
    joints: ['Wirbelsäule', 'LWS', 'Halswirbelsäule', 'Kopfgelenke', 'Kopf', 'Rippen'],
    subregions: ['Rückenmuskulatur', 'Prävertebrale Muskeln'],
  },
  {
    id: 'bauchwand-beckenboden',
    label: 'Bauchwand & Beckenboden',
    hint: 'Bauchpresse, Beckenboden',
    /* NICHT `Becken`: Das trägt auch M. psoas minor (siehe Dateikopf). */
    joints: ['Rumpf'],
    subregions: ['Bauchmuskulatur', 'Beckenboden'],
  },
  {
    id: 'schulterguertel',
    label: 'Schultergürtel',
    hint: 'Skapula gegen den Rumpf',
    joints: ['Schultergürtel'],
    subregions: [],
  },
  {
    id: 'schultergelenk',
    label: 'Schultergelenk',
    hint: 'Art. humeri — inkl. Rotatorenmanschette',
    joints: ['Art. humeri'],
    subregions: [],
  },
  {
    id: 'ellenbogen',
    label: 'Ellenbogen',
    hint: 'Beugen, Strecken, Umwenden',
    joints: ['Art. cubiti'],
    subregions: [],
  },
  {
    id: 'hand',
    label: 'Hand',
    hint: 'Handgelenk, Finger, Daumen',
    joints: ['Art. manus', 'MCP', 'PIP', 'DIP', 'IP', 'Daumensattelgelenk', 'CMC'],
    subregions: ['Hand & Finger'],
  },
  {
    id: 'hueftgelenk',
    label: 'Hüftgelenk',
    hint: 'Art. coxae — Beuger, Strecker, Adduktoren',
    joints: ['Art. coxae'],
    subregions: ['Hüfte'],
  },
  {
    id: 'kniegelenk',
    label: 'Kniegelenk',
    hint: 'Art. genus — Quadrizeps, Ischiocrurale',
    joints: ['Art. genus'],
    subregions: [],
  },
  {
    id: 'sprunggelenk-fuss',
    label: 'Sprunggelenk & Fuß',
    hint: 'Wade, Fußheber, Zehen',
    joints: [
      'Art. talocruralis',
      'Art. subtalaris',
      'MTP Zeh I',
      'MTP Zeh V',
      'MTP und IP Zeh I',
      'MTP und IP Zehen II–V',
      'MTP und IP Zehen II–IV',
      'MTP und proximale IP Zehen II–V',
      'MTP Zehen III–V',
      'MTP Zehen II–IV',
      'MTP Zehen II–V',
    ],
    subregions: ['Fuß & Sprunggelenk'],
  },
] as const;

/**
 * Was in welchem Beruf am Anfang dransteht. **Es wird nur sortiert, nichts versteckt**
 * (Entscheidung 2026-07-26): Die typischen Gruppen stehen oben, alle anderen bleiben
 * darunter sichtbar. Ein Ergo, der die Hüfte lernen will, soll sie nicht suchen müssen.
 */
const TYPICAL: Record<Profession, readonly string[]> = {
  physio: ['hueftgelenk', 'kniegelenk', 'sprunggelenk-fuss', 'wirbelsaeule'],
  ergo: ['hand', 'ellenbogen', 'schultergelenk', 'schulterguertel'],
  logo: ['mimik-kopf', 'zungenbein-kehlkopf'],
}

/** Gehört der Muskel in die Gruppe? Gelenk ODER Subregion — beide Wege zählen. */
function gehoertDazu(muscle: Muscle, def: JointGroupDef): boolean {
  if (def.subregions.includes(muscle.subregion)) return true;
  return muscle.joints.some((j) => def.joints.includes(j));
}

let cache: JointGroup[] | null = null;

/**
 * Die elf Gruppen mit aufgelösten Mitgliedern. Einmal berechnet und gehalten — der
 * Bestand ändert sich zur Laufzeit nicht (dieselbe Annahme wie `CARD_MUSCLES`).
 */
export function getJointGroups(): JointGroup[] {
  if (cache) return cache;
  /* **`CARD_MUSCLES`, NICHT `getMuscles()`** — die harte Regel aus `isCardMuscle`: „Alles, was
     von Karten auf Muskeln schliesst, geht hier durch."

     Erster Versuch lief über alle 150 Muskeln und entdoppelte danach nach `nameLatin`. Gemessen
     hiess das: Die Gruppe „Hand" enthielt `M. abductor digiti minimi`,
     `M. flexor digiti minimi brevis` und `M. opponens digiti minimi` — aber der Kartenschlüssel
     löst diese drei Namen auf die **FUSS**-Muskeln auf. Ein Ergo, der „Hand" klickte, bekam drei
     Karten mit Kleinzehen-Fakten und dem Etikett „Untere Extremität". Genau derselbe Fehler, an
     dem schon `seedDeck` (ADR 0009), die Gruppe Hypothenar und die Kasten-Tabelle gestorben sind.

     Über `CARD_MUSCLES` gibt es je Schlüssel nur den Muskel, den die Karte WIRKLICH rendert —
     die drei Namen liegen damit nur noch bei „Sprunggelenk & Fuss", wo ihr Inhalt hingehört. */
  const muscles = CARD_MUSCLES;
  cache = JOINT_GROUP_DEFS.map((def) => ({
    ...def,
    /* Entdoppelt nach `nameLatin`: Zwei gleichnamige Muskeln sind EINE Karte (ADR 0002 §2).
       Ohne das verspräche der Knopf mehr Karten, als er anlegt. */
    muscles: [...new Set(muscles.filter((m) => gehoertDazu(m, def)).map((m) => m.nameLatin))].sort(
      (a, b) => a.localeCompare(b, 'de'),
    ),
  }))
  return cache
}

export function getJointGroup(id: string): JointGroup | undefined {
  return getJointGroups().find((g) => g.id === id);
}

/**
 * Gruppen für einen Beruf: erst die typischen, dann alle weiteren — **beide sichtbar**.
 * Ohne Beruf (noch kein Profil) gibt es keine Vorsortierung, nur die anatomische Ordnung.
 */
export function orderedJointGroups(profession: Profession | null): {
  typisch: JointGroup[];
  weitere: JointGroup[];
} {
  const groups = getJointGroups();
  if (profession === null) return { typisch: [], weitere: groups };

  const ids = TYPICAL[profession];
  /* Reihenfolge aus TYPICAL übernehmen, nicht aus der anatomischen Liste: Beim Ergo steht
     die Hand zuerst, weil sie sein Fach ist — nicht weil sie im Körper unten liegt. */
  const typisch = ids
    .map((id) => groups.find((g) => g.id === id))
    .filter((g): g is JointGroup => g !== undefined);
  const weitere = groups.filter((g) => !ids.includes(g.id));
  return { typisch, weitere };
}

/**
 * Wie viele Karten dieser Klick WIRKLICH anlegt — ohne die, die schon im Kasten liegen.
 *
 * Die Zahl an einem Knopf ist ein Versprechen. Weil 23 Muskeln in mehreren Gruppen liegen
 * (`M. biceps brachii`: Ellenbogen + Schultergelenk), ist die Mitgliederzahl NICHT die Zahl
 * der neuen Karten, sobald eine Nachbargruppe schon gewählt wurde.
 */
export function neueKarten(group: JointGroup, cards: Record<string, unknown>): number {
  return group.muscles.filter((name) => !(name in cards)).length;
}
