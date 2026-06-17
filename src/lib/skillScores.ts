import type { DailyWatchRow } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import { getRecordDate } from './dates'

export interface SkillScores {
  sleep: number    // avg sleep hours / 8, capped 100%
  exercise: number // avg exercise min / 30, capped 100%
  steps: number    // avg daily steps / 8000, capped 100%
  diet: number     // days with voiceLog / 7, capped 100%
}

export function computeSkillScores(
  watchRows: DailyWatchRow[],
  voiceLogs: VoiceExtraction[],
): SkillScores {
  const recent = watchRows.slice(-7)

  const avgSleep = recent.length
    ? recent.reduce((s, r) => s + (r.sleepHours ?? 0), 0) / recent.length
    : 0
  const avgExercise = recent.length
    ? recent.reduce((s, r) => s + (r.exerciseMinutes ?? 0), 0) / recent.length
    : 0
  const avgSteps = recent.length
    ? recent.reduce((s, r) => s + (r.dailySteps ?? 0), 0) / recent.length
    : 0

  // Days with voice log in last 7 days
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentVoiceDays = new Set(
    voiceLogs
      .filter((l) => {
        const d = getRecordDate(l)
        return d >= sevenDaysAgo.toISOString().slice(0, 10)
      })
      .map((l) => getRecordDate(l)),
  )
  const dietDays = Math.min(recentVoiceDays.size, 7)

  return {
    sleep: Math.min(100, Math.round((avgSleep / 8) * 100)),
    exercise: Math.min(100, Math.round((avgExercise / 30) * 100)),
    steps: Math.min(100, Math.round((avgSteps / 8000) * 100)),
    diet: Math.round((dietDays / 7) * 100),
  }
}
