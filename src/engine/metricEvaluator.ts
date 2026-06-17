import { METRIC_THRESHOLDS, type MetricThresholdDef } from '../config/metricThresholds'
import type { DailyWatchRow } from '../types/health'
import type { MetricEvaluation, MetricStatus } from '../types/prediction'
import {
  avg,
  derivedSeries,
  min,
  recentValues,
  spo2NightAvgSeries,
  trendDelta,
} from '../lib/metricsAggregate'
import { computeDerived } from '../lib/health-import/xmlParser'

function checkThreshold(
  avgVal: number,
  t: NonNullable<MetricThresholdDef['red']>,
): boolean {
  if (Array.isArray(t.threshold)) {
    const [lo, hi] = t.threshold
    return avgVal < lo || avgVal > hi
  }
  return t.below ? avgVal < t.threshold : avgVal > t.threshold
}

function evaluateMetric(
  def: MetricThresholdDef,
  rows: DailyWatchRow[],
): MetricEvaluation {
  let vals: number[] = []

  switch (def.key) {
    case 'spo2NightAvg':
      vals = spo2NightAvgSeries(rows, 14)
      break
    case 'sleepEfficiency':
      vals = derivedSeries(rows, 14)
        .map((d) => d.sleepEfficiency)
        .filter((v): v is number => v != null)
      break
    case 'deepSleepPct':
      vals = derivedSeries(rows, 14)
        .map((d) => d.deepSleepPct)
        .filter((v): v is number => v != null)
      break
    case 'restingHr':
      vals = recentValues(rows, (r) => r.restingHr, 14)
      break
    case 'cardioRecovery1min':
      vals = recentValues(rows, (r) => r.cardioRecovery1min, 14)
      break
    case 'dailySteps':
      vals = recentValues(rows, (r) => r.dailySteps, 7)
      break
    case 'daylightMinutes':
      vals = recentValues(rows, (r) => r.daylightMinutes, 7)
      break
    case 'hrvSdnn':
      vals = recentValues(rows, (r) => r.hrvSdnn, 14)
      break
    case 'vo2max':
      vals = recentValues(rows, (r) => r.vo2max, 30)
      break
    case 'wristTempRaw':
      vals = recentValues(rows, (r) => r.wristTempRaw, 14)
      break
    case 'respiratoryRateSleep':
      vals = recentValues(rows, (r) => r.respiratoryRateSleep, 14)
      break
    case 'environmentalNoiseDb':
      vals = recentValues(rows, (r) => r.environmentalNoiseDb, 7)
      break
    case 'activeEnergyKcal':
      vals = recentValues(rows, (r) => r.activeEnergyKcal, 7)
      break
    case 'sleepHours':
      vals = recentValues(rows, (r) => r.sleepHours, 14)
      break
    default:
      vals = []
  }

  const base: MetricEvaluation = {
    key: def.key,
    name: def.name,
    unit: def.unit,
    reliability:
      def.reliability === 'reliable'
        ? 'reliable'
        : def.reliability === 'unreliable'
          ? 'unreliable'
          : 'trend_only',
    status: 'no_data',
    detail: '无近期数据',
    risk: '',
    evidence: def.yellow?.evidence ?? def.red?.evidence ?? 'heuristic',
    avg7d: null,
  }

  if (!vals.length) return base

  const mean = avg(vals)!
  base.avg7d = mean

  if (def.red && checkThreshold(mean, def.red)) {
    return {
      ...base,
      status: 'red',
      detail: `近7-14日均值 ${mean.toFixed(1)} 触发红色阈值`,
      risk: def.red.risk,
      evidence: def.red.evidence,
    }
  }

  if (def.yellow && checkThreshold(mean, def.yellow)) {
    return {
      ...base,
      status: 'yellow',
      detail: `近7-14日均值 ${mean.toFixed(1)} 触发黄色阈值`,
      risk: def.yellow.risk,
      evidence: def.yellow.evidence,
    }
  }

  // Trend checks for RHR / HRV / VO2
  const delta = trendDelta(vals)
  if (delta != null && def.trendRed && Math.abs(delta) >= def.trendRed.delta) {
    const rising = def.key === 'restingHr' ? delta > 0 : delta < 0
    if (rising || def.key === 'restingHr') {
      return {
        ...base,
        status: 'red',
        detail: `趋势变化 ${delta > 0 ? '+' : ''}${delta.toFixed(1)}`,
        risk: def.trendRed.risk,
        evidence: 'moderate',
      }
    }
  }
  if (delta != null && def.trendYellow && Math.abs(delta) >= def.trendYellow.delta) {
    const rising = def.key === 'restingHr' ? delta > 0 : delta < 0
    if (rising || def.key === 'restingHr') {
      return {
        ...base,
        status: 'yellow',
        detail: `趋势变化 ${delta > 0 ? '+' : ''}${delta.toFixed(1)}`,
        risk: def.trendYellow.risk,
        evidence: 'moderate',
      }
    }
  }

  // SpO2 min check
  if (def.key === 'spo2NightAvg') {
    const nightMin = min(vals)
    if (nightMin != null && nightMin < 90) {
      return {
        ...base,
        status: 'red',
        detail: `夜间最低 ${nightMin.toFixed(0)}%`,
        risk: def.red?.risk ?? '低氧',
        evidence: 'moderate',
      }
    }
  }

  return {
    ...base,
    status: 'normal',
    detail: `均值 ${mean.toFixed(1)} 在正常范围`,
    risk: '',
    evidence: def.yellow?.evidence ?? 'moderate',
  }
}

export function evaluateAllMetrics(rows: DailyWatchRow[]): MetricEvaluation[] {
  if (!rows.length) return []
  return METRIC_THRESHOLDS.map((def) => evaluateMetric(def, rows))
}

export function statusToLevel(status: MetricStatus): 'green' | 'yellow' | 'orange' | 'red' {
  if (status === 'red') return 'red'
  if (status === 'yellow') return 'yellow'
  if (status === 'normal') return 'green'
  return 'green'
}

/** 单条睡眠记录评估（用于当日/近7日） */
export function evaluateSleepRow(row: DailyWatchRow): MetricEvaluation[] {
  const d = computeDerived(row)
  const out: MetricEvaluation[] = []
  if (row.sleepHours != null) {
    let status: MetricStatus = 'normal'
    let risk = ''
    if (row.sleepHours < 6) {
      status = 'yellow'
      risk = '总睡眠 <6h（长期 HR 1.12-1.30）'
    } else if (row.sleepHours > 9) {
      status = 'yellow'
      risk = '总睡眠 >9h（U 形关系）'
    }
    out.push({
      key: 'sleepHours',
      name: '睡眠时长',
      unit: 'h',
      reliability: 'trend_only',
      status,
      detail: `${row.sleepHours.toFixed(1)} h`,
      risk,
      evidence: 'strong',
      avg7d: row.sleepHours,
    })
  }
  if (d.deepSleepPct != null) {
    out.push({
      key: 'deepSleepPct',
      name: '深睡比例',
      unit: '%',
      reliability: 'trend_only',
      status: d.deepSleepPct < 15 ? 'yellow' : 'normal',
      detail: `${d.deepSleepPct.toFixed(0)}%`,
      risk: d.deepSleepPct < 15 ? '深睡 <15%（AW 可能低估）' : '',
      evidence: 'heuristic',
      avg7d: d.deepSleepPct,
    })
  }
  if (d.sleepEfficiency != null) {
    out.push({
      key: 'sleepEfficiency',
      name: '睡眠效率',
      unit: '%',
      reliability: 'trend_only',
      status: d.sleepEfficiency < 85 ? 'yellow' : 'normal',
      detail: `${d.sleepEfficiency.toFixed(0)}%`,
      risk: d.sleepEfficiency < 85 ? '睡眠效率 <85%' : '',
      evidence: 'moderate',
      avg7d: d.sleepEfficiency,
    })
  }
  return out
}
