# Briefing an die Planung — Muskelfinder V2: Feature-Brainstorming

**Datum:** 2026-07-12 · **Status der App:** funktional vollständig, technisch grün, noch nicht veröffentlicht
**Adressat:** Planung/Brainstorming — **du hast keinen Zugriff auf die Dateien.** Dieses Dokument
enthält alles, was du über den Ist-Zustand wissen musst. Wenn dir etwas fehlt, frag nach, statt zu raten.

---

## 1. Der Auftrag

Die App ist fertig im Sinne von „funktioniert und ist sauber gebaut". Sie ist **nicht** fertig im Sinne von
„eine Studentin öffnet sie, bleibt hängen und nimmt nichts anderes mehr".

**Produktziel:** Die ideale Lernplattform für Anatomie (Muskulatur) für Studierende der Physiotherapie,
Ergotherapie und Logopädie. Sie soll:

1. **fachlich tragen** — man besteht damit die Prüfung, ohne ein zweites Werkzeug zu brauchen,
2. **Spaß machen** — man geht freiwillig rein, nicht nur unter Prüfungsdruck,
3. **schick aussehen** — auf dem Niveau kommerzieller Apps, nicht wie ein Studienprojekt,
4. **binden** — es gibt keinen Grund, zu Anki, Quizlet, Kenhub oder Complete Anatomy abzuwandern.

**Was du liefern sollst:**
- Eine priorisierte Feature-Landkarte (was zuerst, was später, was bewusst nie).
- Für jedes größere Feature: welches Problem der Studentin es löst, und woran man merkt, dass es wirkt.
- Konkrete UI/UX-Vorschläge, keine Schlagworte („Gamification" ist keine Antwort, „Streak-Freeze nach
  Duolingo-Vorbild, weil Abbruch nach verpasstem Tag der häufigste Absprung ist" schon).
- Eine ehrliche Aussage, wo wir gegen die Konkurrenz **nicht** gewinnen können und es lassen sollten.

**Stelle Rückfragen.** Am Ende dieses Dokuments stehen die Fragen, die ich schon habe — sie sind
Startpunkt, nicht Grenze.

---

## 2. Zielgruppe (soweit bekannt — hier ist Nachfragen erwünscht)

Studierende in Physio-/Ergo-/Logopädie-Ausbildung. Sie lernen Muskulatur typischerweise
**Ursprung, Ansatz, Funktion, Innervation, Segmente** auswendig — das ist stumpfe, große
Auswendiglernarbeit unter Zeitdruck vor Testaten. Sie lernen mobil (Bahn, Pausen) und am Schreibtisch.
Sie sind keine Mediziner: Latein ist Hürde, nicht Muttersprache.

*Nicht validiert:* Ob sie in Lerngruppen arbeiten, ob Dozierende Vorgaben machen, wie die Prüfungen
konkret aussehen (mündlich? MC? am Präparat? am Modell?). **Das ist die wichtigste offene Frage.**

---

## 3. Was die App heute kann (vollständig)

Statische Web-App, läuft im Browser, **offline-fähig (PWA, installierbar)**, kein Login, kein Konto,
kein Server. Aller Fortschritt liegt im Browser des Geräts (localStorage) und ist per Backup-Datei
exportierbar/importierbar.

### 3.1 Datenbestand
- **150 Muskeln**, 4 Regionen (Obere Extremität, Untere Extremität, Wirbelsäule & Rumpf, Kopf & Hals).
- Je Muskel: lateinischer Name, Region, Subregion, Ursprung, Ansatz, Funktionsbeschreibung,
  Funktionen (Bewegungs-Tags), Innervation, Segmente, Gelenke, **klinischer Bezug**, Schwierigkeit (1–3),
  Bilder.
- **111 verschiedene Bewegungen** als Tags (z. B. Flexion, Abduktion, Außenrotation).
- **152 Bilddateien**, BodyParts3D/DBCLS, **CC BY 4.0 — Attribution ist Pflicht und sichtbar**.
  **47 der 150 Muskeln haben kein Bild.** Das ist ein bekannter Datenmangel aus V1.
- Segmente fehlen bei **48 von 150** Muskeln. Keine TA-Codes.

### 3.2 Seiten & Funktionen

**Suche (Startseite)**
- Volltextsuche über lateinischen Namen, deutsche Begriffe, Stichworte. Treffer werden im Namen
  hervorgehoben.
- Filter: Region (Mehrfachauswahl), Gelenk, Bewegung, Innervation (Nerv), Sortierung.
- Ergebnis als Karten-Raster mit Name, Region/Subregion, Bewegungs-Tags, Schwierigkeitspunkten.
- **Filterzustand steht in der URL** → teilbar/deep-linkbar.
- Mobil: Filter in einem Bottom-Sheet, Region als Chip-Reihe.

**Muskel-Detail**
- Umschalter **„Fachlich" / „Einfach"** — zwei Sprachniveaus derselben Inhalte.
- Ursprung, Ansatz, Funktion, Innervation, Segmente, Gelenke; **klinischer Bezug** hervorgehoben.
- Bild-Viewer mit mehreren Ansichten (ventral/dorsal/lateral …), Thumbnails, Attribution.
- Aktionen: **„Merken"** (Sammlung), **„Zu Lernkarten"** (Karteikasten), **„In 3D ansehen"**
  (Deep-Link in die eigene 3D-Anatomie-App, 121 der 150 Muskeln unterstützt).

**Karteikasten (Verwaltung)**
- Tabelle der Karten im Kasten: Muskel, Bereich, Leitner-Fach, Fälligkeit, Entfernen.
- Bulk-Hinzufügen: Suche + Region-Tabs + Checkboxen, „Ausgewählte hinzufügen" / „Alle sichtbaren
  hinzufügen".

**Lernkarten (Spaced Repetition)**
- **Leitner-System mit 7 Fächern**, Intervalle 1/3/7/14/30/90/180 Tage.
- Setup vor der Session: Kartenlimit, Bereich (Region), nur-schwierige.
- Karte: Vorderseite Muskelname + Region → aufdecken → Rückseite mit allen Fakten (Name wird
  wiederholt). Optional Bild zuschalten.
- Bewertung: **Falsch / Unsicher / Richtig** (Tasten 1/2/3, mobil Wischen). „Schwierig"-Flag (F).
- Fächer-Übersicht während der Session, Zusammenfassung am Ende.

**Quiz — 10 Modi**
- Bild → Muskel · Name → Bild (Bildoptionen) · Bild↔Name gemischt
- Ursprung → Ansatz · Ansatz → Ursprung · gemischt
- Funktion → Muskel · Muskel → Funktion · gemischt
- Innervation (welcher Nerv versorgt den Muskel)
- Multiple Choice mit 4 Optionen (A–D), Bereichsfilter, 10 Fragen je Runde, Fortschrittsbalken,
  sofortiges Feedback mit ✓/✗ und Nennung der richtigen Antwort.

**Statistik**
- Kacheln: Karten im Kasten, Gemeistert, Quiz-Trefferquote, Quiz-Runden.
- Level-Ring + XP-Bilanz, Lernkarten-Aufschlüsselung (Neu/In Arbeit/Gemeistert),
  **Beherrschung nach Region** (Balken), **Quiz-Bilanz je Modus** mit bester Quote, **Ziele/Meilensteine**.
- **Backup**: Export/Import als Datei (kompatibel mit dem alten V1-Format).

**Gamification (heute)**
- **XP** für Kartenbewertungen und Quizantworten, **Level 1–99** (exponentielle Kurve).
- **Tagesbonus** (10 XP, einmal täglich beim Öffnen).
- **Toasts** bei XP-Gewinn und Level-Up. Level-Ring dauerhaft in der Navigation.
- Meilensteine für gemeisterte Karten.

**Rechtliches**: Quellen & Lizenzen, Datenschutz — beide inhaltlich fertig.

### 3.3 Design & Bedienung
- Eigenes Token-System. **Ein einziger Akzent: Orange (#ff6a00).** Marke „Anatomie Fokus".
- Schriften: **Sora** (Titel) + **Manrope** (Text), self-hosted.
- **Light- und Dark-Mode**, beide vollwertig. Light = warmes Papier, Dark = Marken-Schwarz.
- Desktop: schmale Glas-Icon-Leiste links. Mobil: Tab-Leiste unten, Bottom-Sheets.
- Eigenes SVG-Icon-Set (27 Symbole), keine Emoji, keine Icon-Library.
- **Barrierefreiheit: axe-Audit über alle Seiten in Light+Dark = 0 Verstöße** (WCAG 2 A/AA).
  Tastaturbedienung, Fokus-Ringe, Roving-Tabindex, Fokus-Trap in Sheets, `prefers-reduced-motion`.

### 3.4 Technischer Stand
- Vite + React 19 + TypeScript (strict) + Zustand. Tests: Vitest, **170 grün**. Lint sauber.
- Route-Code-Splitting, Bild-Lazy-Load, Service Worker (offline).
- **Noch nicht veröffentlicht.** Kein Git-Remote, nichts gepusht.

---

## 4. Harte Grenzen (nicht verhandelbar — Vorschläge müssen sie einhalten)

1. **Kein Backend, kein Server, kein Login.** Statische Seite. Das heißt konkret: **keine Cloud-Sync,
   keine Konten, keine serverseitigen Bestenlisten, kein Multiplayer in Echtzeit.**
   → *Wer „soziale Features" vorschlägt, muss sagen, wie das ohne Server geht.*
2. **Keine externen Laufzeit-Requests.** Keine CDNs, keine Analytics, keine Fremd-APIs.
3. **Keine fremden Modelle/Bilder ohne geklärte Lizenz.** Bestehende Bilder: CC BY 4.0, Attribution
   muss sichtbar bleiben.
4. Fortschritt lebt im Browser. Gerätewechsel geht **nur** über die Backup-Datei.
5. Datenformat der Persistenz ist eingefroren (V1-kompatibel) — Erweiterungen ja, Brüche nein.

---

## 5. Beobachtete Schwächen (Ausgangspunkte, keine Aufgabenliste)

Aus einem gerade abgeschlossenen UX-Review, ehrlich benannt:

- **Der Einstieg ist kalt.** Neue Nutzerin landet auf einer Liste mit 150 Muskeln. Es gibt kein
  Onboarding, keinen Lernpfad, keine Empfehlung, wo man anfängt. Der Karteikasten ist leer und muss
  von Hand befüllt werden, bevor Lernkarten überhaupt etwas tun.
- **Es gibt keine Didaktik-Struktur.** Die App kennt Muskeln, aber keine *Lektionen*, keine
  funktionellen Gruppen (Agonist/Antagonist, Muskelketten), keine Reihenfolge, kein Curriculum.
- **Falsche Quizantworten erklären nichts.** Man sieht die richtige Antwort — man lernt nicht, *warum*.
- **Kein Prüfungsmodus.** Keine Zeit, keine Simulation eines Testats, keine Auswertung „was muss ich
  nochmal ansehen".
- **47 Muskeln ohne Bild** — im Bild-Quiz und auf der Detailseite eine spürbare Lücke.
- **Die Gamification ist dünn.** XP und Level existieren, aber es gibt keine Streak, keine Abzeichen,
  keinen Grund, morgen wiederzukommen.
- Statistik zeigt *Zahlen*, aber gibt keine *Empfehlung* („deine Unterarmflexoren sind schwach —
  10 Karten dazu?").

---

## 6. Der Wettbewerb (was wir schlagen müssen)

- **Anki** — mächtig, hässlich, hohe Einstiegshürde, Decks von wechselnder Qualität. *Unsere Chance:
  kuratierte Daten + null Setup.*
- **Quizlet** — hübsch, aber generisch und werbefinanziert. *Unsere Chance: Fachtiefe.*
- **Kenhub / Complete Anatomy / Visible Body** — professionell, sehr schön, **kostenpflichtig**.
  *Unsere Chance: kostenlos, offline, ohne Konto — und für genau dieses Curriculum gemacht.*
- **Das Skript der Dozentin + ein Zettelkasten.** Der eigentliche Hauptkonkurrent. *Unsere Chance:
  wir sind schneller und wiederholen automatisch.*

---

## 7. Offene Fragen an die Planung

### Zielgruppe & Didaktik (bitte zuerst — davon hängt alles ab)
1. Wie sehen die realen Prüfungen aus (MC, mündlich, Präparat, Bewegungsanalyse)? Sollen wir die
   Prüfungsform **simulieren**?
2. Brauchen wir **Lernpfade/Lektionen** entlang des Semesters (z. B. „Woche 3: Schultergürtel") —
   oder bleibt die App ein Werkzeug, das sich die Studentin selbst strukturiert?
3. Muskeln lernt man selten einzeln, sondern in **funktionellen Gruppen** (Rotatorenmanschette,
   ischiocrurale Gruppe, Antagonisten-Paare). Soll die Datenschicht das abbilden — und wenn ja,
   woher kommen die Gruppen?
4. Ist **Palpation / Oberflächenanatomie** (wo taste ich den Muskel am lebenden Menschen?) ein Thema?
   Für Physios ist es prüfungsrelevant — wir haben dazu heute nichts.

### Lernmechanik
5. Leitner mit festen Intervallen ist simpel, aber unterlegen gegenüber **SM-2/FSRS** (wie Anki).
   Lohnt der Wechsel — oder ist der Kompatibilitätsbruch mit dem alten Backup-Format zu teuer?
6. Sollen **falsche Quizantworten erklärt** werden („Nein — der M. supraspinatus abduziert, es ist
   nicht der Infraspinatus, der rotiert außen")? Das wäre redaktionelle Arbeit an 150 Muskeln.
7. Braucht es einen **Prüfungsmodus** (Zeit, kein Feedback bis zum Ende, Auswertung mit
   Lernempfehlung)?
8. Soll die App aus der Statistik **aktiv Empfehlungen ableiten** („heute 12 Karten fällig, davon
   8 aus deiner schwächsten Region")?

### Motivation & Bindung (ohne Server!)
9. **Streak** (Tage in Folge) — ja? Mit Streak-Freeze? Das ist der stärkste bekannte Bindungshebel,
   aber auch der, der Nutzer bei Abbruch frustriert.
10. **Abzeichen/Achievements** — oder wird das schnell hohl? Was wäre ein Abzeichen, auf das eine
    Physio-Studentin wirklich stolz wäre?
11. Wettbewerb ohne Server: Ist ein **lokaler Highscore / „gegen dich selbst"** genug? Oder gibt es
    einen legitimen Weg zu sozialem Vergleich (z. B. teilbarer Ergebnis-Link, exportierbarer
    Lernstand als Bild)?
12. Ist **Zeitdruck** (Countdown im Quiz) motivierend oder stressend für diese Zielgruppe?

### UI/UX
13. Der **Erststart** ist heute kalt. Wie sieht ein Onboarding aus, das in unter 60 Sekunden zum
    ersten Lernerfolg führt — ohne wie ein Tutorial-Gefängnis zu wirken?
14. Der Karteikasten muss **manuell befüllt** werden. Sollte die App stattdessen standardmäßig
    *alle* Muskeln als Karten führen und die Auswahl über Filter/Lernpfade steuern?
15. **Mobil ist der Hauptkontext** (Bahn, Pause). Ist die App heute wirklich „daumenfreundlich" —
    oder ist sie eine Desktop-App, die auf Mobil auch geht?
16. Wo braucht es **Bewegung/Animation**, damit es sich hochwertig anfühlt, ohne kindisch zu werden?
    (Marke ist erwachsen, klinisch, orange-akzentuiert — kein Duolingo-Bunt.)
17. Die **Zwei-Sprachniveaus** („Fachlich"/„Einfach") sind ein starkes, unterschätztes Feature.
    Sollten sie tiefer gehen (Merksätze, Eselsbrücken, Herleitung des lateinischen Namens)?

### Inhalt & Daten
18. **47 Muskeln ohne Bild.** Optionen: aus BodyParts3D nachziehen, aus der eigenen 3D-App rendern,
    oder betroffene Muskeln aus dem Bild-Quiz ausschließen. Was ist realistisch?
19. Sollen **eigene Notizen** je Muskel möglich sein (die Studentin schreibt mit, was die Dozentin
    gesagt hat)?
20. **Audio** — lateinische Aussprache? Für Logopädie-Studierende naheliegend, für uns Neuland.

---

## 8. Nicht-Ziele (bis jemand gut begründet, warum doch)

- Kein Konto, kein Cloud-Sync, keine serverseitige Bestenliste.
- Keine Werbung, kein Tracking, keine Monetarisierung.
- Keine eingebetteten fremden 3D-Modelle (nur der Link in die eigene 3D-App).
- Kein Ausweiten auf andere Anatomie-Systeme (Knochen, Organe, Nerven) **in dieser Runde** —
  erst muss die Muskulatur exzellent sein.

---

## 9. Was ich als Ergebnis erwarte

1. **Rückfragen** zu allem, was oben unklar oder unbelegt ist — besonders zur Zielgruppe (Abschnitt 2).
2. Eine **priorisierte Landkarte**: 3–5 Dinge, die den größten Unterschied machen, mit Begründung
   *aus Sicht der Studentin*, nicht aus Sicht der Technik.
3. Für die Top-Vorschläge je: Problem → Lösung → wie wir merken, dass es wirkt → grober Aufwand →
   Konflikt mit den harten Grenzen (Abschnitt 4)?
4. Eine **Streichliste**: was klingt gut, lohnt sich aber nicht.
