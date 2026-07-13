import { useEffect } from 'react'
import { useProgressStore } from '../store/useProgressStore'
import { useStreakStore } from '../store/useStreakStore'
import { notifyAward, notifyToast } from '../store/useToastStore'

/**
 * Alles, was **einmal beim ersten App-Start des Tages** passiert — bewusst an EINER
 * Stelle, damit es keine zweite Tageslogik gibt:
 *
 * 1. Tagesbonus (V1: 10 XP, einmal täglich; die Doppelvergabe-Sperre liegt im Store).
 * 2. Tages-Streak abrechnen (7f): Fehltage werden, soweit vorhanden, automatisch mit
 *    einem Freeze überbrückt — ohne Nachfrage. Reißt der Streak doch, ist die Botschaft
 *    „weiter geht's", nie „du hast X verloren". Keine Schuld-Mechanik.
 *
 * **Nicht auf einem leeren Karteikasten** (Etappe 12): Seit ADR 0009 landet ein neuer Nutzer
 * auf dem Guide statt in einer Sitzung — und bekam dort „+10 XP · Tagesbonus" eingeblendet,
 * bevor er irgendetwas getan hatte. Er konnte an dieser Stelle noch gar nichts tun. Eine
 * Belohnung fürs bloße Erscheinen entwertet alle anderen; der Bonus gehört dem **Lernen**.
 * Sobald die erste Karte im Kasten liegt, läuft der Effekt nach — die Sperre gegen
 * Doppelvergabe liegt im Store, nicht hier.
 */
export function useDailyBonus(): void {
  const hatKarten = useProgressStore((s) => Object.keys(s.flashcards.cards).length > 0)

  useEffect(() => {
    if (!hatKarten) return

    const award = useProgressStore.getState().awardDailyBonus()
    if (award.xpAdded > 0) notifyAward(award, 'Tagesbonus')

    const { event, freezesUsed } = useStreakStore.getState().rollOver()
    if (event === 'freeze-used') {
      notifyToast(
        freezesUsed === 1
          ? 'Ein Fehltag mit deinem Freeze überbrückt — deine Serie steht.'
          : `${freezesUsed} Fehltage mit deinen Freezes überbrückt — deine Serie steht.`,
      )
    }
    if (event === 'reset') {
      notifyToast('Neue Serie — weiter geht’s.')
    }
  }, [hatKarten])
}
