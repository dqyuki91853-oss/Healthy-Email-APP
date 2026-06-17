import { useEffect, useMemo, useState } from 'react'
import type { PersonalCircadianPlan, WuyinListeningWindow, WuyinPrescription } from '../types/tcm'
import { computeWuyinListeningWindow } from '../engine/wuyinListeningWindow'
import { practicedWuyinToday, WUYIN_PRACTICE_UPDATE_EVENT } from '../lib/wuyinPracticeStreak'

export function useWuyinListeningWindow(
  circadian: PersonalCircadianPlan | null | undefined,
  wuyin: WuyinPrescription | null | undefined,
): WuyinListeningWindow | null {
  const [tick, setTick] = useState(0)
  const [practicedToday, setPracticedToday] = useState(practicedWuyinToday)

  useEffect(() => {
    const refresh = () => setPracticedToday(practicedWuyinToday())
    window.addEventListener(WUYIN_PRACTICE_UPDATE_EVENT, refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener(WUYIN_PRACTICE_UPDATE_EVENT, refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return useMemo(() => {
    if (!circadian || !wuyin) return null
    return computeWuyinListeningWindow(circadian, wuyin, {
      now: new Date(),
      practicedToday,
    })
  }, [circadian, wuyin, practicedToday, tick])
}
