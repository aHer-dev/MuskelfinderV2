# Etappe 8 — Rahmen-Briefing für alle Agenten

> **Lies das hier, bevor du ein Task-Briefing 8a–8f öffnest.** Es erklärt, *warum* Etappe 8
> existiert, was aus Etappe 7 bereits dasteht (und benutzt werden muss, statt neu gebaut zu werden)
> und welche Regeln in **jedem** ihrer Tasks gelten.

## Pflichtlektüre vor jedem Task
1. [docs/PROJECT_STATE.md](../PROJECT_STATE.md) — der aktuelle Stand.
2. [docs/produkt-plan.md](../produkt-plan.md) — **Statustafel** (verbindlich) + §Etappe 8.
3. [ADR 0008](../decisions/0008-abrufstufen-aus-leitner-box.md) — die Abrufstufe wird aus der
   Leitner-Box **abgeleitet**, nicht gespeichert. Ab hier wird sie zentral.
4. [ADR 0002](../decisions/0002-persistenz-und-datenkompatibilitaet.md) — Persistenz nur additiv.
5. Dein Task-Briefing.

## Das Problem, das Etappe 8 löst

Nach Etappe 7 hat die App eine Meinung: Sie schlägt vor, füllt den Karteikasten selbst, erklärt
Fehler und gibt einen Grund wiederzukommen. Aber sie fragt die Studentin bis heute fast nur nach
**Wiedererkennen** — vier Optionen, eine davon stimmt.

**Wiedererkennen ist nicht Können.** In der Prüfung steht keine Auswahl daneben. Wer im Quiz 90 %
schafft und in der Klausur einbricht, hat nicht schlecht gelernt, sondern die falsche Abrufform
geübt. Dazu kommt: Die Statistik weiß, wo es hakt, und sagt es — aber sie **tut** nichts damit.

**Nordstern der Etappe:** Die Abrufhärte **wächst mit der Beherrschung**, und keine ausgewiesene
Schwäche bleibt ohne Knopf daneben.

## Was Entscheidung E1 daran geändert hat (2026-07-12)

Der Projektinhaber hat entschieden: Die reale Prüfung ist gemischt (schriftlich *und*
mündlich/praktisch) — **trainiert wird aber der freie Abruf.** Konsequenz für diese Etappe:

**8a ist keine Kür mehr, sondern der Kern.** Die Freitext-Stufe (Fach 7) ist Pflicht. Multiple
Choice bleibt die *Einstiegsstufe* für frische Karten, nicht das Ziel.

## Was aus Etappe 7 dasteht — benutzen, nicht neu bauen

| Was | Wo | Wofür in Etappe 8 |
|-----|-----|-------------------|
| Tagesplan / Empfehlung | [src/data/today.ts](../../src/data/today.ts) | 8c: CTAs sollen dieselbe Priorisierung nutzen |
| Laufende Sitzung (Store, überlebt Navigation) | [src/store/useSessionStore.ts](../../src/store/useSessionStore.ts) | 8a, 8b: die Session ist der Ort der Abrufstufe |
| Sitzung mit **vorpriorisierter Auswahl** starten | `SessionOptions.names` + `readSessionHandoff` | 8b, 8c: „diese 10 Karten jetzt lernen" ist ein Einzeiler |
| Statistik-Selektoren | [src/data/stats.ts](../../src/data/stats.ts) | 8c: wiederverwenden, **nicht** duplizieren |
| Sheet mit Fokus-Trap | [src/components/ui/Sheet.tsx](../../src/components/ui/Sheet.tsx) | 8e: Notizen ohne Navigationsbruch |
| Additive Backup-Sektion (Muster) | `useLookupStore`, `useProfileStore`, `useStreakStore` | 8e: Notizen genauso — optionale Sektion, alte Versionen ignorieren sie |
| Erklärung aus Daten komponieren | [src/data/explain.ts](../../src/data/explain.ts) | 8a: Freitext-Feedback darf denselben Weg gehen |

## Zwei Fallen, die im Produktplan falsch beschrieben sind

Beide sind am Code verifiziert — glaub dem Code, nicht dem Plan:

1. **Die Daten für 8b liegen NICHT in `useQuizStore`.** Der hält nur Aggregate je Serien-Key
   (`rounds`/`answers`/`correct`/`history`) — **keine Fehler je Muskel.** Was du brauchst, steht in
   der Karte selbst: `totalWrong`, `totalCorrect`, `lastSeen`
   ([src/persistence/types.ts](../../src/persistence/types.ts)), also im `useProgressStore`.
   „Nie gesehen" = `lastSeen === null`.
2. **`src/data/generated/` wird überschrieben.** `npm run migrate:data`
   ([scripts/migrate-v1-data.mjs](../../scripts/migrate-v1-data.mjs)) generiert diesen Ordner neu aus
   V1. **Jeder redaktionelle Zusatztext, der dort landet, ist beim nächsten Lauf weg** — das trifft
   8d (Etymologie) und später 9d (Palpation). Solche Daten gehören in eine **eigene, handgepflegte
   Datei** außerhalb von `generated/`, die der Loader dazumischt.

## Invarianten — gelten in JEDEM Task dieser Etappe

1. **Die Leitner-Box bleibt der einzige persistierte Lernschlüssel.** Die Abrufstufe wird aus ihr
   *abgeleitet* (ADR 0008). Kein neuer Fortschritts-Key, keine zweite Wahrheit.
2. **Persistenz ist additiv.** Neue Sektionen (Notizen) sind **optional**, fehlen in älteren Dateien
   und werden von älteren Versionen ignoriert. Backup-Version bleibt 2. **Der Round-Trip-Test gegen
   die V1-Fixtures muss grün bleiben.**
3. **UI rendert nur.** Normalisierung, Toleranz, Auswahl, Ableitung gehören nach `src/data/` bzw.
   `src/persistence/` und sind dort getestet. Kein String-Bau, kein Vergleich im JSX.
4. **Keine Bestrafung.** Härtere Abrufform heißt nicht härtere Sanktion: Ein Freitext-Fehler ist eine
   normale Leitner-Rückstufung, kein Extra-Verlust. Kein Timer im normalen Lernen (der gehört in den
   Prüfungsmodus, 9c).
5. **Tolerant, aber nicht nachlässig.** Beim Freitext gilt: Tippfehler verzeihen, Bedeutungsfehler
   nie. `M. flexor digitorum longus` darf **niemals** als `… brevis` durchgehen.
6. **Erwachsene Marke.** Klinisch, orange-akzentuiert. Kein Maskottchen, kein Konfetti.
   `prefers-reduced-motion` respektieren.
7. **Deep-Links bleiben heil.** Bestehende Routen und Serien-Schlüssel (`quizSeriesKey`) bleiben
   kompatibel — ein neuer Filter darf den V1-Key nicht verändern (ADR 0002).
8. **Statisch, kein Backend.** Keine externen Laufzeit-Requests.

## Reihenfolge und Abhängigkeiten

```
8a (Abrufleiter + Freitext)  ──▶ prägt den Session-Fluss
8b (Session-Filter)          ──▶ hängt an nichts, profitiert von 8a
8c (Statistik → Handlung)    ──▶ hängt an nichts (B4)
8e (Notizen)                 ──▶ hängt an nichts
8f (Bildlücke schließen)     ──▶ braucht ZUERST die Lizenzprüfung (E5)
8d (Etymologie)              ──▶ redaktionell, inkrementell, jederzeit
```

**Empfohlene Reihenfolge: 8a → 8c → 8b → 8e → 8f → 8d.** 8a ist der Kern der Etappe; 8c zahlt die
letzte offene Brücke (B4) ein.

## Definition of Done — zusätzlich zu jedem Task-DoD

- [ ] `npm run lint && npm run test && npm run build` grün, **bevor** „fertig" gemeldet wird
- [ ] **Backup-Round-Trip gegen die V1-Fixtures grün** (jeder Task, nicht nur die mit Persistenz)
- [ ] CHANGELOG-Eintrag
- [ ] **Statustafel in [docs/produkt-plan.md](../produkt-plan.md) aktualisiert** (Status + Branch)
- [ ] [docs/PROJECT_STATE.md](../PROJECT_STATE.md): „Nächster Schritt" nachgezogen
- [ ] axe: 0 Verstöße auf berührten Screens (Light + Dark), Feedback nie nur über Farbe

## Nicht-Ziele der GESAMTEN Etappe 8

- **Kein FSRS/SM-2.** Leitner bleibt.
- **Keine funktionellen Gruppen, keine Abzeichen, kein Prüfungsmodus, keine Palpation.** Das ist
  Etappe 9 — jetzt entblockt, aber *danach*.
- **Keine Spracheingabe, keine Handschrifterkennung.** Freitext heißt tippen.
- **Kein KI-Chat, kein Konto, kein Cloud-Sync, kein Tracking, keine Werbung.**
