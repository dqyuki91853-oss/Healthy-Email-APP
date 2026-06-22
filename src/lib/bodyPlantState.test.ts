import { describe, expect, it } from 'vitest'
import { computePlantVigor } from './bodyPlantState'
import type { DailyWatchRow } from '../types/health'
import { emptyWatchRow } from './health-import/watchRow'

function row(date: string, patch: Partial<DailyWatchRow>): DailyWatchRow {
  return { ...emptyWatchRow(date), ...patch }
}

describe('computePlantVigor', () => {
  it('returns sleepy when fewer than 7 sleep days', () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(`2026-06-0${i + 1}`, { sleepHours: 7.5 }),
    )
    expect(computePlantVigor(rows)).toBe('sleepy')
  })

  it('returns wilted after 3 consecutive short sleeps', () => {
    const rows = [
      row('2026-06-01', { sleepHours: 7.5 }),
      row('2026-06-02', { sleepHours: 7.2 }),
      row('2026-06-03', { sleepHours: 7.0 }),
      row('2026-06-04', { sleepHours: 6.0 }),
      row('2026-06-05', { sleepHours: 5.8 }),
      row('2026-06-06', { sleepHours: 6.2 }),
      row('2026-06-07', { sleepHours: 7.5 }),
    ]
    expect(computePlantVigor(rows)).toBe('wilted')
  })

  it('returns vibrant with 5+ early sleeps and exercise', () => {
    const rows = Array.from({ length: 7 }, (_, i) =>
      row(`2026-06-0${i + 1}`, {
        sleepHours: 7.5,
        exerciseMinutes: i === 2 ? 30 : 0,
      }),
    )
    expect(computePlantVigor(rows)).toBe('vibrant')
  })

  it('returns growing with 3+ early sleeps', () => {
    const rows = [
      row('2026-06-01', { sleepHours: 7.2 }),
      row('2026-06-02', { sleepHours: 6.8 }),
      row('2026-06-03', { sleepHours: 7.0 }),
      row('2026-06-04', { sleepHours: 6.9 }),
      row('2026-06-05', { sleepHours: 7.1 }),
      row('2026-06-06', { sleepHours: 6.6 }),
      row('2026-06-07', { sleepHours: 6.8 }),
    ]
    expect(computePlantVigor(rows)).toBe('growing')
  })

  it('returns okay as default steady state', () => {
    const rows = Array.from({ length: 7 }, (_, i) =>
      row(`2026-06-0${i + 1}`, { sleepHours: 6.8 }),
    )
    expect(computePlantVigor(rows)).toBe('okay')
  })
})
