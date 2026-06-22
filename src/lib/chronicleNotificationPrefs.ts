export const CHRONICLE_NOTIFICATION_PREFS_KEY = 'subhealth_chronicle_notification_prefs'
export const CHRONICLE_NOTIFICATION_PREFS_EVENT = 'chronicle-notification-prefs-updated'
export const CHRONICLE_MORNING_SENT_KEY = 'subhealth_chronicle_morning_sent_date'

export const CHRONICLE_MORNING_DEFAULT_HOUR = 8
export const CHRONICLE_MORNING_DEFAULT_MINUTE = 0

export interface ChronicleNotificationPrefs {
  enabled: boolean
  hour: number
  minute: number
  /** Mac App 系统本地通知；Web 在应用打开时尝试浏览器通知 */
  nativeNotify: boolean
}

const DEFAULTS: ChronicleNotificationPrefs = {
  enabled: true,
  hour: CHRONICLE_MORNING_DEFAULT_HOUR,
  minute: CHRONICLE_MORNING_DEFAULT_MINUTE,
  nativeNotify: true,
}

function clampHour(h: number): number {
  return Math.max(0, Math.min(23, Math.round(h)))
}

function clampMinute(m: number): number {
  return Math.max(0, Math.min(59, Math.round(m)))
}

function read(): ChronicleNotificationPrefs {
  try {
    const raw = localStorage.getItem(CHRONICLE_NOTIFICATION_PREFS_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<ChronicleNotificationPrefs>
    return {
      enabled: parsed.enabled ?? DEFAULTS.enabled,
      hour: clampHour(parsed.hour ?? DEFAULTS.hour),
      minute: clampMinute(parsed.minute ?? DEFAULTS.minute),
      nativeNotify: parsed.nativeNotify ?? DEFAULTS.nativeNotify,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function write(prefs: ChronicleNotificationPrefs): void {
  localStorage.setItem(CHRONICLE_NOTIFICATION_PREFS_KEY, JSON.stringify(prefs))
  window.dispatchEvent(new Event(CHRONICLE_NOTIFICATION_PREFS_EVENT))
}

export function getChronicleNotificationPrefs(): ChronicleNotificationPrefs {
  return read()
}

export function saveChronicleNotificationPrefs(
  patch: Partial<ChronicleNotificationPrefs>,
): ChronicleNotificationPrefs {
  const current = read()
  const next: ChronicleNotificationPrefs = {
    ...current,
    ...patch,
    hour: patch.hour != null ? clampHour(patch.hour) : current.hour,
    minute: patch.minute != null ? clampMinute(patch.minute) : current.minute,
  }
  write(next)
  return next
}

export function formatChronicleMorningTime(prefs: ChronicleNotificationPrefs): string {
  return `${String(prefs.hour).padStart(2, '0')}:${String(prefs.minute).padStart(2, '0')}`
}

export function wasChronicleMorningSentToday(now = new Date()): boolean {
  const today = now.toISOString().slice(0, 10)
  return localStorage.getItem(CHRONICLE_MORNING_SENT_KEY) === today
}

export function markChronicleMorningSent(now = new Date()): void {
  localStorage.setItem(CHRONICLE_MORNING_SENT_KEY, now.toISOString().slice(0, 10))
}

/** 是否已过今日计划推送时刻（用于 Web 前台补发） */
export function isPastScheduledMorningTime(
  prefs: ChronicleNotificationPrefs,
  now = new Date(),
): boolean {
  const scheduled = new Date(now)
  scheduled.setHours(prefs.hour, prefs.minute, 0, 0)
  return now.getTime() >= scheduled.getTime()
}
