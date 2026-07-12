/* =========================================================================
   Etymologie: den Namen lesen lernen (Etappe 8d) — reine Logik.
   src/data/etymology.ts

   Der lateinische Name IST die Funktion — man muss ihn nur lesen können.
   „Flexor digitorum longus": der lange Beuger der Finger. Wer die ~40 Bausteine
   versteht, muss nicht 150 Namen auswendig lernen.

   Die Herleitung wird **komponiert**, nicht redigiert (dasselbe Prinzip wie
   `explain.ts`): Ein handgepflegtes Lexikon von Wortbausteinen, aus dem der
   Loader je Muskel die Herleitung zusammensetzt. Ein Wort, das nicht im Lexikon
   steht, fällt weg — die Herleitung wird kürzer, **nie falsch**.

   ⚠️ Die Daten liegen unter `src/data/editorial/`, NICHT unter `src/data/generated/`:
   Der generierte Ordner wird von `npm run migrate:data` neu erzeugt und würde jeden
   redaktionellen Text mitnehmen.
   ========================================================================= */

import editorial from './editorial/etymology.json';
import type { Muscle } from '../types';

export interface NamePart {
  /** Der Wortbaustein, wie er im Namen steht. */
  word: string;
  /** Seine Bedeutung laut Lexikon. */
  meaning: string;
}

export interface EtymologySource {
  /** Wortbaustein → Bedeutung. */
  lexikon: Record<string, string>;
  /** Ausnahmen und Merksätze je `nameLatin`. */
  muskeln: Record<string, { etymologie?: string; merksatz?: string }>;
}

/** Die redaktionelle Datei, defensiv gelesen — sie wird von Hand gepflegt. */
export function readEtymologySource(raw: unknown): EtymologySource {
  const data = (raw ?? {}) as Partial<EtymologySource>;
  return {
    lexikon: isRecordOfStrings(data.lexikon) ? data.lexikon : {},
    muskeln: typeof data.muskeln === 'object' && data.muskeln !== null ? data.muskeln : {},
  };
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every((v) => typeof v === 'string');
}

/**
 * Zerlegt einen Muskelnamen in seine Wortbausteine.
 *
 * Bewusst ein eigener Tokenizer und nicht der aus `answer-check.ts`: Der wirft
 * „Pars" und „Caput" weg (dort sind sie bedeutungslos), hier tragen sie Bedeutung
 * („Caput longum" = der lange Kopf).
 */
export function tokenizeName(nameLatin: string): string[] {
  return nameLatin
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .split(' ')
    .filter((word) => word !== '' && word !== 'm' && word !== 'mm');
}

/** Die bekannten Bausteine eines Namens — in der Reihenfolge, in der sie dastehen. */
export function decomposeName(nameLatin: string, lexikon: Record<string, string>): NamePart[] {
  const parts: NamePart[] = [];
  for (const word of tokenizeName(nameLatin)) {
    const meaning = lexikon[word];
    // Unbekannt = weglassen. Raten wäre der eine Fehler, den man hier nicht machen darf.
    if (meaning !== undefined && !parts.some((p) => p.word === word)) {
      parts.push({ word, meaning });
    }
  }
  return parts;
}

/** Aus den Bausteinen die Herleitung. `null`, wenn kein einziger bekannt ist. */
export function composeEtymology(parts: NamePart[]): string | null {
  if (parts.length === 0) return null;
  return parts.map((p) => `${p.word} = ${p.meaning}`).join(' · ');
}

const SOURCE = readEtymologySource(editorial);

/**
 * Reichert einen Muskel um Herleitung und Merksatz an (der Loader ruft das).
 *
 * Fehlt beides, bleibt der Muskel **unverändert** — die Detailseite rendert dann
 * genau wie vorher, ohne leeren Kasten.
 */
export function withEtymology(muscle: Muscle, source: EtymologySource = SOURCE): Muscle {
  const manual = source.muskeln[muscle.nameLatin];
  const etymology =
    manual?.etymologie ?? composeEtymology(decomposeName(muscle.nameLatin, source.lexikon)) ?? undefined;
  const mnemonic = manual?.merksatz;

  if (etymology === undefined && mnemonic === undefined) return muscle;
  return { ...muscle, etymology, mnemonic };
}
