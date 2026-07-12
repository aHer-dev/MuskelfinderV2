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
 */
export function useDailyBonus(): void {
  useEffect(() => {
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
  }, [])
}
