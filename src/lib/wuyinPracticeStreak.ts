const STORAGE_KEY = 'subhealth_wuyin_practice'
const UPDATE_EVENT = 'wuyin-practice-updated'

export interface WuyinPracticeStats {
  lastDate: string
  streak: number
  total: number
}

function read(): WuyinPracticeStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { lastDate: '', streak: 0, total: 0 }
    return JSON.parse(raw) as WuyinPracticeStats
  } catch {
    return { lastDate: '', streak: 0, total: 0 }
  }
}

function write(data: WuyinPracticeStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function getWuyinPracticeStats(): WuyinPracticeStats {
  return read()
}

export function practicedWuyinToday(): boolean {
  return read().lastDate === todayKey()
}

/** 首页 / 练习入口展示文案 */
export function getPracticeEntryHint(stats: WuyinPracticeStats): string | null {
  if (stats.total === 0) return null
  if (practicedWuyinToday() && stats.streak > 1) {
    return `今日已练 · 连续 ${stats.streak} 日`
  }
  if (practicedWuyinToday()) {
    return '今日已练 · 收功圆满'
  }
  if (stats.streak > 1) {
    return `已连续 ${stats.streak} 日入道场`
  }
  if (stats.total > 0) {
    return `累计练习 ${stats.total} 次`
  }
  return null
}

/** 来信 fallback / LLM 提示用 */
export function getLetterPracticeHint(stats: WuyinPracticeStats): string | null {
  if (stats.total === 0) return null
  if (stats.streak >= 3) {
    return `这周你已经连续 ${stats.streak} 天做了跟哼练习，把节奏慢下来的习惯养得很好。`
  }
  if (practicedWuyinToday()) {
    return '今天你已经做过一次跟哼放松，记得对自己温柔一点。'
  }
  if (stats.total >= 2) {
    return `你已经累计做了 ${stats.total} 次跟哼练习，这种小仪式很值得坚持。`
  }
  return null
}

export const WUYIN_PRACTICE_UPDATE_EVENT = UPDATE_EVENT

/** 完成一次跟哼练习后调用 */
export function recordWuyinPractice(): WuyinPracticeStats {
  const today = todayKey()
  const prev = read()

  if (prev.lastDate === today) {
    const next = { ...prev, total: prev.total + 1 }
    write(next)
    return next
  }

  const streak = prev.lastDate === yesterdayKey() ? prev.streak + 1 : 1
  const next = { lastDate: today, streak, total: prev.total + 1 }
  write(next)
  return next
}
