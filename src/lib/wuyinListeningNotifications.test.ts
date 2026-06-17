import { describe, expect, it } from 'vitest'
import { listeningWindowFireDate } from './wuyinListeningNotifications'

describe('listeningWindowFireDate', () => {
  it('returns today when window start is later', () => {
    const now = new Date('2026-06-17T10:00:00')
    const fire = listeningWindowFireDate('21:30', now)
    expect(fire.getFullYear()).toBe(2026)
    expect(fire.getMonth()).toBe(5)
    expect(fire.getDate()).toBe(17)
    expect(fire.getHours()).toBe(21)
    expect(fire.getMinutes()).toBe(30)
  })

  it('rolls to tomorrow when window start already passed', () => {
    const now = new Date('2026-06-17T22:00:00')
    const fire = listeningWindowFireDate('21:30', now)
    expect(fire.getDate()).toBe(18)
    expect(fire.getHours()).toBe(21)
  })
})
