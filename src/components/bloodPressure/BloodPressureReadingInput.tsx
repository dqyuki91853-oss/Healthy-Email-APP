import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../ui/Button'
import { addBloodPressureReading } from '../../lib/bloodPressureStore'
import {
  BP_DIASTOLIC_MAX,
  BP_DIASTOLIC_MIN,
  BP_PULSE_MAX,
  BP_PULSE_MIN,
  BP_SYSTOLIC_MAX,
  BP_SYSTOLIC_MIN,
} from '../../types/bloodPressure'

interface Props {
  defaultDate?: string
  onAdded?: () => void
}

function nowLocalInput(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function BloodPressureReadingInput({ defaultDate, onAdded }: Props) {
  const [measuredAt, setMeasuredAt] = useState(() => {
    if (defaultDate) return `${defaultDate}T12:00`
    return nowLocalInput()
  })
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [pulse, setPulse] = useState('')
  const [source, setSource] = useState<'manual' | 'device'>('manual')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    setError(null)
    const iso = new Date(measuredAt).toISOString()
    const result = addBloodPressureReading({
      measuredAt: iso,
      systolicMmHg: Number(systolic),
      diastolicMmHg: Number(diastolic),
      pulseBpm: pulse ? Number(pulse) : undefined,
      source,
      note: note || undefined,
    })
    if (!result) {
      setError(
        `请输入有效血压：收缩压 ${BP_SYSTOLIC_MIN}–${BP_SYSTOLIC_MAX}、舒张压 ${BP_DIASTOLIC_MIN}–${BP_DIASTOLIC_MAX} mmHg（舒张压须低于收缩压）`,
      )
      return
    }
    setSystolic('')
    setDiastolic('')
    setPulse('')
    setNote('')
    onAdded?.()
  }

  const hint = useMemo(
    () =>
      `常见参考约 90–140 / 60–90 mmHg（个体差异大，仅供个人追踪；脉搏可选 ${BP_PULSE_MIN}–${BP_PULSE_MAX}）`,
    [],
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-muted)]">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          测量时间
          <input
            type="datetime-local"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm"
          />
        </label>
        <label className="text-sm">
          收缩压（mmHg）
          <input
            type="number"
            step="1"
            min={BP_SYSTOLIC_MIN}
            max={BP_SYSTOLIC_MAX}
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            placeholder="例如 118"
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm"
          />
        </label>
        <label className="text-sm">
          舒张压（mmHg）
          <input
            type="number"
            step="1"
            min={BP_DIASTOLIC_MIN}
            max={BP_DIASTOLIC_MAX}
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            placeholder="例如 76"
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          脉搏（bpm，可选）
          <input
            type="number"
            step="1"
            min={BP_PULSE_MIN}
            max={BP_PULSE_MAX}
            value={pulse}
            onChange={(e) => setPulse(e.target.value)}
            placeholder="例如 72"
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="bp-source"
            checked={source === 'manual'}
            onChange={() => setSource('manual')}
          />
          手动录入
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="bp-source"
            checked={source === 'device'}
            onChange={() => setSource('device')}
          />
          血压仪
        </label>
      </div>
      <label className="block text-sm">
        备注（可选）
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例如 晨起空腹、餐后 1 小时"
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm"
        />
      </label>
      {error && <p className="text-xs text-[var(--color-coral)]">{error}</p>}
      <Button type="button" onClick={handleSubmit}>
        <Plus size={16} />
        保存记录
      </Button>
    </div>
  )
}
