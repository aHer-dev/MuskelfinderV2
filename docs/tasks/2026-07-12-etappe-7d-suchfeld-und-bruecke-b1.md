# Task: Etappe 7d — Suchfeld überall + Brücke B1 („nachgeschlagen = nicht gewusst“)

> **Zuerst lesen:** [Rahmen-Briefing Etappe 7](2026-07-12-etappe-7-uebersicht.md).

## Ziel
Nachschlagen bleibt trotz des neuen Einstiegs einen Griff entfernt — **und wird zum Lernsignal.**
Wer denselben Muskel dreimal in einer Woche sucht, kann ihn nicht. Die App bemerkt das und bietet an,
ihn zu lernen. Der Karteikasten füllt sich dadurch **durch normale Benutzung**.

Das ist der Mechanismus, den keine Vergleichs-App hat — weil keine von ihnen beides ist.

## Kontext
- Branch: `feat/etappe-7d-suchfeld-bruecke`
- Vorher fertig: **7b** (Route `/heute` als Ort für die neue Sektion).
- Betroffen:
  - `src/components/layout/AppShell.tsx` (Kopfzeile bekommt das Suchfeld)
  - `src/components/features/search/SearchField.tsx` (wiederverwenden, **nicht** duplizieren)
  - neu: `src/store/useLookupStore.ts` + Test
  - `src/pages/MuscleDetailPage.tsx` (zählt den Aufruf)
  - `src/pages/TodayPage.tsx` (neue Sektion)
  - `src/data/today.ts` (Priorisierung — die Schnittstelle `lookupCounts` ist in 7a bereits vorgesehen)
- Doku: [ADR 0007](../decisions/0007-einstieg-und-informationsarchitektur.md) §3,
  [produkt-plan.md](../produkt-plan.md) §Die vier Brücken

## Anforderungen
- [ ] Das **Suchfeld sitzt in der Kopfzeile jeder Route**, nicht nur auf `/suche`. Bestehende
      `SearchField`-Komponente wiederverwenden.
- [ ] Eine **laufende Lern-Session überlebt** den Griff zur Suche — sie wird nicht zurückgesetzt.
- [ ] Neuer Store `useLookupStore`: zählt Detailseiten-Aufrufe je `nameLatin`, mit Zeitstempel des
      letzten Aufrufs. Rein lokal, kein Server, **kein Tracking-Charakter** (die Daten verlassen
      das Gerät nie und stehen im Backup).
- [ ] Auf `/heute` eine Sektion **„Zuletzt nachgeschlagen“** mit dem Zusatz *„= noch nicht gewusst“*:
      - Liste mit Aufrufzähler, häufigste zuerst
      - **ein** Button: „Alle N als Karten lernen“ → legt sie in den Karteikasten
      - Muskeln, die bereits im Kasten liegen, tauchen hier **nicht** auf
- [ ] Mehrfach nachgeschlagene Muskeln werden in der Empfehlung (7a) **höher priorisiert**.
- [ ] Persistenz ist **additiv** — neuer Key im Backup, den eine alte Version ignoriert.

## Nicht-Ziele
- Keine Änderung an Such-/Filter-Logik selbst (`src/data/search.ts`, `filterUrl.ts`) — sie ist
  getestet und bleibt, wie sie ist.
- Keine Volltext-Suche über neue Felder, kein Fuzzy-Ausbau.
- Kein Verstecken der `/suche`-Route. Sie bleibt der Ort für die volle Filteransicht.

## Definition of Done
- [ ] Zähler getestet (mehrfacher Aufruf, Reset bei Aufnahme in den Kasten)
- [ ] Nachweis im Test: Der Karteikasten füllt sich, **ohne** dass `/karteikasten` geöffnet wurde
- [ ] Backup-Round-Trip-Test gegen die V1-Fixtures bleibt grün
- [ ] axe: 0 Verstöße; das Suchfeld in der Kopfzeile ist per Tastatur erreichbar und hat einen
      sichtbaren Fokus-Ring
- [ ] Gate grün · CHANGELOG · **Statustafel 7d auf `fertig`** · PROJECT_STATE nachgezogen
