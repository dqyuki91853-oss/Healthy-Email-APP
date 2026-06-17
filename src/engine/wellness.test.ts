import { describe, it, expect } from 'vitest'
import { computeBodyWeather } from './bodyWeather'
import { buildWellnessSignals } from '../lib/wellnessSignals'
import {
  BASELINES_FIXTURE,
  RAINY_DAY,
  YESTERDAY_EXERCISE,
  RAINBOW_DAY,
  ROWS_RAINY,
  SUNNY_DAY,
  ROWS_SUNNY,
} from './__fixtures__/wellnessFixtures'
import { computeMoodInference } from './moodInference'
import { computeWuyinPrescription } from './wuyinPrescription'
import { buildWellnessSnapshot } from './wellnessSnapshot'

describe('computeBodyWeather', () => {
  it('returns rainy for short sleep + low HRV', () => {
    const signals = buildWellnessSignals(RAINY_DAY, YESTERDAY_EXERCISE, BASELINES_FIXTURE)
    const w = computeBodyWeather(signals)
    expect(w.weatherId).toBe('rainy')
    expect(w.label).toBe('阴雨')
  })

  it('returns rainbow after heavy exercise', () => {
    const signals = buildWellnessSignals(RAINBOW_DAY, YESTERDAY_EXERCISE, BASELINES_FIXTURE)
    const w = computeBodyWeather(signals)
    expect(w.weatherId).toBe('rainbow')
  })

  it('returns sunny when metrics are stable', () => {
    const signals = buildWellnessSignals(SUNNY_DAY, null, BASELINES_FIXTURE)
    const w = computeBodyWeather(signals)
    expect(w.weatherId).toBe('sunny')
  })
})

describe('computeMoodInference', () => {
  it('infers anxiety from short sleep + low HRV', () => {
    const m = computeMoodInference(ROWS_RAINY, BASELINES_FIXTURE, [], '2026-06-09')
    expect(m.dominant).toBe('anxiety')
    expect(m.source).toBe('inferred')
  })
})

describe('computeWuyinPrescription', () => {
  it('prescribes zhi for anxiety', () => {
    const snap = buildWellnessSnapshot(ROWS_RAINY, BASELINES_FIXTURE, [], '2026-06-09')
    expect(snap?.wuyin?.toneId).toBe('zhi')
  })

  it('extends duration on rainy + anxiety', () => {
    const snap = buildWellnessSnapshot(ROWS_RAINY, BASELINES_FIXTURE, [], '2026-06-09')
    const wuyin = computeWuyinPrescription(snap!.mood, snap!.bodyWeather)
    expect(wuyin?.durationSec).toBeGreaterThan(90)
  })
})

describe('buildWellnessSnapshot', () => {
  it('returns complete snapshot', () => {
    const snap = buildWellnessSnapshot(ROWS_SUNNY, BASELINES_FIXTURE, [])
    expect(snap).not.toBeNull()
    expect(snap!.bodyWeather.weatherId).toBe('sunny')
    expect(snap!.circadian.personalSleepOnset).toMatch(/^\d{2}:\d{2}$/)
  })
})
