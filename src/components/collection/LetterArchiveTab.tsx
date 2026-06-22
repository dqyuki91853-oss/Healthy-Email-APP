import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BodyWeatherId } from '../../types/bodyWeather'
import { WeatherIcon } from '../illustrations/WeatherIcon'
import {
  buildLetterArchiveEntry,
  formatLetterDateRange,
  letterPreview,
  loadLetterArchive,
  type LetterArchiveEntry,
} from '../../lib/letterArchiveStore'
import { getCachedEntry } from '../../services/weeklyLetter'

function dateRangeKey(range: { start: string; end: string }): string {
  return `${range.start}_${range.end}`
}

function loadLetterArchiveForDisplay(): LetterArchiveEntry[] {
  const archive = loadLetterArchive()
  const cached = getCachedEntry()
  if (!cached?.data.letter?.trim() || !cached.data.dateRange) {
    return archive
  }

  const key = dateRangeKey(cached.data.dateRange)
  if (archive.some((e) => dateRangeKey(e.dateRange) === key)) {
    return archive
  }

  const current = buildLetterArchiveEntry(cached.data, {
    weatherId: cached.weatherId,
    weatherLabel: cached.weatherLabel,
    seasonId: cached.seasonId,
    seasonLabel: cached.seasonLabel,
  })
  if (!current) return archive

  return [current, ...archive]
}

const WEATHER_EMOJI: Record<BodyWeatherId, string> = {
  sunny: '☀',
  partly_cloudy: '⛅',
  overcast: '☁',
  rainy: '🌧',
  foggy: '🌫',
  rainbow: '🌈',
}

function LetterMeta({ entry }: { entry: LetterArchiveEntry }) {
  const weather =
    entry.weatherId != null
      ? WEATHER_EMOJI[entry.weatherId]
      : entry.weatherLabel
        ? '·'
        : ''
  const season = entry.seasonLabel ? ` · ${entry.seasonLabel}` : ''
  const score = entry.score != null ? ` · ${entry.score} 分` : ''

  return (
    <span className="letter-archive__meta">
      {weather && (
        <span className="letter-archive__weather" aria-hidden>
          {weather}
        </span>
      )}
      {entry.weatherLabel && (
        <span className="letter-archive__weather-label">{entry.weatherLabel}</span>
      )}
      {season}
      {score}
    </span>
  )
}

function LetterCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: LetterArchiveEntry
  expanded: boolean
  onToggle: () => void
}) {
  const preview = letterPreview(entry.letter)

  return (
    <article className={`letter-archive__card ${expanded ? 'letter-archive__card--open' : ''}`}>
      <button
        type="button"
        className="letter-archive__card-head"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="letter-archive__card-top">
          <span className="letter-archive__date">{formatLetterDateRange(entry.dateRange)}</span>
          <LetterMeta entry={entry} />
        </div>
        {!expanded && (
          <p className="letter-archive__preview">
            {preview.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < preview.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        )}
        <span className="letter-archive__toggle">{expanded ? '收起' : '展开阅读'}</span>
      </button>

      {expanded && (
        <div className="letter-archive__body">
          <div className="letter-archive__paper">
            {entry.weatherId && (
              <div className="letter-archive__paper-icon" aria-hidden>
                <WeatherIcon weatherId={entry.weatherId} size={32} variant="duotone" />
              </div>
            )}
            {entry.letter.split('\n').map((paragraph, i) => (
              <p key={i} className="letter-archive__paragraph">
                {paragraph.trim() || '\u00A0'}
              </p>
            ))}
          </div>

          {entry.replyText && (
            <div className="letter-archive__reply">
              <p className="letter-archive__reply-label">你的回信</p>
              <p className="letter-archive__reply-text">{entry.replyText}</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export function LetterArchiveTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
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

  const letters = useMemo(() => {
    void refreshKey
    return loadLetterArchiveForDisplay()
  }, [refreshKey])

  return (
    <div className="letter-archive">
      <p className="letter-archive__count">共 {letters.length} 封</p>

      {letters.length === 0 ? (
        <p className="letter-archive__empty">
          还没有归档来信。每周一新信生成时，上一封会自动收进这里。
        </p>
      ) : (
        <div className="letter-archive__stack">
          {letters.map((entry) => (
            <LetterCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() =>
                setExpandedId((id) => (id === entry.id ? null : entry.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
