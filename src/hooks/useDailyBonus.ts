import { useEffect } from 'react'
import { useProgressStore } from '../store/useProgressStore'
import { notifyAward } from '../store/useToastStore'

/**
 * Vergibt beim ersten App-Start des Tages den Tagesbonus (V1: 10 XP, einmal täglich).
 * Die Doppelvergabe-Sperre liegt im Store (`lastDailyBonus`); hier nur das Auslösen + Toast.
 */
export function useDailyBonus(): void {
  useEffect(() => {
    const award = useProgressStore.getState().awardDailyBonus()
    if (award.xpAdded > 0) notifyAward(award, 'Tagesbonus')
  }, [])
}
