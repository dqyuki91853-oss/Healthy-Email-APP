import { useNavigate } from 'react-router-dom'
import type { WuyinPrescription } from '../../../types/tcm'
import { getPracticeEntryHint } from '../../../lib/wuyinPracticeStreak'
import { useWuyinPracticeStats } from '../../../hooks/useWuyinPracticeStats'
import { ChevronRight } from 'lucide-react'

interface Props {
  prescription: WuyinPrescription
}

export function WuyinPracticeEntry({ prescription }: Props) {
  const navigate = useNavigate()
  const stats = useWuyinPracticeStats()
  const streakHint = getPracticeEntryHint(stats)

  return (
    <button
      type="button"
      onClick={() => navigate('/practice/wuyin')}
      className="dojo-practice-entry tcm-glass flex w-full items-center gap-4 text-left transition-transform hover:scale-[1.01]"
    >
      <div className="dojo-practice-entry__ring shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="text-sm font-medium text-[var(--tcm-text)]"
            style={{ fontFamily: 'var(--tcm-font-serif)' }}
          >
            跟哼练习 · {prescription.label}
          </p>
          {streakHint && (
            <span className="dojo-streak-badge">{streakHint}</span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--tcm-muted)]">
          {prescription.instructionText || '四阶段呼吸引导 + 参考音高哼唱'}
        </p>
        <p className="mt-1 text-[10px] text-[var(--tcm-amber)]">
          {prescription.durationSec}s · {prescription.frequencyHz.toFixed(1)} Hz
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--tcm-amber)]">
        进入练习
        <ChevronRight size={14} />
      </span>
    </button>
  )
}
