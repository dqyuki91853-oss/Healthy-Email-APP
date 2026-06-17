import type { EvidenceLevel } from '../types/health'

export interface ThresholdEntry {
  condition: string
  meaning: string
  evidence: EvidenceLevel
}

export const RHR_THRESHOLDS: ThresholdEntry[] = [
  { condition: 'RHR > 80 bpm（持续）', meaning: '全因死亡风险显著升高（HR 1.43 vs <65）', evidence: 'strong' },
  { condition: 'RHR 升高 ≥5 bpm（长期）', meaning: '全因死亡率 +12%，心血管死亡率 +13%', evidence: 'strong' },
  { condition: 'RHR < 60 bpm（持续无症状）', meaning: '更多与高健身水平相关', evidence: 'moderate' },
  { condition: 'RHR 升高 ≥10 bpm（短期急性）', meaning: '提示感染前驱/炎症反应', evidence: 'moderate' },
  { condition: '年龄-性别 RHR 百分位 > 95th', meaning: '独立心血管危险因素', evidence: 'strong' },
]

export const HRV_THRESHOLDS: ThresholdEntry[] = [
  { condition: '24h SDNN < 50 ms', meaning: '心血管高危', evidence: 'strong' },
  { condition: '24h SDNN 50-100 ms', meaning: '中等风险区间', evidence: 'moderate' },
  { condition: '24h SDNN > 100 ms', meaning: '保护性特征', evidence: 'strong' },
  { condition: 'SDNN 纵向下降 > 20%', meaning: '自主神经功能减退（参考方向）', evidence: 'heuristic' },
]

export const SPO2_THRESHOLDS: ThresholdEntry[] = [
  { condition: 'SpO₂ 95-100%', meaning: '正常', evidence: 'strong' },
  { condition: 'SpO₂ 90-94%', meaning: '轻度低氧，值得关注', evidence: 'strong' },
  { condition: 'SpO₂ 85-89%', meaning: '中度低氧', evidence: 'strong' },
  { condition: 'SpO₂ < 85%', meaning: '重度低氧', evidence: 'strong' },
  { condition: '夜间最低 < 88%', meaning: 'COPD 长期氧疗获益可能指征', evidence: 'moderate' },
]

export const VO2_THRESHOLDS: ThresholdEntry[] = [
  { condition: 'VO₂ max < 15 mL/kg/min', meaning: '最高死亡风险', evidence: 'strong' },
  { condition: 'VO₂ max ≤ 16 mL/kg/min', meaning: '全因死亡强独立预测因子', evidence: 'strong' },
  { condition: '每 1 MET 升高', meaning: '全因死亡率约降低 14%', evidence: 'strong' },
  { condition: '纵向下降 ≥1 MET', meaning: '死亡风险显著上升', evidence: 'moderate' },
]

export const SLEEP_THRESHOLDS: ThresholdEntry[] = [
  { condition: '总睡眠 < 6h（长期）', meaning: '全因死亡率升高', evidence: 'strong' },
  { condition: '总睡眠 7-8h', meaning: 'U 形谷底，最低死亡率', evidence: 'strong' },
  { condition: '总睡眠 > 9h（长期）', meaning: '死亡率同样升高', evidence: 'strong' },
  { condition: '深睡 15-23%（成人）', meaning: '正常范围', evidence: 'strong' },
  { condition: '睡眠效率 < 85%', meaning: '碎片化睡眠', evidence: 'moderate' },
  { condition: '入睡潜伏期 > 30min', meaning: '入睡困难', evidence: 'strong' },
]

export const STEPS_THRESHOLDS: ThresholdEntry[] = [
  { condition: '≥3,143 步/天', meaning: '死亡风险统计学显著降低最低门槛', evidence: 'strong' },
  { condition: '每 +1,000 步/天', meaning: '全因死亡 HR 0.91', evidence: 'strong' },
  { condition: '6,000-8,000 步/天（≥60岁）', meaning: '死亡率收益平台期', evidence: 'strong' },
  { condition: '8,000-10,000 步/天（<60岁）', meaning: '死亡率收益平台期', evidence: 'strong' },
]

export const EVIDENCE_LABELS: Record<EvidenceLevel, { icon: string; label: string }> = {
  strong: { icon: '🏥', label: '强证据' },
  moderate: { icon: '📊', label: '中等证据' },
  heuristic: { icon: '💡', label: '参考方向' },
}

// Numeric reference lines for charts (from published thresholds)
export const CHART_REFERENCE_LINES = {
  rhr: [
    { value: 80, label: '80 bpm', evidence: 'strong' as EvidenceLevel },
    { value: 65, label: '65 bpm', evidence: 'strong' as EvidenceLevel },
  ],
  steps: [
    { value: 3143, label: '3,143', evidence: 'strong' as EvidenceLevel },
    { value: 8000, label: '8,000', evidence: 'strong' as EvidenceLevel },
  ],
  sleepHours: [
    { value: 6, label: '6h', evidence: 'strong' as EvidenceLevel },
    { value: 7, label: '7h', evidence: 'strong' as EvidenceLevel },
    { value: 9, label: '9h', evidence: 'strong' as EvidenceLevel },
  ],
  spo2: [
    { value: 95, label: '95%', evidence: 'strong' as EvidenceLevel },
    { value: 90, label: '90%', evidence: 'strong' as EvidenceLevel },
  ],
}
