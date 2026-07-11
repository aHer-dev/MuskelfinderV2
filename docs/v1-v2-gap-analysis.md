# V1 → V2 Feature-Gap-Analyse

> Stand: 2026-07-09. Zweck: festhalten, **was in V2 gegenüber der Original-App (V1) fehlt oder
> anders ist**, damit die App funktional wieder auf V1-Niveau gebracht werden kann. Ausgelöst
> durch die Beobachtung, dass die Lernkarten-Seite „leer" und strukturell anders ist.
>
> Quellen: V1 = `../Muskelfinder` (statische Multipage-App). V2 = dieses Repo.

## Kurzfassung
Die V2-Migration hat **Datenschicht, Persistenz und Design** vollständig, aber bei den
**Lern-Features spürbar reduziert** umgesetzt. Am gravierendsten: das komplette
**Karteikasten-/Muskelauswahl-System** fehlt, und der **Lernkarten-Ablauf** (Setup → Sitzung →
Zusammenfassung) wurde auf eine Minimalsitzung eingedampft. Die zugrunde liegenden **Daten sind
vollständig vorhanden** (inkl. `origin`/`insertion`/`functionDescription`), d. h. die fehlenden
Features sind rekonstruierbar, ohne die Datenmigration anzufassen.

Legende Schweregrad: 🔴 großer Funktionsverlust · 🟠 spürbar · 🟡 klein/kosmetisch · 🟢 V2 hat mehr.

---

## Vollständiger Seiten-/Funktions-Abgleich (Abschluss, 2026-07-11)
Nach Umsetzung §1–§7 wurde **jede V1-Seite und jedes JS-Modul** gegen V2 geprüft.

| V1-Seite / Modul | V2-Entsprechung | Status |
|---|---|---|
| `index.html` / `app.js` (Suche, Filter, Sortierung) | `SearchPage` (+ Mehrfach-Region, Deep-Link) | ✅ Parität+ |
| `muscle-details.html` / `details.js` | `MuscleDetailPage` (Expert/Easy, Bilder, Attribution, Merken, Zu Lernkarten, Chips, Tags) | ✅ Parität+ |
| `quizzes/flashcards.html` / `flashcards.js` | `FlashcardsPage` (Setup/Card/Summary) | ✅ |
| `quizzes/muscle-selection.html` / `muscle-selection.js` | `DeckManagerPage` | ✅ |
| `package-selector.js` (Regionen-Pakete) | Quiz-Bereichsfilter + Lernkarten-Bereich | ✅ (als Region-Scope) |
| `quizzes/quiz.html` / `quiz-session.js` / `quiz-filter.js` | `QuizPage` (+ Bereichsfilter) | ✅ |
| `movement-quiz.js` (Funktion↔Muskel) | Modi `function-to-muscle` / `muscle-to-function` | ✅ |
| `origin-insertion-quiz.js` (Ursprung↔Ansatz) | Modi `origin-insertion` / `insertion-origin` | ✅ |
| `image-match-quiz.js` (Bild↔Name) | Modus `image` (Bild→Muskel) | ⚠️ teilweise (s. u.) |
| `quizzes/stats.html` / `stats-dashboard.js` | `StatsPage` (+ Quote je Modus, Ziele) | ✅ |
| `gamification.js` (XP, Level, Streak, Tagesbonus, Toasts) | `xp.ts` + Toasts + `useDailyBonus` | ✅ |
| `nav.js` Menü (Suche/Lernkarten/Verwalten/Quiz/Statistik) | IconRail + TabBar | ✅ |
| `nav.js` Backup Import/Export | `BackupPanel` (Statistik) | ✅ |
| Theme-Umschalter | `ThemeToggle` | ✅ |
| `quellen-lizenzen.html` | `SourcesPage` (`/quellen`) | ✅ |
| `datenschutz.html` | `PrivacyPage` (`/datenschutz`) | ✅ |
| — (V1 hatte keine) | Offline/PWA | 🟢 V2-Extra |

### Bewusst nicht übernommen (Architektur-Entscheidung)
- **„In 3D ansehen" + externe 3D-Anatomie-App** (`details.js` `build3DAnatomyUrl`,
  `data/muskelfinder-map.json`-Fetch, Menü-Link, `get3DAnatomyUrl`). Erfordert **externe
  Laufzeit-Requests** und **fremde 3D-Modelle mit ungeklärter Lizenz** — beides durch die harten
  V2-Regeln ausgeschlossen (CLAUDE.md: „Statische App, keine externen Laufzeit-Requests"; „Keine
  fremden Modelle/Bilder ohne geklärte Lizenz"). **Bei Bedarf bewusst als eigene Entscheidung
  wieder aufnehmen** (dann als externer Link ohne Laufzeit-Fetch).

### Kleine, optionale Rest-Verfeinerungen (kein Funktionsverlust im Kern)
- **Quiz-Submodus „Gemischt"**: V1 bot je Quiztyp einen „Gemischt"-Modus (Richtungen zufällig
  gemischt). V2 hat die diskreten Richtungen einzeln, aber keinen kombinierten „Gemischt"-Modus.
- **Quiz-Submodus „Name → Bild"**: V1 konnte im Bildquiz auch Name→Bild (aus 4 Bildern das richtige
  wählen). V2 hat nur Bild→Muskel. Bräuchte ein Bild-Optionen-UI.

Diese zwei Punkte sind Komfort-Varianten bestehender Modi; alle **Inhalte/Daten** dafür sind da.

---

> **Fortschritt:** §1 ✅ · §2 ✅ · §3 ✅ · §4 ✅ · §5 ✅ · §6 ✅ (kein Handlungsbedarf) · §7 ✅ —
> **alle identifizierten Lücken geschlossen.**

## 1. ✅ Karteikasten-Verwaltung / Muskelauswahl — ERLEDIGT (war: fehlt komplett)
**V1:** Eigene Seite `quizzes/muscle-selection.html` (+ `muscle-selection.js`, `package-selector.js`):
- Zwei Bereiche: **„Im Karteikasten"** (Tabelle: Muskel · Bereich · Fach · Fällig · Entfernen) und
  **„Noch nicht im Karteikasten"**.
- Bulk-Hinzufügen: **„Ausgewählte hinzufügen"** (Checkboxen) und **„Alle sichtbaren hinzufügen"**.
- Filter: Suchfeld + **Subgruppen-Tabs**.
- Erreichbar aus dem Menü („📋 Muskeln verwalten") und aus dem Lernkarten-Setup
  („📋 Muskeln im Karteikasten verwalten").

**V2:** Es gibt **nur** den Einzel-Toggle „Zu Lernkarten" auf der Detailseite
([MuscleDetailPage.tsx](../src/pages/MuscleDetailPage.tsx)). Keine Übersicht, kein Bulk-Add, keine Route.

**Folge:** Der Karteikasten bleibt praktisch leer → die Lernkarten-Seite wirkt „leer/kaputt".
**Daten/Aufwand:** Store kann es bereits (`addCard`/`removeCard`, Fach/Fällig vorhanden). Es fehlt
eine neue Seite/Route `/karteikasten` (oder `/muskeln-verwalten`) + Bulk-Aktionen. **Mittel.**

---

## 2. ✅ Lernkarten-Ablauf — ERLEDIGT (war: stark reduziert)
**V1** (`quizzes/flashcards.html` + `flashcards.js`) hat **drei Screens**:

**a) Setup-Screen** (fehlt in V2 komplett):
- Link zur Karteikasten-Verwaltung inkl. Gesamtzahl.
- **„Heutige Wiederholung"** — Anzahl fälliger Karten.
- **Kartenlimit** (Sitzungsziel): Alle fälligen / 5 / 10 / 20 / 50.
- **„Lernen starten"**-Button (Sitzung startet bewusst, nicht automatisch).
- **Fächer-Übersicht** (Leitner 7) vor der Sitzung.
- **„Sitzung auf Bereich einschränken"** — Subgruppen-Baum (Region/Subgruppe).
- **Zurücksetzen** (Reset-Fortschritt).

**b) Card-Screen** (in V2 teilweise vorhanden):
- Fortschrittsbalken + `x/y` ✔ (V2 hat das).
- Karte mit Flip ✔ (V2 hat 3D-Flip).
- Bewertung Falsch/Unsicher/Richtig ✔ (V2 `RatingBar`).
- **Fehlt in V2:** „⚑ Als schwierig markieren" (Flag + Badge); **Bild-Zuschalten**
  („Mit Bild anzeigen"); **Tastatursteuerung** (Space/1/2/3/F); **Swipe** (mobil: ← Falsch,
  → Richtig, Tippen = Aufdecken); Zurück-zur-Übersicht-Button.

**c) Summary-Screen** (fehlt in V2):
- „Sitzung abgeschlossen 🎉" mit **Sitzungs-Statistik**.
- **Fächer nach der Sitzung** (Leitner-Vergleich).
- **„Weiter lernen"** / „Zur Übersicht".

**V2** ([FlashcardsPage.tsx](../src/pages/FlashcardsPage.tsx)): direkt Sitzung über alle fälligen
Karten, ohne Setup, ohne Limit, ohne Bereichseinschränkung, ohne Summary, ohne Flag/Bild/Keyboard.
Der Typ [`FlashcardSession.regionScope`](../src/types/index.ts) ist als Gerüst da, aber ohne UI.
**Daten/Aufwand:** Leitner/XP-Logik vorhanden. Setup/Summary/Flag/Keyboard neu bauen. **Mittel–Groß.**

---

## 3. ✅ Quiz „Ursprung & Ansatz" + Pool-Filter — ERLEDIGT (war: anderer Zuschnitt)
**V1** (`quiz.html`) = **3 Quiztypen mit je Submodi** + geteilter Filter:
- **🖼 Bildzuordnung:** Bild→Name · Name→Bild · Gemischt (`image-match-quiz.js`).
- **📍 Ursprung & Ansatz:** Ursprung→Ansatz · Ansatz→Ursprung · Gemischt (`origin-insertion-quiz.js`).
- **⚡ Funktions-Quiz:** Funktion→Muskel · Muskel→Bewegung · Gemischt (`movement-quiz.js`).
- **Quiz-Filter** (`quiz-filter.js`): gespeicherte Einschränkung des Muskel-Pools (Region/Subgruppe),
  gilt für alle Quiztypen.

**V2** ([QuizPage.tsx](../src/pages/QuizPage.tsx)) = **4 flache MC-Modi**:
- Funktion→Muskel ✔ · Muskel→Funktion ✔ · **Innervation (🟢 neu, in V1 nicht vorhanden)** · Bild→Muskel ✔.

**Unterschiede:**
- 🔴 **„Ursprung & Ansatz"-Quiz fehlt** — obwohl `origin`/`insertion` in den V2-Daten vorhanden sind.
- 🟠 **Submodi fehlen** (Name→Bild, Gemischt, Ansatz→Ursprung, Muskel→Bewegung als eigener Modus).
- 🟠 **Quiz-Filter/Pool-Einschränkung fehlt.**
- 🟢 V2 hat zusätzlich einen **Innervations-Modus** (Divergenz — behalten oder entfernen?).
**Daten/Aufwand:** Ursprung/Ansatz-Modus + Submodi + Pool-Filter. **Mittel.**

---

## 4. ✅ Statistik: Quote je Modus + Ziele — ERLEDIGT (war: reduzierte Panels)
**V1** (`stats-dashboard.js`): Hero „Lernstand auf einen Blick", Level-Panel, **Quiz-Bilanz je
Quiztyp** (Trefferquote, „Beste Quote"-Chip, Mini-Stats), **Deck & Wiederholung**, **Lernfortschritt**,
**Ziele/Meilensteine** („Noch X Karten bis Y in F5–F7", Quiz-Ziele).

**V2** ([StatsPage.tsx](../src/pages/StatsPage.tsx)): Kacheln (Level, XP, Karten, Trefferquote),
Level-Card (Ring), Region-Mastery, `CardBreakdown` (Fächer-Bento), Backup-Panel.

**Fehlt in V2:** Aufschlüsselung **je Quiztyp** (Quote/Antworten), **„Beste Quote"**,
**Ziele/Meilensteine**. **Daten/Aufwand:** aus Stores ableitbar; nur UI+Selektoren. **Klein–Mittel.**

---

## 5. ✅ Navigation / Menü — ERLEDIGT
**V1** (`nav.js`, Hamburger-Menü): 🔍 Suche · 🃏 Lernkarten · **📋 Muskeln verwalten** · 📝 Quiz ·
📊 Gesamtstatistik · **🧊 3D-Anatomie-App** (externer Link) · Theme · **Backup Import/Export im Menü**.

**V2** (IconRail/TabBar): Suche · Lernkarten · Quiz · Statistik · Theme. Import/Export liegt im
Backup-Panel der Statistik.

**Fehlt:** Eintrag **„Muskeln verwalten"** (siehe §1); optionaler **3D-App-Link** (nur wenn gewünscht/lizenzklar).
**Aufwand:** klein, sobald §1 existiert.

---

## 6. ✅ Detailseite — GEPRÜFT (kein Handlungsbedarf)
**Befund:** `functionalChain` ist in **allen 150 V1-Datensätzen leer** — es gibt keinen Inhalt zu
übernehmen. Das Weglassen bei der Migration war korrekt; nichts zu tun.

## 6b. (ursprüngliche Notiz) 🟡 Detailseite
**V2** zeigt Ursprung/Ansatz/Funktion/Innervation/Segmente + Bilder + Attribution + Fachlich/Einfach ✔.
**Fehlt/anders:** V1-Feld **`functionalChain`** (funktionelle Kette) wurde in der Migration nicht
übernommen (war in V1 oft leer). Prüfen, ob überhaupt inhaltlich befüllt; sonst ignorierbar. **Klein.**

---

## 7. ✅ Gamification-Feedback — ERLEDIGT
**V1:** XP-/Level-Up-**Toasts** („+X XP", Level-Up-Feier), Tagesbonus + Streak-Boni **mit sichtbarer
Rückmeldung**.
**V2:** XP-/Streak-/Tagesbonus-**Logik ist vorhanden** ([persistence/xp.ts](../src/persistence/xp.ts),
[useProgressStore.ts](../src/store/useProgressStore.ts)), aber **ohne sichtbare Toast-Rückmeldung**;
zu prüfen, ob `awardDailyBonus` überhaupt aufgerufen wird. **Klein.**

---

## Datenlage (was ist ohne Daten-Neumigration machbar?)
Alle für die fehlenden Features nötigen Felder liegen in `src/data/generated/`:
`origin`, `insertion`, `functionDescription`, `functions`, `innervation`, `segments`, `subregion`,
`images`, `easy`. **Kein Datenfeld muss neu migriert werden**, außer optional `functionalChain`
(müsste aus V1 nachgezogen werden, falls inhaltlich gewünscht).

## Priorisierte Wiederaufbau-Roadmap (Vorschlag)
1. **§1 Karteikasten-Verwaltung** (Route + Bulk-Add) — behebt die „leere" Lernkarten-Seite an der Wurzel.
2. **§2 Lernkarten Setup-/Summary-Screen** + Kartenlimit + Bereichseinschränkung + Flag/Bild/Keyboard.
3. **§3 Quiz:** Ursprung&Ansatz-Modus + Pool-Filter (+ Entscheidung zu Submodi & Innervations-Modus).
4. **§4 Statistik:** Quiz-Bilanz je Typ + Ziele/Meilensteine.
5. **§5 Menü:** „Muskeln verwalten" (+ optional 3D-Link), **§7** XP-Toasts, **§6** functionalChain.

> Offen zu entscheiden (Produkt): Sollen V2-Ergänzungen (Innervations-Quiz) bleiben, oder strikt
> „genau wie V1"? Soll der 3D-App-Link zurück? Ist `functionalChain` inhaltlich relevant?
