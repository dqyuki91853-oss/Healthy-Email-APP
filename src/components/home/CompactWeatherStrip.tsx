import { useState } from 'react'
import type { BodyWeatherSnapshot } from '../../types/bodyWeather'
import { WeatherStamp } from '../bodyWeather/WeatherStamp'
import { BodyWeatherScene } from '../bodyWeather/BodyWeatherScene'

interface Props {
  weather: BodyWeatherSnapshot
}

/**
 * Compact single-row weather strip (~56px).
 * Shows WeatherStamp + label + truncated metaphor.
 * Click to expand into the full animated BodyWeatherCard overlay.
 */
export function CompactWeatherStrip({ weather }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]"
        style={{
          background: weatherTint(weather.weatherId),
          minHeight: 52,
        }}
        aria-label={`今日身体天气：${weather.label}，点击查看详情`}
      >
        <WeatherStamp weatherId={weather.weatherId} label={weather.label} size="sm" />
        <div className="min-w-0 flex-1 text-left">
          <span className="text-sm font-medium">
            今日身体天气 · {weather.label}
          </span>
          <span className="ml-2 text-sm text-[var(--color-muted)] truncate">
            {weather.metaphor}
          </span>
        </div>
      </button>

      {/* Expanded overlay: full animated BodyWeatherCard */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/30 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpanded(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`今日身体天气详情：${weather.label}`}
        >
          <div
            className="w-full max-w-md animate-[scaleIn_0.25s_ease-out] rounded-[var(--radius-lg)] overflow-hidden"
            style={{ boxShadow: 'var(--shadow-float)' }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                minHeight: 200,
                background: 'var(--color-surface)',
              }}
            >
              {/* Scene background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.38 }}>
                <BodyWeatherScene weatherId={weather.weatherId} decorative />
              </div>

              {/* Bottom gradient fade */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none h-16"
                style={{
                  background: 'linear-gradient(to top, var(--color-surface) 0%, transparent 100%)',
                }}
              />

              {/* Content */}
              <div className="relative z-10 p-6">
                <div className="flex items-center gap-4">
                  <WeatherStamp weatherId={weather.weatherId} label={weather.label} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-teal)]">
                      今日身体天气
                    </p>
                    <h3 className="text-lg font-semibold">今天你的身体是{weather.label}</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{weather.metaphor}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="mt-4 text-xs text-[var(--color-muted)] underline hover:text-[var(--color-text)]"
                >
                  收起
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Very light weather-aware tint for the strip background. */
function weatherTint(weatherId: string): string {
  switch (weatherId) {
    case 'rainy':
      return 'linear-gradient(90deg, rgba(216,212,204,0.3) 0%, rgba(200,200,200,0.15) 100%)'
    case 'overcast':
      return 'linear-gradient(90deg, rgba(232,228,222,0.3) 0%, rgba(212,208,200,0.15) 100%)'
    case 'foggy':
      return 'linear-gradient(90deg, rgba(238,234,228,0.3) 0%, rgba(232,224,212,0.15) 100%)'
    case 'rainbow':
      return 'linear-gradient(90deg, rgba(253,240,224,0.3) 0%, rgba(248,233,187,0.15) 100%)'
    case 'sunny':
      return 'linear-gradient(90deg, rgba(253,251,242,0.3) 0%, rgba(248,233,187,0.15) 100%)'
    default:
      return 'linear-gradient(90deg, rgba(248,233,187,0.2) 0%, rgba(235,201,127,0.1) 100%)'
  }
}
