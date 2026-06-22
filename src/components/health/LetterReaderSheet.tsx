import { useEffect, useRef, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { LetterCard } from './LetterCard'
import { Mailbox } from '../illustrations/Mailbox'
import { LetterReplyInput } from './LetterReplyInput'
import { LetterHistory } from './LetterHistory'
import { getDisplayWeeklyScore } from '../../lib/weeklyScore'
import type { WeeklyLetterData } from '../../services/weeklyLetter'
import { isLlmAvailable } from '../../config/llm'
import { Button } from '../ui/Button'
import { RefreshCw, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  letter: WeeklyLetterData | null
  loading: boolean
  error: string | null
  stale: boolean
  onRegenerate: () => void
}

const SEEN_KEY = 'subhealth_last_seen_letter_v3'

/**
 * Slide-in sheet (desktop: right panel 480px; mobile: full-screen).
 * Displays the full weekly letter and supports in-place regeneration.
 */
export function LetterReaderSheet({
  open,
  onClose,
  letter,
  loading,
  error,
  stale,
  onRegenerate,
}: Props) {
  const [replyRefresh, setReplyRefresh] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const llmAvailable = isLlmAvailable()
  const score = getDisplayWeeklyScore(letter)

  // Mark seen on close
  const handleClose = useCallback(() => {
    localStorage.setItem(SEEN_KEY, String(Date.now()))
    onClose()
  }, [onClose])

  // Esc key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-[var(--color-text)]/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={(e) => {
          if (e.target === overlayRef.current) handleClose()
        }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed z-50 flex flex-col bg-[var(--color-bg)] transition-transform duration-400 ease-out
          max-lg:inset-0
          lg:inset-y-0 lg:right-0 lg:w-[480px] lg:rounded-l-[var(--radius-lg)]"
        style={{
          boxShadow: 'var(--shadow-float)',
          animation: 'letterSheetIn 0.4s ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="本周健康来信"
      >
        <style>{sheetAnimStyles}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">本周健康来信</h2>
            {score != null && (
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-teal)]/10 px-3 py-0.5 text-sm font-bold text-[var(--color-teal)]">
                {score}/100
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-50"
              aria-label="重新生成来信"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              重新生成
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
              aria-label="关闭来信"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Loading */}
          {loading && (
            <LetterCard>
              <div className="flex flex-col items-center gap-6 py-16">
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
            </LetterCard>
          )}

          {/* Error */}
          {!loading && error && (
            <LetterCard>
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="text-sm text-[var(--color-red)]">生成健康来信时出错了：{error}</p>
                <Button variant="ghost" onClick={onRegenerate}>
                  <RefreshCw size={14} /> 重试
                </Button>
              </div>
            </LetterCard>
          )}

          {/* Insufficient data */}
          {!loading && !error && letter?.insufficientData && (
            <LetterCard>
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <Mailbox size={64} />
                <div>
                  <p className="text-sm font-medium">数据还不够哦</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    至少需要 3 天的健康数据才能生成周报。
                  </p>
                </div>
                <Link to="/settings" onClick={handleClose}>
                  <Button>导入 Apple Health 数据</Button>
                </Link>
              </div>
            </LetterCard>
          )}

          {/* Letter content */}
          {!loading && !error && letter?.letter && (
            <LetterCard>
              {/* Letter body paragraphs */}
              <div className="max-w-none">
                {letter.letter.split('\n\n').filter(Boolean).map((paragraph, i) => (
                  <p key={i} className="mb-4 text-[15px] leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-[var(--color-muted)]">
                    {letter.dateRange
                      ? `${letter.dateRange.start} — ${letter.dateRange.end}`
                      : ''}
                  </p>
                  {stale && (
                    <span className="text-xs text-[var(--color-coral)]">
                      数据已有更新
                    </span>
                  )}
                </div>
                {!llmAvailable && (
                  <span className="text-[10px] text-[var(--color-muted)]">
                    基础模式 ·{' '}
                    <Link to="/settings" className="text-[var(--color-teal)] underline" onClick={handleClose}>
                      配置 API Key
                    </Link>
                    可启用 AI 个性化
                  </span>
                )}
              </div>

              <LetterReplyInput
                dateRange={letter.dateRange}
                onSaved={() => setReplyRefresh((v) => v + 1)}
              />
              <LetterHistory currentDateRange={letter.dateRange} refreshKey={replyRefresh} />
            </LetterCard>
          )}
        </div>
      </div>
    </>
  )
}

/** Slide-up + fade for reduced-motion safety */
const sheetAnimStyles = `
@keyframes letterSheetIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@media (max-width: 1023px) {
  @keyframes letterSheetIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes letterSheetIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}
`
