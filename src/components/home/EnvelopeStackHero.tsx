import { ScoreRing } from '../ui/ScoreRing'
import { EnvelopeStack } from '../illustrations/EnvelopeStack'
import { getDisplayWeeklyScore } from '../../lib/weeklyScore'
import type { WeeklyLetterData } from '../../services/weeklyLetter'
import type { BodyWeatherId } from '../../types/bodyWeather'

interface Props {
  letter: WeeklyLetterData | null
  loading: boolean
  stale: boolean
  weatherLabel?: string
  weatherId?: BodyWeatherId | null
  nickname?: string
  onOpenSheet: () => void
}

/** Weather-aware gradient tints — reused from HeroBanner. */
function heroGradient(weatherId?: BodyWeatherId | null): string {
  switch (weatherId) {
    case 'rainy':
      return 'linear-gradient(135deg, #D8D4CC 0%, #C8C8C8 60%)'
    case 'overcast':
      return 'linear-gradient(135deg, #E8E4DE 0%, #D4D0C8 60%)'
    case 'foggy':
      return 'linear-gradient(135deg, #EEEAE4 0%, #E8E0D4 60%)'
    case 'rainbow':
      return 'linear-gradient(135deg, #FDF0E0 0%, #F8E9BB 60%)'
    case 'sunny':
      return 'linear-gradient(135deg, #FDFBF2 0%, #F8E9BB 60%)'
    default:
      return 'linear-gradient(135deg, #F8E9BB 0%, #EBC97F 60%)'
  }
}

/**
 * Hero section replacing the old HeroBanner + inline WeeklyLetter.
 *
 * Left: interactive 3-layer envelope stack (click → opens LetterReaderSheet).
 * Right: greeting, the single weather line, ScoreRing, and contextual hints.
 */
export function EnvelopeStackHero({
  letter,
  loading,
  stale,
  weatherLabel,
  weatherId,
  nickname,
  onOpenSheet,
}: Props) {
  const score = getDisplayWeeklyScore(letter)
  const greeting = nickname ? `欢迎回来，${nickname}` : '欢迎回来，健康访客'
  const hasUnread = letter?.letter != null && !localStorage.getItem('subhealth_last_seen_letter_v3')

  // Loading state: pulse envelope placeholder
  const isReady = !loading || (letter?.letter != null)

  return (
    <div
      className="flex flex-wrap items-center gap-6 rounded-[28px] p-6 transition-all duration-700 lg:p-8"
      style={{
        background: heroGradient(weatherId),
        boxShadow: 'var(--shadow-card)',
        minHeight: 220,
        maxHeight: 300,
      }}
    >
      {/* Left: Envelope stack (55% width on desktop) */}
      <div className="flex-shrink-0 mx-auto lg:mx-0" style={{ flex: '0 0 auto' }}>
        {loading && !letter?.letter ? (
          /* Pulse skeleton */
          <div className="flex items-center justify-center animate-pulse" style={{ width: 220, height: 170 }}>
            <div
              className="rounded-2xl bg-[var(--color-cream)]/50"
              style={{ width: 200, height: 140 }}
            />
          </div>
        ) : (
          <EnvelopeStack
            weatherId={weatherId}
            weatherLabel={weatherLabel}
            score={score}
            dateRange={letter?.dateRange}
            onClick={onOpenSheet}
            hasUnread={hasUnread}
          />
        )}
      </div>

      {/* Right: Text area (45% width on desktop) */}
      <div className="flex-1 min-w-0 text-center lg:text-left">
        <h2 className="text-[22px] font-bold leading-tight lg:text-[26px]">{greeting}</h2>

        {/* Single weather line — the ONLY place weather text appears on homepage */}
        <p className="mt-1 text-sm text-[#8A8A8A]">
          {weatherLabel
            ? `今天你的身体是${weatherLabel}`
            : '本周健康来信已准备好'}
        </p>

        {/* Stale hint */}
        {stale && (
          <p className="mt-1 text-xs text-[var(--color-coral)]">
            数据已更新，读信后可重新生成
          </p>
        )}

        {/* CTA hint */}
        {isReady && (
          <p className="mt-2 text-[13px] text-[var(--color-teal)]">
            轻触信封阅读来信
          </p>
        )}

        {loading && !letter?.letter && (
          <p className="mt-2 text-[13px] text-[var(--color-muted)] animate-pulse">
            正在准备来信…
          </p>
        )}
      </div>

      {/* ScoreRing */}
      <div className="flex-shrink-0 mx-auto lg:mx-0">
        {loading && score == null ? (
          /* Skeleton ring */
          <div
            className="animate-pulse rounded-full border-[8px] border-[var(--color-border)]"
            style={{ width: 64, height: 64 }}
          />
        ) : score != null ? (
          <ScoreRing score={score} size={64} />
        ) : (
          /* No letter yet — dash placeholder */
          <div
            className="flex items-center justify-center rounded-full border-[8px] border-[var(--color-border)] text-lg font-semibold text-[var(--color-muted)]"
            style={{ width: 64, height: 64 }}
          >
            —
          </div>
        )}
      </div>
    </div>
  )
}
