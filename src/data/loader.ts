import musclesData from './generated/muscles.json'
import movementsData from './generated/movements.json'
import regionsData from './generated/regions.json'
import type { Movement, Muscle, Region } from '../types'
import { validateMovements, validateMuscles, validateRegions } from './validation'
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
/* Funktionelle Gruppen (9a) und Palpation (9d) werden HIER geprueft, weil die Pruefung
   den Muskelbestand braucht: ein Eintrag zu einem Muskel, den es nicht gibt, soll
   auffallen und nicht still verschwinden. */
initGroups(muscles)
initPalpation(muscles)
initCurriculum(muscles)

const musclesById = new Map(muscles.map((muscle) => [muscle.id, muscle]))
const musclesByName = new Map(muscles.map((muscle) => [muscle.nameLatin, muscle]))

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

/** Lookup nach lateinischem Namen — Schlüssel der Persistenz-/Backup-Schicht (ADR 0002 §2). */
export function getMuscleByLatinName(name: string): Muscle | undefined {
  return musclesByName.get(name)
}

/* ---- Karten-Schlüssel sind nicht eindeutig — Lesen darf trotzdem nicht doppeln ----------
   Fuenf `nameLatin` gibt es ZWEIMAL (Hand/Fuss bzw. zweimal im Kopf). Karten sind nach
   `nameLatin` geschluesselt (ADR 0002 §2), also ist so ein Paar EINE Karte — `addCards`
   entdoppelt darum laengst.

   Der Fehler entstand auf der LESE-Seite: Wer ueber die 150 Muskeln laeuft und die behaelt,
   deren Name ein Kartenschluessel ist, findet fuer EINE Karte ZWEI Muskeln. Gemessen:
   „Obere Extremitaet" (53 Karten) ergab 56 Zeilen im Kasten, das Quiz zaehlte 56, die
   Sitzung 53 — und wer eine der beiden Zeilen entfernte, loeschte die andere gleich mit
   (es ist derselbe Schluessel).

   `isCardMuscle` waehlt genau EINEN Muskel je Schluessel, und zwar den, den
   `getMuscleByLatinName` ohnehin liefert — also den, den die Lernkarte RENDERT. Jede andere
   Wahl wuerde eine Zeile zeigen, die nicht zur Karte gehoert.

   ACHTUNG, das ist eine Entdopplung, keine Heilung: Der Handmuskel bleibt ueber Karten
   unlernbar, weil sein Schluessel auf den Fussmuskel aufloest. Das echte Gegenmittel waere
   ein eindeutiger `nameLatin` — und der bricht ADR 0002. Siehe `docs/todo.md`. */
export function isCardMuscle(muscle: Muscle): boolean {
  return musclesByName.get(muscle.nameLatin) === muscle
}

/** Ein Muskel je Karten-Schluessel — die Menge, die als Karteikasten darstellbar ist. */
export const CARD_MUSCLES: readonly Muscle[] = Object.freeze(muscles.filter(isCardMuscle))
