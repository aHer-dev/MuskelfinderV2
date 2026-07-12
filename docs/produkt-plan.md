# Produktplan — vom Nachschlagewerk zum Coach

> Etappen 7–9. Die Migration (Etappen 0–6) ist abgeschlossen: die App **kann** alles, was V1 konnte.
> Dieser Plan beantwortet die nächste Frage: **warum die Studentin sie morgen wieder öffnet.**
>
> Ebenen: Strategie → [ROADMAP.md](../ROADMAP.md) · Stand → [PROJECT_STATE.md](PROJECT_STATE.md) ·
> Architektur → [architecture.md](architecture.md) · Aufgaben → [tasks/](tasks/)
>
> Visuelle Vorlagen (extern, privat):
> [Entwurf Heute-Screen](https://claude.ai/code/artifact/1d074841-2b00-4b29-a46f-801c15c7fdb0) ·
> [Produktkonzept](https://claude.ai/code/artifact/f3d614e5-cfba-4a54-8aed-44cdb3f30d8f)
> — nicht normativ, aber der schnellste Weg, das Zielbild zu sehen.

## So wird dieser Plan benutzt

Jeder Agent liest **zuerst** [PROJECT_STATE.md](PROJECT_STATE.md), dann die **Statustafel** unten.
Die Tafel ist der verbindliche Stand: Was ist offen, was läuft, was ist fertig, was ist blockiert.
Nach jedem abgeschlossenen Schritt wird die Zeile in der Tafel aktualisiert — sonst weiß der
nächste Agent nicht, wo er ansetzt.

---

## Die Leitidee

Muskelfinder ist die einzige App im Feld, die **Nachschlagewerk und Lernwerkzeug zugleich** ist.
Anki kennt kein Nachschlagen. Kenhub kennt keinen eigenen Karteikasten. AMBOSS kann beides — aber
nicht für Physio/Ergo/Logo, nicht kostenlos, nicht offline. Diese Doppelnatur wirkt heute wie zwei
halbe Apps; sie ist in Wahrheit der einzige Vorteil, den niemand nachbauen kann.

**Nordstern:** Beim Öffnen genau **ein** Vorschlag — „Heute dran". Alles andere hängt daran.

Drei tragende Entscheidungen (Details in den ADRs):

1. **Navigation benennt Absichten, keine Features.** Vier Tabs — *Heute · Suche · Lernen ·
   Fortschritt* — statt sechs gleichrangiger Werkzeuge. → [ADR 0007](decisions/0007-einstieg-und-informationsarchitektur.md)
2. **Vier gerichtete Brücken** zwischen Suche und Lernen statt sieben unabhängiger Seiten
   (siehe unten).
3. **Eine Session, vier Abrufstufen** — die Abrufhärte wird aus der Leitner-Box *abgeleitet*, nicht
   neu gespeichert. → [ADR 0008](decisions/0008-abrufstufen-aus-leitner-box.md)

### Die vier Brücken

| # | Kante | Mechanik | Etappe |
|---|-------|----------|--------|
| B1 | Suche → Lernen | Nachschlagen ist ein Lernsignal. Wer denselben Muskel dreimal sucht, kann ihn nicht → Aufrufzähler, „Zuletzt nachgeschlagen“, Ein-Klick-Karten. | 7d |
| B2 | Lernen → Nachschlagen | Die Detailseite klappt als **Sheet in der Session** auf, statt wegzunavigieren. Wer die Session verlässt, kommt nicht zurück. | 7e |
| B3 | Fehler → Karteikasten | Jedes Debrief seedet die verpassten Muskeln zurück in den Kasten. Der wertvolle Teil des Prüfungsmodus ist nicht der Timer. | 9c |
| B4 | Fortschritt → Handlung | Keine Zahl ohne Knopf. Jede ausgewiesene Schwäche hat eine Aktion daneben. | 8c |

---

## Statustafel

> **Pflicht:** Wer einen Schritt abschließt, ändert hier den Status und trägt den Branch ein.
> Status: `offen` · `laufend` · `fertig` · `blockiert`

### Etappe 7 — Die App bekommt eine Meinung
***Vollständig umgesetzt (2026-07-12).** Alle sechs Schritte fertig; Merge auf `main` am Stück.*
**Rahmen-Briefing für alle Agenten (Pflicht vor jedem Task):**
[tasks/2026-07-12-etappe-7-uebersicht.md](tasks/2026-07-12-etappe-7-uebersicht.md)

| ID | Schritt | Briefing | Status | Branch | Blockiert durch |
|----|---------|----------|--------|--------|-----------------|
| 7a | Empfehlungs-Engine (`src/data/today.ts`), reine Selektoren, kein UI | [7a](tasks/2026-07-12-etappe-7a-empfehlungs-engine.md) | **fertig** | `feat/etappe-7a-empfehlungs-engine` | — |
| 7b | Route `/heute` als Einstieg + Navigation auf vier Absichten | [7b](tasks/2026-07-12-etappe-7b-route-heute.md) | **fertig** | `feat/etappe-7b-route-heute` | — |
| 7c | Onboarding (2 Fragen) + Auto-Seeding des Karteikastens | [7c](tasks/2026-07-12-etappe-7c-onboarding-seeding.md) | **fertig** | `feat/etappe-7c-onboarding-seeding` | — |
| 7d | Persistentes Suchfeld + Aufrufzähler + „Zuletzt nachgeschlagen“ (**B1**) | [7d](tasks/2026-07-12-etappe-7d-suchfeld-und-bruecke-b1.md) | **fertig** | `feat/etappe-7d-suchfeld-bruecke` | — |
| 7e | Falschantwort-Erklärung (Template) + Detail-Sheet in der Session (**B2**) | [7e](tasks/2026-07-12-etappe-7e-falschantwort-erklaeren.md) | **fertig** | `feat/etappe-7e-falschantwort-erklaeren` | — |
| 7f | Streak + Freeze | [7f](tasks/2026-07-12-etappe-7f-streak-und-freeze.md) | **fertig** | `feat/etappe-7f-streak-freeze` | — |

### Etappe 8 — Die App wird schwerer, wenn du besser wirst

| ID | Schritt | Status | Branch | Blockiert durch |
|----|---------|--------|--------|-----------------|
| 8a | Abrufleiter: Stufe aus Leitner-Box + Freitext-Stufe (Fach 7) | offen | — | 7b (Session-Fluss) |
| 8b | Session-Filter „nur falsch beantwortete“ / „nie gesehen“ | offen | — | — |
| 8c | Statistik → Handlung: jede Schwäche bekommt einen CTA (**B4**) | offen | — | — |
| 8d | Etymologie & Eselsbrücken im „Einfach“-Niveau | offen | — | redaktionell, inkrementell |
| 8e | Eigene Notizen je Muskel (additiv im Backup, ADR-0002-konform) | offen | — | — |
| 8f | Typografischer Platzhalter für die 47 bildlosen Muskeln | offen | — | — |

### Etappe 9 — Die App wird prüfungsnah
*Seit 2026-07-12 **nicht mehr blockiert** — E1, E2, E3 und E5 sind entschieden (Tabelle unten).*

| ID | Schritt | Status | Branch | Blockiert durch |
|----|---------|--------|--------|-----------------|
| 9a | Funktionelle Gruppen (~12–15, generiert + geprüft) + Gruppen-Quiz | offen | — | — |
| 9b | Kompetenz-Abzeichen | offen | — | 9a |
| 9c | Prüfungsmodus (schriftlich + mündlich/praktisch) + Debrief-Schleife (**B3**) | offen | — | — |
| 9d | Palpations-Sektion je Muskel (optionales Feld, inkrementell) | offen | — | — |

### Entscheidungen — **alle getroffen (2026-07-12)**

| ID | Frage | Blockierte | Entscheidung |
|----|-------|-----------|--------------|
| E1 | Wie sieht das reale Testat aus (MC / mündlich / praktisch)? | 9c | **Gemischt — aber trainiert wird freier Abruf.** |
| E2 | Wird die Gruppen-Annotation gemacht? | 9a, 9b | **Ja, abgespeckt: ~12–15 kuratierte Gruppen, generiert + geprüft.** |
| E3 | Ist Palpation prüfungsrelevant oder Kür? | 9d | **Datenfeld anlegen, inkrementell füllen.** |
| E4 | Curriculum-fest oder adaptiver Empfehler? | 7a | **Adaptiv** (schon in 7a umgesetzt). |
| E5 | Dürfen Renderings aus der eigenen 3D-App übernommen werden? | 8f | **Ja, sofern BodyParts3D-basiert** (CC BY 4.0, Attribution mitführen). |

**Damit ist Etappe 9 nicht mehr blockiert.** Was aus den Entscheidungen folgt:

- **E1 → 9c + 8a.** Der Prüfungsmodus simuliert beide Formen (schriftlich *und* mündlich/praktisch),
  aber die **Trainingsstufe ist der freie Abruf**, nicht Multiple Choice. Begründung: Wer frei
  abrufen kann, besteht auch MC — umgekehrt nicht. MC bleibt die *Einstiegsstufe* für frische
  Karten (Fach 1–2), nicht das Ziel. Das bestätigt [ADR 0008](decisions/0008-abrufstufen-aus-leitner-box.md)
  und macht die Freitext-Stufe (8a, Fach 7) zur Pflicht statt zur Kür.
- **E2 → 9a/9b.** Keine 30 Gruppen von Hand. Der Agent schlägt **~12–15 klinisch relevante Gruppen**
  vor und annotiert sie **automatisch aus den vorhandenen Feldern** (Region, Subregion, Funktion,
  Innervation); der Projektinhaber prüft nur die fertige Liste. Aufwand: eine Stunde Durchsehen
  statt ein Wochenende Tippen. Erweiterbar bleibt es trotzdem.
- **E3 → 9d.** Optionales Feld `palpation` je Muskel; die Sektion erscheint **nur**, wo etwas steht.
  Kein Redaktionsberg, kein Blocker — Startpunkt sind die gut tastbaren Muskeln.
- **E5 → 8f.** Die 47 bildlosen Muskeln dürfen mit Renderings aus der eigenen 3D-App geschlossen
  werden, **solange die Modelle BodyParts3D (DBCLS) sind**: Renderings davon sind abgeleitete Werke
  unter CC BY 4.0, die Attribution führen wir ohnehin. **Vor der Übernahme ist zu prüfen, dass in
  der 3D-App wirklich nur BodyParts3D-Geometrie steckt** — steckt Fremdmaterial drin, gilt der
  typografische Platzhalter.

---

# Die Etappen

## Etappe 7 — Die App bekommt eine Meinung

**Ziel:** Beim Öffnen steht ein Vorschlag, kein Katalog. Der Karteikasten füllt sich von selbst.
Ein Fehler im Quiz erklärt sich. Es gibt einen Grund, morgen wiederzukommen.

**Warum zuerst:** Alle drei Recherche-Berichte setzen den geführten Einstieg auf Platz 1, und er
reißt drei Reibungswände in einem Zug ein — kalter Start, leerer Karteikasten, empfehlungslose
Statistik. Ohne ihn läuft Spaced Repetition ins Leere, weil nie Karten drin sind.

### 7a — Empfehlungs-Engine
Reine Datenschicht, kein UI. Neues Modul `src/data/today.ts`.

- Selektoren: fällige Karten (aus Leitner), schwächste Region (aus `stats.ts`), Tagesdosis,
  Vorschlag „neue Muskeln aus dem Pfad“, Schätzung „ca. X Min“.
- Ein `TodayPlan`-Objekt als getypter Rückgabewert. Keine Parse-/Ableitungslogik im JSX.
- Muss den Fall „nichts fällig“ und „Kasten leer“ **explizit** beantworten — es gibt keinen
  Zustand ohne Vorschlag.

**DoD:** Vitest deckt alle Zustände ab (leer / nichts fällig / Normalfall / Überfällig-Stau);
`npm run lint && npm run test && npm run build` grün.

### 7b — Route `/heute` + vier Absichten
- Neue Route `/heute`; `/` leitet dorthin statt auf `/suche` (ADR 0007).
- Rail (Desktop) und TabBar (Mobil) auf vier Einträge: Heute · Suche · Lernen · Fortschritt.
- „Karteikasten“ wandert als Ansicht unter *Fortschritt*, `/karteikasten` bleibt als Route
  erhalten (Deep-Links dürfen nicht brechen).
- Kein Zustand ohne Primärbutton.

**DoD:** Deep-Link-Reload auf allen Routen; axe 0 Verstöße (Light + Dark); Alt-Routen leiten
korrekt weiter.

### 7c — Onboarding + Auto-Seeding
- Genau zwei Fragen: „Was lernst du?“ (Physio/Ergo/Logo) und „Wann ist deine Prüfung?“
  (Datum, überspringbar). Keine Tutorial-Slides, kein Konto.
- Daraus seedet `src/data/seeding.ts` den Karteikasten: Regionen nach Beruf gewichtet
  (Logo → Kopf/Hals, Ergo → obere Extremität/Hand, Physio → Extremitäten + Rumpf),
  leichte Muskeln zuerst.
- **Erste bewertete Karte unter 60 Sekunden** nach dem ersten Öffnen.
- Profession + Prüfungsdatum werden persistiert (additiv, bricht das Backup-Format nicht).

**DoD:** Seeding-Logik getestet (jede Profession bekommt ein plausibles, nicht-leeres Startdeck);
ein Logo-Erstsemester bekommt nie den M. gluteus maximus als erste Karte.

### 7d — Suchfeld überall + Brücke B1
- Suchfeld in der Kopfzeile **jeder** Route (nicht nur `/suche`). Laufende Session überlebt das.
- Neuer Store `useLookupStore`: zählt Detailseiten-Aufrufe je `nameLatin`, lokal, ohne Server.
- Heute-Screen: Sektion „Zuletzt nachgeschlagen — *= noch nicht gewusst*“ mit Aufrufzähler und
  Ein-Klick-Button „als Karten lernen“.
- Mehrfach nachgeschlagene Muskeln werden in der Empfehlung (7a) höher priorisiert.

**DoD:** Zähler getestet; Karteikasten füllt sich nachweislich ohne Öffnen der Verwaltungsseite.

### 7e — Falschantwort erklärt sich + Brücke B2
- Bei falscher Antwort: **Template-Satz aus vorhandenen Daten**, keine Redaktionsarbeit —
  „Der M. infraspinatus rotiert außen. Gesucht war der M. supraspinatus, der abduziert.“
- Ein Sheet klappt **über** der Session auf und zeigt richtigen Muskel und gewählten Distraktor
  nebeneinander. Die Session bleibt stehen (bestehendes Sheet-Primitiv wiederverwenden).
- Optionales Feld für ~25 handgeschriebene Verwechslungspaare — inkrementell nachlegbar, kein Blocker.
- Feedback nie nur über Farbe (WCAG 1.4.1 — im Projekt bereits Standard).

**DoD:** Template-Komposition getestet über alle Quizmodi; Sheet schließt zurück in die laufende Frage.

### 7f — Streak + Freeze
- Nüchterner Tageszähler. Kein Cartoon-Feuer, kein Konfetti, keine Schuld-Benachrichtigung.
- **Freeze** wird durch Überperformen verdient (doppelte Tagesdosis) und beim Fehltag automatisch
  eingelöst. Aufsetzen auf `useDailyBonus`/XP.
- Nach verlorenem Streak: „Weiter geht’s“, nie „Du hast X verloren“.

**DoD:** Streak-/Freeze-Logik über Tagesgrenzen getestet (inkl. Zeitzonen-Kante); persistiert additiv.

---

## Etappe 8 — Die App wird schwerer, wenn du besser wirst

**Ziel:** Wiedererkennen ist nicht Können. Die Abrufhärte wächst mit der Beherrschung, und die
Statistik hört auf, bloß Buchhaltung zu sein.

### 8a — Abrufleiter (→ ADR 0008)
Die Abrufform wird aus der Leitner-Box abgeleitet, **nicht** zusätzlich gespeichert:

| Fach | Abrufform | Status |
|------|-----------|--------|
| 1–2 | Multiple Choice (4 Optionen) | vorhanden (`QuizPage`) |
| 3–4 | Bild ↔ Name zuordnen | vorhanden (`name-image`) |
| 5–6 | Freier Abruf, Selbstbewertung | vorhanden (`FlashcardsPage`) |
| 7 | **Produktion — tippen** | **neu** |

- Freitext-Stufe mit toleranter Auswertung (Normalisierung: Groß/Klein, Diakritika, „M.“/„Musculus“,
  kleine Tippfehler-Toleranz). Reine Funktion in `src/data/`, getestet.
- Die zehn bestehenden Quizmodi bleiben als „Freies Üben“ unter *Lernen* erhalten.

**DoD:** Normalisierung/Toleranz mit Fixture-Tabelle getestet (auch False-Positives: `M. flexor
digitorum longus` darf nicht als `… brevis` durchgehen); Leitner-Box bleibt einziger persistierter
Schlüssel — Backup-Round-Trip-Test bleibt grün.

### 8b — Session-Filter
„Nur falsch beantwortete“ und „nie gesehen“ als Pool-Einschränkung (AMBOSS-Mechanik). Daten liegen
bereits in `useQuizStore`.
**DoD:** Serien-Schlüssel bleiben ADR-0002-kompatibel (Filter darf den V1-Key nicht verändern).

### 8c — Statistik → Handlung (B4)
Jede ausgewiesene Schwäche bekommt eine Aktion: „Unterarmflexoren 41 % — 10 Karten dazu“.
**DoD:** Kein Statistik-Block ohne CTA; Selektoren aus `stats.ts` wiederverwendet, nicht dupliziert.

### 8d — Etymologie & Eselsbrücken
Optionales Feld im „Einfach“-Niveau: Herleitung des lateinischen Namens („flexor digitorum“ =
Beuger der Finger — der Name *ist* die Funktion) plus Merksatz.
**DoD:** Feld ist optional; fehlt es, rendert die Detailseite unverändert. Redaktion inkrementell.

### 8e — Eigene Notizen je Muskel
Freitext pro Muskel, lokal, im Backup **additiv** mitgeführt (unbekannte Keys ignoriert eine alte
Version — ADR 0002 bleibt gewahrt).
**DoD:** Round-Trip-Test gegen V1-Fixture bleibt grün.

### 8f — Platzhalter für bildlose Muskeln
Typografischer Platzhalter im Design-System statt Leerstelle. Die Bildquiz-Modi schließen bildlose
Muskeln **bereits** aus (`src/data/quiz.ts:89`) — hier geht es nur um die Detailseite.
**DoD:** 47 bildlose Muskeln sehen absichtlich aus, nicht unfertig.

---

## Etappe 9 — Die App wird prüfungsnah *(gated)*

**Nicht beginnen, bevor die zugehörige Entscheidung (E1–E3) gefallen ist.** Sonst wird das Falsche
gebaut: ein MC-Countdown für eine Prüfung, die mündlich stattfindet, ist verlorene Zeit.

### 9a — Funktionelle Gruppen *(Gate: E2)*
Muskel-kann-zu-Gruppen-gehören als Datendimension (Rotatorenmanschette, ischiocrurale Gruppe,
Kaumuskulatur …). Powert lektionsgroße Häppchen, einen Gruppen-Quizmodus und die Abzeichen.
Code ist billig; der Preis ist die Annotation.

### 9b — Kompetenz-Abzeichen *(Gate: 9a)*
Abzeichen messen Kompetenz, nicht Aktivität: „Rotatorenmanschette komplett“, „Alle Innervationen
obere Extremität“. Setzt alle Muskeln einer Gruppe in hoher Box voraus. **Ohne 9a gibt es nur
hohle Aktivitäts-Abzeichen — die lassen wir dann weg.**

### 9c — Prüfungsmodus + Debrief (B3) *(Gate: E1)*
Festes Set, kein Feedback bis zum Ende, Timer **nur hier**. Auswertung nach Region, Funktion,
Innervation und Verwechslungscluster — nicht als Punktzahl. Der Abschlussbildschirm hat **einen**
Button: „Jetzt aus den Fehlern lernen“ → seedet die verpassten Muskeln und startet die Mini-Session.

### 9d — Palpation *(Gate: E3)*
Textgestützte Zusatzsektion je Muskel: Lage am lebenden Körper, Landmarken, typische Verwechslung.
Keine Videos (Bundle-Größe, Lizenz).

---

## Abhängigkeiten

```
                    ┌── 7e (B2) ──┐
7a ──▶ 7b ──┬── 7c ─┤             ├──▶ 8a ──▶ 9b
            └── 7d ─┘   7f ───────┘      ▲
                (B1)                     │
            8b · 8c(B4) · 8d · 8e · 8f ──┘   (unabhängig, jederzeit)

9a ◀── E2      9c ◀── E1      9d ◀── E3
```

7a ist die Wurzel: ohne die Empfehlungs-Engine gibt es keinen Heute-Screen. 7e und 7f hängen an
nichts und können jederzeit parallel laufen.

## Leitplanken (gelten in jeder Etappe)

- **Statisch, kein Backend.** Keine externen Laufzeit-Requests außer Repo-Daten.
- **ADR 0002 bleibt unangetastet.** Neue Persistenz ist **additiv**: unbekannte Keys ignoriert eine
  alte Version, `nameLatin` bleibt der Backup-Schlüssel, die Leitner-Box bleibt der Fälligkeits-Schlüssel.
- **UI rendert nur.** Empfehlung, Seeding, Normalisierung, Streak-Rechnung liegen in `src/data/`
  bzw. `src/persistence/` und sind getestet.
- **Kein Zustand ohne Primärbutton.** Leere Zustände sind Ausstiegspunkte.
- **Timing nur im Prüfungsmodus.** Nie im normalen Lernen.
- Kein `any` in Kernpfaden, keine `window.*`-Globals, Conventional Commits, Branch pro Task.

## Bewusst nicht

FSRS-Migration · Audio-Aussprache · Cloud-Sync & Konto · Bestenlisten & Live-Quiz · teilbare
Ergebnisbilder · Werbung & Tracking · eigene 3D-Engine · KI-Chat-Tutor · handgeschriebener
Erklärtext für alle 150 Muskeln · die 47 fehlenden Bilder als Release-Blocker · Knochen/Nerven/Organe ·
starrer linearer Lernpfad.

Begründungen: [Brainstorming.txt](Brainstorming.txt) (Recherche, drei unabhängige Berichte).
Das Weglassen von Konto, Cloud und Tracking ist keine Lücke, sondern die Positionierung: „kein
Konto, keine Überwachung, funktioniert im Funkloch“ ist ein Satz, den Quizlet und Kenhub nicht sagen können.
