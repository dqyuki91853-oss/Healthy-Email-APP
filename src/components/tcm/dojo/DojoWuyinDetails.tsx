import { useState } from 'react'
import type { WuyinPrescription } from '../../../types/tcm'
import { getHumSteps } from '../../../lib/wuyinBreathingPattern'
import { WuyinExpandPanel } from '../WuyinExpandPanel'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  prescription: WuyinPrescription
  contextLine: string
  moodLabel?: string
  moodMetaphors?: string[]
}

/** Phase 4 — 首页五音因果 + 三步练习 + 展开详情 */
export function DojoWuyinDetails({ prescription, contextLine, moodLabel, moodMetaphors }: Props) {
  const [expanded, setExpanded] = useState(false)
  const steps = getHumSteps(prescription.humPattern)

  return (
    <div className="dojo-wuyin-details tcm-glass rounded-2xl p-4">
      <p className="text-sm leading-relaxed text-[var(--tcm-text)]">{contextLine}</p>
      <ol className="mt-3 space-y-1">
        {steps.slice(0, 3).map((step) => (
          <li key={step} className="text-[11px] text-[var(--tcm-muted)]">
            {step}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-[var(--tcm-muted)] hover:text-[var(--tcm-text)]"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? '收起详情' : '了解这音'}
      </button>
      {expanded && (
        <div className="dojo-wuyin-details__expand mt-3 border-t border-[var(--tcm-border)] pt-3">
          <WuyinExpandPanel
            prescription={prescription}
            moodLabel={moodLabel}
            contextLine={contextLine}
            moodMetaphors={moodMetaphors}
            theme="dojo"
          />
        </div>
      )}
    </div>
  )
}
