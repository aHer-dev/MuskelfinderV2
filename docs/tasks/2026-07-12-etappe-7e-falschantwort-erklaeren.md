# Task: Etappe 7e — Falschantworten erklären sich + Brücke B2 (Detail-Sheet in der Session)

> **Zuerst lesen:** [Rahmen-Briefing Etappe 7](2026-07-12-etappe-7-uebersicht.md).
> Dieser Task hängt an **nichts** und kann jederzeit parallel laufen.

## Ziel
Wer im Quiz falsch liegt, erfährt **warum** — und kann den Unterschied nachlesen, **ohne die Session
zu verlassen**. Heute sieht man nur die richtige Antwort und lernt daraus nichts („Illusion of
Competence“: man erkennt die Lösung wieder, ohne sie zu verstehen).

## Kontext
- Branch: `feat/etappe-7e-falschantwort-erklaeren`
- Betroffen:
  - `src/components/features/quiz/QuestionCard.tsx` (Feedback)
  - `src/components/ui/Sheet.tsx` (**wiederverwenden** — hat Fokus-Trap, ist getestet)
  - neu: eine reine Funktion in `src/data/` (z. B. `explain.ts`) + Tests
  - `src/data/quiz.ts` (liefert bereits Distraktoren — Datenquelle für die Erklärung)
- Doku: [produkt-plan.md](../produkt-plan.md) §Die vier Brücken (B2)

## Anforderungen
- [ ] **Der Massenfall braucht null Redaktionsarbeit.** Die App kennt die Funktion des korrekten
      Muskels *und* des gewählten Distraktors — beide stehen im Datensatz. Daraus wird der
      Erklärsatz **komponiert**:
      > „Der M. infraspinatus rotiert außen. Gesucht war der M. supraspinatus, der abduziert.“
      Die Komposition ist eine **reine Funktion** in `src/data/`, getestet — kein String-Bau im JSX.
- [ ] Die Erklärung funktioniert in **allen** Quizmodi (Funktion, Ursprung/Ansatz, Innervation, Bild):
      Es wird jeweils das Merkmal kontrastiert, nach dem gefragt war.
- [ ] Fehlt ein Feld im Datensatz, degradiert die Erklärung **sauber** (kürzerer Satz), sie darf
      nie leer oder kaputt sein.
- [ ] **Brücke B2:** Ein Button „Warum?“ öffnet ein `Sheet` **über** der Session mit den beiden
      Muskeln nebeneinander (kompakte Detailkarten: Bild, Funktion, Ursprung/Ansatz, Innervation).
      **Die Session bleibt stehen** — schließen führt zurück in dieselbe Frage.
      Wer aus einer Session herausnavigiert, kommt nicht zurück; deshalb Sheet, nicht `navigate()`.
- [ ] Optionales Feld für **handgeschriebene Verwechslungspaare** (~25 klassische Prüfungsfallen:
      Supra-/Infraspinatus, die drei Glutei, Pronator teres/quadratus …). Ist eines hinterlegt,
      ersetzt es den Template-Satz. **Kein Blocker** — das Feld darf zunächst leer bleiben.
- [ ] Feedback **nie nur über Farbe** (WCAG 1.4.1) — Icon + Text. Ist im Projekt bereits Standard.

## Nicht-Ziele
- **Keine Erklärtexte für alle 150 Muskeln von Hand.** Das ist explizit gestrichen — der Template-Bulk
  erledigt den Massenfall.
- Keine Änderung an der Quiz-Auswertung, den Serien-Schlüsseln oder der Statistik
  (ADR 0002: `quizSeriesKey` bleibt kompatibel).
- Keine neue Quizform. Die Freitext-Stufe ist 8a.

## Definition of Done
- [ ] Template-Komposition über **alle** Modi getestet, inklusive der Degradation bei fehlenden Feldern
- [ ] Test: Sheet schließen führt zurück in die laufende Frage, Session-Zustand unverändert
- [ ] axe: 0 Verstöße im geöffneten Sheet (Fokus-Trap greift), Light + Dark
- [ ] Gate grün · CHANGELOG · **Statustafel 7e auf `fertig`** · PROJECT_STATE nachgezogen
