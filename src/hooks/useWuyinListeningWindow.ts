import { useEffect, useMemo, useState } from 'react'
import type { PersonalCircadianPlan, WuyinListeningWindow, WuyinPrescription } from '../types/tcm'
import { computeWuyinListeningWindow } from '../engine/wuyinListeningWindow'
import { practicedWuyinToday, WUYIN_PRACTICE_UPDATE_EVENT } from '../lib/wuyinPracticeStreak'
import {
  isListeningReminderSuppressed,
  normalizeListeningPrefsForToday,
} from '../lib/wuyinListeningPrefs'
import { useWuyinListeningPrefs } from './useWuyinListeningPrefs'

export function useWuyinListeningWindow(
  circadian: PersonalCircadianPlan | null | undefined,
  wuyin: WuyinPrescription | null | undefined,
): WuyinListeningWindow | null {
  const prefs = useWuyinListeningPrefs()
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
    normalizeListeningPrefsForToday()
    const id = window.setInterval(() => {
      normalizeListeningPrefsForToday()
      setTick((t) => t + 1)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return useMemo(() => {
    if (!circadian || !wuyin) return null
    const win = computeWuyinListeningWindow(circadian, wuyin, {
      now: new Date(),
      practicedToday,
      gateLeadMin: prefs.gateLeadMin,
    })
    if (!win) return null
    if (win.completedInWindow) return win
    if (!prefs.enabled) return null
    if (isListeningReminderSuppressed()) return null
    return win
  }, [circadian, wuyin, practicedToday, prefs.enabled, prefs.gateLeadMin, tick])
}
