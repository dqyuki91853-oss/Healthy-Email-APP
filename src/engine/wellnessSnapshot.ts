import type { DailyWatchRow, PersonalBaseline } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { WellnessSnapshot } from '../types/wellness'
import {
  buildWellnessSignals,
  getYesterdayRow,
  pickLatestWatchDay,
  todayDateStr,
} from '../lib/wellnessSignals'
import { computeBodyWeather } from './bodyWeather'
import { computeMoodInference } from './moodInference'
import { computeWuyinPrescription } from './wuyinPrescription'
import { computePersonalCircadian } from './tcmCircadian'
import { computeWuyinListeningWindow } from './wuyinListeningWindow'
import { practicedWuyinToday } from '../lib/wuyinPracticeStreak'

export function buildWellnessSnapshot(
  rows: DailyWatchRow[],
  baselines: PersonalBaseline[],
  voiceLogs: VoiceExtraction[],
  date?: string,
): WellnessSnapshot | null {
  const targetDate = date ?? pickLatestWatchDay(rows)?.date ?? todayDateStr()
  const todayRow = rows.find((r) => r.date === targetDate)
  if (!todayRow) return null

  const yesterday = getYesterdayRow(rows, targetDate)
  const signals = buildWellnessSignals(todayRow, yesterday, baselines)
  const bodyWeather = computeBodyWeather(signals)
  const mood = computeMoodInference(rows, baselines, voiceLogs, targetDate)
  const wuyin = computeWuyinPrescription(mood, bodyWeather)
  const circadian = computePersonalCircadian(rows)
  const listeningWindow = computeWuyinListeningWindow(circadian, wuyin, {
    practicedToday: practicedWuyinToday(),
  })

  return {
    date: targetDate,
    bodyWeather,
    mood,
    wuyin,
    circadian,
    listeningWindow,
  }
}
