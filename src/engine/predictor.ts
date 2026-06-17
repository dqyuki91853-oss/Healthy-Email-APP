import { v4 as uuid } from './uuid'
import type { DailyWatchRow, PersonalBaseline, UserProfile } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { HealthAlert, SubhealthDirection } from '../types/alerts'
import { ALERT_DISCLAIMER } from '../types/alerts'
import type { DirectionScore, MetricEvaluation, PredictionSnapshot } from '../types/prediction'
import {
  buildDietContext,
  computeOverallLevel,
  scoreAllDirections,
} from './directionScorer'
import { evaluateAllMetrics, statusToLevel } from './metricEvaluator'

const DIRECTION_LABELS: Record<SubhealthDirection, string> = {
  gout: '高尿酸/痛风',
  metabolic: '代谢综合征',
  nafld: '脂肪肝',
  iron_deficiency: '缺铁倾向',
  ibs: '胃肠/不耐受',
  burnout: '职业倦怠',
  mood: '情绪稳定',
  brain_fog: '脑雾',
  women_health: '女性健康',
}

function makeAlert(
  direction: SubhealthDirection,
  level: HealthAlert['level'],
  title: string,
  message: string,
  signals: string[],
  recommendations: string[],
  actionRoute?: string,
  evidenceLevel?: HealthAlert['evidenceLevel'],
  metricKey?: string,
): HealthAlert {
  return {
    id: uuid(),
    direction,
    level,
    title,
    message,
    triggeredSignals: signals,
    recommendations,
    actionRoute,
    evidenceLevel,
    metricKey,
    createdAt: new Date().toISOString(),
    acknowledged: false,
    disclaimer: ALERT_DISCLAIMER,
  }
}

function alertsFromDirection(d: DirectionScore): HealthAlert | null {
  if (d.level === 'green') return null
  const recs = d.recommendation.split(/[；;]/).map((s) => s.trim()).filter(Boolean)
  return makeAlert(
    d.direction,
    d.level,
    `${d.label}风险提示`,
    `${d.label}综合评分 ${d.riskScore}/100，${d.riskItems.length} 项信号异常。本结果为风险筛查，非临床诊断。`,
    d.riskItems,
    recs.length ? recs : [d.recommendation],
    d.actionRoute,
    d.level === 'red' ? 'strong' : d.level === 'orange' ? 'moderate' : 'heuristic',
  )
}

function alertsFromMetric(m: MetricEvaluation): HealthAlert | null {
  if (m.status === 'normal' || m.status === 'no_data') return null
  const level = statusToLevel(m.status)
  const mapRoute: Record<string, string> = {
    restingHr: '/heart',
    hrvSdnn: '/heart',
    cardioRecovery1min: '/heart',
    dailySteps: '/metabolic',
    vo2max: '/metabolic',
    sleepHours: '/sleep',
    deepSleepPct: '/sleep',
    sleepEfficiency: '/sleep',
    spo2NightAvg: '/heart',
  }
  return makeAlert(
    m.key.includes('sleep') ? 'brain_fog' : m.key === 'dailySteps' || m.key === 'vo2max' ? 'metabolic' : 'burnout',
    level === 'red' ? 'red' : 'yellow',
    `${m.name} 阈值关注`,
    m.detail + (m.risk ? ` — ${m.risk}` : ''),
    [m.detail],
    m.risk ? [`建议关注 ${m.name} 变化趋势`, '必要时就医检查'] : ['继续监测个人基线趋势'],
    mapRoute[m.key] ?? '/dashboard',
    m.evidence,
    m.key,
  )
}

export function runPredictionEngine(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  voiceLogs: VoiceExtraction[],
  profile: UserProfile = {},
): HealthAlert[] {
  if (rows.length < 7) return []

  const diet = buildDietContext(voiceLogs)
  const metricEvaluations = evaluateAllMetrics(rows)
  const directionScores = scoreAllDirections(rows, baselines, profile, diet)

  const alerts: HealthAlert[] = []

  for (const d of directionScores) {
    const a = alertsFromDirection(d)
    if (a) alerts.push(a)
  }

  for (const m of metricEvaluations) {
    const a = alertsFromMetric(m)
    if (a && !alerts.some((x) => x.metricKey === m.key)) alerts.push(a)
  }

  // 强证据单指标：RHR >80 独立橙灯
  const rhr = metricEvaluations.find((m) => m.key === 'restingHr')
  if (rhr?.status === 'yellow' || rhr?.status === 'red') {
    if (!alerts.some((a) => a.title.includes('静息心率') && a.level === 'orange')) {
      alerts.push(
        makeAlert(
          'metabolic',
          'orange',
          '静息心率偏高（强证据阈值）',
          '静息心率持续 >80 bpm，建议心血管评估。',
          ['RHR > 80 bpm 持续'],
          ['增加有氧运动', '择期测量血压与血脂', '如持续升高请就医'],
          '/heart',
          'strong',
          'restingHr_strong',
        ),
      )
    }
  }

  return alerts.sort((a, b) => {
    const order = { red: 0, orange: 1, yellow: 2, green: 3 }
    return order[a.level] - order[b.level]
  })
}

export function buildPredictionSnapshot(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  voiceLogs: VoiceExtraction[],
  profile: UserProfile = {},
): PredictionSnapshot {
  const diet = buildDietContext(voiceLogs)
  const metricEvaluations = evaluateAllMetrics(rows)
  const directionScores = scoreAllDirections(rows, baselines, profile, diet)
  const metricReds = metricEvaluations.filter((m) => m.status === 'red').length
  const metricYellows = metricEvaluations.filter((m) => m.status === 'yellow').length

  return {
    metricEvaluations,
    directionScores,
    overallLevel: computeOverallLevel(directionScores, metricReds, metricYellows),
    evaluatedAt: new Date().toISOString(),
  }
}

export { DIRECTION_LABELS }
