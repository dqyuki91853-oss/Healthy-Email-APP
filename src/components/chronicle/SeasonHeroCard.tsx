import type { BodySeasonSnapshot, BodySeasonId } from '../../types/bodySeason'
import { SeasonIcon } from '../illustrations/SeasonIcon'

interface Props {
  season: BodySeasonSnapshot
}

export function SeasonHeroCard({ season }: Props) {
  return (
    <div className="weather-chronicle weather-chronicle-card p-6">
      <div className="flex items-start gap-4">
        <SeasonIcon seasonId={season.seasonId} size={64} title={season.label} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--weather-rain)]">
            当前生理季
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--weather-text)]">
            你的身体正处于「{season.label}」
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--weather-text-soft)]">
            {season.metaphor}
          </p>
          <p className="mt-3 text-xs text-[var(--weather-text-soft)]">
            漂移指数 {Math.round(season.driftScore * 100)}% ·{' '}
            {season.confidence === 'high'
              ? '信号较稳'
              : season.confidence === 'medium'
                ? '仍在辨认'
                : '线索偏少'}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2 border-t border-[var(--weather-card-border)] pt-4">
        {season.suggestions.map((s) => (
          <li key={s} className="flex gap-2 text-sm text-[var(--weather-text)]">
            <span className="text-[var(--weather-leaf)]" aria-hidden>
              ·
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

const SEASON_ORDER: BodySeasonId[] = ['spring', 'summer', 'autumn', 'winter']

const SEASON_LABEL: Record<BodySeasonId, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}

interface TimelineProps {
  history: { seasonId: BodySeasonId; startedAt: string; endedAt: string | null }[]
  currentSeasonId: BodySeasonId
}

export function SeasonTimeline({ history, currentSeasonId }: TimelineProps) {
  const entries =
    history.length > 0
      ? history
      : [{ seasonId: currentSeasonId, startedAt: '—', endedAt: null }]

  return (
    <div className="weather-chronicle weather-chronicle-card p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-[var(--weather-rain)]">
        季节时间线
      </p>
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {entries.map((entry, i) => (
          <div key={`${entry.seasonId}-${entry.startedAt}-${i}`} className="flex min-w-[72px] flex-col items-center">
            <SeasonIcon seasonId={entry.seasonId} size={32} />
            <span className="mt-2 text-sm font-medium text-[var(--weather-text)]">
              {SEASON_LABEL[entry.seasonId]}
            </span>
            <span className="mt-0.5 text-[10px] text-[var(--weather-text-soft)]">
              {entry.startedAt.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-[var(--weather-text-soft)]">
        {SEASON_ORDER.map((id) => (
          <span key={id} className={id === currentSeasonId ? 'text-[var(--weather-leaf)] font-medium' : ''}>
            {SEASON_LABEL[id]}
          </span>
        ))}
      </div>
    </div>
  )
}
