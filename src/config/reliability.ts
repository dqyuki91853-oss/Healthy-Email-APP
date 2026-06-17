import type { ReliabilityLevel } from '../types/health'

export interface MetricReliability {
  key: string
  label: string
  healthKitType: string
  reliability: ReliabilityLevel
  awNote?: string
}

export const METRIC_RELIABILITY: MetricReliability[] = [
  {
    key: 'restingHr',
    label: '静息心率',
    healthKitType: 'HKQuantityTypeIdentifierRestingHeartRate',
    reliability: 'reliable',
  },
  {
    key: 'hrvSdnn',
    label: 'HRV (SDNN)',
    healthKitType: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
    reliability: 'trend_only',
    awNote: 'AW 为短时程 PPG/PRV，非 24h SDNN；仅看个人基线趋势',
  },
  {
    key: 'spo2',
    label: '血氧 SpO₂',
    healthKitType: 'HKQuantityTypeIdentifierOxygenSaturation',
    reliability: 'trend_only',
    awNote: '低氧区 (<90%) AW 偏差约 5%，离群值可达 15%',
  },
  {
    key: 'vo2max',
    label: 'VO₂ max',
    healthKitType: 'HKQuantityTypeIdentifierVO2Max',
    reliability: 'trend_only',
    awNote: '系统性低估约 4-8.5 mL/kg/min，仅看逐年趋势',
  },
  {
    key: 'dailySteps',
    label: '步数',
    healthKitType: 'HKQuantityTypeIdentifierStepCount',
    reliability: 'reliable',
  },
  {
    key: 'sleep',
    label: '睡眠',
    healthKitType: 'HKCategoryTypeIdentifierSleepAnalysis',
    reliability: 'trend_only',
    awNote: '深睡平均低估约 43 分钟，浅睡高估约 45 分钟',
  },
  {
    key: 'cardioRecovery',
    label: '心率恢复',
    healthKitType: 'HKQuantityTypeIdentifierHeartRateRecoveryOneMinute',
    reliability: 'reliable',
    awNote: '低中强度运动后可靠；与临床分级运动试验阈值不可直接换算',
  },
  {
    key: 'respiratoryRate',
    label: '呼吸频率',
    healthKitType: 'HKQuantityTypeIdentifierRespiratoryRate',
    reliability: 'unreliable',
    awNote: '不可用于决策，仅参考',
  },
  {
    key: 'wristTemp',
    label: '手腕温度',
    healthKitType: 'HKQuantityTypeIdentifierAppleSleepingWristTemperature',
    reliability: 'trend_only',
    awNote: '仅相对偏移，非临床体温计',
  },
  {
    key: 'exerciseMinutes',
    label: '运动分钟',
    healthKitType: 'HKQuantityTypeIdentifierAppleExerciseTime',
    reliability: 'reliable',
  },
  {
    key: 'environmentalNoise',
    label: '环境噪声',
    healthKitType: 'HKQuantityTypeIdentifierEnvironmentalSoundPressureLevel',
    reliability: 'trend_only',
  },
  {
    key: 'daylight',
    label: '日照时间',
    healthKitType: 'HKQuantityTypeIdentifierTimeInDaylight',
    reliability: 'reliable',
  },
  {
    key: 'walkingSteadiness',
    label: '步态稳定性',
    healthKitType: 'HKCategoryTypeIdentifierAppleWalkingSteadiness',
    reliability: 'trend_only',
    awNote: '分类：Normal / Low / Very Low，中等精度筛查',
  },
  {
    key: 'walkingAsymmetry',
    label: '步态不对称',
    healthKitType: 'HKQuantityTypeIdentifierWalkingAsymmetryPercentage',
    reliability: 'trend_only',
  },
]

export function getReliability(key: string): MetricReliability | undefined {
  return METRIC_RELIABILITY.find((m) => m.key === key)
}

export const RELIABILITY_LABELS: Record<ReliabilityLevel, { dot: string; label: string }> = {
  reliable: { dot: '🟢', label: '可靠' },
  trend_only: { dot: '🟡', label: '仅趋势可靠' },
  unreliable: { dot: '🔴', label: '不可用于决策' },
}
