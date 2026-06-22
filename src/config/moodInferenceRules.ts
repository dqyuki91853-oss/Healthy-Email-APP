/**
 * 情绪推断规则表骨架 — 详见 docs/mood-inference-rules.md
 * 引擎实现：src/engine/moodInference.ts（待建）
 */
import type { MoodTag } from '../types/mood'
import type { WuyinToneId } from '../types/tcm'

export const MOOD_INFERENCE_THRESHOLDS = {
  /** 低于此加权分 → dominant = unknown */
  MIN_DOMINANT_SCORE: 30,
  SLEEP_SHORT_H: 6.0,
  SLEEP_BORDERLINE_H: 6.5,
  SLEEP_OK_H: 7.0,
  HRV_LOW_RATIO: 0.85,
  HRV_VERY_LOW_RATIO: 0.75,
  RHR_ELEVATED_BPM: 5,
  RHR_HIGH_BPM: 8,
  AWAKE_HIGH: 5,
  EXERCISE_HIGH_MIN: 60,
  STEPS_LOW_RATIO: 0.6,
} as const

export interface MoodInferenceRule {
  ruleId: string
  moodTag: MoodTag
  weight: number
  confidence: 'high' | 'medium' | 'low'
  citationIds: string[]
  conditionDescription: string
  gentleNote?: string
}

export const MOOD_GENTLE_NOTES: Partial<Record<MoodTag, string>> = {
  anxiety: '身体今天有点像「心里下着小雨」，不一定是坏事，慢一点的节奏也可以。',
  low_mood: '这几天节奏重了一点，允许自己轻一点。',
  irritable: '睡眠和心跳都在提醒你：今天适合少较劲。',
  fatigue: '昨天很努力，今天值得多休息一会儿。',
  calm: '今天状态比较稳，很好。',
}

export const MOOD_INFERENCE_RULES: MoodInferenceRule[] = [
  {
    ruleId: 'MOOD-sleep_anxiety-01',
    moodTag: 'anxiety',
    weight: 40,
    confidence: 'medium',
    citationIds: ['SLEEP-ANX-001'],
    conditionDescription: 'sleepHours < 6 AND hrvRatio < 0.85',
  },
  {
    ruleId: 'MOOD-sleep_anxiety-02',
    moodTag: 'anxiety',
    weight: 35,
    confidence: 'medium',
    citationIds: ['SLEEP-ANX-001'],
    conditionDescription: 'sleepHours < 6.5 for 2 consecutive days',
  },
  {
    ruleId: 'MOOD-rhr_stress-01',
    moodTag: 'anxiety',
    weight: 30,
    confidence: 'medium',
    citationIds: ['RHR-SLEEP-001', 'HRV-STRESS-001'],
    conditionDescription: 'rhrDelta >= 8 for 2 consecutive days',
  },
  {
    ruleId: 'MOOD-rhr_irritable-01',
    moodTag: 'irritable',
    weight: 25,
    confidence: 'low',
    citationIds: [],
    conditionDescription: 'rhrDelta >= 5 AND sleepHours < 7 AND hrvRatio < 0.90',
  },
  {
    ruleId: 'MOOD-hrv_low_lowmood-01',
    moodTag: 'low_mood',
    weight: 25,
    confidence: 'low',
    citationIds: [],
    conditionDescription: 'hrvRatio < 0.75 AND steps < baseline*0.6 for 2 days',
  },
  {
    ruleId: 'MOOD-exercise_fatigue-01',
    moodTag: 'fatigue',
    weight: 20,
    confidence: 'medium',
    citationIds: ['RECOVERY-HRV-001'],
    conditionDescription: 'yesterdayExercise >= 60 AND hrvRatio < 0.85',
  },
  {
    ruleId: 'MOOD-awake_anxiety-01',
    moodTag: 'anxiety',
    weight: 20,
    confidence: 'low',
    citationIds: [],
    conditionDescription: 'awakeEpisodes >= 5 AND sleepHours < 7',
  },
  {
    ruleId: 'MOOD-calm-01',
    moodTag: 'calm',
    weight: 30,
    confidence: 'medium',
    citationIds: [],
    conditionDescription: 'hrvRatio >= 0.95 AND sleepHours >= 7 AND no negative voice',
  },
]

/** moodTag → 默认五音，详见 wuyinToneMap.ts */
export const MOOD_TO_WUYIN: Partial<Record<MoodTag, WuyinToneId>> = {
  fatigue: 'gong',
  low_mood: 'shang',
  irritable: 'jue',
  anxiety: 'zhi',
  calm: 'yu',
}
