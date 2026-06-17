import { useEffect, useState } from 'react'
import { getBreathPhaseCycle, type BreathPhaseId } from '../lib/wuyinBreathingPattern'

export function useBreathPhase(pattern: string, active: boolean): { phaseId: BreathPhaseId; label: string } {
  const [index, setIndex] = useState(0)
  const cycle = getBreathPhaseCycle(pattern)
  const step = cycle.steps[index] ?? cycle.steps[0]

  useEffect(() => {
    if (!active) {
      setIndex(0)
      return
    }

    const { steps } = getBreathPhaseCycle(pattern)
    let stepIndex = 0
    let timer: number | undefined

    const schedule = () => {
      const current = steps[stepIndex]
      timer = window.setTimeout(() => {
        stepIndex = (stepIndex + 1) % steps.length
        setIndex(stepIndex)
        schedule()
      }, current.durationMs)
    }

    setIndex(0)
    schedule()

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [pattern, active])

  return { phaseId: step.id, label: step.label }
}
