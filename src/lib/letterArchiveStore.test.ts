import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  archiveWeeklyLetter,
  clearLetterArchive,
  formatLetterDateRange,
  letterPreview,
  loadLetterArchive,
} from './letterArchiveStore'
import { saveBodyReply } from './bodyReplyStore'
import type { WeeklyLetterData } from '../services/weeklyLetter'

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

const LETTER: WeeklyLetterData = {
  score: 72,
  letter: '这周你的身体像初夏的清晨。\nHRV 稳定，心率平稳，睡眠充足。',
  insufficientData: false,
  dateRange: { start: '2026-06-15', end: '2026-06-21' },
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorage())
  vi.stubGlobal('crypto', { randomUUID: () => `id-${Math.random().toString(36).slice(2, 8)}` })
  clearLetterArchive()
})

describe('letterArchiveStore', () => {
  it('archives a letter with context and reply', () => {
    saveBodyReply('这周睡不太好，想早点休息。', LETTER.dateRange!)
    const entry = archiveWeeklyLetter(LETTER, {
      weatherId: 'sunny',
      weatherLabel: '晴天',
      seasonId: 'spring',
      seasonLabel: '春',
    })
    expect(entry?.score).toBe(72)
    expect(entry?.weatherLabel).toBe('晴天')
    expect(entry?.replyText).toContain('睡不太好')
    expect(loadLetterArchive()).toHaveLength(1)
  })

  it('replaces archive for the same date range', () => {
    archiveWeeklyLetter(LETTER)
    archiveWeeklyLetter({
      ...LETTER,
      letter: '更新后的来信内容。',
      score: 80,
    })
    expect(loadLetterArchive()).toHaveLength(1)
    expect(loadLetterArchive()[0].score).toBe(80)
  })

  it('formats date range and preview', () => {
    expect(formatLetterDateRange(LETTER.dateRange!)).toBe('6/15 - 6/21')
    expect(letterPreview(LETTER.letter!)).toContain('初夏的清晨')
    expect(letterPreview(LETTER.letter!).split('\n')).toHaveLength(2)
  })
})
