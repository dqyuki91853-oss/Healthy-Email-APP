import type { EvidenceLevel } from '../types/health'

export interface MetricThresholdDef {
  key: string
  name: string
  unit: string
  reliability: 'reliable' | 'trend_only' | 'unreliable'
  normal: string
  yellow?: { threshold: number | [number, number]; risk: string; evidence: EvidenceLevel; below?: boolean }
  red?: { threshold: number | [number, number]; risk: string; evidence: EvidenceLevel; below?: boolean }
  trendYellow?: { delta: number; risk: string }
  trendRed?: { delta: number; risk: string }
}

/** 与阈值 doc / notebook THRESHOLDS 一致的可执行定义 */
export const METRIC_THRESHOLDS: MetricThresholdDef[] = [
  {
    key: 'restingHr',
    name: '静息心率',
    unit: 'bpm',
    reliability: 'reliable',
    normal: '60-80 bpm',
    yellow: { threshold: 80, risk: '全因死亡 HR=1.43', evidence: 'strong' },
    red: { threshold: 85, risk: '高 CV 风险', evidence: 'strong' },
    trendYellow: { delta: 5, risk: '死亡风险 +12%' },
    trendRed: { delta: 10, risk: '显著 CV 恶化' },
  },
  {
    key: 'cardioRecovery1min',
    name: '心率恢复 1min',
    unit: 'bpm',
    reliability: 'reliable',
    normal: '≥12 bpm',
    yellow: { threshold: 12, risk: '死亡风险 ~4x', evidence: 'strong', below: true },
    red: { threshold: 8, risk: '极高 CV 死亡风险', evidence: 'strong', below: true },
  },
  {
    key: 'dailySteps',
    name: '日均步数',
    unit: '步',
    reliability: 'reliable',
    normal: '≥8,000（<60岁）',
    yellow: { threshold: 5000, risk: '活动不足', evidence: 'strong', below: true },
    red: { threshold: 3143, risk: '显著死亡风险提升', evidence: 'strong', below: true },
  },
  {
    key: 'daylightMinutes',
    name: '日照时间',
    unit: 'min',
    reliability: 'reliable',
    normal: '≥30 分钟',
    yellow: { threshold: 15, risk: '维生素D/昼夜节律紊乱', evidence: 'moderate', below: true },
  },
  {
    key: 'hrvSdnn',
    name: 'HRV (SDNN)',
    unit: 'ms',
    reliability: 'trend_only',
    normal: '>50 ms（24h 参考）',
    yellow: { threshold: [30, 50], risk: '中等 CV 风险（AW 仅趋势）', evidence: 'strong' },
    red: { threshold: 30, risk: '高 CV 风险 ~5x（AW 仅趋势）', evidence: 'strong', below: true },
  },
  {
    key: 'vo2max',
    name: 'VO₂ max',
    unit: 'mL/kg/min',
    reliability: 'trend_only',
    normal: '≥36（45岁男，AW 低估）',
    yellow: { threshold: 15, risk: '约 20x 死亡风险', evidence: 'strong', below: true },
    red: { threshold: 10, risk: '极度危险', evidence: 'strong', below: true },
  },
  {
    key: 'wristTempRaw',
    name: '手腕温度',
    unit: '°C',
    reliability: 'trend_only',
    normal: '相对偏移 <0.3°C',
    yellow: { threshold: 0.3, risk: '炎症/排卵/感染可能', evidence: 'strong' },
    red: { threshold: 0.5, risk: '感染信号', evidence: 'moderate' },
  },
  {
    key: 'spo2NightAvg',
    name: '血氧 SpO₂',
    unit: '%',
    reliability: 'unreliable',
    normal: '95-100%',
    yellow: { threshold: [90, 94], risk: '轻度低氧（AW 精度有限）', evidence: 'strong' },
    red: { threshold: 90, risk: '急性低氧性呼吸衰竭', evidence: 'moderate', below: true },
  },
  {
    key: 'respiratoryRateSleep',
    name: '睡眠呼吸频率',
    unit: '次/分',
    reliability: 'unreliable',
    normal: '12-20',
    yellow: { threshold: 21, risk: '轻度呼吸急促', evidence: 'heuristic' },
    red: { threshold: 25, risk: '呼吸窘迫', evidence: 'moderate' },
  },
  {
    key: 'environmentalNoiseDb',
    name: '环境噪声',
    unit: 'dB',
    reliability: 'trend_only',
    normal: '<50 dB',
    yellow: { threshold: 53, risk: 'MI 风险 ~1.06/10dB', evidence: 'moderate' },
    red: { threshold: 80, risk: '听力保护触发', evidence: 'strong' },
  },
  {
    key: 'activeEnergyKcal',
    name: '活动能量',
    unit: 'kcal',
    reliability: 'reliable',
    normal: '≥300 kcal',
    yellow: { threshold: 200, risk: '活动不足', evidence: 'moderate', below: true },
    red: { threshold: 100, risk: '严重静坐', evidence: 'moderate', below: true },
  },
  {
    key: 'sleepHours',
    name: '睡眠时长',
    unit: 'h',
    reliability: 'trend_only',
    normal: '7-8h',
    yellow: { threshold: 6, risk: '全因死亡率升高 HR 1.12-1.30', evidence: 'strong', below: true },
    red: { threshold: 9, risk: 'U 形关系 HR 1.30+', evidence: 'strong' },
  },
  {
    key: 'sleepEfficiency',
    name: '睡眠效率',
    unit: '%',
    reliability: 'trend_only',
    normal: '≥85%',
    yellow: { threshold: 85, risk: '碎片化睡眠', evidence: 'moderate', below: true },
  },
  {
    key: 'deepSleepPct',
    name: '深睡比例',
    unit: '%',
    reliability: 'trend_only',
    normal: '15-23%（成人）',
    yellow: { threshold: 15, risk: '可能提示抑郁/睡眠呼吸暂停', evidence: 'heuristic', below: true },
  },
]
