import { useState } from 'react'
import type { PersonalCircadianPlan, WuyinListeningWindow } from '../../../types/tcm'
import { WUYIN_GATE_LEAD_MIN } from '../../../engine/wuyinListeningWindow'
import type { DailyWatchRow } from '../../../types/health'
import { CircadianExpandPanel } from '../CircadianExpandPanel'
import { TCM_MERIDIAN_SCHEDULE } from '../../../config/tcmMeridianSchedule'
import { TANG } from '../../../config/tangPalette'
import { SleepPhaseSparkline } from './SleepPhaseSparkline'

interface Props {
  plan: PersonalCircadianPlan
  watchRows?: DailyWatchRow[]
  listeningWindow?: WuyinListeningWindow | null
  gateLeadMin?: number
}

/** 时间长河 + Watch 睡眠相位（Phase 2C） */
export function CircadianRiverStrip({ plan, watchRows = [], listeningWindow, gateLeadMin = WUYIN_GATE_LEAD_MIN }: Props) {
  const [expanded, setExpanded] = useState(false)
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const [gH, gM] = plan.personalSleepGate.split(':').map(Number)
  const gateMin = gH * 60 + gM
  const [oH, oM] = plan.personalSleepOnset.split(':').map(Number)
  const onsetMin = oH * 60 + oM
  const RANGE_START = 18 * 60
  const RANGE_END = 25 * 60
  const toPct = (min: number): number => {
    let m = min
    if (m < RANGE_START) m += 24 * 60
    return ((m - RANGE_START) / (RANGE_END - RANGE_START)) * 100
  }
  const gatePct = toPct(gateMin)
  const onsetPct = toPct(onsetMin)
  const listenStartPct = toPct(gateMin - gateLeadMin)
  const listenEndPct = onsetPct
  const nowPct = toPct(nowMin)

  const phaseLabel =
    plan.phaseLabel === 'before_gate' ? '收工前' :
    plan.phaseLabel === 'wind_down' ? '收工段' :
    plan.phaseLabel === 'sleep_window' ? '入静段' :
    plan.phaseLabel === 'late' ? '已过入睡时间' : ''

  return (
    <div className="dojo-circadian tcm-glass rounded-xl p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-widest text-[var(--tcm-muted)]" style={{ fontFamily: 'var(--tcm-font-serif)' }}>
          子午流注 · 时间长河
        </p>
        {plan.confidence !== 'high' && (
          <span className="dojo-cloud-hint text-[10px] text-[var(--tcm-muted)]" title={plan.personalizationHint}>
            ☁️ 基于默认时辰
          </span>
        )}
      </div>

      <div className="dojo-river-track relative h-2.5 overflow-hidden rounded-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${TANG.earth} 0%, ${TANG.fire} 28%, ${TANG.water} 100%)`,
            opacity: 0.85,
          }}
        />
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${gatePct}%`,
            width: `${Math.max(onsetPct - gatePct, 2)}%`,
            background: `rgba(222, 153, 96, 0.42)`,
            boxShadow: `0 0 14px ${TANG.earth}66`,
          }}
        />
        {listeningWindow && listeningWindow.tier !== 'closed' && (
          <div
            className="dojo-river-wuyin-band absolute inset-y-0 rounded-full"
            style={{
              left: `${listenStartPct}%`,
              width: `${Math.max(listenEndPct - listenStartPct, 2)}%`,
            }}
            title={`五音聆听 ${listeningWindow.windowStart}–${listeningWindow.windowEnd}`}
          />
        )}
        <div
          className="dojo-river-now absolute top-1/2 h-3 w-3 rounded-full border-2 border-[var(--tcm-text)] bg-white"
          style={{ left: `${nowPct}%`, transform: 'translate(-50%, -50%)' }}
          title="现在"
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--tcm-text)]/40"
          style={{ left: `${onsetPct}%` }}
          title={`入睡 ★ ${plan.personalSleepOnset}`}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[9px] text-[var(--tcm-muted)]">
        <span>18:00</span>
        <span>{plan.personalSleepGate} 收工</span>
        <span className="text-[var(--tcm-amber)]">★ {plan.personalSleepOnset}</span>
        <span>01:00</span>
      </div>

      <p className="mt-2 text-[11px] leading-snug text-[var(--tcm-text)]">
        {phaseLabel && <span className="text-[var(--tcm-amber)]">{phaseLabel} · </span>}
        {plan.suggestionText}
      </p>

      {plan.minutesUntilGate > 0 && plan.phaseLabel === 'before_gate' && (
        <p className="mt-1 text-[10px] text-[var(--tcm-muted)]">
          距收工窗口约 {Math.floor(plan.minutesUntilGate / 60)} 小时 {plan.minutesUntilGate % 60} 分
        </p>
      )}

      <SleepPhaseSparkline rows={watchRows} />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-[10px] text-[var(--tcm-muted)] hover:text-[var(--tcm-text)]"
      >
        {expanded ? '收起时辰' : '展开时辰详情'}
      </button>
      {expanded && (
        <div className="mt-2 border-t border-[var(--tcm-border)] pt-2 text-[var(--tcm-text)]">
          <CircadianExpandPanel plan={plan} windows={TCM_MERIDIAN_SCHEDULE} />
        </div>
      )}
    </div>
  )
}
