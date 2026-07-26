import musclesData from './generated/muscles.json'
import movementsData from './generated/movements.json'
import regionsData from './generated/regions.json'
import type { Movement, Muscle, Region } from '../types'
import { validateMovements, validateMuscles, validateRegions } from './validation'
import { assertCardKeys, cardKey } from './card-key'
import { withEtymology } from './etymology'
import { initGroups } from './groups'
import { initPalpation, withPalpation } from './palpation'
import { initCurriculum } from './curriculum'

/* Zwei HANDGEPFLEGTE Ebenen kommen hier dazu, beide von ausserhalb `generated/` (das
   ueberschreibt `npm run migrate:data`): die Herleitung des Namens (8d) und die
   Palpationshinweise (9d). Fehlt ein Eintrag, bleibt der Muskel unveraendert — die
   Detailseite rendert dann wie vorher, ohne leeren Kasten. */
const muscles = validateMuscles(musclesData as unknown)
  .map((muscle) => withEtymology(muscle))
  .map((muscle) => withPalpation(muscle))
const regions = validateRegions(regionsData as unknown)
const movements = validateMovements(movementsData as unknown)
/* Funktionelle Gruppen (9a), Palpation (9d) und die Kartenschluessel (ADR 0012) werden
   HIER geprueft, weil die Pruefung den Muskelbestand braucht: ein Eintrag zu einem Muskel,
   den es nicht gibt, soll auffallen und nicht still verschwinden. */
assertCardKeys(muscles)
initGroups(muscles)
initPalpation(muscles)
initCurriculum(muscles)

const musclesById = new Map(muscles.map((muscle) => [muscle.id, muscle]))
const musclesByCardKey = new Map(muscles.map((muscle) => [cardKey(muscle), muscle]))

export const MUSCLES: readonly Muscle[] = Object.freeze(muscles)
export const REGIONS: readonly Region[] = Object.freeze(regions)
export const MOVEMENTS: readonly Movement[] = Object.freeze(movements)

export function getMuscles(): readonly Muscle[] {
  return MUSCLES
}

export function getRegions(): readonly Region[] {
  return REGIONS
}

export function getMovements(): readonly Movement[] {
  return MOVEMENTS
}

export function getMuscleById(id: string): Muscle | undefined {
  return musclesById.get(id)
}

/**
 * Der Muskel hinter einem Kartenschlüssel — die einzige erlaubte Richtung von der
 * Persistenz zurück zu den Fakten (ADR 0002 §2, ADR 0012).
 *
 * Der Schlüssel kommt aus `cardKey`, nicht aus `nameLatin`. Wer hier einen Anzeigenamen
 * hineinreicht, trifft für die drei Handmuskeln den Fuß — genau der Fehler, den ADR 0012
 * behoben hat.
 */
export function getMuscleByCardKey(key: string): Muscle | undefined {
  return musclesByCardKey.get(key)
}

/* ---- Ein Muskel je Kartenschluessel ----------------------------------------------------
   Zwei `nameLatin` gibt es weiterhin zweimal: `M. nasalis` und `M. occipitofrontalis`.
   Das sind aber KEINE zwei Muskeln, sondern je einer in zwei Funktionszeilen (Pars
   transversa / Pars alaris) — also zu Recht EINE Karte.

   Der Fehler entstand auf der LESE-Seite: Wer ueber die 150 Muskeln laeuft und die behaelt,
   deren Name ein Kartenschluessel ist, findet fuer EINE Karte ZWEI Muskeln. Gemessen:
   „Obere Extremitaet" (53 Karten) ergab 56 Zeilen im Kasten, das Quiz zaehlte 56, die
   Sitzung 53 — und wer eine der beiden Zeilen entfernte, loeschte die andere gleich mit
   (es ist derselbe Schluessel).

   `isCardMuscle` waehlt genau EINEN Muskel je Schluessel, und zwar den, den
   `getMuscleByCardKey` ohnehin liefert — also den, den die Lernkarte RENDERT. Jede andere
   Wahl wuerde eine Zeile zeigen, die nicht zur Karte gehoert. */
export function isCardMuscle(muscle: Muscle): boolean {
  return musclesByCardKey.get(cardKey(muscle)) === muscle
}

/** Ein Muskel je Kartenschluessel — die Menge, die als Karteikasten darstellbar ist. */
export const CARD_MUSCLES: readonly Muscle[] = Object.freeze(muscles.filter(isCardMuscle))

/* ---- Gleicher Anzeigename, andere Karte ------------------------------------------------
   Seit ADR 0012 koennen ZWEI Karten denselben `nameLatin` tragen (Hand und Fuss). Auf der
   Karte selbst ist das egal — man sieht immer nur eine. In einer LISTE nicht: Zwei Zeilen
   „M. abductor digiti minimi" untereinander sind genau die Verwirrung, die der Kasten vor
   der Entdopplung hatte. Wer Karten auflistet, haengt bei `true` die Subregion an. */
const NAME_TWINS: ReadonlySet<string> = new Set(
  CARD_MUSCLES.map((m) => m.nameLatin).filter(
    (name, index, all) => all.indexOf(name) !== index,
  ),
)

/** Traegt ein zweiter Muskel im Kasten denselben Anzeigenamen? */
export function hasNameTwin(muscle: Muscle): boolean {
  return NAME_TWINS.has(muscle.nameLatin)
}
