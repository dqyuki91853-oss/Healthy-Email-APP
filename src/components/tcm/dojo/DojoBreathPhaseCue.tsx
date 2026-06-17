import { useBreathPhase } from '../../../hooks/useBreathPhase'
import { getBreathPhaseCycle } from '../../../lib/wuyinBreathingPattern'

interface Props {
  pattern: string
  active?: boolean
}

/** Phase 3 — 吸 / 哼 / 呼 节拍引导 */
export function DojoBreathPhaseCue({ pattern, active = true }: Props) {
  const { phaseId, label } = useBreathPhase(pattern, active)
  const steps = getBreathPhaseCycle(pattern).steps

  return (
    <div className="dojo-breath-cue" role="status" aria-live="polite" aria-atomic="true">
      <div className="dojo-breath-cue__track">
        {steps.map((step) => (
          <span
            key={step.id}
            className={`dojo-breath-cue__step ${phaseId === step.id && active ? 'dojo-breath-cue__step--active' : ''}`}
            style={{ fontFamily: 'var(--tcm-font-serif)' }}
          >
            {step.label}
          </span>
        ))}
      </div>
      {active && (
        <p className="dojo-breath-cue__now" style={{ fontFamily: 'var(--tcm-font-serif)' }}>
          {label}
        </p>
      )}
    </div>
  )
}
