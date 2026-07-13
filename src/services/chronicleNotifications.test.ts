import { describe, it, expect } from 'vitest'
import { buildChronicleMorningBody, buildChronicleMorningTitle, morningFireDate } from './chronicleNotifications'
import type { WellnessSnapshot } from '../types/wellness'

function minimalSnapshot(overrides: Partial<WellnessSnapshot> = {}): WellnessSnapshot {
  return {
    date: '2026-06-10',
    bodyWeather: {
      date: '2026-06-10',
      weatherId: 'overcast',
      label: '雾',
      metaphor: '像晨雾还没散尽',
      letterOpener: '',
      confidence: 'medium',
      matchedRuleId: 'BW-1',
    } as WellnessSnapshot['bodyWeather'],
    mood: {
      date: '2026-06-10',
      dominant: 'calm',
      confidence: 'medium',
      source: 'unknown',
      matchedRuleIds: [],
    },
    wuyin: null,
    circadian: {
      personalSleepOnset: '23:30',
      personalSleepGate: '23:00',
      confidence: 'medium',
      activeWindowId: null,
      suggestionText: '',
      matchedRuleIds: [],
      minutesUntilGate: 480,
      phaseLabel: 'before_gate',
      personalizationHint: '',
    },
    listeningWindow: null,
    innerClimate: null,
    dailyBrief: {
      date: '2026-06-10',
      energyLevel: 'steady',
      energyLabel: '平稳',
      recoveryProbability: 0.7,
      recoveryLabel: '恢复 70%',
      trendHint: '接下来几天大概维持现状',
      suitability: [
        { id: 'walk', label: '适合散步' },
        { id: 'wuyin', label: '适合跟哼宫音', href: '/practice/wuyin' },
      ],
      decisionHints: {
        exercise: 'light',
        treat: 'ok',
        sleep: 'normal',
        labels: {
          exercise: '轻度动一动可以',
          treat: '解解馋可以',
          sleep: '作息照常',
        },
      },
      confidence: 'medium',
      matchedRuleId: 'DB-energy-steady',
    },
    caseFiles: [],
    bodySeason: null,
    bpAdvisory: null,
    ...overrides,
  }
}

describe('chronicleNotifications', () => {
  it('buildChronicleMorningTitle is warm and non-clinical', () => {
    expect(buildChronicleMorningTitle()).toContain('今日天气')
  })

  it('returns null body when dailyBrief missing', () => {
    const snap = minimalSnapshot({ dailyBrief: undefined as unknown as WellnessSnapshot['dailyBrief'] })
    expect(buildChronicleMorningBody(snap)).toBeNull()
  })

  it('builds morning body with weather and suitability', () => {
    const body = buildChronicleMorningBody(minimalSnapshot())
    expect(body).toBe('今早身体雾，适宜散步+跟哼宫音')
  })

  it('falls back to decision labels when no suitability chips', () => {
    const snap = minimalSnapshot({
      dailyBrief: {
        ...minimalSnapshot().dailyBrief!,
        suitability: [],
      },
    })
    const body = buildChronicleMorningBody(snap)
    expect(body).toContain('今早身体雾')
    expect(body).toContain('轻度动一动')
  })

  it('schedules fire date on next occurrence', () => {
    const now = new Date('2026-06-10T09:00:00')
    const fire = morningFireDate(8, 0, now)
    expect(fire.getHours()).toBe(8)
    expect(fire.getDate()).toBe(11)
  })
})
