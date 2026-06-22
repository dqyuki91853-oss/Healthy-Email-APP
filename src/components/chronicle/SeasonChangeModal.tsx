import type { BodySeasonSnapshot } from '../../types/bodySeason'
import { SeasonIcon } from '../illustrations/SeasonIcon'
import { seasonLabelZh } from '../../lib/bodySeasonLabels'

interface Props {
  open: boolean
  season: BodySeasonSnapshot
  onClose: () => void
}

export function SeasonChangeModal({ open, season, onClose }: Props) {
  if (!open) return null

  const prev = season.previousSeasonId

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-text)]/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="身体季节更替"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="weather-chronicle weather-chronicle-animate-season w-full max-w-md rounded-[var(--radius-lg)] bg-white p-8 shadow-[var(--shadow-float)]">
        <div className="flex items-center justify-center gap-6">
          {prev && (
            <>
              <div className="flex flex-col items-center opacity-60">
                <SeasonIcon seasonId={prev} size={48} />
                <span className="mt-2 text-sm text-[var(--weather-text-soft)]">
                  {seasonLabelZh(prev)}
                </span>
              </div>
              <span className="text-2xl text-[var(--weather-text-soft)]" aria-hidden>
                →
              </span>
            </>
          )}
          <div className="flex flex-col items-center">
            <SeasonIcon seasonId={season.seasonId} size={64} />
            <span className="mt-2 text-lg font-semibold text-[var(--weather-text)]">
              {season.label}
            </span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-lg font-semibold text-[var(--weather-text)]">
          你的身体从「{prev ? seasonLabelZh(prev) : '上一季'}」进入了「{season.label}」
        </h2>
        <p className="mt-3 text-center text-sm text-[var(--weather-text-soft)]">{season.metaphor}</p>

        <ul className="mt-6 space-y-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]/80 p-4">
          {season.suggestions.map((s) => (
            <li key={s} className="text-sm text-[var(--weather-text)]">
              {s}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-[var(--weather-leaf)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          知道了
        </button>
      </div>
    </div>
  )
}
