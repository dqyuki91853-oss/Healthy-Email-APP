import { describe, it, expect } from 'vitest'
import { discoverPatterns } from './patternDiscovery'
import { emptyWatchRow } from '../lib/health-import/watchRow'
import type { DailyWatchRow } from '../types/health'
import type { VoiceExtraction } from '../types/voice'

function row(date: string, patch: Partial<DailyWatchRow>): DailyWatchRow {
  return { ...emptyWatchRow(date), ...patch }
}

function buildCorrelatedRows(n: number): DailyWatchRow[] {
  const rows: DailyWatchRow[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date('2026-01-01T12:00:00')
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const sleep = 5 + (i % 5) * 0.5
    rows.push(
      row(date, {
        sleepHours: sleep,
        hrvSdnn: 30 + sleep * 4,
        restingHr: 65,
        dailySteps: 6000,
      }),
    )
  }
  return rows
}

function buildSundayLowHrvRows(): DailyWatchRow[] {
  const rows: DailyWatchRow[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date('2026-01-05T12:00:00')
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const isSunday = new Date(`${date}T12:00:00`).getDay() === 0
    rows.push(
      row(date, {
        hrvSdnn: isSunday ? 28 : 42,
        sleepHours: 7,
        restingHr: 64,
        dailySteps: 6000,
      }),
    )
  }
  return rows
}

describe('discoverPatterns', () => {
  it('returns insufficientData when fewer than 14 days', () => {
    const result = discoverPatterns(
      buildCorrelatedRows(10),
      [],
      [],
      '2026-01-10',
    )
    expect(result.insufficientData).toBe(true)
    expect(result.newCases).toHaveLength(0)
  })

  it('discovers sleep–HRV correlation with enough paired days', () => {
    const rows = buildCorrelatedRows(21)
    const result = discoverPatterns(rows, [], [], rows[rows.length - 1].date)
    const kinds = result.newCases.map((c) => c.kind)
    expect(kinds).toContain('sleep_hrv_correlation')
  })

  it('discovers Sunday HRV pattern when Sundays are lower', () => {
    const rows = buildSundayLowHrvRows()
    const result = discoverPatterns(rows, [], [], rows[rows.length - 1].date)
    expect(result.newCases.some((c) => c.kind === 'weekday_pattern')).toBe(true)
  })

  it('limits new cases to 2 per week', () => {
    const rows = buildSundayLowHrvRows()
    const target = rows[rows.length - 1].date
    const first = discoverPatterns(rows, [], [], target)
    expect(first.newCases.length).toBeLessThanOrEqual(2)
  })

  it('does not duplicate open case of same kind', () => {
    const rows = buildCorrelatedRows(21)
    const target = rows[rows.length - 1].date
    const first = discoverPatterns(rows, [], [], target)
    const second = discoverPatterns(rows, [], first.activeCases, target)
    expect(second.newCases.filter((c) => c.kind === 'sleep_hrv_correlation')).toHaveLength(0)
  })
})

describe('late dinner rule', () => {
  it('discovers late dinner sleep pattern', () => {
    const rows: DailyWatchRow[] = []
    const logs: VoiceExtraction[] = []
    for (let i = 0; i < 20; i++) {
      const d = new Date('2026-02-01T12:00:00')
      d.setDate(d.getDate() + i)
      const date = d.toISOString().slice(0, 10)
      const late = i % 2 === 0
      rows.push(row(date, { sleepHours: late ? 5.5 : 7.5, hrvSdnn: 38 }))
      if (late) {
        logs.push({
          id: `v${i}`,
          timestamp: `${date}T21:00:00`,
          recordDate: date,
          mealSlot: 'dinner',
          transcript: '晚饭',
          foods: [{ name: '面', portion: 'medium', confidence: 0.9, categories: ['noodle'] }],
          emotions: [],
          symptoms: [],
          stressScore: null,
          brainFogScore: null,
          needsFollowUp: false,
          followUpQuestions: [],
          overallConfidence: 0.9,
          extractionSource: 'local',
        })
      }
    }
    const result = discoverPatterns(rows, logs, [], rows[rows.length - 1].date)
    expect(result.newCases.some((c) => c.kind === 'late_dinner_sleep')).toBe(true)
  })
})
