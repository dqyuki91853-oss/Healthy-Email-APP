import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { recordPlantJournalVisit } from '../lib/plantJournalStore'
import { HomeDashboard } from '../components/home/HomeDashboard'
import { EnvelopeStage } from '../components/home/EnvelopeStage'
import { WeatherHeroCard } from '../components/home/WeatherHeroCard'
import { BodyTeaCard } from '../components/home/BodyTeaCard'
import { BodyPlantGarden } from '../components/home/BodyPlantGarden'
import { HomeSeasonsPanel } from '../components/home/HomeSeasonsPanel'
import { WellnessDojo } from '../components/home/WellnessDojo'
import { CalendarDietRail } from '../components/home/CalendarDietRail'
import { LetterRevealOverlay } from '../components/health/LetterRevealOverlay'
import { SeasonChangeModal } from '../components/chronicle/SeasonChangeModal'
import { useWeeklyLetter } from '../hooks/useWeeklyLetter'
import { markSeasonModalSeen, shouldShowSeasonModal } from '../lib/chroniclePrefs'

export function HomePage() {
  const { wellness, watchRows } = useAppStore()

  const [letterOpen, setLetterOpen] = useState(false)
  const [seasonModalOpen, setSeasonModalOpen] = useState(false)

  useEffect(() => {
    if (wellness?.bodySeason && shouldShowSeasonModal(wellness.bodySeason)) {
      setSeasonModalOpen(true)
    }
  }, [wellness?.bodySeason])

  useEffect(() => {
    const seasonId = wellness?.bodySeason?.seasonId
    if (!seasonId) return
    recordPlantJournalVisit(seasonId, watchRows)
  }, [wellness?.bodySeason?.seasonId, watchRows])

  const closeSeasonModal = () => {
    if (wellness?.bodySeason) {
      markSeasonModalSeen(wellness.bodySeason.seasonId)
    }
    setSeasonModalOpen(false)
  }

  const { letter, loading, error, stale, regenerate } = useWeeklyLetter()

  const nickname = ''
  const hasDojo = Boolean(wellness?.wuyin || wellness?.circadian)

  return (
    <div className="page-enter home-page">
      <LetterRevealOverlay
        open={letterOpen}
        onClose={() => setLetterOpen(false)}
        letter={letter}
        loading={loading}
        error={error}
        stale={stale}
        onRegenerate={regenerate}
      />

      {wellness?.bodySeason && (
        <SeasonChangeModal
          open={seasonModalOpen}
          season={wellness.bodySeason}
          onClose={closeSeasonModal}
        />
      )}

      <div className="home-page__mobile-rail mb-4 lg:hidden">
        <div className="home-card home-card--panel p-4">
          <CalendarDietRail compact />
        </div>
      </div>

      <HomeDashboard
        envelope={
          <EnvelopeStage
            hero
            bowl
            letter={letter}
            loading={loading}
            stale={stale}
            weatherLabel={wellness?.bodyWeather?.label}
            weatherId={wellness?.bodyWeather?.weatherId ?? null}
            nickname={nickname}
            onOpenLetter={() => setLetterOpen(true)}
          />
        }
        weather={
          wellness?.bodyWeather ? (
            <WeatherHeroCard
              bodyWeather={wellness.bodyWeather}
              dailyBrief={wellness.dailyBrief}
              innerClimate={wellness.innerClimate}
              bodySeason={wellness.bodySeason}
              onSeasonBadgeClick={() => setSeasonModalOpen(true)}
            />
          ) : undefined
        }
        tea={
          <BodyTeaCard
            weatherId={wellness?.bodyWeather?.weatherId}
            seasonId={wellness?.bodySeason?.seasonId}
          />
        }
        plant={
          <BodyPlantGarden
            seasonId={wellness?.bodySeason?.seasonId}
            watchRows={watchRows}
          />
        }
        seasons={
          <HomeSeasonsPanel season={wellness?.bodySeason} watchDays={watchRows.length} />
        }
        therapy={
          hasDojo ? (
            <WellnessDojo
              layout="therapy"
              tracksHorizontal
              wuyin={wellness?.wuyin}
              circadian={wellness?.circadian}
            />
          ) : undefined
        }
        rhythm={
          hasDojo ? (
            <WellnessDojo layout="rhythm" wuyin={wellness?.wuyin} circadian={wellness?.circadian} />
          ) : undefined
        }
      />
    </div>
  )
}
