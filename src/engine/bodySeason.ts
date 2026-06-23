import { getBaseline } from '../lib/baselines'
import type { ConfidenceLevel } from '../types/bodyWeather'
import type { DailyWatchRow, PersonalBaseline } from '../types/health'
import type { BodySeasonId, BodySeasonSnapshot } from '../types/bodySeason'
import type { BpAdvisory } from '../types/bpAdvisory'

const EWMA_WINDOW = 14

const SEASON_COPY: Record<
  BodySeasonId,
  { label: string; metaphor: string; suggestions: string[] }
> = {
  spring: {
    label: '春',
    metaphor: '恢复力在慢慢回升，像解冻的河。',
    suggestions: [
      '逐步加一点活动，不必一次拉满',
      '固定收工时间，帮身体找到新节奏',
      '跟哼宫音，稳一稳内在节拍',
    ],
  },
  summer: {
    label: '夏',
    metaphor: '活跃峰正在展开，像日照下的原野。',
    suggestions: [
      '把运动分散到白天，别堆在睡前',
      '记得补水和日光，也记得留白',
      '徵音跟哼，释放一点积压的火力',
    ],
  },
  autumn: {
    label: '秋',
    metaphor: '各指标接近你的基线，像午后落叶般平稳。',
    suggestions: [
      '维持现有节奏，小幅微调即可',
      '留意饮食与睡眠的微小波动',
      '商音跟哼，帮思绪慢慢落定',
    ],
  },
  winter: {
    label: '冬',
    metaphor: '储备消耗期，需要多一点缓冲。',
    suggestions: [
      '优先睡眠与收工，少连续高压日',
      '减少连续高强度，给身体回气空间',
      '羽音跟哼，帮身体慢慢慢下来',
    ],
  },
}

function ewmaRecent(rows: DailyWatchRow[], extract: (r: DailyWatchRow) => number | null): number | null {
  const window = rows.slice(-EWMA_WINDOW)
  const vals = window.map(extract).filter((v): v is number => v != null)
  if (vals.length === 0) return null
  let e = vals[0]
  const alpha = 0.15
  for (let i = 1; i < vals.length; i++) {
    e = alpha * vals[i] + (1 - alpha) * e
  }
  return e
}

function zScore(value: number | null, base: PersonalBaseline | undefined): number | null {
  if (value == null || !base || base.sd === 0) return null
  return (value - base.mean) / base.sd
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function scoreSeasons(
  hrvEwma: number | null,
  sleepEwma: number | null,
  stepsEwma: number | null,
  rhrEwma: number | null,
  baselines: PersonalBaseline[],
  bpAdvisory?: BpAdvisory | null,
): Record<BodySeasonId, number> {
  const hrvBase = getBaseline(baselines, 'hrvSdnn')
  const sleepBase = getBaseline(baselines, 'sleepHours')
  const stepsBase = getBaseline(baselines, 'dailySteps')
  const rhrBase = getBaseline(baselines, 'restingHr')

  const scores: Record<BodySeasonId, number> = {
    spring: 0,
    summer: 0,
    autumn: 0,
    winter: 0,
  }

  if (hrvEwma != null && hrvBase && hrvEwma > hrvBase.mean * 1.05) scores.spring += 2
  if (sleepEwma != null && sleepBase && sleepEwma > sleepBase.mean * 1.03) scores.spring += 2

  if (stepsEwma != null && stepsBase && stepsEwma > stepsBase.mean * 1.1) scores.summer += 2
  if (hrvEwma != null && hrvBase && hrvEwma >= hrvBase.mean * 0.95) scores.summer += 1

  const zs = [
    zScore(hrvEwma, hrvBase),
    zScore(sleepEwma, sleepBase),
    zScore(stepsEwma, stepsBase),
    zScore(rhrEwma, rhrBase),
  ].filter((z): z is number => z != null)

  if (zs.length >= 3 && zs.every((z) => Math.abs(z) < 0.5)) scores.autumn += 3

  if (rhrEwma != null && rhrBase && rhrEwma > rhrBase.mean + 3) scores.winter += 2
  if (hrvEwma != null && hrvBase && hrvEwma < hrvBase.mean * 0.9) scores.winter += 2
  if (sleepEwma != null && sleepBase && sleepEwma < sleepBase.mean * 0.93) scores.winter += 2

  if (
    bpAdvisory?.fusionHints.seasonModifier === 'stable_bonus' &&
    bpAdvisory.daysWithReadings7d >= 5
  ) {
    scores.autumn += 1
  }

  return scores
}

function pickSeasonId(
  scores: Record<BodySeasonId, number>,
  prevSeasonId: BodySeasonId | null,
): BodySeasonId {
  const entries = (Object.entries(scores) as [BodySeasonId, number][]).sort((a, b) => b[1] - a[1])
  const top = entries[0][1]
  const tied = entries.filter(([, s]) => s === top).map(([id]) => id)
  if (tied.length > 1 && prevSeasonId && tied.includes(prevSeasonId)) return prevSeasonId
  return entries[0][0]
}

function buildSuggestions(
  seasonId: BodySeasonId,
  wuyinLabel?: string | null,
  sleepGate?: string | null,
): string[] {
  const base = [...SEASON_COPY[seasonId].suggestions]
  if (wuyinLabel) {
    base[2] = base[2].replace(/宫音|徵音|商音|羽音/g, wuyinLabel.replace(/音.*$/, '音') || wuyinLabel)
  }
  if (sleepGate) {
    base[1] = `尽量在 ${sleepGate} 前收工，帮身体进入下一季`
  }
  return base.slice(0, 3)
}

export function computeBodySeason(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  prevSeasonId: BodySeasonId | null,
  targetDate: string,
  opts?: {
    wuyinLabel?: string | null
    sleepGate?: string | null
    bpAdvisory?: BpAdvisory | null
  },
): BodySeasonSnapshot | null {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  const maturityDays = sorted.length

  if (maturityDays < 14) return null

  const hrvEwma = ewmaRecent(sorted, (r) => r.hrvSdnn)
  const sleepEwma = ewmaRecent(sorted, (r) => r.sleepHours)
  const stepsEwma = ewmaRecent(sorted, (r) => r.dailySteps)
  const rhrEwma = ewmaRecent(sorted, (r) => r.restingHr)

  const zs = [
    zScore(hrvEwma, getBaseline(baselines, 'hrvSdnn')),
    zScore(sleepEwma, getBaseline(baselines, 'sleepHours')),
    zScore(stepsEwma, getBaseline(baselines, 'dailySteps')),
    zScore(rhrEwma, getBaseline(baselines, 'restingHr')),
  ].filter((z): z is number => z != null)

  const driftScore =
    zs.length > 0 ? clamp01(zs.reduce((s, z) => s + Math.abs(z), 0) / zs.length / 2) : 0

  const scores = scoreSeasons(hrvEwma, sleepEwma, stepsEwma, rhrEwma, baselines, opts?.bpAdvisory)
  const seasonId = pickSeasonId(scores, prevSeasonId)
  const copy = SEASON_COPY[seasonId]

  let confidence: ConfidenceLevel = 'low'
  if (maturityDays >= 42) confidence = 'high'
  else if (maturityDays >= 21) confidence = 'medium'

  const justChanged = prevSeasonId != null && seasonId !== prevSeasonId

  return {
    date: targetDate,
    seasonId,
    label: copy.label,
    metaphor: copy.metaphor,
    suggestions: buildSuggestions(seasonId, opts?.wuyinLabel, opts?.sleepGate),
    driftScore,
    confidence,
    justChanged,
    previousSeasonId: prevSeasonId,
    baselineMaturityDays: maturityDays,
  }
}
