/* =========================================================================
   Der Kartenschlüssel (ADR 0012, Nachtrag zu ADR 0002 §2).
   src/data/card-key.ts

   ADR 0002 §2 sagt: Lernkarten sind nach `nameLatin` geschlüsselt, damit V1-Backups
   verlustfrei einlesbar bleiben. Der Preis stand seit dem 2026-07-14 in `docs/todo.md`:
   `M. abductor digiti minimi` heißt in der HAND genauso wie im FUSS — zwei verschiedene
   Muskeln, ein Name. Ein Schlüssel kann nur einen davon treffen, und er traf den Fuß.
   Wer „Hand" lernte, bekam drei Karten mit Kleinzehen-Fakten; der Handmuskel war über
   Karten überhaupt nicht lernbar.

   Diese Datei trennt den **Schlüssel** vom **Namen**:

       Schlüssel  = womit die Karte gespeichert wird     (nie sichtbar)
       nameLatin  = was auf der Karte steht              (nie ein Schlüssel)

   Für 147 der 150 Muskeln sind beide gleich. Für die drei Handmuskeln trägt der
   Schlüssel den anatomischen Zusatz aus der Terminologia Anatomica („…digiti minimi
   manus"), abgesetzt durch ein Zeichen, das in keinem lateinischen Namen vorkommt.

   ── Warum die HAND den Zusatz bekommt und nicht der Fuß ────────────────────
   Weil der Fuß den Schlüssel heute schon besitzt. Jede Karte, die irgendein Schüler
   je unter `M. abductor digiti minimi` angelegt hat, zeigt den Fußmuskel. Gäbe man dem
   Fuß den Zusatz, hieße das: bestehende Karten still umdeuten oder eine Migrationsregel
   schreiben, die V1-Backups anfasst. So dagegen bleibt der Import **byte-gleich**, kein
   Bestandsnutzer verliert etwas, und der Handmuskel ist ein Schlüssel, den alte Dateien
   schlicht nicht enthalten — genau der additive Weg, den `lookups`, `profile`, `streak`
   und `notes` im Backup-Format schon gegangen sind.

   ── Warum eine HANDGESCHRIEBENE Tabelle und keine Regel ───────────────────
   Eine Regel („bei Namensgleichheit die Region anhängen") hätte auch `M. nasalis` und
   `M. occipitofrontalis` getroffen. Die sind aber KEIN Namenskonflikt, sondern
   **derselbe Muskel in zwei Funktionszeilen** (Pars transversa / Pars alaris) — aus
   ihnen zwei Karten zu machen wäre fachlich falsch. Das Unterscheidungsmerkmal ist
   nicht der Name, sondern die Subregion, und diese Entscheidung gehört ausgeschrieben,
   nicht geraten. `assertCardKeys` erzwingt, dass die Tabelle vollständig bleibt.
   ========================================================================= */

import type { Muscle } from '../types';

/**
 * Trennt Namen und Zusatz im Schlüssel. Kommt in **keinem** `nameLatin` vor — und
 * `assertCardKeys` hält das so. Bewusst kein Klammerzusatz: `acceptedForms`
 * (`answer-check.ts`) liest Klammern als Synonym, ein Schlüssel
 * „M. abductor digiti minimi (Hand)" würde in Fach 7 die Eingabe **„Hand"** als
 * richtige Antwort durchwinken. Gemessen, nicht vermutet.
 */
export const CARD_KEY_MARK = '#';

/** Ein Muskel, der sich seinen `nameLatin` teilt und trotzdem eine eigene Karte braucht. */
export interface OwnCardEntry {
  nameLatin: string;
  /** Zusammen mit `nameLatin` eindeutig — die Subregion trennt Hand von Fuß. */
  subregion: string;
  /** Anatomischer Zusatz (Terminologia Anatomica), nicht erfunden. */
  qualifier: string;
}

/**
 * Die vollständige Ausnahmeliste. Wächst nur, wenn der Bestand einen neuen
 * Namenskonflikt zwischen zwei **verschiedenen** Muskeln bekommt — und dann meldet
 * sich `assertCardKeys` von selbst, statt still einen der beiden zu verschlucken.
 */
export const OWN_CARD: readonly OwnCardEntry[] = [
  { nameLatin: 'M. abductor digiti minimi', subregion: 'Hand & Finger', qualifier: 'manus' },
  { nameLatin: 'M. flexor digiti minimi brevis', subregion: 'Hand & Finger', qualifier: 'manus' },
  { nameLatin: 'M. opponens digiti minimi', subregion: 'Hand & Finger', qualifier: 'manus' },
];

export class CardKeyError extends Error {}

/**
 * Der Schlüssel, unter dem dieser Muskel als Lernkarte gespeichert wird.
 *
 * **Das ist kein Anzeigetext.** Wer ihn rendert, zeigt „M. abductor digiti minimi#manus"
 * auf einer Karteikarte. Zum Anzeigen ist `muscle.nameLatin` da.
 */
export function cardKey(muscle: Muscle): string {
  const entry = OWN_CARD.find(
    (e) => e.nameLatin === muscle.nameLatin && e.subregion === muscle.subregion,
  );
  return entry ? `${muscle.nameLatin}${CARD_KEY_MARK}${entry.qualifier}` : muscle.nameLatin;
}

/** Namen nach Muskeln gruppiert — Basis beider Prüfungen unten. */
function groupByName(muscles: readonly Muscle[]): Map<string, Muscle[]> {
  const groups = new Map<string, Muscle[]>();
  for (const muscle of muscles) {
    const list = groups.get(muscle.nameLatin);
    if (list) list.push(muscle);
    else groups.set(muscle.nameLatin, [muscle]);
  }
  return groups;
}

/**
 * Lässt den Start scheitern, wenn die Ausnahmeliste nicht mehr zu den Daten passt.
 * Der Loader ruft das, sobald die Muskeln validiert sind.
 *
 * Drei Behauptungen, jede eine gemessene Vergangenheit:
 *
 * 1. **Kein `nameLatin` enthält das Trennzeichen.** Sonst wäre nicht mehr entscheidbar,
 *    wo der Name aufhört und der Zusatz anfängt.
 * 2. **Jeder Eintrag der Tabelle trifft wirklich einen Muskel.** Ein Tippfehler erzeugt
 *    sonst keinen Fehler, sondern eine Ausnahme, die nie greift — und der Handmuskel wäre
 *    still wieder unlernbar. (Dieselbe Klasse wie die toten Gelenk-Etiketten in
 *    `joint-groups.test.ts`.)
 * 3. **Gleicher Name, verschiedene Subregion ⇒ verschiedene Schlüssel; gleicher Name,
 *    gleiche Subregion ⇒ derselbe Schlüssel.** Die erste Hälfte fängt ein neues
 *    Hand/Fuß-Paar, das jemand ohne Tabelleneintrag einpflegt. Die zweite verhindert,
 *    dass `M. nasalis` versehentlich in zwei Karten zerfällt — er ist ein Muskel mit
 *    zwei Funktionszeilen, keine zwei Muskeln.
 */
export function assertCardKeys(muscles: readonly Muscle[]): void {
  for (const muscle of muscles) {
    if (muscle.nameLatin.includes(CARD_KEY_MARK)) {
      throw new CardKeyError(
        `„${muscle.nameLatin}" enthält „${CARD_KEY_MARK}" — dieses Zeichen ist dem Kartenschlüssel vorbehalten`,
      );
    }
  }

  for (const entry of OWN_CARD) {
    const treffer = muscles.filter(
      (m) => m.nameLatin === entry.nameLatin && m.subregion === entry.subregion,
    );
    if (treffer.length === 0) {
      throw new CardKeyError(
        `Ausnahme ohne Muskel: „${entry.nameLatin}" / „${entry.subregion}" gibt es im Bestand nicht`,
      );
    }
  }

  for (const [nameLatin, gleichnamige] of groupByName(muscles)) {
    if (gleichnamige.length < 2) continue;
    for (const a of gleichnamige) {
      for (const b of gleichnamige) {
        if (a === b) continue;
        const gleicheKarte = cardKey(a) === cardKey(b);
        if (a.subregion !== b.subregion && gleicheKarte) {
          throw new CardKeyError(
            `„${nameLatin}" gibt es in „${a.subregion}" UND „${b.subregion}" — das sind zwei Muskeln, ` +
              `aber eine Karte. Trag einen davon in OWN_CARD ein (src/data/card-key.ts).`,
          );
        }
        if (a.subregion === b.subregion && !gleicheKarte) {
          throw new CardKeyError(
            `„${nameLatin}" (${a.subregion}) zerfällt in zwei Karten, ist aber derselbe Muskel ` +
              `in zwei Funktionszeilen. Nimm den Eintrag aus OWN_CARD wieder heraus.`,
          );
        }
      }
    }
  }
}
