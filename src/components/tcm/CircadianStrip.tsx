import { useState, useEffect } from 'react'
import type { PersonalCircadianPlan } from '../../types/tcm'
import { TCM_MERIDIAN_SCHEDULE } from '../../config/tcmMeridianSchedule'
import { CircadianExpandPanel } from './CircadianExpandPanel'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  plan: PersonalCircadianPlan
}

/**
 * Compact circadian display for the wellness section sidebar (~30% width).
 * Shows: current time, mini timeline (36px), phase label, one-line suggestion.
 * Details expand via accordion.
 */
export function CircadianStrip({ plan }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [nowStr, setNowStr] = useState('')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setNowStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  const phaseHint =
    plan.phaseLabel === 'before_gate' ? '收工前' :
    plan.phaseLabel === 'wind_down' ? '收工段' :
    plan.phaseLabel === 'sleep_window' ? '入静段' :
    plan.phaseLabel === 'late' ? '已过入睡时间' : ''

  // Parse gate/onset for mini bar
  const [gH, gM] = plan.personalSleepGate.split(':').map(Number)
  const gateMin = gH * 60 + gM
  const [oH, oM] = plan.personalSleepOnset.split(':').map(Number)
  const onsetMin = oH * 60 + oM
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const RANGE_START = 18 * 60
  const RANGE_END = 25 * 60
  const toPct = (min: number): number => {
    let m = min
    if (m < RANGE_START) m += 24 * 60
    return ((m - RANGE_START) / (RANGE_END - RANGE_START)) * 100
  }

  const gatePct = toPct(gateMin)
  const onsetPct = toPct(onsetMin)
  const nowPct = toPct(nowMin)

  return (
    <div className="space-y-2">
      {/* Time + phase */}
      <div className="flex items-center gap-1.5">
        <Clock size={12} className="text-[var(--color-teal)]" />
        <span className="text-xs font-medium text-[var(--color-teal)]">{nowStr}</span>
        {phaseHint && (
          <span className="text-[10px] text-[var(--color-muted)]">· {phaseHint}</span>
        )}
      </div>

      {/* Mini timeline bar */}
      <div className="relative h-1 rounded-full bg-[var(--color-surface-2)]">
        {/* Gate → onset zone */}
        <div
          className="absolute h-full rounded-full bg-[var(--color-teal)]/20"
          style={{ left: `${gatePct}%`, width: `${onsetPct - gatePct}%` }}
        />
        {/* Now dot */}
        <div
          className="absolute -top-0.5 h-2 w-2 rounded-full border border-[var(--color-teal)] bg-white"
          style={{ left: `${nowPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Times */}
      <div className="flex justify-between text-[10px] text-[var(--color-muted)]">
        <span>{plan.personalSleepGate}</span>
        <span>{plan.personalSleepOnset}</span>
      </div>

      {/* One-line suggestion */}
      <p className="text-[11px] leading-snug text-[var(--color-muted)] line-clamp-2">
        {plan.suggestionText}
      </p>

      {plan.personalizationHint && (
        <p className="text-[10px] text-[var(--color-muted)]/70">{plan.personalizationHint}</p>
      )}

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {expanded ? '收起' : '详情'}
      </button>

      {/* Expand panel */}
      {expanded && (
        <div className="mt-2 border-t border-[var(--color-border)] pt-2">
          <CircadianExpandPanel plan={plan} windows={TCM_MERIDIAN_SCHEDULE} />
        </div>
      )}
    </div>
  )
}
