import { useState, useEffect } from 'react'
import type { PersonalCircadianPlan } from '../../types/tcm'
import { TCM_MERIDIAN_SCHEDULE } from '../../config/tcmMeridianSchedule'
import { CircadianMiniTimeline } from './CircadianMiniTimeline'
import { CircadianExpandPanel } from './CircadianExpandPanel'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  plan: PersonalCircadianPlan
}

export function CircadianHintCard({ plan }: Props) {
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
    plan.phaseLabel === 'wind_down' ? '亥时·收工段' :
    plan.phaseLabel === 'sleep_window' ? '子时·入静段' :
    plan.phaseLabel === 'late' ? '已过参考入睡时间' : ''

  return (
    <div
      className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--color-teal)]" />
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-teal)]">
            东方作息参考
          </p>
        </div>
        <span className="text-xs font-medium text-[var(--color-teal)]">
          现在 {nowStr}
          {phaseHint && ` · ${phaseHint}`}
        </span>
      </div>

      {/* Mini timeline */}
      <CircadianMiniTimeline plan={plan} />

      {/* Main suggestion */}
      <p className="mt-3 text-sm leading-relaxed">{plan.suggestionText}</p>

      {/* Personalization hint */}
      {plan.personalizationHint && (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{plan.personalizationHint}</p>
      )}

      {/* Times + confidence */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
        <span>准备休息：{plan.personalSleepGate}</span>
        <span>参考入睡：{plan.personalSleepOnset}</span>
        {plan.confidence === 'low' && <span className="italic">（数据较少，仅供参考）</span>}
      </div>

      {/* Disclaimer */}
      <p className="mt-1 text-[10px] text-[var(--color-muted)]">
        传统文化参考，非医疗建议；不声称褪黑素监测或经络诊断。
      </p>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? '收起详情' : '了解时辰'}
      </button>

      {/* Expand panel */}
      {expanded && <CircadianExpandPanel plan={plan} windows={TCM_MERIDIAN_SCHEDULE} />}
    </div>
  )
}
