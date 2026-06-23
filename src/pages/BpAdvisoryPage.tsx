import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { computeBpAdvisory } from '../engine/bpAdvisory'
import { loadBloodPressureReadings } from '../lib/bloodPressureStore'
import { todayStr } from '../lib/dates'
import {
  BpDataQualityNote,
  BpFoodReactionsPanel,
  BpLatestReading,
  BpSuggestionsList,
  BpTrendSummary,
  BpWeatherCard,
} from '../components/bpAdvisory/BpAdvisoryPanels'

export function BpAdvisoryPage() {
  const voiceLogs = useAppStore((s) => s.voiceLogs)
  const watchRows = useAppStore((s) => s.watchRows)

  const advisory = useMemo(() => {
    const readings = loadBloodPressureReadings()
    const date = todayStr()
    return computeBpAdvisory(readings, voiceLogs, watchRows, date)
  }, [voiceLogs, watchRows])

  return (
    <div className="page-enter mx-auto max-w-2xl space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-teal)]">
          血压建议
        </p>
        <h1 className="mt-1 text-2xl font-semibold">血压检测与建议</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          相对你的个人基线看风况与趋势——日常用 N=1 隐喻，异常偏高时会提醒复测。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/blood-pressure"
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
          >
            录入与食物指纹 →
          </Link>
        </div>
      </header>

      <BpWeatherCard advisory={advisory} />
      <BpLatestReading advisory={advisory} />
      <BpTrendSummary advisory={advisory} />
      <BpSuggestionsList suggestions={advisory.suggestions} />
      <BpFoodReactionsPanel reactions={advisory.topFoodReactions} />
      <BpDataQualityNote advisory={advisory} />

      {advisory.clinicalEscalation.triggered && (
        <p className="text-center text-xs text-[var(--color-muted)]">
          {advisory.clinicalEscalation.disclaimer}
        </p>
      )}
    </div>
  )
}
