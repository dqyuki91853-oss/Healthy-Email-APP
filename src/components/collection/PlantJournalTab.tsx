import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BodySeasonId } from '../../types/bodySeason'
import { TEA_SEASON_LABEL } from '../../config/bodyTeaGuide'
import {
  PLANT_SEASON_ORDER,
  PLANT_SPECIES,
  PLANT_STAGE_LABEL,
  PLANT_VIGOR_ORDER,
  type PlantVigor,
} from '../../lib/bodyPlantState'
import {
  formatJournalDate,
  formatJournalLine,
  getSeenStagesForSeason,
  loadPlantJournal,
  type PlantJournalEntry,
} from '../../lib/plantJournalStore'

function SpeciesAtlas({ seasonId, seen }: { seasonId: BodySeasonId; seen: Set<PlantVigor> }) {
  const species = PLANT_SPECIES[seasonId]
  const seasonLabel = TEA_SEASON_LABEL[seasonId]
  const seenCount = PLANT_VIGOR_ORDER.filter((v) => seen.has(v)).length

  return (
    <section className="plant-atlas__species" aria-labelledby={`plant-species-${seasonId}`}>
      <h3 id={`plant-species-${seasonId}`} className="plant-atlas__species-title">
        {species} · {seasonLabel}
        <span className="plant-atlas__species-count">
          见过 {seenCount} / {PLANT_VIGOR_ORDER.length} 种状态
        </span>
      </h3>

      <div className="plant-atlas__states">
        {PLANT_VIGOR_ORDER.map((vigor) => {
          const discovered = seen.has(vigor)
          return (
            <div
              key={vigor}
              className={`plant-atlas__state ${
                discovered ? 'plant-atlas__state--seen' : 'plant-atlas__state--unseen'
              }`}
            >
              <span className="plant-atlas__state-label">{PLANT_STAGE_LABEL[vigor]}</span>
              <span className="plant-atlas__state-mark" aria-hidden>
                {discovered ? '✓ 见过' : '✗'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function PlantJournalTab() {
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const journal = useMemo(() => {
    void refreshKey
    return loadPlantJournal()
  }, [refreshKey])

  const seenBySeason = useMemo(() => {
    const map = new Map<BodySeasonId, Set<PlantVigor>>()
    for (const seasonId of PLANT_SEASON_ORDER) {
      map.set(seasonId, getSeenStagesForSeason(seasonId))
    }
    return map
  }, [journal, refreshKey])

  const diaryEntries = useMemo(
    () => [...journal].reverse() as PlantJournalEntry[],
    [journal],
  )

  return (
    <div className="plant-atlas">
      <div className="plant-atlas__grid">
        {PLANT_SEASON_ORDER.map((seasonId) => (
          <SpeciesAtlas
            key={seasonId}
            seasonId={seasonId}
            seen={seenBySeason.get(seasonId) ?? new Set()}
          />
        ))}
      </div>

      <section className="plant-atlas__diary" aria-labelledby="plant-diary-title">
        <h3 id="plant-diary-title" className="plant-atlas__diary-title">
          植物日记
        </h3>

        {diaryEntries.length === 0 ? (
          <p className="plant-atlas__diary-empty">
            还没有日记。回到首页看看小植物，它会悄悄记下你的每一天。
          </p>
        ) : (
          <ul className="plant-atlas__diary-list">
            {diaryEntries.map((entry) => (
              <li key={entry.id} className="plant-atlas__diary-item">
                <span className="plant-atlas__diary-date">{formatJournalDate(entry.date)}</span>
                <span className="plant-atlas__diary-text">{formatJournalLine(entry)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
