import { SeasonHeroCard, SeasonTimeline } from '../components/chronicle/SeasonHeroCard'
import { useAppStore } from '../store/useAppStore'
import { getSeasonHistory } from '../lib/chroniclePrefs'

export function SeasonsPage() {
  const wellness = useAppStore((s) => s.wellness)
  const watchRows = useAppStore((s) => s.watchRows)
  const season = wellness?.bodySeason
  const history = getSeasonHistory()

  if (!season) {
    return (
      <div className="weather-chronicle page-enter mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--weather-text)]">身体四季</h1>
          <p className="mt-2 text-sm text-[var(--weather-text-soft)]">
            还需要再积累一些日子，才能辨认你个人的生理季节。
          </p>
        </header>
        <div className="weather-chronicle-card p-8 text-center text-sm text-[var(--weather-text-soft)]">
          当前有效天数 {watchRows.length} / 14
        </div>
      </div>
    )
  }

  return (
    <div className="weather-chronicle page-enter mx-auto max-w-2xl space-y-4">
      <header className="mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--weather-rain)]">
          四季编年
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--weather-text)]">身体四季</h1>
        <p className="mt-2 text-sm text-[var(--weather-text-soft)]">
          这不是公历季节，而是你的身体正在经历的个人生理季。
        </p>
      </header>

      <SeasonHeroCard season={season} />
      <SeasonTimeline history={history} currentSeasonId={season.seasonId} />
    </div>
  )
}
