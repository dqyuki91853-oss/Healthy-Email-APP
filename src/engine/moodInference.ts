import {
  MOOD_GENTLE_NOTES,
  MOOD_INFERENCE_RULES,
  MOOD_INFERENCE_THRESHOLDS as T,
} from '../config/moodInferenceRules'
import type { DailyWatchRow, PersonalBaseline } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { MoodInferenceResult, MoodTag, ConfidenceLevel } from '../types/mood'
import { VOICE_EMOTION_TO_MOOD } from '../types/mood'
import {
  buildWellnessSignals,
  countConsecutiveDays,
  getYesterdayRow,
} from '../lib/wellnessSignals'

interface MoodContext {
  date: string
  signals: ReturnType<typeof buildWellnessSignals>
  rows: DailyWatchRow[]
  voiceToday: VoiceExtraction[]
  voiceRecent: VoiceExtraction[]
  hasNegativeVoice: boolean
}

function voiceMoodFromLogs(logs: VoiceExtraction[]): MoodTag | null {
  for (const log of logs) {
    for (const e of log.emotions) {
      const mapped = VOICE_EMOTION_TO_MOOD[e]
      if (mapped && mapped !== 'calm') return mapped
    }
  }
  for (const log of logs) {
    for (const e of log.emotions) {
      const mapped = VOICE_EMOTION_TO_MOOD[e]
      if (mapped === 'calm') return 'calm'
    }
  }
  return null
}

function ruleMatches(ruleId: string, ctx: MoodContext, baselines: PersonalBaseline[]): boolean {
  const s = ctx.signals
  const { rows, date } = ctx

  const rhrHighForRow = (row: DailyWatchRow) => {
    const y = getYesterdayRow(rows, row.date)
    const sig = buildWellnessSignals(row, y, baselines)
    return sig.rhrDelta != null && sig.rhrDelta >= T.RHR_HIGH_BPM
  }

  switch (ruleId) {
    case 'MOOD-sleep_anxiety-01':
      return (
        s.sleepHours != null &&
        s.sleepHours < T.SLEEP_SHORT_H &&
        s.hrvRatio != null &&
        s.hrvRatio < T.HRV_LOW_RATIO
      )
    case 'MOOD-sleep_anxiety-02':
      return (
        countConsecutiveDays(
          rows,
          date,
          (r) => r.sleepHours != null && r.sleepHours < T.SLEEP_BORDERLINE_H,
        ) >= 2
      )
    case 'MOOD-rhr_stress-01':
      return countConsecutiveDays(rows, date, rhrHighForRow) >= 2 && s.rhrDelta != null && s.rhrDelta >= T.RHR_HIGH_BPM
    case 'MOOD-rhr_irritable-01':
      return (
        s.rhrDelta != null &&
        s.rhrDelta >= T.RHR_ELEVATED_BPM &&
        s.sleepHours != null &&
        s.sleepHours < T.SLEEP_OK_H &&
        s.hrvRatio != null &&
        s.hrvRatio < 0.9
      )
    case 'MOOD-hrv_low_lowmood-01': {
      const lowMoodRow = (row: DailyWatchRow) => {
        const y = getYesterdayRow(rows, row.date)
        const sig = buildWellnessSignals(row, y, baselines)
        return (
          sig.hrvRatio != null &&
          sig.hrvRatio < T.HRV_VERY_LOW_RATIO &&
          sig.stepsRatio != null &&
          sig.stepsRatio < T.STEPS_LOW_RATIO
        )
      }
      return (
        s.hrvRatio != null &&
        s.hrvRatio < T.HRV_VERY_LOW_RATIO &&
        s.stepsRatio != null &&
        s.stepsRatio < T.STEPS_LOW_RATIO &&
        countConsecutiveDays(rows, date, lowMoodRow) >= 2
      )
    }
    case 'MOOD-exercise_fatigue-01':
      return (
        (s.yesterdayExercise ?? 0) >= T.EXERCISE_HIGH_MIN &&
        s.hrvRatio != null &&
        s.hrvRatio < T.HRV_LOW_RATIO
      )
    case 'MOOD-awake_anxiety-01':
      return (
        (s.awakeEpisodes ?? 0) >= T.AWAKE_HIGH &&
        s.sleepHours != null &&
        s.sleepHours < T.SLEEP_OK_H
      )
    case 'MOOD-calm-01':
      return (
        s.hrvRatio != null &&
        s.hrvRatio >= 0.95 &&
        s.sleepHours != null &&
        s.sleepHours >= T.SLEEP_OK_H &&
        !ctx.hasNegativeVoice
      )
    default:
      return false
  }
}

function confidenceWeight(c: ConfidenceLevel): number {
  return c === 'high' ? 1 : c === 'medium' ? 0.85 : 0.6
}

export function computeMoodInference(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  voiceLogs: VoiceExtraction[],
  date: string,
): MoodInferenceResult {
  const todayRow = rows.find((r) => r.date === date)
  if (!todayRow) {
    return {
      date,
      dominant: 'unknown',
      confidence: 'low',
      source: 'unknown',
      matchedRuleIds: [],
    }
  }

  const yesterday = getYesterdayRow(rows, date)
  const signals = buildWellnessSignals(todayRow, yesterday, baselines)

  const voiceToday = voiceLogs.filter((v) => v.recordDate === date)
  const voiceRecent = voiceLogs.filter((v) => {
    const diff = (new Date(date).getTime() - new Date(v.recordDate).getTime()) / 86400000
    return diff >= 0 && diff <= 2
  })

  const voiceMoodToday = voiceMoodFromLogs(voiceToday)
  const voiceMoodRecent = voiceMoodFromLogs(voiceRecent)

  const hasNegativeVoice = voiceRecent.some((v) =>
    v.emotions.some((e) => ['焦虑', '低落', '易怒'].includes(e)),
  )

  const ctx: MoodContext = {
    date,
    signals,
    rows,
    voiceToday,
    voiceRecent,
    hasNegativeVoice,
  }

  if (voiceMoodToday && voiceMoodToday !== 'unknown') {
    return {
      date,
      dominant: voiceMoodToday,
      confidence: 'high',
      source: 'voice',
      matchedRuleIds: ['MOOD-voice-override'],
      gentleNote: MOOD_GENTLE_NOTES[voiceMoodToday],
    }
  }

  if (voiceMoodRecent && voiceMoodRecent !== 'unknown' && voiceMoodRecent !== 'calm') {
    return {
      date,
      dominant: voiceMoodRecent,
      confidence: 'high',
      source: 'voice',
      matchedRuleIds: ['MOOD-voice-override-recent'],
      gentleNote: MOOD_GENTLE_NOTES[voiceMoodRecent],
    }
  }

  const scores: Partial<Record<MoodTag, number>> = {}

  for (const rule of MOOD_INFERENCE_RULES) {
    if (!ruleMatches(rule.ruleId, ctx, baselines)) continue
    const w = rule.weight * confidenceWeight(rule.confidence)
    scores[rule.moodTag] = (scores[rule.moodTag] ?? 0) + w
  }

  let dominant: MoodTag = 'unknown'
  let topScore = 0
  for (const [tag, score] of Object.entries(scores) as [MoodTag, number][]) {
    if (score > topScore) {
      topScore = score
      dominant = tag
    }
  }

  const matchedRuleIds = MOOD_INFERENCE_RULES.filter((r) => ruleMatches(r.ruleId, ctx, baselines)).map(
    (r) => r.ruleId,
  )

  if (topScore < T.MIN_DOMINANT_SCORE) {
    return {
      date,
      dominant: 'unknown',
      confidence: 'low',
      source: voiceMoodRecent ? 'mixed' : 'inferred',
      matchedRuleIds,
      scores,
    }
  }

  const topRule = MOOD_INFERENCE_RULES.find(
    (r) => r.moodTag === dominant && ruleMatches(r.ruleId, ctx, baselines),
  )

  return {
    date,
    dominant,
    confidence: topRule?.confidence ?? 'medium',
    source: 'inferred',
    matchedRuleIds,
    gentleNote: MOOD_GENTLE_NOTES[dominant],
    scores,
  }
}
