# Task: Etappe 8f — Die 47 bildlosen Muskeln

> **Zuerst lesen:** [Rahmen-Briefing Etappe 8](2026-07-12-etappe-8-uebersicht.md).

## Ziel
47 von 150 Muskeln haben kein Bild (so schon in V1). Heute klafft dort eine Lücke, die aussieht wie
ein Fehler. Am Ende dieses Tasks sieht sie **absichtlich** aus — oder sie ist geschlossen.

## Der Task hat zwei Stufen. Stufe 1 ist eine Prüfung, kein Code.

Entscheidung **E5** (2026-07-12) lautet: Renderings aus der **eigenen 3D-App** dürfen übernommen
werden — **sofern sie BodyParts3D-basiert sind.** Renderings von BodyParts3D-Modellen (DBCLS) sind
abgeleitete Werke unter **CC BY 4.0**; die Attribution führen wir ohnehin schon.

### Stufe 1 — Lizenzprüfung (zuerst, ohne Ausnahme)
- [ ] Prüfen, **welche Geometrie** in der 3D-App (`3DAnatomyV2`) tatsächlich steckt.
- [ ] **Nur** wenn dort ausschließlich BodyParts3D-Modelle (DBCLS) liegen, ist Stufe 2a erlaubt.
- [ ] Steckt **irgendwo** Fremdmaterial mit unklarer Lizenz drin → **Stufe 2b**, ohne Diskussion.
- [ ] Das Ergebnis der Prüfung wird schriftlich festgehalten (PROJECT_STATE + CHANGELOG), damit es
      niemand ein zweites Mal raten muss.

> **Harte Projektregel** (AGENTS.md): *Keine fremden Modelle/Bilder ohne geklärte Lizenz einbauen.*
> Im Zweifel gilt: kein Bild.

### Stufe 2a — Renderings übernehmen (nur nach bestandener Prüfung)
- [ ] Für die bildlosen Muskeln Ansichten aus der eigenen 3D-App rendern und wie die bestehenden
      Bilder einbinden ([public/muscles/](../../public/muscles/), `MuscleImage` in
      [src/types/index.ts](../../src/types/index.ts)).
- [ ] **Attribution ist Pflicht** und muss zum Rendering passen: „© DBCLS · BodyParts3D, CC BY 4.0",
      Quellenseite ([src/pages/SourcesPage.tsx](../../src/pages/SourcesPage.tsx)) entsprechend ergänzen.
- [ ] Bilder gehören ins Repo (statische App, keine externen Laufzeit-Requests) und in den
      Service-Worker-Cache — auf die **Bundle-Größe achten**.
- [ ] Muskeln, für die es auch dann kein Rendering gibt, bekommen den Platzhalter aus 2b.

### Stufe 2b — Typografischer Platzhalter (Fallback, immer nötig)
- [ ] Ein gestalteter Platzhalter im Design-System: Name, Region, Subregion — **absichtlich**, nicht
      leer. Nur Tokens, kein Fremd-Asset.
- [ ] Ehrlich beschriftet: „Für diesen Muskel liegt kein lizenzfreies Bild vor." Keine Attrappe, die
      wie ein kaputtes Bild aussieht.

## Anforderungen (beide Stufen)
- [ ] Die Bildquiz-Modi schließen bildlose Muskeln **bereits** aus
      ([src/data/quiz.ts](../../src/data/quiz.ts), `eligible`) — **das bleibt so**, solange sie kein
      echtes Bild haben. Ein Platzhalter ist **kein** Bild und darf nicht in den Bildquiz-Pool geraten.
- [ ] `alt`-Texte für neue Bilder wie bei den bestehenden (`nameLatin — Ansicht`).

## Nicht-Ziele
- **Keine fremden Bilder aus dem Netz.** Nicht von Kenhub, nicht aus Lehrbüchern, nicht „nur zum
  Testen".
- Keine KI-generierten Anatomiebilder — anatomisch falsche Bilder sind schlimmer als keine.
- Kein Nachzeichnen fremder Vorlagen.

## Definition of Done
- [ ] **Lizenzprüfung dokumentiert** (Ergebnis + Begründung), bevor ein einziges Bild dazukommt
- [ ] Test: Platzhalter-Muskeln tauchen **nicht** in den Bildquiz-Modi auf
- [ ] Alle neuen Bilder mit korrekter Attribution auf `/quellen`
- [ ] Bundle-/Precache-Größe geprüft (der Build meldet sie)
- [ ] axe: 0 Verstöße (Light + Dark)
- [ ] Gate grün · CHANGELOG · **Statustafel 8f auf `fertig`** · PROJECT_STATE nachgezogen
