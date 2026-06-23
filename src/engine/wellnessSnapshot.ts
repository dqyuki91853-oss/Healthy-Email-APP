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
import { computeDailyBrief } from './dailyBrief'
import { computeInnerClimate } from './innerClimate'
import { computeMoodInference } from './moodInference'
import { computeWuyinPrescription } from './wuyinPrescription'
import { computePersonalCircadian } from './tcmCircadian'
import { computeWuyinListeningWindow } from './wuyinListeningWindow'
import { discoverPatterns } from './patternDiscovery'
import { computeBodySeason } from './bodySeason'
import { practicedWuyinToday } from '../lib/wuyinPracticeStreak'
import { getWuyinListeningPrefs } from '../lib/wuyinListeningPrefs'
import { loadCaseFiles, saveCaseFiles, visibleCaseFiles } from '../lib/caseFileStore'
import { loadChroniclePrefs, persistBodySeason } from '../lib/chroniclePrefs'
import { loadBloodPressureReadings } from '../lib/bloodPressureStore'
import { computeBpAdvisory } from './bpAdvisory'

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
  const listeningPrefs = getWuyinListeningPrefs()
  const listeningWindow = computeWuyinListeningWindow(circadian, wuyin, {
    practicedToday: practicedWuyinToday(),
    gateLeadMin: listeningPrefs.gateLeadMin,
  })
  const bpReadings = loadBloodPressureReadings()
  const bpAdvisory = computeBpAdvisory(bpReadings, voiceLogs, rows, targetDate)
  const innerClimate = computeInnerClimate(signals, voiceLogs, bpReadings, bpAdvisory)
  const dailyBrief = computeDailyBrief(
    signals,
    bodyWeather,
    innerClimate,
    mood,
    wuyin,
    circadian,
    rows,
    baselines,
    voiceLogs,
    bpReadings,
    bpAdvisory,
  )

  const existingCases = loadCaseFiles()
  const discovery = discoverPatterns(rows, voiceLogs, existingCases, targetDate)
  if (discovery.newCases.length > 0) {
    saveCaseFiles(discovery.activeCases)
  }
  const caseFiles = visibleCaseFiles(discovery.activeCases)

  const chroniclePrefs = loadChroniclePrefs()
  const bodySeason = computeBodySeason(rows, baselines, chroniclePrefs.seasonId, targetDate, {
    wuyinLabel: wuyin?.label ?? null,
    sleepGate: circadian.personalSleepGate,
    bpAdvisory,
  })
  if (bodySeason) {
    persistBodySeason(bodySeason)
  }

  return {
    date: targetDate,
    bodyWeather,
    mood,
    wuyin,
    circadian,
    listeningWindow,
    innerClimate,
    dailyBrief,
    caseFiles,
    bodySeason,
    bpAdvisory,
  }
}
