import type { PersonalCircadianPlan } from '../../types/tcm'

interface Props {
  plan: PersonalCircadianPlan
}

/** Render 18:00–01:00 segment with gate + onset anchors and now marker */
export function CircadianMiniTimeline({ plan }: Props) {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  // Parse gate and onset to minutes
  const [gH, gM] = plan.personalSleepGate.split(':').map(Number)
  const gateMin = gH * 60 + gM

  const [oH, oM] = plan.personalSleepOnset.split(':').map(Number)
  const onsetMin = oH * 60 + oM

  // Timeline range: 18:00 (1080) to 01:00 next day (1500 or 60)
  const RANGE_START = 18 * 60  // 1080
  const RANGE_END = 25 * 60     // 1500 (1am next day)

  // Compute positions as percentage
  const toPct = (min: number): number => {
    let m = min
    if (m < RANGE_START) m += 24 * 60 // wrap 0:xx → 24:xx
    return ((m - RANGE_START) / (RANGE_END - RANGE_START)) * 100
  }

  const nowPct = toPct(nowMin)
  const gatePct = toPct(gateMin)
  const onsetPct = toPct(onsetMin)

  return (
    <div className="relative py-3">
      {/* Track */}
      <div className="relative h-1.5 rounded-full bg-[var(--color-surface-2)]">
        {/* Highlight zone: gate → onset */}
        <div
          className="absolute h-full rounded-full bg-[var(--color-teal)]/20"
          style={{ left: `${gatePct}%`, width: `${onsetPct - gatePct}%` }}
        />
        {/* Now marker */}
        <div
          className="absolute -top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--color-teal)] bg-white animate-pulse"
          style={{ left: `${nowPct}%`, transform: 'translateX(-50%)' }}
          title="现在"
        />
        {/* Gate anchor */}
        <div
          className="absolute -top-0.5 h-2.5 w-0.5 bg-[var(--color-teal)]"
          style={{ left: `${gatePct}%` }}
        />
        {/* Onset anchor */}
        <div
          className="absolute -top-0.5 h-2.5 w-0.5 bg-[var(--color-muted)]"
          style={{ left: `${onsetPct}%` }}
        />
      </div>

      {/* Labels */}
      <div className="relative mt-1 flex text-[10px] text-[var(--color-muted)]" style={{ height: 20 }}>
        <span className="absolute" style={{ left: `${gatePct}%`, transform: 'translateX(-50%)' }}>
          收工 {plan.personalSleepGate}
        </span>
        <span className="absolute" style={{ left: `${onsetPct}%`, transform: 'translateX(-50%)' }}>
          入睡 {plan.personalSleepOnset}
        </span>
      </div>
    </div>
  )
}
