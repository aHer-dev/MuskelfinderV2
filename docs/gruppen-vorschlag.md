# Gruppen-Vorschlag (Etappe 9a) — **zur fachlichen Prüfung**

> Erzeugt von `node scripts/propose-groups.mjs`. **Dieses Dokument ist ein Vorschlag,
> keine Wahrheit.** Erst was der Projektinhaber freigibt, landet in
> `src/data/editorial/groups.json`. Eine falsche Gruppenzuordnung wird auswendig gelernt.

Datenstand: **150 Muskeln**, 126 Tags. Kandidaten mit 3–15 Muskeln: **53**.

## ⚠️ Zuerst: Tag-Kollisionen in den Daten

Diese Tags sind für einen Menschen **dasselbe Wort**, für den Code aber zwei verschiedene.
**Nicht vorschnell „reparieren".** Prüfe erst, ob dahinter *eine* Gruppe steckt oder *zwei*:

- Sind es **zwei** Gruppen (z. B. Außenrotatoren der *Schulter* vs. der *Hüfte*), muss man sie
  **unterschiedlich benennen** — wer die Schreibweise vereinheitlicht, verschmilzt sie zu einer
  **falschen** Gruppe.
- Ist es **eine** Gruppe, gehört der Tag in den Daten korrigiert (`npm run migrate:data`-Quelle!).

- `außenrotator` → 2 Muskeln (Obere Extremität): M. infraspinatus, M. teres minor
- `aussenrotator` → 9 Muskeln (Untere Extremität): M. gluteus maximus, M. piriformis, M. obturatorius internus, M. obturatorius externus, M. gemellus superior, M. gemellus inferior, M. quadratus femoris, M. sartorius, M. biceps femoris – Caput breve

## Kandidaten aus einer Region (die saubersten)

### `knie` — 14 Muskeln · Untere Extremität
- M. tensor fasciae latae *(Hüfte)*
- M. sartorius *(Hüfte)*
- M. gracilis *(Hüfte)*
- M. rectus femoris *(Knie)*
- M. biceps femoris – Caput longum *(Knie)*
- M. semitendinosus *(Knie)*
- M. semimembranosus *(Knie)*
- M. vastus medialis *(Knie)*
- M. vastus intermedius *(Knie)*
- M. vastus lateralis *(Knie)*
- M. biceps femoris – Caput breve *(Knie)*
- M. articularis genus *(Knie)*
- M. popliteus *(Knie)*
- M. gastrocnemius *(Fuß & Sprunggelenk)*

### `fusssohle` — 11 Muskeln · Untere Extremität
- M. flexor digitorum brevis *(Fuß & Sprunggelenk)*
- M. quadratus plantae *(Fuß & Sprunggelenk)*
- Mm. interossei plantares *(Fuß & Sprunggelenk)*
- Mm. interossei dorsales *(Fuß & Sprunggelenk)*
- Mm. lumbricales *(Fuß & Sprunggelenk)*
- M. flexor hallucis brevis *(Fuß & Sprunggelenk)*
- M. abductor hallucis *(Fuß & Sprunggelenk)*
- M. adductor hallucis *(Fuß & Sprunggelenk)*
- M. flexor digiti minimi brevis *(Fuß & Sprunggelenk)*
- M. abductor digiti minimi *(Fuß & Sprunggelenk)*
- M. opponens digiti minimi *(Fuß & Sprunggelenk)*

### `kurze-fussmuskulatur` — 10 Muskeln · Untere Extremität
- M. extensor digitorum brevis *(Fuß & Sprunggelenk)*
- M. flexor digitorum brevis *(Fuß & Sprunggelenk)*
- M. quadratus plantae *(Fuß & Sprunggelenk)*
- M. extensor hallucis brevis *(Fuß & Sprunggelenk)*
- M. flexor hallucis brevis *(Fuß & Sprunggelenk)*
- M. abductor hallucis *(Fuß & Sprunggelenk)*
- M. adductor hallucis *(Fuß & Sprunggelenk)*
- M. flexor digiti minimi brevis *(Fuß & Sprunggelenk)*
- M. abductor digiti minimi *(Fuß & Sprunggelenk)*
- M. opponens digiti minimi *(Fuß & Sprunggelenk)*

### `schulterguertel` — 9 Muskeln · Obere Extremität
- M. pectoralis minor *(Schultergürtel)*
- M. serratus anterior *(Schultergürtel)*
- M. subclavius *(Schultergürtel)*
- M. trapezius – Pars descendens *(Schultergürtel)*
- M. trapezius – Pars transversa *(Schultergürtel)*
- M. trapezius – Pars ascendens *(Schultergürtel)*
- M. levator scapulae *(Schultergürtel)*
- M. rhomboideus major *(Schultergürtel)*
- M. rhomboideus minor *(Schultergürtel)*

### `ellenbogen` — 9 Muskeln · Obere Extremität
- M. biceps brachii *(Ellenbogen)*
- M. triceps brachii – Caput longum *(Ellenbogen)*
- M. triceps brachii – Caput laterale und mediale *(Ellenbogen)*
- M. anconeus *(Ellenbogen)*
- M. brachialis *(Ellenbogen)*
- M. pronator teres *(Ellenbogen)*
- M. brachioradialis *(Ellenbogen)*
- M. supinator *(Ellenbogen)*
- M. pronator quadratus *(Ellenbogen)*

### `aussenrotator` — 9 Muskeln · Untere Extremität
- M. gluteus maximus *(Hüfte)*
- M. piriformis *(Hüfte)*
- M. obturatorius internus *(Hüfte)*
- M. obturatorius externus *(Hüfte)*
- M. gemellus superior *(Hüfte)*
- M. gemellus inferior *(Hüfte)*
- M. quadratus femoris *(Hüfte)*
- M. sartorius *(Hüfte)*
- M. biceps femoris – Caput breve *(Knie)*

### `autochthon` — 9 Muskeln · Wirbelsäule & Rumpf
- Mm. interspinales *(Rückenmuskulatur)*
- Mm. spinales *(Rückenmuskulatur)*
- Mm. intertransversarii mediales *(Rückenmuskulatur)*
- Mm. rotatores *(Rückenmuskulatur)*
- M. semispinalis *(Rückenmuskulatur)*
- Mm. multifidi *(Rückenmuskulatur)*
- Mm. iliocostales *(Rückenmuskulatur)*
- Mm. longissimi *(Rückenmuskulatur)*
- Mm. splenii *(Rückenmuskulatur)*

### `mimik` — 9 Muskeln · Kopf & Hals
- M. orbicularis oris *(Mimikmuskulatur)*
- M. orbicularis oculi *(Mimikmuskulatur)*
- M. procerus *(Mimikmuskulatur)*
- M. nasalis *(Mimikmuskulatur)*
- M. nasalis *(Mimikmuskulatur)*
- M. corrugator supercilii *(Mimikmuskulatur)*
- M. occipitofrontalis *(Mimikmuskulatur)*
- M. occipitofrontalis *(Mimikmuskulatur)*
- Platysma *(Halsmuskulatur)*

### `fazialis` — 9 Muskeln · Kopf & Hals
- M. orbicularis oris *(Mimikmuskulatur)*
- M. orbicularis oculi *(Mimikmuskulatur)*
- M. procerus *(Mimikmuskulatur)*
- M. nasalis *(Mimikmuskulatur)*
- M. nasalis *(Mimikmuskulatur)*
- M. corrugator supercilii *(Mimikmuskulatur)*
- M. occipitofrontalis *(Mimikmuskulatur)*
- M. occipitofrontalis *(Mimikmuskulatur)*
- Platysma *(Halsmuskulatur)*

### `finger` — 8 Muskeln · Obere Extremität
- M. flexor digitorum superficialis *(Hand & Finger)*
- M. extensor digitorum *(Hand & Finger)*
- M. extensor digiti minimi *(Hand & Finger)*
- M. flexor digitorum profundus *(Hand & Finger)*
- M. extensor indicis *(Hand & Finger)*
- Mm. interossei palmares I–III *(Hand & Finger)*
- Mm. interossei dorsales I–IV *(Hand & Finger)*
- Mm. lumbricales I–IV *(Hand & Finger)*

### `daumen` — 8 Muskeln · Obere Extremität
- M. flexor pollicis longus *(Hand & Finger)*
- M. abductor pollicis longus *(Hand & Finger)*
- M. extensor pollicis brevis *(Hand & Finger)*
- M. extensor pollicis longus *(Hand & Finger)*
- M. flexor pollicis brevis *(Hand & Finger)*
- M. abductor pollicis brevis *(Hand & Finger)*
- M. adductor pollicis *(Hand & Finger)*
- M. opponens pollicis *(Hand & Finger)*

### `plantarflexion` — 8 Muskeln · Untere Extremität
- M. gastrocnemius *(Fuß & Sprunggelenk)*
- M. soleus *(Fuß & Sprunggelenk)*
- M. plantaris *(Fuß & Sprunggelenk)*
- M. tibialis posterior *(Fuß & Sprunggelenk)*
- M. fibularis longus (M. peroneus longus) *(Fuß & Sprunggelenk)*
- M. fibularis brevis (M. peroneus brevis) *(Fuß & Sprunggelenk)*
- M. flexor digitorum longus *(Fuß & Sprunggelenk)*
- M. flexor hallucis longus *(Fuß & Sprunggelenk)*

### `schlucken` — 8 Muskeln · Kopf & Hals
- M. masseter *(Kaumuskulatur)*
- M. temporalis *(Kaumuskulatur)*
- M. mylohyoideus *(Suprahyoidale Muskeln)*
- M. digastricus *(Suprahyoidale Muskeln)*
- M. geniohyoideus *(Suprahyoidale Muskeln)*
- M. stylohyoideus *(Suprahyoidale Muskeln)*
- M. sternohyoideus *(Infrahyoidale Muskeln)*
- M. thyrohyoideus *(Infrahyoidale Muskeln)*

### `hyoid` — 7 Muskeln · Kopf & Hals
- M. mylohyoideus *(Suprahyoidale Muskeln)*
- M. digastricus *(Suprahyoidale Muskeln)*
- M. geniohyoideus *(Suprahyoidale Muskeln)*
- M. stylohyoideus *(Suprahyoidale Muskeln)*
- M. sternohyoideus *(Infrahyoidale Muskeln)*
- M. thyrohyoideus *(Infrahyoidale Muskeln)*
- M. omohyoideus *(Infrahyoidale Muskeln)*

### `handgelenk` — 6 Muskeln · Obere Extremität
- M. flexor carpi radialis *(Hand & Finger)*
- M. flexor carpi ulnaris *(Hand & Finger)*
- M. extensor carpi radialis brevis *(Hand & Finger)*
- M. extensor carpi radialis longus *(Hand & Finger)*
- M. extensor carpi ulnaris *(Hand & Finger)*
- M. palmaris longus *(Hand & Finger)*

### `zehenflexion` — 6 Muskeln · Untere Extremität
- M. flexor digitorum longus *(Fuß & Sprunggelenk)*
- M. flexor digitorum brevis *(Fuß & Sprunggelenk)*
- M. quadratus plantae *(Fuß & Sprunggelenk)*
- Mm. interossei plantares *(Fuß & Sprunggelenk)*
- Mm. interossei dorsales *(Fuß & Sprunggelenk)*
- Mm. lumbricales *(Fuß & Sprunggelenk)*

### `medialer-trakt` — 6 Muskeln · Wirbelsäule & Rumpf
- Mm. interspinales *(Rückenmuskulatur)*
- Mm. spinales *(Rückenmuskulatur)*
- Mm. intertransversarii mediales *(Rückenmuskulatur)*
- Mm. rotatores *(Rückenmuskulatur)*
- M. semispinalis *(Rückenmuskulatur)*
- Mm. multifidi *(Rückenmuskulatur)*

### `schultergelenk` — 5 Muskeln · Obere Extremität
- M. pectoralis major *(Schultergürtel)*
- M. latissimus dorsi *(Schultergürtel)*
- M. deltoideus *(Schultergürtel)*
- M. teres major *(Schultergürtel)*
- M. coracobrachialis *(Schultergürtel)*

### `kleinfinger` — 5 Muskeln · Obere Extremität
- M. extensor digiti minimi *(Hand & Finger)*
- M. flexor digiti minimi brevis *(Hand & Finger)*
- M. abductor digiti minimi *(Hand & Finger)*
- M. opponens digiti minimi *(Hand & Finger)*
- M. palmaris brevis *(Hand & Finger)*

### `bauch` — 5 Muskeln · Wirbelsäule & Rumpf
- M. rectus abdominis *(Bauchmuskulatur)*
- M. obliquus externus abdominis *(Bauchmuskulatur)*
- M. obliquus internus abdominis *(Bauchmuskulatur)*
- M. transversus abdominis *(Bauchmuskulatur)*
- M. quadratus lumborum *(Bauchmuskulatur)*

### `hals` — 5 Muskeln · Kopf & Hals
- M. omohyoideus *(Infrahyoidale Muskeln)*
- M. sternocleidomastoideus *(Halsmuskulatur)*
- M. longus colli *(Prävertebrale Muskeln)*
- M. longus capitis *(Prävertebrale Muskeln)*
- Platysma *(Halsmuskulatur)*

### `elevator` — 4 Muskeln · Obere Extremität
- M. trapezius – Pars descendens *(Schultergürtel)*
- M. levator scapulae *(Schultergürtel)*
- M. rhomboideus major *(Schultergürtel)*
- M. rhomboideus minor *(Schultergürtel)*

### `retraktor` — 4 Muskeln · Obere Extremität
- M. trapezius – Pars transversa *(Schultergürtel)*
- M. trapezius – Pars ascendens *(Schultergürtel)*
- M. rhomboideus major *(Schultergürtel)*
- M. rhomboideus minor *(Schultergürtel)*

### `rotatorenmanschette` — 4 Muskeln · Obere Extremität
- M. subscapularis *(Schultergürtel)*
- M. supraspinatus *(Schultergürtel)*
- M. infraspinatus *(Schultergürtel)*
- M. teres minor *(Schultergürtel)*

### `hypothenar` — 4 Muskeln · Obere Extremität
- M. flexor digiti minimi brevis *(Hand & Finger)*
- M. abductor digiti minimi *(Hand & Finger)*
- M. opponens digiti minimi *(Hand & Finger)*
- M. palmaris brevis *(Hand & Finger)*

### `thenar` — 4 Muskeln · Obere Extremität
- M. flexor pollicis brevis *(Hand & Finger)*
- M. abductor pollicis brevis *(Hand & Finger)*
- M. adductor pollicis *(Hand & Finger)*
- M. opponens pollicis *(Hand & Finger)*

### `sakrofemoral` — 4 Muskeln · Untere Extremität
- M. piriformis *(Hüfte)*
- M. obturatorius internus *(Hüfte)*
- M. gemellus superior *(Hüfte)*
- M. gemellus inferior *(Hüfte)*

### `quadriceps` — 4 Muskeln · Untere Extremität
- M. rectus femoris *(Knie)*
- M. vastus medialis *(Knie)*
- M. vastus intermedius *(Knie)*
- M. vastus lateralis *(Knie)*

### `supination` — 4 Muskeln · Untere Extremität
- M. tibialis anterior *(Fuß & Sprunggelenk)*
- M. tibialis posterior *(Fuß & Sprunggelenk)*
- M. flexor digitorum longus *(Fuß & Sprunggelenk)*
- M. flexor hallucis longus *(Fuß & Sprunggelenk)*

### `beckenboden` — 4 Muskeln · Wirbelsäule & Rumpf
- M. coccygeus *(Beckenboden)*
- M. levator ani *(Beckenboden)*
- M. transversus perinei profundus *(Beckenboden)*
- M. transversus perinei superficialis *(Beckenboden)*

### `kaumuskulatur` — 4 Muskeln · Kopf & Hals
- M. masseter *(Kaumuskulatur)*
- M. temporalis *(Kaumuskulatur)*
- M. pterygoideus medialis *(Kaumuskulatur)*
- M. pterygoideus lateralis *(Kaumuskulatur)*

### `kiefergelenk` — 4 Muskeln · Kopf & Hals
- M. masseter *(Kaumuskulatur)*
- M. temporalis *(Kaumuskulatur)*
- M. pterygoideus medialis *(Kaumuskulatur)*
- M. pterygoideus lateralis *(Kaumuskulatur)*

### `suprahyoidal` — 4 Muskeln · Kopf & Hals
- M. mylohyoideus *(Suprahyoidale Muskeln)*
- M. digastricus *(Suprahyoidale Muskeln)*
- M. geniohyoideus *(Suprahyoidale Muskeln)*
- M. stylohyoideus *(Suprahyoidale Muskeln)*

### `infrahyoidal` — 4 Muskeln · Kopf & Hals
- M. sternohyoideus *(Infrahyoidale Muskeln)*
- M. sternothyroideus *(Infrahyoidale Muskeln)*
- M. thyrohyoideus *(Infrahyoidale Muskeln)*
- M. omohyoideus *(Infrahyoidale Muskeln)*

### `extensor` — 3 Muskeln · Obere Extremität
- M. latissimus dorsi *(Schultergürtel)*
- M. teres major *(Schultergürtel)*
- M. triceps brachii – Caput longum *(Ellenbogen)*

### `radialabduktor` — 3 Muskeln · Obere Extremität
- M. flexor carpi radialis *(Hand & Finger)*
- M. extensor carpi radialis brevis *(Hand & Finger)*
- M. extensor carpi radialis longus *(Hand & Finger)*

### `hand` — 3 Muskeln · Obere Extremität
- Mm. interossei palmares I–III *(Hand & Finger)*
- Mm. interossei dorsales I–IV *(Hand & Finger)*
- Mm. lumbricales I–IV *(Hand & Finger)*

### `intrinsisch` — 3 Muskeln · Obere Extremität
- Mm. interossei palmares I–III *(Hand & Finger)*
- Mm. interossei dorsales I–IV *(Hand & Finger)*
- Mm. lumbricales I–IV *(Hand & Finger)*

### `ischiokrural` — 3 Muskeln · Untere Extremität
- M. biceps femoris – Caput longum *(Knie)*
- M. semitendinosus *(Knie)*
- M. semimembranosus *(Knie)*

### `wadenmuskeln` — 3 Muskeln · Untere Extremität
- M. gastrocnemius *(Fuß & Sprunggelenk)*
- M. soleus *(Fuß & Sprunggelenk)*
- M. plantaris *(Fuß & Sprunggelenk)*

### `dorsalextension` — 3 Muskeln · Untere Extremität
- M. tibialis anterior *(Fuß & Sprunggelenk)*
- M. extensor digitorum longus *(Fuß & Sprunggelenk)*
- M. extensor hallucis longus *(Fuß & Sprunggelenk)*

### `vorderer-unterschenkel` — 3 Muskeln · Untere Extremität
- M. tibialis anterior *(Fuß & Sprunggelenk)*
- M. extensor digitorum longus *(Fuß & Sprunggelenk)*
- M. extensor hallucis longus *(Fuß & Sprunggelenk)*

### `tiefer-beugerloge` — 3 Muskeln · Untere Extremität
- M. tibialis posterior *(Fuß & Sprunggelenk)*
- M. flexor digitorum longus *(Fuß & Sprunggelenk)*
- M. flexor hallucis longus *(Fuß & Sprunggelenk)*

### `pronation` — 3 Muskeln · Untere Extremität
- M. fibularis longus (M. peroneus longus) *(Fuß & Sprunggelenk)*
- M. fibularis brevis (M. peroneus brevis) *(Fuß & Sprunggelenk)*
- M. extensor digitorum longus *(Fuß & Sprunggelenk)*

### `intertransversales-system` — 3 Muskeln · Wirbelsäule & Rumpf
- Mm. intertransversarii mediales *(Rückenmuskulatur)*
- Mm. iliocostales *(Rückenmuskulatur)*
- Mm. longissimi *(Rückenmuskulatur)*

### `transversospinales-system` — 3 Muskeln · Wirbelsäule & Rumpf
- Mm. rotatores *(Rückenmuskulatur)*
- M. semispinalis *(Rückenmuskulatur)*
- Mm. multifidi *(Rückenmuskulatur)*

### `lateraler-trakt` — 3 Muskeln · Wirbelsäule & Rumpf
- Mm. iliocostales *(Rückenmuskulatur)*
- Mm. longissimi *(Rückenmuskulatur)*
- Mm. splenii *(Rückenmuskulatur)*

### `lateralflexor` — 3 Muskeln · Wirbelsäule & Rumpf
- M. obliquus externus abdominis *(Bauchmuskulatur)*
- M. obliquus internus abdominis *(Bauchmuskulatur)*
- M. quadratus lumborum *(Bauchmuskulatur)*

## Kandidaten über mehrere Regionen — meist **zu weit**

Ein Tag wie `adduktor` fasst Hüft- **und** Daumenadduktoren zusammen. Das ist eine
*Eigenschaft*, keine Lerngruppe. Wenn überhaupt, dann **je Region getrennt**.

### `adduktor` — 11 Muskeln, verteilt auf: Obere Extremität (5) · Untere Extremität (6)
- M. pectoralis major *(Obere Extremität · Schultergürtel)*
- M. latissimus dorsi *(Obere Extremität · Schultergürtel)*
- M. teres major *(Obere Extremität · Schultergürtel)*
- M. coracobrachialis *(Obere Extremität · Schultergürtel)*
- M. adductor pollicis *(Obere Extremität · Hand & Finger)*
- M. pectineus *(Untere Extremität · Hüfte)*
- M. adductor longus *(Untere Extremität · Hüfte)*
- M. adductor brevis *(Untere Extremität · Hüfte)*
- M. adductor magnus *(Untere Extremität · Hüfte)*
- M. quadratus femoris *(Untere Extremität · Hüfte)*
- M. gracilis *(Untere Extremität · Hüfte)*

### `abduktor` — 8 Muskeln, verteilt auf: Obere Extremität (5) · Untere Extremität (3)
- M. deltoideus *(Obere Extremität · Schultergürtel)*
- M. supraspinatus *(Obere Extremität · Schultergürtel)*
- M. abductor pollicis longus *(Obere Extremität · Hand & Finger)*
- M. abductor digiti minimi *(Obere Extremität · Hand & Finger)*
- M. abductor pollicis brevis *(Obere Extremität · Hand & Finger)*
- M. gluteus medius *(Untere Extremität · Hüfte)*
- M. gluteus minimus *(Untere Extremität · Hüfte)*
- M. tensor fasciae latae *(Untere Extremität · Hüfte)*

### `innenrotator` — 7 Muskeln, verteilt auf: Obere Extremität (4) · Untere Extremität (3)
- M. pectoralis major *(Obere Extremität · Schultergürtel)*
- M. latissimus dorsi *(Obere Extremität · Schultergürtel)*
- M. subscapularis *(Obere Extremität · Schultergürtel)*
- M. teres major *(Obere Extremität · Schultergürtel)*
- M. gluteus minimus *(Untere Extremität · Hüfte)*
- M. tensor fasciae latae *(Untere Extremität · Hüfte)*
- M. popliteus *(Untere Extremität · Knie)*

### `atemhilfsmuskel` — 4 Muskeln, verteilt auf: Obere Extremität (1) · Wirbelsäule & Rumpf (2) · Kopf & Hals (1)
- M. pectoralis minor *(Obere Extremität · Schultergürtel)*
- M. serratus posterior superior *(Wirbelsäule & Rumpf · Rückenmuskulatur)*
- M. serratus posterior inferior *(Wirbelsäule & Rumpf · Rückenmuskulatur)*
- M. sternocleidomastoideus *(Kopf & Hals · Halsmuskulatur)*

### `stabilisator` — 3 Muskeln, verteilt auf: Untere Extremität (1) · Wirbelsäule & Rumpf (2)
- M. gluteus medius *(Untere Extremität · Hüfte)*
- Mm. multifidi *(Wirbelsäule & Rumpf · Rückenmuskulatur)*
- M. transversus abdominis *(Wirbelsäule & Rumpf · Bauchmuskulatur)*

