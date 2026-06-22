import { describe, it, expect } from 'vitest'
import { computeInnerClimate } from './innerClimate'
import { buildWellnessSignals } from '../lib/wellnessSignals'
import { BASELINES_FIXTURE, SUNNY_DAY } from './__fixtures__/wellnessFixtures'
import type { BloodPressureReading } from '../types/bloodPressure'
import type { VoiceExtraction } from '../types/voice'

const LUNCH: VoiceExtraction = {
  id: 'l1',
  timestamp: '2026-06-10T12:00:00',
  recordDate: '2026-06-10',
  mealSlot: 'lunch',
  transcript: '午饭',
  foods: [{ name: '面', portion: 'medium', confidence: 0.9, categories: ['noodle'] }],
  emotions: [],
  symptoms: [],
  stressScore: null,
  brainFogScore: null,
  needsFollowUp: false,
  followUpQuestions: [],
  overallConfidence: 0.9,
  extractionSource: 'local',
}

describe('computeInnerClimate blood pressure', () => {
  it('sets bpInformed false without readings', () => {
    const signals = buildWellnessSignals(SUNNY_DAY, null, BASELINES_FIXTURE)
    const snap = computeInnerClimate(signals, [])
    expect(snap.bpInformed).toBe(false)
  })

  it('forces ripple when post-meal systolic exceeds median by 10%', () => {
    const signals = buildWellnessSignals(SUNNY_DAY, null, BASELINES_FIXTURE)
    const readings: BloodPressureReading[] = [
      {
        id: '1',
        measuredAt: '2026-06-09T12:30:00',
        systolicMmHg: 118,
        diastolicMmHg: 76,
        source: 'manual',
      },
      {
        id: '2',
        measuredAt: '2026-06-10T12:30:00',
        systolicMmHg: 145,
        diastolicMmHg: 90,
        source: 'manual',
      },
    ]
    const logs = [
      { ...LUNCH, id: 'p', recordDate: '2026-06-09', timestamp: '2026-06-09T12:00:00' },
      LUNCH,
    ]
    const snap = computeInnerClimate(signals, logs, readings)
    expect(snap.bpInformed).toBe(true)
    expect(snap.state).toBe('ripple')
    expect(snap.matchedRuleId).toBe('IC-bp-ripple-01')
  })
})
