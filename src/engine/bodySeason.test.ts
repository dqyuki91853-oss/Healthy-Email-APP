import { describe, it, expect } from 'vitest'
import { computeBodySeason } from './bodySeason'
import { emptyWatchRow } from '../lib/health-import/watchRow'
import type { DailyWatchRow } from '../types/health'
import { BASELINES_FIXTURE } from './__fixtures__/wellnessFixtures'

function row(date: string, patch: Partial<DailyWatchRow>): DailyWatchRow {
  return { ...emptyWatchRow(date), ...patch }
}

function buildRows(n: number, patch: (i: number) => Partial<DailyWatchRow>): DailyWatchRow[] {
  const rows: DailyWatchRow[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date('2026-03-01T12:00:00')
    d.setDate(d.getDate() + i)
    rows.push(row(d.toISOString().slice(0, 10), patch(i)))
  }
  return rows
}

describe('computeBodySeason', () => {
  it('returns null when fewer than 14 days', () => {
    const rows = buildRows(10, () => ({ hrvSdnn: 40, sleepHours: 7 }))
    expect(computeBodySeason(rows, BASELINES_FIXTURE, null, rows[9].date)).toBeNull()
  })

  it('returns a season snapshot with suggestions', () => {
    const rows = buildRows(21, () => ({
      hrvSdnn: 44,
      sleepHours: 7.5,
      dailySteps: 8000,
      restingHr: 63,
    }))
    const snap = computeBodySeason(rows, BASELINES_FIXTURE, null, rows[20].date)
    expect(snap).not.toBeNull()
    expect(snap!.suggestions).toHaveLength(3)
    expect(['spring', 'summer', 'autumn', 'winter']).toContain(snap!.seasonId)
  })

  it('sets justChanged when season differs from previous', () => {
    const rows = buildRows(21, () => ({
      hrvSdnn: 30,
      sleepHours: 5.5,
      dailySteps: 4000,
      restingHr: 72,
    }))
    const snap = computeBodySeason(rows, BASELINES_FIXTURE, 'spring', rows[20].date)
    expect(snap?.justChanged).toBe(true)
    expect(snap?.previousSeasonId).toBe('spring')
  })
})
