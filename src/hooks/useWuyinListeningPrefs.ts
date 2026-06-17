import { useEffect, useState } from 'react'
import {
  normalizeListeningPrefsForToday,
  type WuyinListeningPrefs,
  WUYIN_LISTENING_PREFS_EVENT,
} from '../lib/wuyinListeningPrefs'

export function useWuyinListeningPrefs(): WuyinListeningPrefs {
  const [prefs, setPrefs] = useState(() => normalizeListeningPrefsForToday())

  useEffect(() => {
    const refresh = () => setPrefs(normalizeListeningPrefsForToday())
    window.addEventListener(WUYIN_LISTENING_PREFS_EVENT, refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(WUYIN_LISTENING_PREFS_EVENT, refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return prefs
}
