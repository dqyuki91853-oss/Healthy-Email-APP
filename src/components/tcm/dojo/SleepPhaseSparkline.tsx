import type { DailyWatchRow } from '../../../types/health'

interface Props {
  rows: DailyWatchRow[]
}

/** 最近一条有睡眠数据的 Watch 记录 → 相位条 */
export function SleepPhaseSparkline({ rows }: Props) {
  const latest = [...rows]
    .reverse()
    .find((r) => (r.sleepHours ?? 0) > 0 && (r.deepSleepMin ?? 0) + (r.coreSleepMin ?? 0) + (r.remSleepMin ?? 0) > 0)

  if (!latest) return null

  const deep = latest.deepSleepMin ?? 0
  const core = latest.coreSleepMin ?? 0
  const rem = latest.remSleepMin ?? 0
  const total = deep + core + rem || 1
  const deepPct = (deep / total) * 100
  const corePct = (core / total) * 100
  const remPct = (rem / total) * 100

  return (
    <div className="dojo-sleep-spark">
      <div className="mb-1.5 flex items-center justify-between text-[10px] text-[var(--tcm-muted)]">
        <span>Apple Watch · 睡眠相位</span>
        <span>{latest.date} · {latest.sleepHours?.toFixed(1) ?? '—'}h</span>
      </div>
      <div className="dojo-sleep-spark__bar" title={`深睡 ${deep}min · 核心 ${core}min · REM ${rem}min`}>
        {deepPct > 0 && (
          <span className="dojo-sleep-spark__seg--deep" style={{ width: `${deepPct}%` }} />
        )}
        {corePct > 0 && (
          <span className="dojo-sleep-spark__seg--core" style={{ width: `${corePct}%` }} />
        )}
        {remPct > 0 && (
          <span className="dojo-sleep-spark__seg--rem" style={{ width: `${remPct}%` }} />
        )}
      </div>
      <div className="mt-1 flex gap-3 text-[9px] text-[var(--tcm-muted)]">
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-[#436C85] mr-1" />深睡 {deep}m</span>
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-[rgba(238,230,203,0.5)] mr-1" />核心 {core}m</span>
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-[#82B29B] mr-1" />REM {rem}m</span>
      </div>
    </div>
  )
}
