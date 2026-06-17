/** 情绪推断标签 — 与 docs/mood-inference-rules.md 对齐 */
export type MoodTag =
  | 'anxiety'
  | 'low_mood'
  | 'irritable'
  | 'fatigue'
  | 'fearful'
  | 'calm'
  | 'unknown'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type MoodSource = 'voice' | 'inferred' | 'mixed' | 'unknown'

export interface MoodInferenceResult {
  date: string
  dominant: MoodTag
  confidence: ConfidenceLevel
  source: MoodSource
  matchedRuleIds: string[]
  gentleNote?: string
  scores?: Partial<Record<MoodTag, number>>
}

/** llm.ts EMOTION_KEYWORDS → MoodTag */
export const VOICE_EMOTION_TO_MOOD: Record<string, MoodTag> = {
  焦虑: 'anxiety',
  低落: 'low_mood',
  易怒: 'irritable',
  平静: 'calm',
}
