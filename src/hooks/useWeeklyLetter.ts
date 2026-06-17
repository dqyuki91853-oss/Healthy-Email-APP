import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import {
  generateWeeklyLetterAndCache,
  getCachedLetter,
  shouldAutoRefreshForNewWeek,
  type WeeklyLetterData,
} from '../services/weeklyLetter'

export interface UseWeeklyLetterReturn {
  letter: WeeklyLetterData | null
  loading: boolean
  error: string | null
  stale: boolean
  regenerate: () => void
}

/**
 * Centralized weekly-letter lifecycle hook.
 *
 * - On mount: show stored/cached letter immediately, auto-generate only on Monday or first visit.
 * - On `regenerate()`: force a new generation (skips cache).
 * - Wellness ref ensures the latest snapshot is baked into the letter opener.
 *
 * Consumes watchRows / voiceLogs / baselines / profile / wellness from the Zustand store
 * so the caller does NOT need to thread them through.
 */
export function useWeeklyLetter(): UseWeeklyLetterReturn {
  const store = useAppStore()
  const {
    weeklyLetter,
    weeklyLetterVersion,
    weeklyLetterStale,
  } = store

  const [loading, setLoading] = useState(!weeklyLetter?.letter)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(false)

  // Keep a ref to the latest store snapshot so generation always uses fresh data.
  const storeRef = useRef(store)
  storeRef.current = store

  const generateLetter = useCallback(async (skipCache = false) => {
    const s = storeRef.current
    setLoading(true)
    setError(null)

    try {
      // 1. If not skipping cache, try stored/cached letter first
      if (!skipCache) {
        if (s.weeklyLetter?.letter && !s.weeklyLetter.insufficientData) {
          setLoading(false)
          return
        }
        const cached = getCachedLetter()
        if (cached?.letter && !cached.insufficientData) {
          s.setWeeklyLetter(cached)
          setLoading(false)
          return
        }
      }

      // 2. Generate new letter
      const data = await generateWeeklyLetterAndCache(
        s.watchRows,
        s.voiceLogs,
        s.baselines,
        s.profile,
        s.wellness,
      )
      s.setWeeklyLetter(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Initial load ──
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const s = storeRef.current

    // Already have a valid letter in store → done
    if (s.weeklyLetter?.letter && !s.weeklyLetter.insufficientData) {
      setLoading(false)
      return
    }

    // Check cache
    const cached = getCachedLetter()
    if (cached?.letter && !cached.insufficientData) {
      s.setWeeklyLetter(cached)
      setLoading(false)
      return
    }

    // Auto-generate on Monday or first visit
    if (shouldAutoRefreshForNewWeek() || !cached) {
      generateLetter()
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Regenerate on version bump (manual trigger) ──
  useEffect(() => {
    if (!mountedRef.current) return
    if (weeklyLetterVersion > 0) {
      generateLetter(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyLetterVersion])

  const regenerate = useCallback(() => {
    // Bump version in store → triggers the effect above
    storeRef.current.regenerateWeeklyLetter()
  }, [])

  return {
    letter: weeklyLetter,
    loading,
    error,
    stale: weeklyLetterStale,
    regenerate,
  }
}
