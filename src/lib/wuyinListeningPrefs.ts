export const WUYIN_LISTENING_PREFS_KEY = 'subhealth_wuyin_listening_prefs'
export const WUYIN_LISTENING_PREFS_EVENT = 'wuyin-listening-prefs-updated'

/** 默认收工窗口提前量（分钟） */
export const WUYIN_GATE_LEAD_DEFAULT_MIN = 15

export const WUYIN_SNOOZE_MINUTES = 30

export interface WuyinListeningPrefs {
  enabled: boolean
  gateLeadMin: number
  /** ISO — 稍后提醒截止 */
  snoozeUntil: string | null
  /** YYYY-MM-DD — 今日不再提醒 */
  dismissDate: string | null
}

const DEFAULTS: WuyinListeningPrefs = {
  enabled: true,
  gateLeadMin: WUYIN_GATE_LEAD_DEFAULT_MIN,
  snoozeUntil: null,
  dismissDate: null,
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function read(): WuyinListeningPrefs {
  try {
    const raw = localStorage.getItem(WUYIN_LISTENING_PREFS_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<WuyinListeningPrefs>
    return {
      enabled: parsed.enabled ?? DEFAULTS.enabled,
      gateLeadMin: clampGateLead(parsed.gateLeadMin ?? DEFAULTS.gateLeadMin),
      snoozeUntil: parsed.snoozeUntil ?? null,
      dismissDate: parsed.dismissDate ?? null,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function write(prefs: WuyinListeningPrefs): void {
  localStorage.setItem(WUYIN_LISTENING_PREFS_KEY, JSON.stringify(prefs))
  window.dispatchEvent(new Event(WUYIN_LISTENING_PREFS_EVENT))
}

export function clampGateLead(minutes: number): number {
  return Math.max(0, Math.min(60, Math.round(minutes)))
}

export function getWuyinListeningPrefs(): WuyinListeningPrefs {
  return read()
}

export function saveWuyinListeningPrefs(patch: Partial<WuyinListeningPrefs>): WuyinListeningPrefs {
  const next = {
    ...read(),
    ...patch,
    gateLeadMin: patch.gateLeadMin != null ? clampGateLead(patch.gateLeadMin) : read().gateLeadMin,
  }
  write(next)
  return next
}

export function clearListeningReminderSuppress(): WuyinListeningPrefs {
  return saveWuyinListeningPrefs({ snoozeUntil: null, dismissDate: null })
}

/** 是否暂时隐藏提醒条（不含设置总开关） */
export function isListeningReminderSuppressed(now = new Date()): boolean {
  const prefs = read()
  if (prefs.dismissDate === todayKey()) return true
  if (prefs.snoozeUntil && new Date(prefs.snoozeUntil) > now) return true
  return false
}

export function snoozeListeningReminder(minutes = WUYIN_SNOOZE_MINUTES): WuyinListeningPrefs {
  const until = new Date(Date.now() + minutes * 60_000).toISOString()
  return saveWuyinListeningPrefs({ snoozeUntil: until })
}

export function dismissListeningReminderForToday(): WuyinListeningPrefs {
  return saveWuyinListeningPrefs({ dismissDate: todayKey() })
}

/** 新一天自动清除「今日不再提醒」标记（snooze 靠时间自然过期） */
export function normalizeListeningPrefsForToday(): WuyinListeningPrefs {
  const prefs = read()
  const today = todayKey()
  if (prefs.dismissDate && prefs.dismissDate !== today) {
    return saveWuyinListeningPrefs({ dismissDate: null })
  }
  if (prefs.snoozeUntil && new Date(prefs.snoozeUntil) <= new Date()) {
    return saveWuyinListeningPrefs({ snoozeUntil: null })
  }
  return prefs
}
