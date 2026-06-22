import { useEffect, useState } from 'react'
import {
  CHRONICLE_NOTIFICATION_PREFS_EVENT,
  getChronicleNotificationPrefs,
  type ChronicleNotificationPrefs,
} from '../lib/chronicleNotificationPrefs'

export function useChronicleNotificationPrefs(): ChronicleNotificationPrefs {
  const [prefs, setPrefs] = useState(getChronicleNotificationPrefs)

  useEffect(() => {
    const refresh = () => setPrefs(getChronicleNotificationPrefs())
    window.addEventListener(CHRONICLE_NOTIFICATION_PREFS_EVENT, refresh)
    return () => window.removeEventListener(CHRONICLE_NOTIFICATION_PREFS_EVENT, refresh)
  }, [])

  return prefs
}
