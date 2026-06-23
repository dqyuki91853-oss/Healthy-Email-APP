import { describe, it, expect } from 'vitest'
import { computeBpAdvisory } from './bpAdvisory'
import { buildPersonalBpBaseline } from '../lib/bpBaseline'
import { computeInnerClimate } from './innerClimate'
import { computeBodySeason } from './bodySeason'
import { buildWellnessSignals } from '../lib/wellnessSignals'
import { computeBaselines } from '../lib/baselines'
import { buildDemoBloodPressureReadings, buildDemoWellnessSeed } from '../lib/demoWellnessSeed'
import type { BloodPressureReading } from '../types/bloodPressure'
import type { VoiceExtraction } from '../types/voice'

function reading(
  date: string,
  hour: number,
  sys: number,
  dia: number,
  pulse?: number,
): BloodPressureReading {
  return {
    id: `${date}-${hour}`,
    measuredAt: `${date}T${String(hour).padStart(2, '0')}:00:00`,
    systolicMmHg: sys,
    diastolicMmHg: dia,
    pulseBpm: pulse,
    source: 'manual',
  }
}

function stable14d(endDate: string): BloodPressureReading[] {
  const rows: BloodPressureReading[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(`${endDate}T12:00:00`)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    rows.push(reading(date, 8, 118 + (i % 3), 76 + (i % 2), 72))
    rows.push(reading(date, 20, 115 + (i % 2), 74 + (i % 2), 70))
  }
  return rows
}

describe('computeBpAdvisory', () => {
  it('T1: no readings → insufficient data + measurement suggestion', () => {
    const adv = computeBpAdvisory([], [], [], '2026-06-10')
    expect(adv.hasSufficientData).toBe(false)
    expect(adv.latest).toBeNull()
    expect(adv.suggestions.some((s) => s.id === 'BP-MSR-01')).toBe(true)
  })

  it('T2: 14d stable ~118/76 → calm with high confidence', () => {
    const adv = computeBpAdvisory(stable14d('2026-06-10'), [], [], '2026-06-10')
    expect(adv.hasSufficientData).toBe(true)
    expect(adv.weatherLevel).toBe('calm')
    expect(adv.confidence).toBe('high')
  })

  it('T3: today +12% sys → windy', () => {
    const rows = stable14d('2026-06-10')
    rows.push(reading('2026-06-10', 8, 135, 82))
    rows.push(reading('2026-06-10', 20, 133, 80))
    const adv = computeBpAdvisory(rows, [], [], '2026-06-10')
    expect(['windy', 'storm', 'breeze']).toContain(adv.weatherLevel)
    expect(adv.baselineDeltaSysPct).not.toBeNull()
  })

  it('T4: 7d volatile readings → volatile trend', () => {
    const rows: BloodPressureReading[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date('2026-06-10T12:00:00')
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      const sys = i % 2 === 0 ? 145 : 100
      rows.push(reading(date, 8, sys, 76))
    }
    const adv = computeBpAdvisory(rows, [], [], '2026-06-10')
    expect(adv.trend7d).toBe('volatile')
  })

  it('T5: single sys=185 → crisis + BP-ALT-01', () => {
    const adv = computeBpAdvisory(
      [reading('2026-06-10', 9, 185, 95)],
      [],
      [],
      '2026-06-10',
    )
    expect(adv.weatherLevel).toBe('crisis')
    expect(adv.clinicalEscalation.triggered).toBe(true)
    expect(adv.suggestions.some((s) => s.id === 'BP-ALT-01')).toBe(true)
  })

  it('T6: 3 consecutive elevated days → storm + BP-ALT-02', () => {
    const rows: BloodPressureReading[] = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date('2026-06-10T12:00:00')
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      rows.push(reading(date, 8, 145, 92))
      rows.push(reading(date, 20, 142, 90))
    }
    for (let i = 13; i >= 3; i--) {
      const d = new Date('2026-06-10T12:00:00')
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      rows.push(reading(date, 8, 118, 76))
    }
    const adv = computeBpAdvisory(rows, [], [], '2026-06-10')
    expect(adv.weatherLevel).toBe('storm')
    expect(adv.suggestions.some((s) => s.id === 'BP-ALT-02')).toBe(true)
  })

  it('T7: morning-only rhythm', () => {
    const rows: BloodPressureReading[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date('2026-06-10T12:00:00')
      d.setDate(d.getDate() - i)
      rows.push(reading(d.toISOString().slice(0, 10), 8, 118, 76))
    }
    const adv = computeBpAdvisory(rows, [], [], '2026-06-10')
    expect(adv.readingRhythm).toBe('morning_only')
  })

  it('T8: morning surge triggers BP-LIF-03', () => {
    const rows = [
      reading('2026-06-09', 20, 125, 80),
      reading('2026-06-10', 8, 138, 84),
    ]
    const adv = computeBpAdvisory(rows, [], [], '2026-06-10')
    expect(adv.suggestions.some((s) => s.id === 'BP-LIF-03')).toBe(true)
  })

  it('T9: food fingerprints surface in topFoodReactions', () => {
    const demo = buildDemoWellnessSeed()
    const bp = buildDemoBloodPressureReadings()
    const adv = computeBpAdvisory(
      bp,
      demo.voiceLogs,
      demo.watchRows,
      demo.watchRows[demo.watchRows.length - 1].date,
    )
    expect(adv.topFoodReactions.length).toBeGreaterThan(0)
    expect(adv.suggestions.some((s) => s.id === 'BP-FOD-01')).toBe(true)
  })

  it('T10: rising EWMA triggers BP-LIF-02', () => {
    const rows: BloodPressureReading[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date('2026-06-10T12:00:00')
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      const sys = 110 + (13 - i) * 2
      rows.push(reading(date, 8, sys, 76))
    }
    const adv = computeBpAdvisory(rows, [], [], '2026-06-10')
    expect(adv.trend7d).toBe('rising')
    expect(adv.suggestions.some((s) => s.id === 'BP-LIF-02')).toBe(true)
  })

  it('T11: innerClimate fusion windy → IC-bp-advisory-01', () => {
    const demo = buildDemoWellnessSeed()
    const targetDate = demo.watchRows[demo.watchRows.length - 1].date
    const rows = stable14d(targetDate).filter((r) => !r.measuredAt.startsWith(targetDate))
    rows.push(reading(targetDate, 8, 140, 88))
    rows.push(reading(targetDate, 20, 138, 86))
    const adv = computeBpAdvisory(rows, [], demo.watchRows, targetDate)
    expect(adv.fusionHints.bodyWeatherRipple).toBe(true)

    const todayRow = demo.watchRows.find((r) => r.date === targetDate)!
    const signals = buildWellnessSignals(todayRow, null, computeBaselines(demo.watchRows))
    const snap = computeInnerClimate(signals, [], rows, adv)
    expect(snap.state).toBe('ripple')
    expect(snap.matchedRuleId).toBe('IC-bp-advisory-01')
  })

  it('T12: demo seed produces sufficient BP advisory', () => {
    const demo = buildDemoWellnessSeed()
    const bp = buildDemoBloodPressureReadings()
    const targetDate = demo.watchRows[demo.watchRows.length - 1].date
    const adv = computeBpAdvisory(bp, demo.voiceLogs, demo.watchRows, targetDate)
    expect(adv.hasSufficientData).toBe(true)
    expect(adv.fusionHints.seasonModifier).toBe('stable_bonus')
    const baselines = computeBaselines(demo.watchRows)
    const season = computeBodySeason(demo.watchRows, baselines, null, targetDate, {
      bpAdvisory: adv,
    })
    expect(season).not.toBeNull()
  })
})

describe('buildPersonalBpBaseline', () => {
  it('computes medians from morning/evening slots', () => {
    const rows = stable14d('2026-06-10')
    const baseline = buildPersonalBpBaseline(rows, [], '2026-06-10')
    expect(baseline.allDaySysMedian).not.toBeNull()
    expect(baseline.sampleCounts.all).toBeGreaterThanOrEqual(14)
    expect(baseline.confidence).toBe('high')
  })
})
