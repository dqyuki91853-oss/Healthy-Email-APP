import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { useChronicleNotificationPrefs } from '../../hooks/useChronicleNotificationPrefs'
import { CHRONICLE_NOTIFICATION_PREFS_EVENT } from '../../lib/chronicleNotificationPrefs'
import {
  bindChronicleNotificationResyncListeners,
  setupChronicleNotificationDeepLink,
  syncChronicleMorningNotification,
} from '../../services/chronicleNotifications'
import { isTauri } from '../../lib/platform'

/** Mac App / Web：调度晨间身体天气推送 */
export function ChronicleNotificationBridge() {
  const navigate = useNavigate()
  const wellness = useAppStore((s) => s.wellness)
  const prefs = useChronicleNotificationPrefs()

  useEffect(() => {
    if (!isTauri()) return
    return setupChronicleNotificationDeepLink(navigate)
  }, [navigate])

  useEffect(() => {
    const resync = () => {
      void syncChronicleMorningNotification(wellness)
    }

    resync()
    const off = bindChronicleNotificationResyncListeners(resync)
    const onPrefs = () => resync()
    window.addEventListener(CHRONICLE_NOTIFICATION_PREFS_EVENT, onPrefs)

    return () => {
      off()
      window.removeEventListener(CHRONICLE_NOTIFICATION_PREFS_EVENT, onPrefs)
    }
  }, [
    wellness,
    wellness?.date,
    wellness?.dailyBrief,
    wellness?.bodyWeather?.weatherId,
    prefs.enabled,
    prefs.nativeNotify,
    prefs.hour,
    prefs.minute,
  ])

  return null
}
