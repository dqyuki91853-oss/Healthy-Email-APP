import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  clearTeaCollection,
  getUnlockedTeaCount,
  isTeaUnlocked,
  loadTeaCollection,
  unlockTea,
} from './teaCollectionStore'
import { teaKey } from '../config/bodyTeaGuide'

function createStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key)
    },
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorage())
  clearTeaCollection()
})

describe('teaCollectionStore', () => {
  it('unlocks a tea on first sight', () => {
    const added = unlockTea('rainy', 'autumn', '2026-06-22')
    expect(added).toBe(true)
    expect(isTeaUnlocked(teaKey('rainy', 'autumn'))).toBe(true)
    expect(loadTeaCollection()[0].unlockedAt).toBe('2026-06-22')
  })

  it('does not duplicate unlocks', () => {
    unlockTea('sunny', 'spring', '2026-06-20')
    const again = unlockTea('sunny', 'spring', '2026-06-22')
    expect(again).toBe(false)
    expect(getUnlockedTeaCount()).toBe(1)
    expect(loadTeaCollection()[0].unlockedAt).toBe('2026-06-20')
  })

  it('tracks multiple teas independently', () => {
    unlockTea('sunny', 'spring')
    unlockTea('foggy', 'winter')
    expect(getUnlockedTeaCount()).toBe(2)
  })
})
