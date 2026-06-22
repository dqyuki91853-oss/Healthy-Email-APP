import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { DateTracker } from '../components/ui/DateTracker'
import { BloodPressureReadingInput } from '../components/bloodPressure/BloodPressureReadingInput'
import { BloodPressureTimeline } from '../components/bloodPressure/BloodPressureTimeline'
import { FoodFingerprintCard } from '../components/bloodPressure/FoodFingerprintCard'
import { MealTimelineViz } from '../components/bloodPressure/MealTimelineViz'
import {
  computeFoodFingerprints,
  getReadingsForDate,
  getReadingsInRange,
  loadBloodPressureReadings,
} from '../lib/bloodPressureStore'
import { todayStr, weekRange } from '../lib/dates'

export function BloodPressurePage() {
  const voiceLogs = useAppStore((s) => s.voiceLogs)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [refresh, setRefresh] = useState(0)

  const allReadings = useMemo(() => {
    void refresh
    return loadBloodPressureReadings()
  }, [refresh])

  const week = weekRange(selectedDate)
  const weekStart = week[0]
  const weekEnd = week[6]
  const weekReadings = useMemo(
    () => getReadingsInRange(weekStart, weekEnd),
    [allReadings, weekStart, weekEnd, refresh],
  )

  const dayReadings = useMemo(
    () => getReadingsForDate(selectedDate),
    [allReadings, selectedDate, refresh],
  )

  const fingerprints = useMemo(
    () => computeFoodFingerprints(voiceLogs, allReadings),
    [voiceLogs, allReadings],
  )

  const markedDates = useMemo(() => {
    const dates = new Set(allReadings.map((r) => r.measuredAt.slice(0, 10)))
    return dates
  }, [allReadings])

  const bump = () => setRefresh((v) => v + 1)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">血压与食物反应</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          记录血压仪或手动测量数据，与饮食配对后生成你的个人「食物指纹」——只讲相对反应，不做诊断。
        </p>
      </div>

      <Card>
        <h3 className="mb-3 font-medium">手动录入</h3>
        <BloodPressureReadingInput defaultDate={selectedDate} onAdded={bump} />
      </Card>

      <Card>
        <h3 className="mb-3 font-medium">日期</h3>
        <DateTracker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          markedDates={markedDates}
        />
      </Card>

      <Card>
        <h3 className="mb-1 font-medium">当日时间线</h3>
        <p className="mb-3 text-xs text-[var(--color-muted)]">{selectedDate}</p>
        <MealTimelineViz date={selectedDate} voiceLogs={voiceLogs} readings={allReadings} />
        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          <BloodPressureTimeline readings={dayReadings} onChange={bump} />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-medium">本周记录</h3>
        <BloodPressureTimeline readings={weekReadings} onChange={bump} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">食物指纹</h3>
          <Link to="/diet" className="text-xs text-[var(--color-teal)] underline">
            查看饮食页
          </Link>
        </div>
        <FoodFingerprintCard fingerprints={fingerprints} />
      </Card>

      <p className="text-xs text-[var(--color-muted)]">
        血压仪 CSV 批量导入请前往{' '}
        <Link to="/settings" className="text-[var(--color-teal)] underline">
          设置
        </Link>
        。数据仅保存在本机。
      </p>
    </div>
  )
}
