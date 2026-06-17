import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { HomeDashboard } from '../components/home/HomeDashboard'
import { EnvelopeStage } from '../components/home/EnvelopeStage'
import { CompactWeatherStrip } from '../components/home/CompactWeatherStrip'
import { WellnessDojo } from '../components/home/WellnessDojo'
import { WeeklyActivitySection } from '../components/home/WeeklyActivitySection'
import { LetterRevealOverlay } from '../components/health/LetterRevealOverlay'
import { useWeeklyLetter } from '../hooks/useWeeklyLetter'

export function HomePage() {
  const { wellness } = useAppStore()

  const [letterOpen, setLetterOpen] = useState(false)

  // Single source: all score display uses the letter from store
  const { letter, loading, error, stale, regenerate } = useWeeklyLetter()

  const nickname = ''

  return (
    <div className="page-enter">
      {/* Letter reveal overlay (centered, portal-like) */}
      <LetterRevealOverlay
        open={letterOpen}
        onClose={() => setLetterOpen(false)}
        letter={letter}
        loading={loading}
        error={error}
        stale={stale}
        onRegenerate={regenerate}
      />

      {/* Compact weather strip — full width pill row */}
      {wellness?.bodyWeather && (
        <div className="mb-4">
          <CompactWeatherStrip weather={wellness.bodyWeather} />
        </div>
      )}

      {/* v3 Dashboard: hero (full-width envelope) + body (Wellness 55% / Activity 45%) */}
      <HomeDashboard
        hero={
          <EnvelopeStage
            letter={letter}
            loading={loading}
            stale={stale}
            weatherLabel={wellness?.bodyWeather?.label}
            weatherId={wellness?.bodyWeather?.weatherId ?? null}
            nickname={nickname}
            onOpenLetter={() => setLetterOpen(true)}
          />
        }
        body={
          <>
            <WellnessDojo
              wuyin={wellness?.wuyin}
              circadian={wellness?.circadian}
            />
            <WeeklyActivitySection variant="panel" />
          </>
        }
      />
    </div>
  )
}
