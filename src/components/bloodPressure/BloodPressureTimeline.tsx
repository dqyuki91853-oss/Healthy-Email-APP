import { Trash2 } from 'lucide-react'
import type { BloodPressureReading } from '../../types/bloodPressure'
import { deleteBloodPressureReading, formatBloodPressure } from '../../lib/bloodPressureStore'

interface Props {
  readings: BloodPressureReading[]
  onChange?: () => void
}

const SOURCE_LABELS: Record<BloodPressureReading['source'], string> = {
  manual: '手动',
  device: '血压仪',
  csv: '导入',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BloodPressureTimeline({ readings, onChange }: Props) {
  if (readings.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        暂无记录。手动录入或从设置页导入血压仪 CSV 后，这里会显示时间线。
      </p>
    )
  }

  const sorted = [...readings].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
  const maxSys = Math.max(...sorted.map((r) => r.systolicMmHg), 140)

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]/50 p-3">
        {[...sorted].reverse().slice(-24).map((r) => {
          const h = Math.max(12, (r.systolicMmHg / maxSys) * 72)
          return (
            <div
              key={r.id}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${formatTime(r.measuredAt)} · ${formatBloodPressure(r)}`}
            >
              <div
                className="w-full max-w-[10px] rounded-t-sm bg-[var(--color-teal)]/80"
                style={{ height: `${h}px` }}
              />
            </div>
          )
        })}
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {sorted.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <p className="font-medium">{formatBloodPressure(r)}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {formatTime(r.measuredAt)} · {SOURCE_LABELS[r.source]}
                {r.note ? ` · ${r.note}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                deleteBloodPressureReading(r.id)
                onChange?.()
              }}
              className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-coral)]"
              aria-label="删除记录"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
