import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { DateTracker } from '../components/ui/DateTracker'
import { DietLogItem } from '../components/diet/DietLogItem'
import { DirectionScoreCard } from '../components/health/DirectionScoreCard'
import { FoodFingerprintCard } from '../components/bloodPressure/FoodFingerprintCard'
import { getRecordDate, todayStr, weekRange } from '../lib/dates'
import {
  computeFoodFingerprints,
  hasBloodPressureData,
  loadBloodPressureReadings,
} from '../lib/bloodPressureStore'

const CATEGORIES = [
  { key: 'purine', label: '嘌呤来源', color: '#de7b64' },
  { key: 'fructose', label: '果糖来源', color: '#f59553' },
  { key: 'high_gi', label: '高 GI 餐', color: '#ebc97e' },
  { key: 'high_fodmap', label: '高 FODMAP', color: '#a78bfa' },
  { key: 'fish', label: '鱼类/DHA', color: '#63af97' },
  { key: 'alcohol', label: '酒精', color: '#64748b' },
]

type ViewMode = 'day' | 'week'

export function DietPage() {
  const voiceLogs = useAppStore((s) => s.voiceLogs)
  const prediction = useAppStore((s) => s.prediction)
  const deleteVoiceLog = useAppStore((s) => s.deleteVoiceLog)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const markedDates = useMemo(
    () => new Set(voiceLogs.map((l) => getRecordDate(l))),
    [voiceLogs],
  )

  const filteredLogs = useMemo(() => {
    if (viewMode === 'day') {
      return voiceLogs.filter((l) => getRecordDate(l) === selectedDate)
    }
    const week = weekRange(selectedDate)
    const start = week[0]
    const end = week[6]
    return voiceLogs.filter((l) => {
      const d = getRecordDate(l)
      return d >= start && d <= end
    })
  }, [voiceLogs, selectedDate, viewMode])

  const counts: Record<string, number> = {}
  filteredLogs.forEach((log) => {
    log.foods.forEach((f) => {
      f.categories.forEach((c) => {
        counts[c] = (counts[c] ?? 0) + 1
      })
    })
  })

  const foodFingerprints = useMemo(() => {
    if (!hasBloodPressureData()) return []
    return computeFoodFingerprints(voiceLogs, loadBloodPressureReadings())
  }, [voiceLogs])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteVoiceLog(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">饮食分析</h2>
        <p className="text-sm text-[var(--color-muted)]">
          按日期跟踪饮食模式。填错可删除单条记录。
        </p>
      </div>

      {prediction && (
        <div className="grid gap-3 md:grid-cols-3">
          {['gout', 'ibs', 'iron_deficiency'].map((dir) => {
            const d = prediction.directionScores.find((x) => x.direction === dir)
            return d ? <DirectionScoreCard key={dir} score={d} /> : null
          })}
        </div>
      )}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">日期跟踪</h3>
          <div className="flex rounded-lg border border-[var(--color-border)] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`rounded-md px-3 py-1 ${viewMode === 'day' ? 'bg-[var(--color-surface-2)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}
            >
              单日
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded-md px-3 py-1 ${viewMode === 'week' ? 'bg-[var(--color-surface-2)] text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}
            >
              本周
            </button>
          </div>
        </div>
        <DateTracker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          markedDates={markedDates}
        />
      </Card>

      <Card>
        <h3 className="mb-3 font-medium">
          {viewMode === 'day' ? '当日' : '本周'}饮食模式
          <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">
            {filteredLogs.length} 条记录
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div
              key={c.key}
              className="rounded-lg p-3"
              style={{ background: `${c.color}15`, borderLeft: `3px solid ${c.color}` }}
            >
              <p className="text-sm text-[var(--color-muted)]">{c.label}</p>
              <p className="text-2xl font-semibold">{counts[c.key] ?? 0}</p>
              <p className="text-xs text-[var(--color-muted)]">次提及</p>
            </div>
          ))}
        </div>
      </Card>

      {foodFingerprints.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">食物指纹</h3>
            <Link to="/blood-pressure" className="text-xs text-[var(--color-teal)] underline">
              血压详情
            </Link>
          </div>
          <FoodFingerprintCard fingerprints={foodFingerprints} compact />
        </Card>
      )}

      <Card>
        <h3 className="mb-3 font-medium">饮食记录明细</h3>
        {filteredLogs.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {viewMode === 'day' ? '该日暂无记录，可在「每日记录」补记' : '本周暂无记录'}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <DietLogItem
                key={log.id}
                log={log}
                onDelete={handleDelete}
                deleting={deletingId === log.id}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
