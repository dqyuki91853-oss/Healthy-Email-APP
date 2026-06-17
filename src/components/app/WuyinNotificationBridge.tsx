import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { useWuyinListeningPrefs } from '../../hooks/useWuyinListeningPrefs'
import { WUYIN_LISTENING_PREFS_EVENT } from '../../lib/wuyinListeningPrefs'
import {
  bindWuyinNotificationResyncListeners,
  setupWuyinNotificationDeepLink,
  syncWuyinListeningNotification,
} from '../../lib/wuyinListeningNotifications'
import { isTauri } from '../../lib/platform'

/** Mac App：调度收工本地通知 + 通知点击深链 */
export function WuyinNotificationBridge() {
  const navigate = useNavigate()
  const wellness = useAppStore((s) => s.wellness)
  const prefs = useWuyinListeningPrefs()

  useEffect(() => {
    if (!isTauri()) return
    return setupWuyinNotificationDeepLink(navigate)
  }, [navigate])

  useEffect(() => {
    if (!isTauri()) return

    const resync = () => {
      void syncWuyinListeningNotification(wellness?.circadian, wellness?.wuyin)
    }

    resync()
    const offPractice = bindWuyinNotificationResyncListeners(resync)
    const onPrefs = () => resync()
    window.addEventListener(WUYIN_LISTENING_PREFS_EVENT, onPrefs)

    return () => {
      offPractice()
      window.removeEventListener(WUYIN_LISTENING_PREFS_EVENT, onPrefs)
    }
  }, [wellness?.circadian, wellness?.wuyin, wellness?.date, prefs.enabled, prefs.nativeNotify, prefs.gateLeadMin])

  return null
}
