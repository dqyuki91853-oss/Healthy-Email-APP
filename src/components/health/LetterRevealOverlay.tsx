import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LetterCard } from './LetterCard'
import { Mailbox } from '../illustrations/Mailbox'
import { PostmarkStamp } from '../illustrations/PostmarkStamp'
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

type AnimPhase = 'entering' | 'opening' | 'reading'

const SEEN_KEY = 'subhealth_last_seen_letter_v3'

/**
 * Center-stage overlay that replaces the right-side LetterReaderSheet.
 *
 * Animation timeline (~900ms total, reduced-motion → instant fade):
 *   entering (0–300ms): backdrop fades in, closed envelope scales 0.95→1
 *   opening  (200–700ms): paper slides up from inside envelope
 *   reading  (600ms+): full letter content revealed, scrollable
 */
export function LetterRevealOverlay({
  open,
  onClose,
  letter,
  loading,
  error,
  stale,
  onRegenerate,
}: Props) {
  const [phase, setAnimPhase] = useState<AnimPhase>('entering')
  const [replyRefresh, setReplyRefresh] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const llmAvailable = isLlmAvailable()
  const score = getDisplayWeeklyScore(letter)
  const reducedMotion = useRef(false)

  // Detect reduced-motion preference once
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.current = mq.matches
  }, [])

  // Drive animation phases
  useEffect(() => {
    if (!open) {
      setAnimPhase('entering')
      return
    }
    // Clear old timers
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    setAnimPhase('entering')

    if (reducedMotion.current) {
      // Skip animation — jump straight to reading
      const t = setTimeout(() => setAnimPhase('reading'), 100)
      timersRef.current.push(t)
      return
    }

    const t1 = setTimeout(() => setAnimPhase('opening'), 300)
    const t2 = setTimeout(() => setAnimPhase('reading'), 750)
    timersRef.current.push(t1, t2)

    return () => timersRef.current.forEach(clearTimeout)
  }, [open])

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

  // Lock body scroll
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

  const showEnvelope = phase === 'entering' || phase === 'opening'
  const paperVisible = phase === 'opening' || phase === 'reading'
  const contentVisible = phase === 'reading'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="本周健康来信"
    >
      <style>{overlayStyles}</style>

      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${phase === 'entering' ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: 'rgba(26,17,16,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Envelope Stage (entering + opening phases) ── */}
      {showEnvelope && (
        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-500 ease-out ${
            phase === 'entering' ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
          } ${contentVisible ? 'hidden' : ''}`}
        >
          {/* Envelope SVG */}
          <div
            className="transition-all duration-500 ease-out"
            style={{
              perspective: '800px',
              transformStyle: 'preserve-3d',
            }}
          >
            <svg
              viewBox="0 0 360 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[min(360px,85vw)] h-auto"
              aria-hidden="true"
            >
              {/* Paper — slides up during opening phase */}
              <g
                className="transition-all duration-500 ease-out"
                style={{
                  transform: paperVisible ? 'translateY(-120px)' : 'translateY(0px)',
                  opacity: paperVisible ? 1 : 0.5,
                }}
              >
                <rect x="42" y="16" width="276" height="160" rx="4" fill="white" stroke="#E8E0D4" strokeWidth="0.75" />
                {/* Ruled lines */}
                {[50, 78, 106, 134, 162].map((y) => (
                  <line key={y} x1="62" y1={y} x2="298" y2={y} stroke="#E8E0D4" strokeWidth="0.75" />
                ))}
              </g>

              {/* Envelope body */}
              <rect x="10" y="80" width="340" height="160" rx="8" fill="#F5F0E8" />

              {/* Envelope flap — rotates open during opening phase */}
              <g
                className="transition-all duration-500 ease-out"
                style={{
                  transformOrigin: '180px 80px',
                  transform: paperVisible ? 'rotateX(-160deg)' : 'rotateX(0deg)',
                  opacity: paperVisible ? 0.2 : 1,
                }}
              >
                <path d="M10 80 L180 140 L350 80" fill="#EDE6D8" stroke="#E0D8C8" strokeWidth="1" />
              </g>

              {/* Bottom flap (stays visible) */}
              <path d="M10 168 L180 238 L350 168" fill="#EDE6D8" stroke="#E0D8C8" strokeWidth="1.25" />
            </svg>

            {/* Postmark on envelope during entering */}
            <div
              className={`absolute transition-all duration-500 ease-out ${
                paperVisible ? 'opacity-0 translate-y-4' : 'opacity-100'
              }`}
              style={{ right: 20, bottom: 44 }}
            >
              <PostmarkStamp score={score} dateRange={letter?.dateRange} />
            </div>
          </div>

          {/* Loading dots during entering */}
          {loading && phase === 'entering' && (
            <p className="mt-3 text-sm text-white/60 animate-pulse">正在准备来信…</p>
          )}
        </div>
      )}

      {/* ── Letter content (reading phase) ── */}
      {contentVisible && (
        <div className="relative z-10 flex w-full max-w-lg flex-col animate-[letterFadeIn_0.4s_ease-out]">
          {/* Close + regenerate header */}
          <div className="mb-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              {score != null && (
                <span className="rounded-[var(--radius-pill)] bg-white/15 px-3 py-0.5 text-sm font-bold text-white">
                  {score}/100
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRegenerate}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-white/20 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                重新生成
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-white/60 hover:bg-white/10 transition-colors"
                aria-label="关闭来信"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable content area */}
          <div
            className="overflow-y-auto rounded-[var(--radius-lg)]"
            style={{ maxHeight: '70vh' }}
          >
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
                <div className="max-w-none">
                  {letter.letter.split('\n\n').filter(Boolean).map((paragraph, i) => (
                    <p key={i} className={`mb-4 text-[15px] leading-relaxed ${i === 0 ? 'italic' : ''}`}>
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
      )}
    </div>
  )
}

const overlayStyles = `
@keyframes letterFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes letterFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}
`
