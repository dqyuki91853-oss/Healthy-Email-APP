import type { WellnessSnapshot } from '../types/wellness'
import {
  formatChronicleMorningTime,
  getChronicleNotificationPrefs,
  isPastScheduledMorningTime,
  markChronicleMorningSent,
  type ChronicleNotificationPrefs,
  wasChronicleMorningSentToday,
} from '../lib/chronicleNotificationPrefs'
import { isTauri } from '../lib/platform'

/** 32-bit 通知 ID — 晨间身体天气 */
export const CHRONICLE_MORNING_NOTIFICATION_ID = 90_002

export const CHRONICLE_NOTIFICATION_RESYNC_EVENT = 'chronicle-notification-resync'

export function buildChronicleMorningTitle(): string {
  return '健康来信 · 今日天气'
}

/** 推送正文；无 dailyBrief 时返回 null（不推送） */
export function buildChronicleMorningBody(snapshot: WellnessSnapshot): string | null {
  const { bodyWeather, dailyBrief } = snapshot
  if (!dailyBrief) return null

  const suitParts = dailyBrief.suitability.map((c) =>
    c.label.replace(/^适合/, '').trim(),
  )

  let actionPart: string
  if (suitParts.length > 0) {
    actionPart = `适宜${suitParts.join('+')}`
  } else {
    const hints = [
      dailyBrief.decisionHints.labels.exercise,
      dailyBrief.decisionHints.labels.sleep,
    ].filter(Boolean)
    actionPart = hints.length > 0 ? hints.join(' · ') : dailyBrief.trendHint
  }

  return `今早身体${bodyWeather.label}，${actionPart}`
}

export function morningFireDate(
  hour: number,
  minute: number,
  now = new Date(),
): Date {
  const d = new Date(now)
  d.setSeconds(0, 0)
  d.setMilliseconds(0)
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() <= now.getTime()) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

export function shouldScheduleChronicleMorning(
  snapshot: WellnessSnapshot | null | undefined,
  prefs: ChronicleNotificationPrefs,
): snapshot is WellnessSnapshot {
  if (!prefs.enabled) return false
  if (!snapshot?.dailyBrief) return false
  return buildChronicleMorningBody(snapshot) != null
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (isTauri()) {
    const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification')
    if (await isPermissionGranted()) return true
    return (await requestPermission()) === 'granted'
  }
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function cancelChronicleMorningNotification(): Promise<void> {
  if (!isTauri()) return
  try {
    const { cancel } = await import('@tauri-apps/plugin-notification')
    await cancel([CHRONICLE_MORNING_NOTIFICATION_ID])
  } catch {
    /* plugin unavailable */
  }
}

export async function syncChronicleMorningNotification(
  snapshot: WellnessSnapshot | null | undefined,
): Promise<void> {
  const prefs = getChronicleNotificationPrefs()

  if (!shouldScheduleChronicleMorning(snapshot, prefs)) {
    await cancelChronicleMorningNotification()
    return
  }

  const body = buildChronicleMorningBody(snapshot)
  if (!body) return

  if (isTauri()) {
    if (!prefs.nativeNotify) {
      await cancelChronicleMorningNotification()
      return
    }

    const granted = await ensureNotificationPermission()
    if (!granted) return

    const { sendNotification, Schedule, cancel } = await import('@tauri-apps/plugin-notification')
    await cancel([CHRONICLE_MORNING_NOTIFICATION_ID]).catch(() => {})

    const fireAt = morningFireDate(prefs.hour, prefs.minute)
    sendNotification({
      id: CHRONICLE_MORNING_NOTIFICATION_ID,
      title: buildChronicleMorningTitle(),
      body,
      schedule: Schedule.at(fireAt, false, true),
      autoCancel: true,
      extra: { route: '/', scrollTo: null },
    })
    return
  }

  // Web：应用在前台且已过计划时刻时补发一次（无法后台定时）
  if (
    !wasChronicleMorningSentToday() &&
    isPastScheduledMorningTime(prefs) &&
    document.visibilityState !== 'hidden'
  ) {
    const granted = await ensureNotificationPermission()
    if (!granted) return
    try {
      new Notification(buildChronicleMorningTitle(), { body })
      markChronicleMorningSent()
    } catch {
      /* ignore */
    }
  }
}

export function requestChronicleNotificationResync(): void {
  window.dispatchEvent(new Event(CHRONICLE_NOTIFICATION_RESYNC_EVENT))
}

export function bindChronicleNotificationResyncListeners(onResync: () => void): () => void {
  const handler = () => onResync()
  window.addEventListener(CHRONICLE_NOTIFICATION_RESYNC_EVENT, handler)
  return () => window.removeEventListener(CHRONICLE_NOTIFICATION_RESYNC_EVENT, handler)
}

/** 注册晨推通知点击深链（Mac App） */
export function setupChronicleNotificationDeepLink(navigate: (path: string) => void): () => void {
  if (!isTauri()) return () => {}

  let disposed = false
  let cleanup: (() => void) | undefined

  void (async () => {
    try {
      const { onAction } = await import('@tauri-apps/plugin-notification')
      const listener = await onAction((notification) => {
        if (notification.id !== CHRONICLE_MORNING_NOTIFICATION_ID) return
        const extra = notification.extra as { route?: string; scrollTo?: string | null } | undefined
        navigate(extra?.route ?? '/')
      })
      if (disposed) {
        listener.unregister()
        return
      }
      cleanup = () => listener.unregister()
    } catch {
      /* ignore */
    }
  })()

  return () => {
    disposed = true
    cleanup?.()
  }
}

export { formatChronicleMorningTime }
