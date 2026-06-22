import { describe, expect, it } from 'vitest'
import { comboLabel, recommendTea, teaKey } from './bodyTeaGuide'

describe('recommendTea', () => {
  it('maps rainy autumn to 桂花龙井', () => {
    const tea = recommendTea('rainy', 'autumn')
    expect(tea.name).toBe('桂花龙井')
    expect(tea.whisper).toBe('雨凉了秋天，桂花暖着杯')
    expect(tea.nature).toBe('neutral')
  })

  it('covers all 6 weathers × 4 seasons', () => {
    const weathers = ['sunny', 'partly_cloudy', 'overcast', 'rainy', 'foggy', 'rainbow'] as const
    const seasons = ['spring', 'summer', 'autumn', 'winter'] as const

    for (const weather of weathers) {
      for (const season of seasons) {
        const tea = recommendTea(weather, season)
        expect(tea.name.length).toBeGreaterThan(0)
        expect(tea.whisper.length).toBeLessThanOrEqual(16)
        expect(['warm', 'cool', 'neutral']).toContain(tea.nature)
      }
    }
  })

  it('falls back when inputs missing', () => {
    const tea = recommendTea(null, null)
    expect(tea.name).toBeTruthy()
    expect(tea.whisper).toBeTruthy()
  })

  it('builds stable tea keys for collection', () => {
    expect(teaKey('rainy', 'autumn')).toBe('rainy_autumn')
    expect(comboLabel('rainy', 'autumn')).toBe('雨·秋')
  })
})
