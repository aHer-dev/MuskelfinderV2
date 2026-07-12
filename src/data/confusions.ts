/* =========================================================================
   Verwechslungspaare — die klassischen Prüfungsfallen (Etappe 7e).
   src/data/confusions.ts

   Optionale Handarbeit ÜBER dem Template (`explain.ts`): Wo ein Paar hier steht,
   ersetzt der geschriebene Satz die komponierte Erklärung. Wo keines steht,
   greift das Template — die Liste ist also **nie ein Blocker** und darf beliebig
   klein bleiben.

   Aufnahmekriterium: Nur Paare, die in Prüfungen wirklich verwechselt werden,
   und nur Aussagen, die im Datensatz gedeckt sind. Lieber wenige richtige Sätze
   als viele ungefähre — ein falscher Merksatz ist schlimmer als keiner.

   Schlüssel = beide `nameLatin`, alphabetisch sortiert (Richtung egal).
   ========================================================================= */

function pairKey(a: string, b: string): string {
  return [a, b].sort().join(' || ');
}

const CONFUSIONS: Record<string, string> = {
  [pairKey('M. supraspinatus', 'M. infraspinatus')]:
    'Beide entspringen der Scapula und ziehen zum Tuberculum majus — daher die Verwechslung. ' +
    'Merke: Der M. supraspinatus initiiert die Abduktion, der M. infraspinatus rotiert außen.',

  [pairKey('M. teres major', 'M. teres minor')]:
    'Der M. teres minor gehört zur Rotatorenmanschette und rotiert außen. ' +
    'Der M. teres major gehört NICHT dazu: er rotiert innen und adduziert.',

  [pairKey('M. pronator teres', 'M. pronator quadratus')]:
    'Beide pronieren den Unterarm. Der M. pronator quadratus liegt distal zwischen Radius und Ulna; ' +
    'der M. pronator teres überquert zusätzlich das Ellenbogengelenk und beugt es mit.',

  [pairKey('M. biceps brachii', 'M. brachialis')]:
    'Der M. brachialis ist der reine Beuger des Ellenbogengelenks. ' +
    'Der M. biceps brachii beugt ebenfalls, ist aber zusätzlich der kräftigste Supinator.',

  [pairKey('M. gluteus maximus', 'M. gluteus medius')]:
    'Der M. gluteus maximus streckt die Hüfte (Aufstehen, Treppensteigen). ' +
    'Der M. gluteus medius abduziert und stabilisiert das Becken im Einbeinstand — ' +
    'sein Ausfall zeigt sich als Trendelenburg-Zeichen.',

  [pairKey('M. rectus femoris', 'M. vastus lateralis')]:
    'Der M. rectus femoris ist der einzige Teil des M. quadriceps, der über das Hüftgelenk zieht — ' +
    'er beugt die Hüfte mit. Die Vasti wirken ausschließlich auf das Kniegelenk.',

  [pairKey('M. rhomboideus major', 'M. rhomboideus minor')]:
    'Gleiche Funktion (Skapula nach medial/kranial), nur andere Lage und Größe: ' +
    'Der Minor liegt kranial und ist der kleinere von beiden.',
};

/** Handgeschriebener Satz für dieses Paar, sonst `null` (dann greift das Template). */
export function confusionText(a: string, b: string): string | null {
  return CONFUSIONS[pairKey(a, b)] ?? null;
}

/** Wie viele Paare hinterlegt sind — für den Test, der die Namen gegen die Daten prüft. */
export function confusionPairs(): string[][] {
  return Object.keys(CONFUSIONS).map((key) => key.split(' || '));
}
