import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { DailyWatchRow, PersonalBaseline, UserProfile } from '../../types/health'
import type { VoiceExtraction } from '../../types/voice'
import { generateWeeklyLetterAndCache, getCachedLetter, shouldAutoRefreshForNewWeek, type WeeklyLetterData } from '../../services/weeklyLetter'
import { isLlmAvailable } from '../../config/llm'
import { Card } from '../ui/Card'
import { LetterCard } from './LetterCard'
import { Mailbox } from '../illustrations/Mailbox'
import { RefreshCw, MessageSquareHeart } from 'lucide-react'
import { Button } from '../ui/Button'
import type { WellnessSnapshot } from '../../types/wellness'

interface WeeklyLetterProps {
  watchRows: DailyWatchRow[]
  voiceLogs: VoiceExtraction[]
  baselines: PersonalBaseline[]
  profile: UserProfile
  regenerationKey: number
  onRegenerate: () => void
  wellness?: WellnessSnapshot | null
  /** P0-a: stored letter from Zustand so remount doesn't flash loading */
  storedLetter?: WeeklyLetterData | null
  onLetterReady?: (data: WeeklyLetterData) => void
  stale?: boolean
}

export function WeeklyLetter({
  watchRows,
  voiceLogs,
  baselines,
  profile,
  regenerationKey,
  onRegenerate,
  wellness,
  storedLetter,
  onLetterReady,
  stale,
}: WeeklyLetterProps) {
  const [letterData, setLetterData] = useState<WeeklyLetterData | null>(storedLetter ?? null)
  const [loading, setLoading] = useState(!storedLetter)
  const [error, setError] = useState<string | null>(null)

  const llmAvailable = isLlmAvailable()
  const wellnessRef = useRef(wellness)
  wellnessRef.current = wellness
  const mountedRef = useRef(false)

  const loadLetter = useCallback(async (skipCache = false) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Check stored/props letter (same-week route change)
      if (!skipCache) {
        const cached = getCachedLetter()
        if (cached && !cached.insufficientData && cached.letter) {
          setLetterData(cached)
          onLetterReady?.(cached)
          setLoading(false)
          return
        }
      }

      // 2. Generate new
      const data = await generateWeeklyLetterAndCache(
        watchRows, voiceLogs, baselines, profile, wellnessRef.current,
      )
      setLetterData(data)
      onLetterReady?.(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }, [watchRows, voiceLogs, baselines, profile, onLetterReady])

  // On mount: show stored or cached letter immediately, auto-generate only on Monday
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    if (storedLetter && storedLetter.letter && !storedLetter.insufficientData) {
      setLetterData(storedLetter)
      setLoading(false)
      return
    }

    const cached = getCachedLetter()
    if (cached && cached.letter && !cached.insufficientData) {
      setLetterData(cached)
      onLetterReady?.(cached)
      setLoading(false)
      return
    }

    // First time or new week: auto generate
    if (shouldAutoRefreshForNewWeek() || !cached) {
      loadLetter()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-generate on manual click (regenerationKey change)
  useEffect(() => {
    if (!mountedRef.current) return
    if (regenerationKey > 0) {
      loadLetter(true) // skip cache, force regenerate
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenerationKey])

  // ── Loading ──
  if (loading) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="animate-pulse">
            <Mailbox size={72} />
          </div>
          <p className="text-sm text-[var(--color-muted)] animate-pulse">
            正在为你生成每周健康来信…
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-teal)]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <MessageSquareHeart size={40} className="text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-red)]">生成健康来信时出错了：{error}</p>
          <Button variant="ghost" onClick={onRegenerate}>
            <RefreshCw size={14} /> 重试
          </Button>
        </div>
      </Card>
    )
  }

  // ── Insufficient data ──
  if (letterData?.insufficientData) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Mailbox size={64} />
          <div>
            <p className="text-sm font-medium">数据还不够哦</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              至少需要 3 天的健康数据才能生成周报。
            </p>
          </div>
          <Link to="/settings">
            <Button>导入 Apple Health 数据</Button>
          </Link>
        </div>
      </Card>
    )
  }

  // ── Letter display ──
  return (
    <LetterCard>
      {/* Score badge */}
      {letterData?.score != null && (
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-teal)]/10 px-4 py-1.5 text-lg font-bold text-[var(--color-teal)]">
            本周评分 {letterData.score}/100
          </span>
          {!llmAvailable && (
            <span className="text-xs text-[var(--color-muted)]">
              · 基础模式（
              <Link to="/settings" className="text-[var(--color-teal)] underline">
                配置 API Key
              </Link>
              可启用 AI 个性化）
            </span>
          )}
        </div>
      )}

      {/* Letter body */}
      <div className="max-w-none">
        {letterData?.letter?.split('\n\n').filter(Boolean).map((paragraph, i) => (
          <p key={i} className="mb-4 text-[15px] leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center gap-3">
          <p className="text-xs text-[var(--color-muted)]">
            {letterData?.dateRange
              ? `${letterData.dateRange.start} — ${letterData.dateRange.end}`
              : ''}
          </p>
          {stale && (
            <span className="text-xs text-[var(--color-coral)]">
              数据已有更新
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <RefreshCw size={12} /> 重新生成
        </button>
      </div>
    </LetterCard>
  )
}
