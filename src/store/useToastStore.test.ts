import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notifyAward, useToastStore } from './useToastStore'
import type { XpAward } from './useProgressStore'

function award(partial: Partial<XpAward>): XpAward {
  return { xpAdded: 0, levelBefore: 1, levelAfter: 1, levelUp: false, ...partial }
}

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
  })
  afterEach(() => vi.useRealTimers())

  it('push fügt einen Toast hinzu und blendet ihn nach der TTL aus', () => {
    useToastStore.getState().push('Hallo', 'info')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(2500)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('hält maximal 4 Toasts gleichzeitig', () => {
    for (let i = 0; i < 6; i++) useToastStore.getState().push(`t${i}`)
    expect(useToastStore.getState().toasts).toHaveLength(4)
    expect(useToastStore.getState().toasts[0].message).toBe('t2')
  })

  it('notifyAward meldet Level-Up + XP; ohne XP keinen Toast', () => {
    notifyAward(award({ xpAdded: 5, levelUp: true, levelAfter: 3 }), 'Serie ×5')
    const msgs = useToastStore.getState().toasts.map((t) => t.message)
    expect(msgs).toEqual(['Level 3 erreicht!', '+5 XP · Serie ×5'])

    useToastStore.setState({ toasts: [] })
    notifyAward(award({ xpAdded: 0 }))
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
