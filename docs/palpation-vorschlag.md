# Palpation — erste Charge, **wartet auf deine fachliche Freigabe**

> **Status: NICHT in der App.** `src/data/editorial/palpation.json` ist leer. Dieser Vorschlag wandert
> erst dort hinein, wenn du ihn geprüft hast.
>
> Grund steht im Briefing (9d, Nicht-Ziele): **„Keine KI-generierten Palpationsanleitungen ohne
> fachliche Prüfung."** Ein falscher Landmarken-Hinweis wird auswendig gelernt — und am Patienten
> angewandt. Du bist der Fachmann, nicht ich.

## Was du tun musst

Lies die 21 Einträge. Sag mir, was **falsch**, was **ungenau** und was **überflüssig** ist. Dann
schiebe ich die geprüfte Fassung in `palpation.json`, und die Sektion „Am Körper finden" erscheint
auf den Detailseiten.

Ein „passt so" genügt — dann übernehme ich sie unverändert.

## Bewusst NICHT geschrieben

Das ist kein Versäumnis, sondern die Regel aus dem Briefing (*„Wo unsicher: Feld leer lassen"*):

| Muskel | Warum nichts dasteht |
|---|---|
| **M. subscapularis** | Nur der laterale Rand ist in der Achselhöhle erreichbar, und das ist heikel. Eine Anleitung dazu schreibst besser du. |
| **M. vastus intermedius** | Liegt unter dem M. rectus femoris — **nicht direkt tastbar.** |
| **M. gluteus minimus** | Liegt unter dem M. gluteus medius — **nicht direkt tastbar.** |
| **M. semimembranosus** | Weitgehend vom M. semitendinosus überdeckt; sauber abzugrenzen ist er nur bedingt. |

Wenn du für diese vier doch etwas hinterlegen willst, sag mir den Text — ich erfinde ihn nicht.

## Die Einträge

Vier Felder je Muskel, **alle optional**:
`position` (Lagerung) · `landmarks` (knöcherne Orientierungspunkte) · `technique` (Aufsuchen &
Aktivieren) · `confusion` (Verwechslungsgefahr).

```json
{
  "muskeln": {
    "M. deltoideus": {
      "position": "Sitz, Arm locker hängend.",
      "landmarks": "Lateraler Rand des Acromions, Spina scapulae, laterales Drittel der Clavicula; distal die Tuberositas deltoidea am Humerusschaft.",
      "technique": "Vom Acromion nach distal tasten. Widerstand gegen Abduktion lässt den mittleren (acromialen) Anteil anspringen, Widerstand gegen Flexion den vorderen (clavicularen), gegen Extension den hinteren (spinalen).",
      "confusion": "Der vordere Anteil grenzt am Sulcus deltoideopectoralis an den M. pectoralis major — die Rinne ist die Grenze."
    },

    "M. supraspinatus": {
      "position": "Sitz, Arm hängend; von hinten tasten.",
      "landmarks": "Spina scapulae; die Fossa supraspinata liegt oberhalb davon.",
      "technique": "Oberhalb der Spina scapulae in die Fossa supraspinata tasten. Widerstand gegen die ersten Grad der Abduktion.",
      "confusion": "Der M. trapezius (Pars descendens) liegt darüber — man tastet ihn zwangsläufig mit. Der M. infraspinatus liegt unterhalb der Spina."
    },

    "M. infraspinatus": {
      "position": "Sitz, Ellenbogen 90° gebeugt, Oberarm am Rumpf.",
      "landmarks": "Spina scapulae; die Fossa infraspinata liegt unterhalb davon.",
      "technique": "Unterhalb der Spina scapulae flächig tasten. Widerstand gegen Außenrotation bei anliegendem Oberarm.",
      "confusion": "Der M. teres minor liegt kaudal-lateral am Margo lateralis und rotiert ebenfalls außen."
    },

    "M. teres minor": {
      "position": "Sitz, Ellenbogen 90° gebeugt, Oberarm am Rumpf.",
      "landmarks": "Margo lateralis der Scapula, zwischen M. infraspinatus und M. teres major.",
      "technique": "Am Margo lateralis nach kranial tasten. Widerstand gegen Außenrotation.",
      "confusion": "Der M. teres major liegt direkt kaudal davon — er rotiert aber INNEN und gehört nicht zur Rotatorenmanschette."
    },

    "M. trapezius – Pars descendens": {
      "position": "Sitz, Arme locker.",
      "landmarks": "Protuberantia occipitalis externa, Processus spinosi der Halswirbel, laterales Drittel der Clavicula.",
      "technique": "Der Muskelbauch liegt oberflächlich zwischen Nacken und Schulter. Widerstand gegen das Anheben des Schultergürtels.",
      "confusion": "Er überdeckt den M. supraspinatus und den M. levator scapulae."
    },

    "M. sternocleidomastoideus": {
      "position": "Rückenlage oder Sitz, Kopf zur Gegenseite gedreht.",
      "landmarks": "Processus mastoideus, Manubrium sterni, mediales Drittel der Clavicula.",
      "technique": "Kopf zur Gegenseite drehen — der Muskelbauch tritt als Strang zwischen Warzenfortsatz und Sternum hervor.",
      "confusion": "Achtung auf die darunterliegenden Gefäß-Nerven-Strukturen des Halses; nur flächig und ohne Druck tasten."
    },

    "M. pectoralis major": {
      "position": "Rückenlage oder Sitz, Arm 90° abduziert.",
      "landmarks": "Clavicula, Sternum, Sulcus deltoideopectoralis; die vordere Achselfalte wird von ihm gebildet.",
      "technique": "Widerstand gegen horizontale Adduktion — die vordere Achselfalte spannt sich deutlich an.",
      "confusion": "Der Pars clavicularis grenzt am Sulcus deltoideopectoralis an den M. deltoideus."
    },

    "M. latissimus dorsi": {
      "position": "Bauchlage oder Sitz, Arm eleviert.",
      "landmarks": "Processus spinosi der unteren BWS/LWS, Crista iliaca, Angulus inferior scapulae; er bildet die hintere Achselfalte.",
      "technique": "Widerstand gegen Adduktion und Innenrotation aus der Elevation — die hintere Achselfalte spannt sich an.",
      "confusion": "Der M. teres major bildet die hintere Achselfalte mit; beide adduzieren und rotieren innen."
    },

    "M. biceps brachii": {
      "position": "Sitz, Ellenbogen ca. 90° gebeugt, Unterarm supiniert.",
      "landmarks": "Sulcus intertubercularis (lange Sehne), Tuberositas radii, Aponeurosis bicipitalis in der Ellenbeuge.",
      "technique": "Widerstand gegen Flexion bei supiniertem Unterarm — der Muskelbauch tritt deutlich hervor. Die distale Sehne ist in der Ellenbeuge gut tastbar.",
      "confusion": "Der M. brachialis liegt darunter und beugt ebenfalls; er wird bei proniertem Unterarm stärker gefordert."
    },

    "M. triceps brachii – Caput longum": {
      "position": "Bauchlage mit abduziertem Arm oder Sitz.",
      "landmarks": "Tuberculum infraglenoidale der Scapula, Olecranon.",
      "technique": "An der Rückseite des Oberarms, medial. Widerstand gegen Extension im Ellenbogen — bei zusätzlicher Elevation des Arms tritt der lange Kopf hervor, weil er über das Schultergelenk zieht.",
      "confusion": "Caput laterale und mediale ziehen NICHT über das Schultergelenk — nur der lange Kopf tut das."
    },

    "M. brachioradialis": {
      "position": "Sitz, Unterarm in Mittelstellung (Daumen nach oben).",
      "landmarks": "Crista supracondylaris lateralis des Humerus, Processus styloideus radii.",
      "technique": "Widerstand gegen Flexion bei Unterarm in Mittelstellung — er springt als kräftiger Wulst an der radialen Unterarmseite hervor.",
      "confusion": "Er bildet die radiale Begrenzung der Ellenbeuge; die Handgelenksextensoren liegen direkt daneben."
    },

    "M. gluteus maximus": {
      "position": "Bauchlage, Knie gebeugt (nimmt die ischiocrurale Muskulatur aus der Extension).",
      "landmarks": "Crista iliaca, Os sacrum, Tuber ischiadicum, Tractus iliotibialis.",
      "technique": "Widerstand gegen Hüftextension bei gebeugtem Knie — der Muskelbauch spannt sich flächig an.",
      "confusion": "Bei gestrecktem Knie extendiert die ischiocrurale Muskulatur mit; das gebeugte Knie schaltet sie weitgehend aus."
    },

    "M. gluteus medius": {
      "position": "Seitlage, oben liegendes Bein gestreckt.",
      "landmarks": "Zwischen Crista iliaca und Trochanter major; der vordere Anteil liegt ventral des Trochanters.",
      "technique": "Widerstand gegen Abduktion in Seitlage. Funktionell zeigt sich seine Schwäche im Einbeinstand (Trendelenburg-Zeichen).",
      "confusion": "Der M. gluteus maximus liegt dorsal davon; der M. tensor fasciae latae ventral. Der M. gluteus minimus liegt DARUNTER und ist nicht direkt tastbar."
    },

    "M. rectus femoris": {
      "position": "Rückenlage, Bein gestreckt.",
      "landmarks": "Spina iliaca anterior inferior, Patella; er verläuft mittig auf der Oberschenkelvorderseite.",
      "technique": "Widerstand gegen Knieextension bei gestrecktem Bein; er tritt als mittiger Strang hervor. Als einziger Teil des M. quadriceps zieht er über das Hüftgelenk — bei zusätzlicher Hüftflexion spannt er stärker an.",
      "confusion": "Die Vasti liegen seitlich davon und wirken NUR auf das Kniegelenk."
    },

    "M. vastus medialis": {
      "position": "Rückenlage, Knie leicht gebeugt unterlagert.",
      "landmarks": "Distal-medial am Oberschenkel, direkt oberhalb der Patella.",
      "technique": "Widerstand gegen die letzten Grad der Knieextension — der distale, schräge Anteil oberhalb der Patella springt an.",
      "confusion": "Der M. rectus femoris liegt mittig, der M. vastus lateralis lateral."
    },

    "M. vastus lateralis": {
      "position": "Rückenlage oder Seitlage.",
      "landmarks": "Lateral am Oberschenkel, unter dem Tractus iliotibialis.",
      "technique": "Widerstand gegen Knieextension — er füllt die laterale Oberschenkelseite flächig aus.",
      "confusion": "Der Tractus iliotibialis liegt als derber Strang darüber und ist kein Muskel."
    },

    "M. biceps femoris – Caput longum": {
      "position": "Bauchlage, Knie ca. 30° gebeugt.",
      "landmarks": "Tuber ischiadicum, Caput fibulae; seine Sehne bildet die LATERALE Begrenzung der Kniekehle.",
      "technique": "Widerstand gegen Knieflexion — die laterale Sehne der Kniekehle tritt deutlich hervor und lässt sich bis zum Fibulaköpfchen verfolgen.",
      "confusion": "Medial in der Kniekehle liegen M. semitendinosus und M. semimembranosus. Lateral = Biceps femoris, medial = die Semi-Muskeln."
    },

    "M. semitendinosus": {
      "position": "Bauchlage, Knie ca. 30° gebeugt.",
      "landmarks": "Tuber ischiadicum, Pes anserinus superficialis (medial unterhalb des Kniegelenkspalts); seine Sehne bildet die MEDIALE Begrenzung der Kniekehle.",
      "technique": "Widerstand gegen Knieflexion — die mediale Sehne der Kniekehle tritt als dünner, runder Strang hervor.",
      "confusion": "Der M. semimembranosus liegt darunter und ist breiter/flacher; er ist kaum sauber abzugrenzen."
    },

    "M. gastrocnemius": {
      "position": "Bauchlage, Knie GESTRECKT, Fuß über die Bankkante.",
      "landmarks": "Condylus medialis und lateralis des Femurs, Tendo calcaneus (Achillessehne).",
      "technique": "Widerstand gegen Plantarflexion bei GESTRECKTEM Knie — die beiden Bäuche treten in der Wade hervor. Er zieht über das Kniegelenk und arbeitet nur bei gestrecktem Knie voll mit.",
      "confusion": "Der M. soleus liegt darunter. Der Unterschied ist das Knie: gestreckt = Gastrocnemius, gebeugt = Soleus."
    },

    "M. soleus": {
      "position": "Bauchlage, Knie ca. 90° GEBEUGT.",
      "landmarks": "Seitlich der Wade, unterhalb der Gastrocnemius-Bäuche; gemeinsame Achillessehne.",
      "technique": "Widerstand gegen Plantarflexion bei GEBEUGTEM Knie — das nimmt den M. gastrocnemius weitgehend aus dem Spiel, weil er über das Knie zieht.",
      "confusion": "Der M. gastrocnemius liegt darüber. Das gebeugte Knie ist der ganze Trick, um die beiden zu trennen."
    },

    "M. tibialis anterior": {
      "position": "Rückenlage oder Sitz.",
      "landmarks": "Lateral der Tibiakante (Margo anterior); die Sehne ist am Sprunggelenk medial gut sichtbar.",
      "technique": "Widerstand gegen Dorsalextension und Supination — der Muskelbauch tritt lateral der Schienbeinkante hervor, die Sehne springt am Fußrücken an.",
      "confusion": "Der M. extensor digitorum longus liegt lateral davon; seine Sehnen ziehen zu den Zehen, die des Tibialis anterior zum Os cuneiforme mediale / Basis Os metatarsale I."
    }
  }
}
```

## Wo ich am unsichersten bin

Diese vier prüfe bitte besonders:

1. **M. supraspinatus** — dass der M. trapezius darüberliegt, macht die Palpation schwierig. Steht das
   so richtig da, oder gehört ein Hinweis zur Entlastung des Trapezius dazu?
2. **M. sternocleidomastoideus** — ich habe eine Warnung zu den Halsstrukturen hineingeschrieben.
   Reicht sie, oder soll das Feld anders formuliert werden?
3. **M. semitendinosus / M. semimembranosus** — meine Abgrenzung („dünn und rund" vs. „breit und flach").
4. **M. gluteus medius** — die Lagerung in Seitlage und der Trendelenburg-Bezug.

## Danach

Ich übernehme die geprüfte Fassung 1:1 nach `src/data/editorial/palpation.json`. Der Loader mischt sie
zu, die Detailseite zeigt sie in **beiden** Niveaus als einklappbare Sektion „Am Körper finden".
Die Mechanik ist gebaut und getestet — es fehlt nur dein Urteil.
