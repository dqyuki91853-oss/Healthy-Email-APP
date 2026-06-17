import type { BodyWeatherSnapshot } from '../../types/bodyWeather'
import { WeatherStamp } from './WeatherStamp'
import { BodyWeatherScene } from './BodyWeatherScene'

interface Props {
  weather: BodyWeatherSnapshot
}

export function BodyWeatherCard({ weather }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-lg)]"
      style={{
        minHeight: 160,
        boxShadow: 'var(--shadow-card)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Full-background weather scene at 38% opacity */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[var(--radius-lg)]" style={{ opacity: 0.38 }}>
        <BodyWeatherScene weatherId={weather.weatherId} decorative />
      </div>

      {/* Bottom gradient fade to card edge */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none h-16 rounded-b-[var(--radius-lg)]"
        style={{
          background: 'linear-gradient(to top, var(--color-surface) 0%, transparent 100%)',
        }}
      />

      {/* Foreground content */}
      <div className="relative z-10 flex items-center gap-4 p-6">
        <WeatherStamp weatherId={weather.weatherId} label={weather.label} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-teal)]">
            今日身体天气
          </p>
          <h3 className="text-lg font-semibold">今天你的身体是{weather.label}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{weather.metaphor}</p>
        </div>
      </div>
    </div>
  )
}
