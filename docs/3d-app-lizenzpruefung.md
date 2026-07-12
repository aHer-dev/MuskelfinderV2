# Lizenzprüfung der eigenen 3D-App (Etappe 8f, Stufe 1)

**Datum:** 2026-07-13 · **Geprüftes Projekt:** `~/Documents/3D_ANATOMY_BIG/3DAnatomy 2.0`
**Anlass:** Entscheidung **E5** — Renderings aus der eigenen 3D-App dürfen in Muskelfinder
übernommen werden, **sofern sie BodyParts3D-basiert sind**. Ohne bestandene Prüfung: Platzhalter.

> **Diese Datei existiert, damit niemand die Frage ein zweites Mal raten muss.**
> Wer die 3D-App um neue Modelle erweitert, prüft erneut und schreibt das Ergebnis hier fort.

---

## Ergebnis: **BESTANDEN**

Die ausgelieferte Geometrie der 3D-App stammt **ausschließlich** aus BodyParts3D (DBCLS).
Renderings daraus sind abgeleitete Werke unter **CC BY 4.0** und dürfen mit Attribution
übernommen werden.

## Was geprüft wurde (nicht: was behauptet wird)

Die App **behauptet** BodyParts3D auf ihrer eigenen Quellenseite (`quellen-lizenzen.html`,
gestützt auf ihr ADR 0005). Eine Behauptung ist keine Prüfung — nachgesehen wurde die Substanz:

| Prüfung | Ergebnis |
|---|---|
| **Jede ausgelieferte Modelldatei** (`public/models/**`, 3 772 Dateien) | **Alle** folgen dem BodyParts3D-Schema `FJ<Nummer>[M].glb`. **Keine einzige Ausnahme.** |
| **Jeder Eintrag der Modell-Bundles** (5 × `*.bundle.json`, 789 Einträge) | **Alle** sind BodyParts3D-FJ-Teile. Null Fremdeinträge. |
| **Quell-Dateien** (`NEW MODELS/`, `.obj`) | Tragen die volle BodyParts3D-Herkunft im Namen, z. B. `FJ114_BP63250_FMA46823_Right levator anguli oris.obj` (BP = BodyParts3D-ID, FMA = Foundational Model of Anatomy). |
| **Eingebettete Texturen** in den Modellen | **0** Modelle enthalten Bilddaten — reine Geometrie. Damit stellt sich die Texturlizenz-Frage gar nicht erst. |
| **Suche nach kommerziellen Modellquellen** (Zygote, TurboSquid, Sketchfab, CGTrader, Primal, Visible Body, Complete Anatomy, 3D4Medical) | **Kein Treffer** in irgendeiner Modelldatei. |
| **glTF-Metadaten** | Generator ist die eigene Pipeline (Blender-Exporter, glTF-Transform). Kein fremder Copyright-Vermerk. |
| **Software-Abhängigkeiten der App** | three.js (MIT), Draco (Apache 2.0) — betrifft Code, **nicht** die Geometrie. |

## Pflichten bei Übernahme (Stufe 2a)

- **Attribution ist Pflicht:** „© DBCLS · BodyParts3D, CC BY 4.0" — am Bild **und** auf
  [`/quellen`](../src/pages/SourcesPage.tsx). Muskelfinder führt diese Attribution bereits für die
  bestehenden Bilder; neue Renderings reihen sich dort ein.
- Bilder gehören **ins Repo** (statische App, keine externen Laufzeit-Requests) und in den
  Service-Worker-Cache → **Bundle-Größe im Auge behalten**.

---

## Warum trotzdem (noch) kein einziges Rendering übernommen wurde

Die Lizenz erlaubt es. Die **Bildqualität** ist die zweite, unabhängige Hürde — und sie ist nicht
genommen:

1. **Nur 21 der 47 bildlosen Muskeln sind überhaupt adressierbar.** Die Deep-Link-Zuordnung der
   3D-App (`muskelfinder-map.json`, 118 Keys) deckt 121 der 150 Muskeln ab. Für die übrigen meldet
   der **eigene Build-Report der App** `"reason": "no-meta-match"` (28 Muskeln, darunter Masseter,
   Temporalis, Pterygoidei, Rectus abdominis). Deren Geometrie liegt teils in `NEW MODELS/`, ist aber
   noch nicht in die Metadaten der App eingepflegt.
2. **Der Deep-Link allein erzeugt kein brauchbares Bild.** Ein Kontrollrendering von
   `m_mylohyoideus` (headless, Chromium + SwiftShader — das funktioniert) zeigt: Die Kamera fährt auf
   die Region, der Muskel selbst liegt aber **hinter Unterkiefer und Zähnen** und ist nicht zu sehen.
   Für ein verwertbares Bild braucht es **pro Muskel** Isolation (verdeckende Strukturen ausblenden),
   Kamerawinkel und Hervorhebung — also redaktionelle Arbeit, keine Schleife.
3. **Ein Bild, auf dem der Muskel nicht zu erkennen ist, ist schlechter als kein Bild.** Das ist die
   Regel des Briefings, und sie gilt hier wörtlich: Es würde ein Bild *versprechen* und keines
   *liefern*. Der Platzhalter ist ehrlicher.

**Konsequenz:** Stufe **2b** (typografischer Platzhalter) ist umgesetzt — für **alle 47**. Stufe 2a
bleibt möglich und ist lizenzrechtlich freigegeben, braucht aber einen eigenen Task **mit
Qualitäts-Gate**: Jedes Rendering muss vom Projektinhaber (Fachmann) angesehen und freigegeben
werden, bevor es in die App kommt.
