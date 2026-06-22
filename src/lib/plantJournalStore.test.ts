import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  clearPlantJournal,
  getLastJournalEntry,
  getSeenStagesForSeason,
  loadPlantJournal,
  recordPlantJournalVisit,
} from './plantJournalStore'
import type { DailyWatchRow } from '../types/health'
import { emptyWatchRow } from './health-import/watchRow'

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

function row(date: string, patch: Partial<DailyWatchRow>): DailyWatchRow {
  return { ...emptyWatchRow(date), ...patch }
}

function fullSleepWeek(base: Partial<DailyWatchRow> = {}): DailyWatchRow[] {
  return Array.from({ length: 7 }, (_, i) =>
    row(`2026-06-0${i + 1}`, { sleepHours: 7.5, exerciseMinutes: 30, ...base }),
  )
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorage())
  vi.stubGlobal('crypto', { randomUUID: () => `id-${Math.random().toString(36).slice(2, 8)}` })
  clearPlantJournal()
})

describe('plantJournalStore', () => {
  it('creates seed entry on first visit', () => {
    const entry = recordPlantJournalVisit('spring', [], '2026-06-10')
    expect(entry?.kind).toBe('seed')
    expect(entry?.whisper).toContain('樱花嫩枝')
    expect(loadPlantJournal()).toHaveLength(1)
  })

  it('records first_seen when stage changes to new vigor', () => {
    recordPlantJournalVisit('spring', [], '2026-06-10')
    const rows = fullSleepWeek()
    const entry = recordPlantJournalVisit('spring', rows, '2026-06-15')
    expect(entry?.kind).toBe('first_seen')
    expect(entry?.plantStage).toBe('vibrant')
    expect(entry?.whisper).toContain('首次出现')
    expect(loadPlantJournal()).toHaveLength(2)
  })

  it('records state_change when returning to a known stage', () => {
    const sleepy: DailyWatchRow[] = []
    recordPlantJournalVisit('spring', sleepy, '2026-06-10')

    const vibrant = fullSleepWeek()
    recordPlantJournalVisit('spring', vibrant, '2026-06-15')

    const growing = Array.from({ length: 7 }, (_, i) =>
      row(`2026-06-${10 + i}`, { sleepHours: 7.2 }),
    )
    recordPlantJournalVisit('spring', growing, '2026-06-20')

    const vibrantAgain = fullSleepWeek()
    const entry = recordPlantJournalVisit('spring', vibrantAgain, '2026-06-25')
    expect(entry?.kind).toBe('state_change')
    expect(entry?.whisper).toContain('进入')
    expect(loadPlantJournal()).toHaveLength(4)
  })

  it('skips duplicate visits with same stage', () => {
    recordPlantJournalVisit('spring', [], '2026-06-10')
    const again = recordPlantJournalVisit('spring', [], '2026-06-11')
    expect(again).toBeNull()
    expect(loadPlantJournal()).toHaveLength(1)
  })

  it('tracks seen stages per season', () => {
    recordPlantJournalVisit('spring', [], '2026-06-10')
    recordPlantJournalVisit('spring', fullSleepWeek(), '2026-06-15')
    const seen = getSeenStagesForSeason('spring')
    expect(seen.has('vibrant')).toBe(true)
    expect(getLastJournalEntry()?.plantStage).toBe('vibrant')
  })
})
