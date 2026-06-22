import { Link } from 'react-router-dom'
import type { BodySeasonSnapshot } from '../../types/bodySeason'
import { SeasonHeroCard, SeasonTimeline } from '../chronicle/SeasonHeroCard'
import { getSeasonHistory } from '../../lib/chroniclePrefs'

interface Props {
  season: BodySeasonSnapshot | null | undefined
  watchDays: number
}

export function HomeSeasonsPanel({ season, watchDays }: Props) {
  const history = getSeasonHistory()

  return (
    <section className="home-chronicle-panel home-chronicle-panel--seasons weather-chronicle" aria-labelledby="home-seasons-title">
      <header className="home-chronicle-panel__header">
        <p className="home-chronicle-panel__kicker">四季编年</p>
        <div className="flex items-start justify-between gap-2">
          <h2 id="home-seasons-title" className="home-chronicle-panel__title">
            身体四季
          </h2>
          {season && (
            <Link to="/seasons" className="home-chronicle-panel__link shrink-0">
              详情 →
            </Link>
          )}
        </div>
      </header>

      <div className="home-chronicle-panel__body space-y-3">
        {!season ? (
          <div className="home-chronicle-panel__empty">
            <p className="text-sm text-[var(--weather-text-soft)]">
              还需要再积累一些日子，才能辨认你个人的生理季节。
            </p>
            <p className="mt-3 text-xs tabular-nums text-[var(--weather-rain)]">
              当前有效天数 {watchDays} / 14
            </p>
          </div>
        ) : (
          <>
            <SeasonHeroCard season={season} />
            <SeasonTimeline history={history} currentSeasonId={season.seasonId} />
          </>
        )}
      </div>
    </section>
  )
}
