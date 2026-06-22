import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadBodyReplies,
  saveBodyReply,
  getLatestReply,
  getReplyForWeek,
  formatReplyHintForLetter,
  weekKeyForLetterRange,
} from './bodyReplyStore'

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

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorage())
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
})

describe('bodyReplyStore', () => {
  it('saves and loads a reply for a letter week', () => {
    const range = { start: '2026-06-02', end: '2026-06-08' }
    const saved = saveBodyReply('这周睡不太好，想早点休息。', range)
    expect(saved).not.toBeNull()
    expect(saved!.text).toBe('这周睡不太好，想早点休息。')
    expect(getReplyForWeek(weekKeyForLetterRange(range))).toEqual(saved)
    expect(loadBodyReplies()).toHaveLength(1)
  })

  it('rejects empty or over-length text', () => {
    expect(saveBodyReply('   ')).toBeNull()
    expect(saveBodyReply('x'.repeat(501))).toBeNull()
    expect(loadBodyReplies()).toHaveLength(0)
  })

  it('updates existing reply for the same week', () => {
    const range = { start: '2026-06-02', end: '2026-06-08' }
    const first = saveBodyReply('第一版', range)!
    const second = saveBodyReply('更新版', range)!
    expect(second.id).toBe(first.id)
    expect(loadBodyReplies()).toHaveLength(1)
    expect(getLatestReply()!.text).toBe('更新版')
  })

  it('formatReplyHintForLetter returns excerpt for latest reply', () => {
    saveBodyReply('谢谢提醒，我会少喝奶茶。', { start: '2026-05-26', end: '2026-06-01' })
    const hint = formatReplyHintForLetter()
    expect(hint).toContain('用户上一封回信说')
    expect(hint).toContain('少喝奶茶')
  })

  it('formatReplyHintForLetter returns null when no replies', () => {
    expect(formatReplyHintForLetter()).toBeNull()
  })
})
