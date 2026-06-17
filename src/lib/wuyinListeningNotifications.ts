import type { PersonalCircadianPlan, WuyinListeningWindow, WuyinPrescription } from '../types/tcm'
import { computeWuyinListeningWindow } from '../engine/wuyinListeningWindow'
import { practicedWuyinToday, WUYIN_PRACTICE_UPDATE_EVENT } from './wuyinPracticeStreak'
import { getWuyinListeningPrefs, isListeningReminderSuppressed } from './wuyinListeningPrefs'
import { isTauri } from './platform'

/** 32-bit 通知 ID — 收工窗口开启提醒 */
export const WUYIN_LISTENING_NOTIFICATION_ID = 90_001

export function listeningWindowFireDate(windowStart: string, now = new Date()): Date {
  const [h, m] = windowStart.split(':').map(Number)
  const d = new Date(now)
  d.setSeconds(0, 0)
  d.setMilliseconds(0)
  d.setHours(h, m, 0, 0)
  if (d.getTime() <= now.getTime()) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

export function notificationRouteForWindow(win: WuyinListeningWindow): {
  route: string
  scrollTo: string | null
} {
  if (win.tier === 'primary' && win.suggestedMode === 'hum') {
    return { route: '/practice/wuyin', scrollTo: null }
  }
  return { route: '/', scrollTo: 'wellness-dojo' }
}

async function ensureNotificationPermission(): Promise<boolean> {
  const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification')
  if (await isPermissionGranted()) return true
  return (await requestPermission()) === 'granted'
}

export async function cancelWuyinListeningNotification(): Promise<void> {
  if (!isTauri()) return
  try {
    const { cancel } = await import('@tauri-apps/plugin-notification')
    await cancel([WUYIN_LISTENING_NOTIFICATION_ID])
  } catch {
    /* plugin unavailable */
  }
}

export async function syncWuyinListeningNotification(
  circadian: PersonalCircadianPlan | null | undefined,
  wuyin: WuyinPrescription | null | undefined,
): Promise<void> {
  if (!isTauri()) return

  const prefs = getWuyinListeningPrefs()
  if (!prefs.enabled || !prefs.nativeNotify || isListeningReminderSuppressed()) {
    await cancelWuyinListeningNotification()
    return
  }
  if (!circadian || !wuyin) {
    await cancelWuyinListeningNotification()
    return
  }

  const win = computeWuyinListeningWindow(circadian, wuyin, {
    practicedToday: practicedWuyinToday(),
    gateLeadMin: prefs.gateLeadMin,
  })
  if (!win || win.completedInWindow || win.tier === 'closed') {
    await cancelWuyinListeningNotification()
    return
  }

  const granted = await ensureNotificationPermission()
  if (!granted) return

  const { sendNotification, Schedule, cancel } = await import('@tauri-apps/plugin-notification')
  await cancel([WUYIN_LISTENING_NOTIFICATION_ID]).catch(() => {})

  const fireAt = listeningWindowFireDate(win.windowStart)
  const { route, scrollTo } = notificationRouteForWindow(win)

  sendNotification({
    id: WUYIN_LISTENING_NOTIFICATION_ID,
    title: '五音收工提醒',
    body: `${win.windowStart}–${win.windowEnd} · ${win.reasonText}`,
    schedule: Schedule.at(fireAt, false, true),
    autoCancel: true,
    extra: { route, scrollTo },
  })
}

type NotificationExtra = { route?: string; scrollTo?: string | null }

function handleNotificationNavigate(
  extra: NotificationExtra | undefined,
  navigate: (path: string) => void,
): void {
  const route = extra?.route ?? '/'
  navigate(route)
  if (extra?.scrollTo) {
    window.setTimeout(() => {
      document.getElementById(extra.scrollTo!)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 350)
  }
}

/** 注册通知点击深链（Mac App） */
export function setupWuyinNotificationDeepLink(navigate: (path: string) => void): () => void {
  if (!isTauri()) return () => {}

  let disposed = false
  let cleanup: (() => void) | undefined

  void (async () => {
    try {
      const { onAction } = await import('@tauri-apps/plugin-notification')
      const listener = await onAction((notification) => {
        handleNotificationNavigate(notification.extra as NotificationExtra | undefined, navigate)
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

export const WUYIN_NOTIFICATION_RESYNC_EVENT = 'wuyin-notification-resync'

export function requestWuyinNotificationResync(): void {
  window.dispatchEvent(new Event(WUYIN_NOTIFICATION_RESYNC_EVENT))
}

/** 监听练习完成等事件，便于重新调度通知 */
export function bindWuyinNotificationResyncListeners(onResync: () => void): () => void {
  const handler = () => onResync()
  window.addEventListener(WUYIN_PRACTICE_UPDATE_EVENT, handler)
  window.addEventListener(WUYIN_NOTIFICATION_RESYNC_EVENT, handler)
  return () => {
    window.removeEventListener(WUYIN_PRACTICE_UPDATE_EVENT, handler)
    window.removeEventListener(WUYIN_NOTIFICATION_RESYNC_EVENT, handler)
  }
}
