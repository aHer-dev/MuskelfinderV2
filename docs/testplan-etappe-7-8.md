# Testplan: alles Neue aus Etappe 7 + 8 (von Hand prüfen)

Stand: 2026-07-13 · Für den Projektinhaber. Automatische Tests laufen ohnehin (405 Stück) — hier geht
es um das, was nur ein Mensch beurteilen kann: **Fühlt sich das richtig an? Stimmt es fachlich?**

## Vorbereitung (2 Minuten)

```bash
npm run dev          # http://localhost:5173/Muskelfinder-V2/
```

**Wichtig:** Die Hälfte der Neuerungen ist von Hand kaum erreichbar — eine Karte in **Fach 7**
bekommst du natürlich erst nach sieben richtigen Abrufen über Monate. Darum gibt es einen Seed:

1. App öffnen, **F12** → Reiter *Konsole*.
2. Inhalt von [`scripts/testdaten-seed.js`](../scripts/testdaten-seed.js) hineinkopieren, Enter.
3. Die Seite lädt neu. Fertig.

Der Seed legt an: 8 Karten (2 × Fach 7, 1 × „nie gesehen", 1 × „falsch beantwortet", 1 × „schwierig",
1 × bildlos), ein Profil (Physio, **Prüfung in 5 Tagen**), 2 nachgeschlagene Muskeln außerhalb des
Kastens, 2 Quiz-Modi mit sehr unterschiedlicher Quote und eine 4-Tage-Serie mit 1 Freeze.

> **Zurücksetzen:** In der Konsole `localStorage.clear()` und neu laden. Damit bist du wieder im
> echten Kaltstart (nützlich für Fall 1).

---

## Die 6 Fälle, an denen sich die Etappe entscheidet

### 1 · Kaltstart: von 0 auf die erste bewertete Karte
**Vorher:** `localStorage.clear()` → neu laden.
**Schritte:** `/heute` öffnet sich → Beruf wählen → Prüfungstermin (oder überspringen).
**Erwartung:** Der Karteikasten ist **nicht leer** — die App hat ihn selbst mit ~20 Muskeln gefüllt,
passend zum Beruf (Logo → Kopf/Hals, Ergo → Hand, Physio → Beine/Rumpf). Von der Startseite bis zur
ersten bewerteten Karte sind es **zwei Klicks**.
**Was hier scheitern kann:** Ein leerer Kasten. Genau daran ist V1 bei deinen Schülern gestorben.

### 2 · Fach 7: die App verlangt den Namen
**Schritte:** Seed einspielen → `/lernkarten` → *Lernen starten*.
**Erwartung:** Die erste Karte zeigt **kein** „Aufdecken", sondern Funktion/Innervation/Ursprung/Ansatz
und ein **Eingabefeld**. Der Name muss getippt werden. Enter prüft, Enter geht weiter.

**Probier bewusst diese Eingaben** (Karte: *M. pectoralis major*):

| Eingabe | Erwartung |
|---|---|
| `M. pectoralis major` | **Richtig.** |
| `pectoralis major` | **Richtig** (das „M." ist optional) |
| `M. pectorais major` (Tippfehler) | **Fast** — mit sichtbarer Korrektur der Schreibweise |
| `M. pectoralis **minor**` | **Falsch** — obwohl nur 2 Zeichen anders! |

Der letzte Fall ist der wichtigste: `major`/`minor`, `longus`/`brevis`, `abductor`/`adductor`
(**ein** Zeichen Unterschied!) dürfen **nie** als Tippfehler durchgehen.

### 3 · Statistik: keine Zahl ohne Knopf
**Schritte:** `/statistik`.
**Erwartung:** Neben **jedem** Block, der eine Schwäche zeigt, steht genau eine Aktion:
„Die schwachen Karten üben · 3 Karten", „Kopf & Hals üben · 1 Karte", „Innervation üben · 30 % — dein
schwächster Modus", „Die Karten kurz vor dem Ziel üben · 1 Karte".
**Der eigentliche Test:** Klick auf einen davon → die Sitzung startet mit **genau so vielen Karten,
wie danebenstand**. Der Knopf darf nicht mehr versprechen, als er liefert.
**Gegenprobe:** `localStorage.clear()` → `/statistik` → die Knöpfe sind **deaktiviert und nennen den
Grund** („Dazu liegt keine Karte im Kasten"), statt stumm ins Leere zu greifen.

### 4 · Notizen: verlierst du etwas?
**Schritte:** Beliebiger Muskel → unten *Deine Notiz* → etwas tippen → **sofort** auf „Zur Suche"
klicken, ohne zu warten → zurück zum Muskel.
**Erwartung:** Der Text ist **da**. Es gibt keinen Speichern-Knopf, und trotzdem geht nichts verloren.
**Zweiter Test:** Notiz komplett leeren → sie verschwindet ganz (keine leere Notiz im Backup).

### 5 · Etymologie: stimmt das fachlich?
**Schritte:** Beliebiger Muskel → oben auf **„Einfach"** umschalten → Block *Den Namen verstehen*.
**Erwartung:** z. B. *flexor = Beuger · digitorum = der Finger bzw. der Zehen · longus = lang*.
Im **„Fachlich"**-Niveau ist der Block **nicht** da.
**Deine Aufgabe hier:** Das Lexikon (~110 Bausteine) ist Standard-Vokabular, aber **du** bist der
Fachmann — geh ein paar Muskeln durch und sag mir, wo ich danebenliege. Die Datei ist
[`src/data/editorial/etymology.json`](../src/data/editorial/etymology.json).
**Merksätze sind bewusst leer.** Ich habe keinen einzigen erfunden — ein falscher Merksatz wird
auswendig gelernt. Die schreibst du (Feld `muskeln.<nameLatin>.merksatz`).

### 6 · Backup: der Härtetest der ganzen Etappe
**Schritte:** `/statistik` → *Exportieren* → Datei öffnen.
**Erwartung:** Die Datei enthält jetzt zusätzlich `lookups`, `profile`, `streak` und `notes` — aber
**`"version": 2`** wie eh und je.
**Der eigentliche Test:** Ein **altes** Backup (aus V1 oder von vor Etappe 7) importieren.
→ Es muss **sauber durchgehen**, und deine Notizen/Serie/Profil dürfen dabei **nicht gelöscht**
werden. Ein Backup, das etwas nicht kennt, darf es nicht wegwerfen.

---

## Die weiteren Fälle (schneller durchzuklicken)

| # | Was | Wie | Erwartung |
|---|-----|-----|-----------|
| 7 | **Heute-Screen hat eine Meinung** | `/heute` nach Seed | Eine Überschrift, **eine** Empfehlung, **ein** Primärbutton („Los — 6 Karten lernen"), Zeitschätzung. Kein Menü von Optionen. |
| 8 | **Prüfungstermin wirkt** | Profil: Prüfung in 5 Tagen (Seed) vs. kein Termin | Mit nahem Termin steigt die Tagesdosis (bis 40), ohne Termin bleibt sie bei 20. |
| 9 | **Nachschlagen ist ein Lernsignal** | `/heute` → Abschnitt „Zuletzt nachgeschlagen = noch nicht gewusst" | *M. gluteus medius* (4× nachgeschlagen, nicht im Kasten) steht dort mit einem Knopf, der ihn **direkt** in den Kasten legt. |
| 10 | **Suche unterbricht die Sitzung nicht** | Sitzung starten → oben etwas suchen → zurück | Die Sitzung läuft **weiter** (Fortschritt 3/8 bleibt 3/8). Vor Etappe 7 war sie weg. |
| 11 | **Falschantwort erklärt sich** | `/quiz` → einen Modus → absichtlich falsch antworten | Es kommt ein **Kontrastsatz**, nicht nur die Lösung („X versorgt A. B dagegen wird von Y versorgt."). |
| 12 | **Serie & Freeze** | Seed setzt 4 Tage + 1 Freeze → `/heute` | Zeile „4 Tage in Folge · 1 Freeze". Nüchtern, kein Feuer, kein Konfetti. |
| 13 | **Session-Filter** | `/lernkarten` → *Auswahl* | „nur falsch beantwortete" → 2 · „nie gesehen" → 1 · „schwierig markiert" → 1. Die Zahl oben ändert sich mit. |
| 14 | **Filter ins Leere** | Filter „nur falsch beantwortete" + Bereich „Kopf & Hals"… oder ein Bereich ohne Treffer | **Kein leerer Screen**, sondern eine Erklärung + Knopf „Filter aufheben". |
| 15 | **Bildlose Muskeln** | `/muskel/masseter` (47 von 150 haben kein Bild) | Ein **gesetzter** Platzhalter mit Name/Region — sieht **absichtlich** aus, nicht wie ein kaputtes Bild. Ehrlich beschriftet. |
| 16 | **Platzhalter ≠ Bild** | `/quiz` → Bildquiz-Modi, mehrere Runden | *M. masseter* & Co. tauchen dort **nie** auf. Ein Platzhalter darf nicht abgefragt werden. |
| 17 | **Dark Mode + Tastatur** | Alles oben nochmal im Dunkelmodus; Sitzung nur mit Tastatur | Nichts bricht. Feedback nie **nur** über Farbe. |

---

## Wenn dir etwas komisch vorkommt

Zwei Dinge sind **absichtlich** offen und keine Fehler:

1. **Keine Merksätze** (Fall 5) — die schreibst du, ich erfinde sie nicht.
2. **Keine 3D-Renderings** für die bildlosen Muskeln (Fall 15). Die Lizenzprüfung ist
   [bestanden](3d-app-lizenzpruefung.md), aber der Deep-Link allein liefert kein brauchbares Bild:
   Im Kontrollrendering lag der Muskel hinter dem Unterkiefer. Ein Bild, auf dem der Muskel nicht zu
   erkennen ist, ist schlechter als keins.

Alles andere: bitte melden.
