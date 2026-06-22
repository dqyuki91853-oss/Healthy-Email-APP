import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  addBloodPressureReading,
  computeFoodFingerprints,
  hasElevatedPostMealBp,
  importBloodPressureReadings,
  loadBloodPressureReadings,
  clearBloodPressureReadings,
} from './bloodPressureStore'
import type { VoiceExtraction } from '../types/voice'

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

const LUNCH_LOG: VoiceExtraction = {
  id: 'lunch-1',
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

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorage())
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
  clearBloodPressureReadings()
})

describe('bloodPressureStore', () => {
  it('adds a valid reading', () => {
    const r = addBloodPressureReading({
      measuredAt: '2026-06-10T08:00:00',
      systolicMmHg: 118,
      diastolicMmHg: 76,
      pulseBpm: 72,
    })
    expect(r?.systolicMmHg).toBe(118)
    expect(loadBloodPressureReadings()).toHaveLength(1)
  })

  it('dedupes on import', () => {
    addBloodPressureReading({
      measuredAt: '2026-06-10T08:00:00',
      systolicMmHg: 118,
      diastolicMmHg: 76,
    })
    const added = importBloodPressureReadings([
      {
        id: 'x',
        measuredAt: '2026-06-10T08:00:00',
        systolicMmHg: 118,
        diastolicMmHg: 76,
        source: 'csv',
      },
      {
        id: 'y',
        measuredAt: '2026-06-11T08:00:00',
        systolicMmHg: 120,
        diastolicMmHg: 78,
        source: 'csv',
      },
    ])
    expect(added).toBe(1)
    expect(loadBloodPressureReadings()).toHaveLength(2)
  })

  it('detects elevated post-meal systolic', () => {
    const logs = [
      { ...LUNCH_LOG, id: 'a', recordDate: '2026-06-09', timestamp: '2026-06-09T12:00:00' },
      LUNCH_LOG,
    ]
    addBloodPressureReading({
      measuredAt: '2026-06-09T12:30:00',
      systolicMmHg: 118,
      diastolicMmHg: 76,
    })
    addBloodPressureReading({
      measuredAt: '2026-06-10T12:30:00',
      systolicMmHg: 145,
      diastolicMmHg: 90,
    })
    expect(hasElevatedPostMealBp('2026-06-10', logs, loadBloodPressureReadings())).toBe(true)
  })

  it('builds food fingerprints from paired meals', () => {
    const logs = [
      { ...LUNCH_LOG, id: 'a', recordDate: '2026-06-08', timestamp: '2026-06-08T12:00:00' },
      { ...LUNCH_LOG, id: 'b', recordDate: '2026-06-09', timestamp: '2026-06-09T12:00:00' },
      LUNCH_LOG,
    ]
    addBloodPressureReading({
      measuredAt: '2026-06-08T12:45:00',
      systolicMmHg: 118,
      diastolicMmHg: 76,
    })
    addBloodPressureReading({
      measuredAt: '2026-06-09T12:45:00',
      systolicMmHg: 119,
      diastolicMmHg: 77,
    })
    addBloodPressureReading({
      measuredAt: '2026-06-10T12:45:00',
      systolicMmHg: 138,
      diastolicMmHg: 86,
    })
    const fps = computeFoodFingerprints(logs, loadBloodPressureReadings())
    expect(fps.some((f) => f.foodName === '面')).toBe(true)
  })
})
