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
import { computeInnerClimate } from './innerClimate'
import { computeDailyBrief } from './dailyBrief'
import type { VoiceExtraction } from '../types/voice'

const DINNER_LOG: VoiceExtraction = {
  id: 'd1',
  timestamp: '2026-06-10T20:00:00',
  recordDate: '2026-06-10',
  mealSlot: 'dinner',
  transcript: '晚饭吃了炒饭',
  foods: [{ name: '炒饭', portion: 'large', confidence: 0.9, categories: ['rice'] }],
  emotions: [],
  symptoms: [],
  stressScore: null,
  brainFogScore: null,
  needsFollowUp: false,
  followUpQuestions: [],
  overallConfidence: 0.9,
  extractionSource: 'local',
}

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
    expect(snap!.innerClimate?.state).toBe('steady')
    expect(snap!.dailyBrief?.energyLevel).toBe('high')
    expect(snap!.dailyBrief?.suitability.length).toBeGreaterThan(0)
    expect(Array.isArray(snap!.caseFiles)).toBe(true)
  })

  it('wires afterglow inner climate after heavy yesterday exercise', () => {
    const snap = buildWellnessSnapshot(ROWS_RAINY, BASELINES_FIXTURE, [], '2026-06-09')
    expect(snap?.innerClimate?.state).toBe('afterglow')
    expect(snap?.innerClimate?.label).toBe('余波')
  })

  it('wires low energy daily brief on rainy day', () => {
    const snap = buildWellnessSnapshot(ROWS_RAINY, BASELINES_FIXTURE, [], '2026-06-09')
    expect(snap?.dailyBrief?.energyLevel).toBe('low')
    expect(snap?.dailyBrief?.recoveryProbability).toBeLessThanOrEqual(0.55)
    expect(snap?.dailyBrief?.decisionHints.exercise).toBe('light')
  })
})

describe('computeInnerClimate', () => {
  it('returns ripple when dinner is heavy', () => {
    const signals = buildWellnessSignals(SUNNY_DAY, null, BASELINES_FIXTURE)
    const climate = computeInnerClimate(signals, [DINNER_LOG])
    expect(climate.state).toBe('ripple')
    expect(climate.label).toBe('微澜')
  })
})

describe('computeDailyBrief', () => {
  it('includes wuyin suitability chip when prescription exists', () => {
    const snap = buildWellnessSnapshot(ROWS_RAINY, BASELINES_FIXTURE, [], '2026-06-09')
    const signals = buildWellnessSignals(RAINY_DAY, YESTERDAY_EXERCISE, BASELINES_FIXTURE)
    const brief = computeDailyBrief(
      signals,
      snap!.bodyWeather,
      snap!.innerClimate,
      snap!.mood,
      snap!.wuyin,
      snap!.circadian,
      ROWS_RAINY,
      BASELINES_FIXTURE,
    )
    expect(brief.suitability.some((c) => c.id === 'wuyin')).toBe(true)
    expect(brief.suitability.length).toBeLessThanOrEqual(3)
  })
})
