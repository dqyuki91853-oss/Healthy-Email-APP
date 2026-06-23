import {
  BP_WEATHER_COPY,
  CLINICAL_DISCLAIMER,
  CRISIS_DIA,
  CRISIS_SYS,
  ELEVATED_DIA,
  ELEVATED_STREAK_DAYS,
  ELEVATED_SYS,
  FOOD_REACTION_LABELS,
  MIN_DAYS_TREND,
  TREND_SLOPE_EPS,
  VOLATILE_CV_7D,
  WEATHER_BREEZE_PCT,
  WEATHER_CALM_PCT,
  WEATHER_WINDY_PCT,
} from '../config/bpAdvisoryRules'
import {
  buildDailyBpSummaries,
  buildPersonalBpBaseline,
  coefficientOfVariation,
  computeRhythmScore,
  countDaysWithReadings,
  countGapDays7d,
  dailySysSeries,
  detectDuplicateSuspect,
  ewma,
  inferReadingRhythm,
  pctDelta,
} from '../lib/bpBaseline'
import { computeFoodFingerprints } from '../lib/bloodPressureStore'
import { getYesterdayRow, todayDateStr } from '../lib/wellnessSignals'
import type {
  BpAdvisory,
  BpSuggestion,
  BpTrend,
  BpWeatherLevel,
  DailyBpSummary,
  PersonalBpBaseline,
} from '../types/bpAdvisory'
import type { BloodPressureReading } from '../types/bloodPressure'
import type { DailyWatchRow } from '../types/health'
import type { VoiceExtraction } from '../types/voice'

function roundPct(n: number | null): number | null {
  if (n == null) return null
  return Math.round(n * 1000) / 10
}

function computeTrend(
  summaries: DailyBpSummary[],
  windowDays: 7 | 14,
): BpTrend {
  const cutoff = summaries.slice(-windowDays)
  const days = cutoff.length
  if (days < MIN_DAYS_TREND) return 'insufficient_data'

  const sysVals = cutoff.map((s) => s.sysAvg)
  const cv = coefficientOfVariation(sysVals)
  if (cv != null && cv > VOLATILE_CV_7D && windowDays === 7) return 'volatile'

  const ewmaShort = ewma(sysVals.slice(-Math.min(7, sysVals.length)), 0.35)
  const ewmaLong = ewma(sysVals, 0.2)
  if (ewmaShort == null || ewmaLong == null) return 'insufficient_data'

  const slope = (ewmaShort - ewmaLong) / ewmaLong
  if (slope > TREND_SLOPE_EPS) return 'rising'
  if (slope < -TREND_SLOPE_EPS) return 'falling'
  return 'stable'
}

function countWindyStreak(summaries: DailyBpSummary[], baseline: PersonalBpBaseline): number {
  let streak = 0
  for (let i = summaries.length - 1; i >= 0; i--) {
    const s = summaries[i]
    const sysPct = pctDelta(s.sysAvg, baseline.allDaySysMedian)
    const diaPct = pctDelta(s.diaAvg, baseline.allDayDiaMedian)
    const windy =
      (sysPct != null && sysPct > WEATHER_BREEZE_PCT && sysPct <= WEATHER_WINDY_PCT) ||
      (diaPct != null && diaPct > WEATHER_BREEZE_PCT && diaPct <= WEATHER_WINDY_PCT) ||
      (sysPct != null && sysPct > WEATHER_WINDY_PCT) ||
      (diaPct != null && diaPct > WEATHER_WINDY_PCT)
    if (windy) streak += 1
    else break
  }
  return streak
}

function classifyWeather(
  sysPct: number | null,
  diaPct: number | null,
  trend7d: BpTrend,
  windyStreak: number,
  clinicalCrisis: boolean,
  clinicalStorm: boolean,
  hasBaseline: boolean,
): BpWeatherLevel {
  if (clinicalCrisis) return 'crisis'
  if (clinicalStorm && hasBaseline) return 'storm'

  const sysAbs = sysPct != null ? Math.abs(sysPct) : 0
  const diaAbs = diaPct != null ? Math.abs(diaPct) : 0
  const maxDev = Math.max(sysAbs, diaAbs)

  if (maxDev <= WEATHER_CALM_PCT) return 'calm'
  if (maxDev <= WEATHER_BREEZE_PCT) return 'breeze'
  if (maxDev <= WEATHER_WINDY_PCT || trend7d === 'volatile') return 'windy'
  if (maxDev > WEATHER_WINDY_PCT || windyStreak >= 3) return 'storm'
  return 'windy'
}

function checkClinicalCrisis(readings: BloodPressureReading[]): boolean {
  return readings.some(
    (r) => r.systolicMmHg >= CRISIS_SYS || r.diastolicMmHg >= CRISIS_DIA,
  )
}

function checkClinicalElevatedStreak(summaries: DailyBpSummary[]): boolean {
  if (summaries.length < ELEVATED_STREAK_DAYS) return false
  const recent = summaries.slice(-ELEVATED_STREAK_DAYS)
  return recent.every((s) => s.sysAvg >= ELEVATED_SYS || s.diaAvg >= ELEVATED_DIA)
}

function pulsePressureLabel(
  pp: number | null,
  baseline: PersonalBpBaseline | null,
): string | null {
  if (pp == null || baseline?.pulsePressureMedian == null) return null
  const delta = pp - baseline.pulsePressureMedian
  if (Math.abs(delta) <= 3) return '接近你的平常脉压'
  if (delta > 3) return '脉压略宽'
  return '脉压略窄'
}

function variabilityLabel(cv: number | null): string | null {
  if (cv == null) return null
  if (cv <= 0.08) return '最近波动较小'
  if (cv <= VOLATILE_CV_7D) return '波动适中'
  return '最近波动偏大'
}

function buildSuggestions(
  params: {
    days7d: number
    readingRhythm: BpAdvisory['readingRhythm']
    rhythmScore: number
    weatherLevel: BpWeatherLevel
    trend7d: BpTrend
    todaySummary: DailyBpSummary | null
    watchRows: DailyWatchRow[]
    targetDate: string
    topFoodReactions: BpAdvisory['topFoodReactions']
    clinicalCrisis: boolean
    clinicalStorm: boolean
    baseline: PersonalBpBaseline | null
  },
): BpSuggestion[] {
  const suggestions: BpSuggestion[] = []
  const {
    days7d,
    readingRhythm,
    rhythmScore,
    weatherLevel,
    trend7d,
    todaySummary,
    watchRows,
    targetDate,
    topFoodReactions,
    clinicalCrisis,
    clinicalStorm,
    baseline,
  } = params

  if (days7d < 4) {
    suggestions.push({
      id: 'BP-MSR-01',
      category: 'measurement',
      priority: 'medium',
      label: '建立测量习惯',
      detail: '最近 7 天有效测量不足 4 天，建议固定晨/晚各测一次，便于建立个人基线。',
      actionHref: '/blood-pressure',
      actionLabel: '去录入',
    })
  }

  if (readingRhythm === 'single_reading') {
    suggestions.push({
      id: 'BP-MSR-02',
      category: 'measurement',
      priority: 'medium',
      label: '增加测量频次',
      detail: '目前仅有单次读数，连续几天同一时间测量会更准。',
      actionHref: '/blood-pressure',
      actionLabel: '去录入',
    })
  }

  if (rhythmScore < 0.4) {
    suggestions.push({
      id: 'BP-MSR-03',
      category: 'measurement',
      priority: 'low',
      label: '测量节奏可再稳一点',
      detail: '尽量在同一时段测量，减少可比性噪音。',
    })
  }

  const yesterday = getYesterdayRow(watchRows, targetDate)
  if (
    (weatherLevel === 'windy' || weatherLevel === 'storm') &&
    yesterday?.sleepHours != null &&
    yesterday.sleepHours < 6.5
  ) {
    suggestions.push({
      id: 'BP-LIF-01',
      category: 'lifestyle',
      priority: 'medium',
      label: '昨晚睡得偏少',
      detail: '睡眠偏短时血压更容易波动，今晚可以早点收工。',
    })
  }

  if (trend7d === 'rising') {
    suggestions.push({
      id: 'BP-LIF-02',
      category: 'lifestyle',
      priority: 'medium',
      label: '近一周略往上走',
      detail: '收缩压趋势在缓升，清淡饮食、减盐、多走动会有帮助。',
    })
  }

  if (todaySummary?.morningSurge) {
    suggestions.push({
      id: 'BP-LIF-03',
      category: 'lifestyle',
      priority: 'medium',
      label: '晨峰略明显',
      detail: '今早收缩压比昨晚高出一截，留意昨晚饮食与入睡时间。',
    })
  }

  if (topFoodReactions.length > 0) {
    const top = topFoodReactions[0]
    suggestions.push({
      id: 'BP-FOD-01',
      category: 'food',
      priority: 'medium',
      label: `${top.foodName} 反应${top.reaction}`,
      detail: `餐后收缩压峰值平均比你的基线高约 ${Math.round(top.avgPeakDeltaPct * 100)}%，可留意份量与搭配。`,
      actionHref: '/blood-pressure',
      actionLabel: '查看指纹',
    })
  }

  if (clinicalCrisis) {
    suggestions.push({
      id: 'BP-ALT-01',
      category: 'alert',
      priority: 'high',
      label: '读数异常偏高',
      detail: `检测到收缩压 ≥ ${CRISIS_SYS} 或舒张压 ≥ ${CRISIS_DIA}，建议尽快复测并咨询医生。${CLINICAL_DISCLAIMER}`,
    })
  } else if (clinicalStorm && baseline && baseline.confidence !== 'low') {
    suggestions.push({
      id: 'BP-ALT-02',
      category: 'alert',
      priority: 'high',
      label: '连续几天偏高',
      detail: `近 ${ELEVATED_STREAK_DAYS} 天均值达到常见关注线（${ELEVATED_SYS}/${ELEVATED_DIA}），建议就医复测。${CLINICAL_DISCLAIMER}`,
    })
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

function buildFusionHints(
  weatherLevel: BpWeatherLevel,
  trend7d: BpTrend,
  days7d: number,
): BpAdvisory['fusionHints'] {
  return {
    bodyWeatherRipple: weatherLevel === 'windy' || weatherLevel === 'storm',
    seasonModifier:
      weatherLevel === 'calm' && trend7d === 'stable' && days7d >= 5 ? 'stable_bonus' : null,
  }
}

function advisoryConfidence(
  baseline: PersonalBpBaseline | null,
  days7d: number,
): BpAdvisory['confidence'] {
  if (!baseline) return 'low'
  if (baseline.confidence === 'high' && days7d >= 5) return 'high'
  if (baseline.confidence !== 'low' && days7d >= 3) return 'medium'
  return 'low'
}

export function computeBpAdvisory(
  readings: BloodPressureReading[],
  voiceLogs: VoiceExtraction[],
  watchRows: DailyWatchRow[] = [],
  targetDate?: string,
): BpAdvisory {
  const date = targetDate ?? todayDateStr()
  const sorted = [...readings].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
  const dayReadings = sorted.filter((r) => r.measuredAt.slice(0, 10) === date)
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null

  const baseline = sorted.length > 0 ? buildPersonalBpBaseline(sorted, voiceLogs, date) : null
  const summaries = buildDailyBpSummaries(sorted, voiceLogs, date)
  const todaySummary = summaries.find((s) => s.date === date) ?? null

  const days7d = countDaysWithReadings(sorted, date, 7)
  const days14d = countDaysWithReadings(sorted, date, 14)
  const readingRhythm = inferReadingRhythm(sorted, voiceLogs, date, 7)
  const rhythmScore = computeRhythmScore(days7d, readingRhythm)
  const gapDays7d = countGapDays7d(date, summaries)

  const trend7d = computeTrend(summaries, 7)
  const trend14d = computeTrend(summaries, 14)

  const refSys = todaySummary?.sysAvg ?? latest?.systolicMmHg ?? null
  const refDia = todaySummary?.diaAvg ?? latest?.diastolicMmHg ?? null
  const baselineDeltaSysPct = roundPct(pctDelta(refSys, baseline?.allDaySysMedian ?? null))
  const baselineDeltaDiaPct = roundPct(pctDelta(refDia, baseline?.allDayDiaMedian ?? null))

  const sys7 = summaries.slice(-7).map((s) => s.sysAvg)
  const variability7d =
    sys7.length >= 2
      ? Math.round(
          (Math.sqrt(
            sys7.reduce((s, v) => {
              const m = sys7.reduce((a, b) => a + b, 0) / sys7.length
              return s + (v - m) ** 2
            }, 0) / sys7.length,
          )) *
            10,
        ) / 10
      : null

  const cv7 = coefficientOfVariation(sys7)
  const clinicalCrisis = checkClinicalCrisis(dayReadings.length > 0 ? dayReadings : sorted.slice(-3))
  const clinicalStorm = checkClinicalElevatedStreak(summaries)
  const windyStreak = baseline ? countWindyStreak(summaries, baseline) : 0

  const hasSufficientData =
    baseline != null &&
    baseline.sampleCounts.all >= 3 &&
    baseline.allDaySysMedian != null &&
    baseline.allDayDiaMedian != null

  const weatherLevel = classifyWeather(
    baselineDeltaSysPct != null ? baselineDeltaSysPct / 100 : null,
    baselineDeltaDiaPct != null ? baselineDeltaDiaPct / 100 : null,
    trend7d,
    windyStreak,
    clinicalCrisis,
    clinicalStorm,
    hasSufficientData,
  )

  const copy = BP_WEATHER_COPY[weatherLevel]
  const pulsePressure =
    refSys != null && refDia != null ? Math.round(refSys - refDia) : null

  const fingerprints = computeFoodFingerprints(voiceLogs, sorted)
  const topFoodReactions = fingerprints.slice(0, 3).map((f) => ({
    foodName: f.foodName,
    reaction: FOOD_REACTION_LABELS[f.reaction] ?? f.reaction,
    avgPeakDeltaPct: f.avgPeakDeltaPct,
  }))

  const clinicalEscalation = {
    triggered: clinicalCrisis || (clinicalStorm && baseline?.confidence !== 'low'),
    reason: clinicalCrisis
      ? `读数达到 ${CRISIS_SYS}/${CRISIS_DIA} 关注线`
      : clinicalStorm
        ? `连续 ${ELEVATED_STREAK_DAYS} 天均值偏高`
        : '',
    disclaimer: CLINICAL_DISCLAIMER,
  }

  const dataQuality = {
    rhythmScore,
    duplicateSuspect: detectDuplicateSuspect(sorted),
    gapDays7d,
  }

  const suggestions = buildSuggestions({
    days7d,
    readingRhythm,
    rhythmScore,
    weatherLevel,
    trend7d,
    todaySummary,
    watchRows,
    targetDate: date,
    topFoodReactions,
    clinicalCrisis,
    clinicalStorm,
    baseline,
  })

  const fusionHints = buildFusionHints(weatherLevel, trend7d, days7d)

  return {
    date,
    latest: latest
      ? {
          systolicMmHg: latest.systolicMmHg,
          diastolicMmHg: latest.diastolicMmHg,
          pulseBpm: latest.pulseBpm,
          measuredAt: latest.measuredAt,
        }
      : null,
    baseline,
    weatherLevel,
    weatherLabel: copy.label,
    weatherHint: copy.hint,
    trend7d,
    trend14d,
    pulsePressure,
    pulsePressureLabel: pulsePressureLabel(pulsePressure, baseline),
    variability7d,
    variabilityLabel: variabilityLabel(cv7),
    baselineDeltaSysPct,
    baselineDeltaDiaPct,
    daysWithReadings7d: days7d,
    daysWithReadings14d: days14d,
    readingRhythm,
    suggestions,
    topFoodReactions,
    clinicalEscalation,
    dataQuality,
    fusionHints,
    hasSufficientData,
    confidence: advisoryConfidence(baseline, days7d),
  }
}

/** Re-export series helper for tests */
export { dailySysSeries }
