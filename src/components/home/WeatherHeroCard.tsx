import { useNavigate } from 'react-router-dom'
import type { BodySeasonSnapshot } from '../../types/bodySeason'
import type { BodyWeatherSnapshot } from '../../types/bodyWeather'
import type { DailyWeatherBrief, DecisionHints, SuitabilityChip } from '../../types/dailyBrief'
import type { InnerClimateSnapshot } from '../../types/innerClimate'
import { WeatherIcon } from '../illustrations/WeatherIcon'
import { WeatherPatternBackdrop } from './WeatherPatternBackdrop'

interface Props {
  bodyWeather: BodyWeatherSnapshot
  dailyBrief: DailyWeatherBrief | null
  innerClimate: InnerClimateSnapshot | null
  bodySeason?: BodySeasonSnapshot | null
  onSeasonBadgeClick?: () => void
}

export function WeatherHeroCard({
  bodyWeather,
  dailyBrief,
  innerClimate,
  bodySeason,
  onSeasonBadgeClick,
}: Props) {
  const navigate = useNavigate()

  const handleChip = (chip: SuitabilityChip) => {
    if (chip.href) {
      navigate(chip.href)
      return
    }
    if (chip.id === 'walk' || chip.id === 'early_sleep' || chip.id === 'circadian_gate') {
      document.getElementById('wellness-dojo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleDecision = (
    hints: DecisionHints,
    kind: 'exercise' | 'treat' | 'sleep',
  ) => {
    if (kind === 'exercise') {
      if (hints.exercise === 'go') {
        navigate('/practice/wuyin')
        return
      }
      document.getElementById('wellness-dojo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (kind === 'treat' && hints.treat === 'caution') {
      navigate('/blood-pressure')
      return
    }
    if (kind === 'sleep' && hints.sleep === 'early') {
      document.getElementById('wellness-dojo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    document.getElementById('wellness-dojo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="weather-chronicle weather-hero-card weather-chronicle-card relative flex h-full min-h-[200px] flex-col overflow-hidden p-5">
      <WeatherPatternBackdrop weatherId={bodyWeather.weatherId} />

      <div className="weather-hero-card__icon-ring pointer-events-none absolute right-3 top-3 h-24 w-24 rounded-full" aria-hidden />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="weather-hero-card__icon-shell shrink-0">
            <WeatherIcon weatherId={bodyWeather.weatherId} size={48} variant="duotone" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--weather-leaf)]">
              今日身体天气
            </p>
            <h2 className="text-base font-semibold leading-snug text-[var(--weather-text)]">
              今天你的身体是{bodyWeather.label}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--weather-text-soft)]">
              {bodyWeather.metaphor}
            </p>
          </div>
        </div>

        {dailyBrief && (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusPill icon="⚡" label={dailyBrief.energyLabel} />
              {innerClimate && (
                <StatusPill icon="🌡" label={innerClimate.label} title={innerClimate.hint} />
              )}
              <StatusPill icon="↻" label={dailyBrief.recoveryLabel} />
            </div>

            {dailyBrief.suitability.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dailyBrief.suitability.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChip(chip)}
                    className="weather-hero-card__chip rounded-full border border-white/60 bg-white/72 px-3 py-1 text-xs font-medium text-[var(--weather-text)] backdrop-blur-sm transition-colors hover:border-[var(--weather-leaf)] hover:bg-white/90"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-[var(--weather-text-soft)]">{dailyBrief.trendHint}</p>

            <div className="flex flex-wrap gap-2">
              <DecisionChip
                icon="🏃"
                label={dailyBrief.decisionHints.labels.exercise}
                emphasis={dailyBrief.decisionHints.exercise === 'rest'}
                onClick={() => handleDecision(dailyBrief.decisionHints, 'exercise')}
              />
              <DecisionChip
                icon="🧋"
                label={dailyBrief.decisionHints.labels.treat}
                emphasis={dailyBrief.decisionHints.treat === 'caution'}
                onClick={() => handleDecision(dailyBrief.decisionHints, 'treat')}
              />
              <DecisionChip
                icon="🌙"
                label={dailyBrief.decisionHints.labels.sleep}
                emphasis={dailyBrief.decisionHints.sleep === 'early'}
                onClick={() => handleDecision(dailyBrief.decisionHints, 'sleep')}
              />
            </div>
          </>
        )}

        {!dailyBrief && innerClimate && (
          <p className="text-sm text-[var(--weather-text-soft)]">{innerClimate.hint}</p>
        )}

        {bodySeason?.justChanged && (
          <button
            type="button"
            onClick={onSeasonBadgeClick}
            className="self-start rounded-full bg-[var(--season-spring-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--season-spring)]"
          >
            🌸 季节更替
          </button>
        )}
      </div>
    </div>
  )
}

function DecisionChip({
  icon,
  label,
  emphasis,
  onClick,
}: {
  icon: string
  label: string
  emphasis?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
        emphasis
          ? 'border-[var(--color-coral)]/40 bg-[var(--color-coral)]/10 text-[var(--weather-text)] hover:bg-[var(--color-coral)]/15'
          : 'border-dashed border-[var(--weather-leaf)]/35 bg-white/60 text-[var(--weather-text-soft)] hover:border-[var(--weather-leaf)] hover:bg-white/90 hover:text-[var(--weather-text)]'
      }`}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </button>
  )
}

function StatusPill({
  icon,
  label,
  title,
}: {
  icon: string
  label: string
  title?: string
}) {
  return (
    <span
      className="weather-hero-card__pill inline-flex items-center gap-1 rounded-full bg-white/72 px-2.5 py-1 text-xs font-medium text-[var(--weather-text)] backdrop-blur-sm"
      title={title}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  )
}
