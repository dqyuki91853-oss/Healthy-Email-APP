import { useEffect, useState } from 'react'
import {
  getWuyinPracticeStats,
  WUYIN_PRACTICE_UPDATE_EVENT,
  type WuyinPracticeStats,
} from '../lib/wuyinPracticeStreak'

export function useWuyinPracticeStats(): WuyinPracticeStats {
  const [stats, setStats] = useState(getWuyinPracticeStats)

  useEffect(() => {
    const refresh = () => setStats(getWuyinPracticeStats())
    window.addEventListener(WUYIN_PRACTICE_UPDATE_EVENT, refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(WUYIN_PRACTICE_UPDATE_EVENT, refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return stats
}
