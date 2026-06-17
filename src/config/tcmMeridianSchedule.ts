/**
 * 子午流注时辰表骨架 — 详见 docs/ziwu-liuzhu-rules.md
 */
import type { MeridianWindow } from '../types/tcm'

export const TCM_CIRCADIAN_DEFAULTS = {
  /** personalSleepGate = personalSleepOnset - offsetMinutes */
  SLEEP_GATE_OFFSET_MIN: 90,
  FALLBACK_SLEEP_ONSET: '23:00',
  ONSET_ON_TRACK_TOLERANCE_MIN: 45,
} as const

/** 默认只在前台高亮这些 windowId */
export const TCM_HIGHLIGHT_WINDOWS = ['W-亥', 'W-子'] as const

export const TCM_MERIDIAN_SCHEDULE: MeridianWindow[] = [
  {
    windowId: 'W-亥',
    label: '亥时',
    hourStart: 21,
    hourEnd: 23,
    meridianLabel: '三焦',
    modernProxy: 'wind_down',
    suggestionText: '少进食、少屏幕，让身体慢慢收工。',
    citationIds: ['TCM-ZIWU-001'],
  },
  {
    windowId: 'W-子',
    label: '子时',
    hourStart: 23,
    hourEnd: 1,
    meridianLabel: '胆',
    modernProxy: 'sleep_gate',
    suggestionText: '尽量靠近你的个人入睡窗口。',
    citationIds: ['TCM-ZIWU-001', 'TEMP-SLEEP-001'],
  },
  {
    windowId: 'W-丑',
    label: '丑时',
    hourStart: 1,
    hourEnd: 3,
    meridianLabel: '肝',
    modernProxy: 'deep_sleep',
    suggestionText: '深睡阶段，尽量不被打断。',
    citationIds: ['TCM-ZIWU-001'],
  },
  {
    windowId: 'W-寅',
    label: '寅时',
    hourStart: 3,
    hourEnd: 5,
    meridianLabel: '肺',
    modernProxy: 'deep_sleep',
    suggestionText: '继续休息。',
    citationIds: ['TCM-ZIWU-001'],
  },
  {
    windowId: 'W-卯',
    label: '卯时',
    hourStart: 5,
    hourEnd: 7,
    meridianLabel: '大肠',
    modernProxy: 'gentle_wake',
    suggestionText: '缓慢醒来、补水。',
    citationIds: ['TCM-ZIWU-001'],
  },
]

export interface TcmCircadianRule {
  ruleId: string
  conditionDescription: string
  citationIds: string[]
}

export const TCM_CIRCADIAN_RULES: TcmCircadianRule[] = [
  {
    ruleId: 'TCM-sleep-onset-01',
    conditionDescription: 'median sleep segment start over 14 days',
    citationIds: ['TEMP-SLEEP-001'],
  },
  {
    ruleId: 'TCM-sleep-onset-fallback',
    conditionDescription: 'no segment data → default 23:00, confidence low',
    citationIds: [],
  },
  {
    ruleId: 'TCM-sleep-gate-01',
    conditionDescription: 'personalSleepGate = personalSleepOnset - 90min',
    citationIds: ['TCM-ZIWU-001'],
  },
]
