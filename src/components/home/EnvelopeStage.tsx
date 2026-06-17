import { ScoreRing } from '../ui/ScoreRing'
import { EnvelopeOpen } from '../illustrations/EnvelopeOpen'
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
  onOpenLetter: () => void
}

/** Weather-aware gradient tint for the envelope stage background. */
function stageGradient(weatherId?: BodyWeatherId | null): string {
  switch (weatherId) {
    case 'rainy':
      return 'linear-gradient(135deg, #D8D4CC 0%, #E0DCD6 60%)'
    case 'overcast':
      return 'linear-gradient(135deg, #E8E4DE 0%, #DDD9D1 60%)'
    case 'foggy':
      return 'linear-gradient(135deg, #EEEAE4 0%, #E8E2D8 60%)'
    case 'rainbow':
      return 'linear-gradient(135deg, #FDF0E0 0%, #F8E9BB 60%)'
    case 'sunny':
      return 'linear-gradient(135deg, #FDFBF2 0%, #F8E9BB 60%)'
    default:
      return 'linear-gradient(135deg, #FDFBF2 0%, #F8E9BB 60%)'
  }
}

/**
 * Main-column hero card. Visually equivalent to the Welcome banner in p3 reference.
 * Contains the cream envelope (with paper peek) + ScoreRing + contextual hints.
 */
export function EnvelopeStage({
  letter,
  loading,
  stale,
  weatherLabel,
  weatherId,
  nickname,
  onOpenLetter,
}: Props) {
  const score = getDisplayWeeklyScore(letter)
  const hasUnread = letter?.letter != null && !localStorage.getItem('subhealth_last_seen_letter_v3')

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 rounded-[32px] p-6 transition-all duration-700"
      style={{
        background: stageGradient(weatherId),
        boxShadow: 'var(--shadow-card)',
        width: '100%',
        height: '100%',
        minHeight: 240,
      }}
    >
      {/* Weather hint line */}
      {weatherLabel && (
        <p className="text-xs text-[var(--color-muted)]">
          今天你的身体是{weatherLabel}
        </p>
      )}

      {/* Envelope */}
      <div
        className="transition-transform duration-300 ease-out hover:-translate-y-1.5"
        style={{ cursor: 'pointer' }}
      >
        {loading && !letter?.letter ? (
          <div
            className="animate-pulse rounded-2xl bg-[var(--color-cream)]/50 mx-auto"
            style={{ width: 'min(360px, 85vw)', height: 200 }}
          />
        ) : (
          <EnvelopeOpen
            score={score}
            dateRange={letter?.dateRange}
            weatherId={weatherId}
            weatherLabel={weatherLabel}
            nickname={nickname}
            onClick={onOpenLetter}
            showPaper
          />
        )}
      </div>

      {/* Bottom row: ScoreRing + hints */}
      <div className="flex items-center gap-4">
        {loading && score == null ? (
          <div
            className="animate-pulse rounded-full border-[6px] border-[var(--color-border)]"
            style={{ width: 56, height: 56 }}
          />
        ) : score != null ? (
          <ScoreRing score={score} size={56} />
        ) : (
          <div
            className="flex items-center justify-center rounded-full border-[6px] border-[var(--color-border)] text-base font-semibold text-[var(--color-muted)]"
            style={{ width: 56, height: 56 }}
          >
            —
          </div>
        )}

        <div className="text-left">
          {loading && !letter?.letter ? (
            <p className="text-xs text-[var(--color-muted)] animate-pulse">正在准备来信…</p>
          ) : (
            <p className="text-xs text-[var(--color-teal)]">轻触信封阅读来信</p>
          )}
          {stale && (
            <p className="text-[11px] text-[var(--color-coral)]">数据已更新，可重新生成</p>
          )}
          {hasUnread && (
            <span className="inline-block mt-0.5 h-2 w-2 rounded-full bg-[var(--color-coral)]" />
          )}
        </div>
      </div>
    </div>
  )
}
