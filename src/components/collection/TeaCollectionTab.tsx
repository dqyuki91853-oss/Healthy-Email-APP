import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { BodySeasonId } from '../../types/bodySeason'
import type { BodyWeatherId } from '../../types/bodyWeather'
import {
  comboLabel,
  recommendTea,
  TEA_COLLECTION_TOTAL,
  TEA_NATURE_LABEL,
  TEA_SEASON_LABEL,
  TEA_SEASON_ORDER,
  TEA_WEATHER_LABEL,
  TEA_WEATHER_ORDER,
  teaKey,
  type TeaRecommendation,
} from '../../config/bodyTeaGuide'
import {
  getUnlockedTeaCount,
  loadTeaCollection,
} from '../../lib/teaCollectionStore'

interface GridCell {
  key: string
  weatherId: BodyWeatherId
  seasonId: BodySeasonId
  tea: TeaRecommendation
  unlocked: boolean
  unlockedAt: string | null
}

function formatUnlockDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'M月d日')
  } catch {
    return dateStr
  }
}

function TeaDetailModal({
  cell,
  onClose,
}: {
  cell: GridCell
  onClose: () => void
}) {
  const { tea, weatherId, seasonId, unlockedAt } = cell

  return (
    <div
      className="tea-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${tea.name} 详情`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="tea-detail-modal__sheet weather-chronicle">
        <button type="button" className="tea-detail-modal__close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <span className="tea-detail-modal__leaf" aria-hidden>
          {tea.leaf}
        </span>
        <h3 className="tea-detail-modal__name">{tea.name}</h3>
        <p className="tea-detail-modal__whisper">{tea.whisper}</p>
        <dl className="tea-detail-modal__meta">
          <div>
            <dt>天气 · 季节</dt>
            <dd>{comboLabel(weatherId, seasonId)}</dd>
          </div>
          <div>
            <dt>茶性</dt>
            <dd>{TEA_NATURE_LABEL[tea.nature]}</dd>
          </div>
          {unlockedAt && (
            <div>
              <dt>解锁日期</dt>
              <dd>{formatUnlockDate(unlockedAt)}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}

export function TeaCollectionTab() {
  const [selected, setSelected] = useState<GridCell | null>(null)
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

  const unlockedMap = useMemo(() => {
    void refreshKey
    const map = new Map<string, string>()
    for (const entry of loadTeaCollection()) {
      map.set(entry.teaKey, entry.unlockedAt)
    }
    return map
  }, [refreshKey])

  const unlockedCount = useMemo(() => {
    void refreshKey
    return getUnlockedTeaCount()
  }, [refreshKey])

  const cells = useMemo((): GridCell[] => {
    const list: GridCell[] = []
    for (const seasonId of TEA_SEASON_ORDER) {
      for (const weatherId of TEA_WEATHER_ORDER) {
        const key = teaKey(weatherId, seasonId)
        const unlockedAt = unlockedMap.get(key) ?? null
        list.push({
          key,
          weatherId,
          seasonId,
          tea: recommendTea(weatherId, seasonId),
          unlocked: unlockedAt != null,
          unlockedAt,
        })
      }
    }
    return list
  }, [unlockedMap])

  const progressPct = Math.round((unlockedCount / TEA_COLLECTION_TOTAL) * 100)

  return (
    <div className="tea-collection">
      <header className="tea-collection__header">
        <p className="tea-collection__progress-label">
          已解锁 <strong>{unlockedCount}</strong> / {TEA_COLLECTION_TOTAL}
        </p>
        <div className="tea-collection__progress" aria-hidden>
          <div className="tea-collection__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <div className="tea-collection__table">
        <div className="tea-collection__head-row">
          <div className="tea-collection__corner" aria-hidden />
          {TEA_WEATHER_ORDER.map((weatherId) => (
            <div key={weatherId} className="tea-collection__col-head">
              {TEA_WEATHER_LABEL[weatherId]}
            </div>
          ))}
        </div>

        {TEA_SEASON_ORDER.map((seasonId) => (
          <div key={`row-${seasonId}`} className="tea-collection__row">
            <div className="tea-collection__row-head">{TEA_SEASON_LABEL[seasonId]}</div>
            {TEA_WEATHER_ORDER.map((weatherId) => {
              const cell = cells.find(
                (c) => c.weatherId === weatherId && c.seasonId === seasonId,
              )!
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`tea-collection__cell ${
                    cell.unlocked ? 'tea-collection__cell--unlocked' : 'tea-collection__cell--locked'
                  }`}
                  disabled={!cell.unlocked}
                  onClick={() => cell.unlocked && setSelected(cell)}
                >
                  {cell.unlocked ? (
                    <>
                      <span className="tea-collection__cell-leaf" aria-hidden>
                        {cell.tea.leaf}
                      </span>
                      <span className="tea-collection__cell-name">{cell.tea.name}</span>
                      <span className="tea-collection__cell-combo">
                        {comboLabel(weatherId, seasonId)}
                      </span>
                      <span className="tea-collection__cell-badge">已解锁 ✓</span>
                    </>
                  ) : (
                    <>
                      <span className="tea-collection__cell-mystery" aria-hidden>
                        ？
                      </span>
                      <span className="tea-collection__cell-name tea-collection__cell-name--locked">
                        ？？？
                      </span>
                      <span className="tea-collection__cell-combo">
                        {comboLabel(weatherId, seasonId)}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <p className="tea-collection__hint">
        在首页茶语卡片遇见过的茶，会自动收录到这里。经历不同的身体天气与季节，慢慢集齐 24 盏。
      </p>

      {selected && <TeaDetailModal cell={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
