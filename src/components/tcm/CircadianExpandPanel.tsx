import type { PersonalCircadianPlan, MeridianWindow } from '../../types/tcm'
import { TCM_HIGHLIGHT_WINDOWS } from '../../config/tcmMeridianSchedule'
import { Clock, Info } from 'lucide-react'

interface Props {
  plan: PersonalCircadianPlan
  windows: MeridianWindow[]
}

export function CircadianExpandPanel({ plan, windows }: Props) {
  const highlightWindows = windows.filter((w) =>
    (TCM_HIGHLIGHT_WINDOWS as readonly string[]).includes(w.windowId),
  )

  return (
    <div className="mt-4 space-y-4 border-t border-[var(--color-border)] pt-4">
      {/* Full timeline */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
          <Clock size={12} /> 时辰参考
        </p>
        <div className="grid grid-cols-4 gap-1">
          {highlightWindows.map((w) => (
            <div
              key={w.windowId}
              className="rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-2 text-center"
            >
              <p className="text-xs font-medium">{w.label}</p>
              <p className="text-[10px] text-[var(--color-muted)]">{w.meridianLabel}</p>
              <p className="mt-1 text-[11px] text-[var(--color-muted)] leading-snug">{w.modernProxy}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How we got these numbers */}
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
          <Info size={12} /> 我的窗口怎么算的
        </p>
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-muted)] space-y-1">
          <p>· 参考入睡时间：{plan.personalSleepOnset}</p>
          <p>· 准备休息：{plan.personalSleepGate}（入睡前 90 分钟）</p>
          <p>· 置信度：{plan.confidence === 'high' ? '高' : plan.confidence === 'medium' ? '中' : '低'}</p>
          {plan.personalizationHint && <p>· {plan.personalizationHint}</p>}
          <p className="text-[10px] pt-1 opacity-70">
            基于 Apple Watch 近 14 天睡眠数据推算；置信度低时使用默认 23:00 入睡。
            不含真实 sleep segment XML 解析，仅为代理窗口。
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-[var(--color-muted)] leading-relaxed">
        子午流注为传统文化参考，非医疗建议。不声称可监测褪黑素或经络状态。
      </p>
    </div>
  )
}
