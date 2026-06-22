import type { BloodPressureReading } from '../../types/bloodPressure'
import type { VoiceExtraction } from '../../types/voice'
import { formatBloodPressure } from '../../lib/bloodPressureStore'

interface Props {
  date: string
  voiceLogs: VoiceExtraction[]
  readings: BloodPressureReading[]
}

function hourLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function positionPct(iso: string, dayStart: number, daySpan: number): number {
  const t = new Date(iso).getTime()
  return clamp(((t - dayStart) / daySpan) * 100, 2, 98)
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: '早',
  lunch: '午',
  dinner: '晚',
  snack: '加餐',
}

export function MealTimelineViz({ date, voiceLogs, readings }: Props) {
  const dayLogs = voiceLogs.filter((l) => l.recordDate === date)
  const dayReadings = readings.filter((r) => r.measuredAt.slice(0, 10) === date)

  if (dayLogs.length === 0 && dayReadings.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        选中日暂无饮食或血压记录，无法绘制时间线。
      </p>
    )
  }

  const dayStart = new Date(`${date}T06:00:00`).getTime()
  const dayEnd = new Date(`${date}T23:00:00`).getTime()
  const daySpan = dayEnd - dayStart

  return (
    <div className="relative mt-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]/40 p-4">
      <div className="mb-6 flex justify-between text-[10px] text-[var(--color-muted)]">
        <span>06:00</span>
        <span>15:00</span>
        <span>23:00</span>
      </div>
      <div className="relative h-16 border-b border-[var(--color-border)]">
        {dayLogs.map((log) => {
          const foods = log.foods.map((f) => f.name).join('、') || '饮食'
          const slot = log.mealSlot ? MEAL_LABELS[log.mealSlot] ?? '' : ''
          return (
            <div
              key={log.id}
              className="absolute bottom-0 -translate-x-1/2"
              style={{ left: `${positionPct(log.timestamp, dayStart, daySpan)}%` }}
              title={`${hourLabel(log.timestamp)} ${foods}`}
            >
              <span className="block h-3 w-3 rounded-full bg-[var(--color-gold)] ring-2 ring-white" />
              <span className="absolute left-1/2 top-4 w-max max-w-[80px] -translate-x-1/2 truncate text-[10px] text-[var(--color-text)]">
                {slot}
                {foods.slice(0, 6)}
              </span>
            </div>
          )
        })}
        {dayReadings.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-0 -translate-x-1/2"
            style={{ left: `${positionPct(r.measuredAt, dayStart, daySpan)}%` }}
            title={`${hourLabel(r.measuredAt)} ${formatBloodPressure(r)}`}
          >
            <span className="block h-2.5 w-2.5 rounded-full bg-[var(--color-teal)]" />
          </div>
        ))}
      </div>
      <p className="mt-8 text-[10px] text-[var(--color-muted)]">
        金点 = 饮食记录 · 绿点 = 血压测量（仅个人 N=1 参考，不展示诊断阈值）
      </p>
    </div>
  )
}
