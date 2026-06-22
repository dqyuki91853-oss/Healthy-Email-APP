import type { UserProfile } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { DailyWatchRow } from '../types/health'
import type { DietHistoryPattern } from '../services/dietHistory'
import type { BloodPressureReading } from '../types/bloodPressure'

export const EXPORT_VERSION = 1 as const

/** localStorage keys bundled for Web ↔ App migration */
export interface SubhealthLocalPrefs {
  seedId?: string | null
  wuyinListeningPrefs?: string | null
  wuyinPractice?: string | null
  weeklyLetterCache?: string | null
  advancedMode?: string | null
  lastSeenLetterV3?: string | null
  [key: string]: string | null | undefined
}

export interface SubhealthExportV1 {
  version: typeof EXPORT_VERSION
  exportedAt: string
  voiceLogs: VoiceExtraction[]
  watchRows?: DailyWatchRow[]
  dietHistory?: DietHistoryPattern[]
  bloodPressureReadings?: BloodPressureReading[]
  profile?: UserProfile
  localPrefs?: SubhealthLocalPrefs
}

export interface ImportSyncResult {
  voiceLogsAdded: number
  voiceLogsUpdated: number
  watchRowsImported: number
  dietHistoryMerged: number
  bpMerged: number
  prefsRestored: boolean
}

const PREFS_KEYS = [
  'subhealth_seed_id',
  'subhealth_wuyin_listening_prefs',
  'subhealth_wuyin_practice',
  'subhealth_weekly_letter',
  'subhealth_letter_archive',
  'subhealth_tea_collection',
  'subhealth_plant_journal',
  'subhealth_body_replies',
  'subhealth_bp_readings',
  'subhealth_chronicle_prefs',
  'subhealth_advanced_mode',
  'subhealth_last_seen_letter_v3',
  'subhealth_chronicle_notification_prefs',
] as const

function isVoiceLog(value: unknown): value is VoiceExtraction {
  if (!value || typeof value !== 'object') return false
  const v = value as VoiceExtraction
  return (
    typeof v.id === 'string' &&
    typeof v.timestamp === 'string' &&
    Array.isArray(v.foods) &&
    typeof v.transcript === 'string'
  )
}

export function collectLocalPrefs(): SubhealthLocalPrefs {
  const prefs: SubhealthLocalPrefs = {}
  for (const key of PREFS_KEYS) {
    prefs[key] = localStorage.getItem(key)
  }
  return prefs
}

export function restoreLocalPrefs(prefs?: SubhealthLocalPrefs): boolean {
  if (!prefs) return false
  let restored = false
  for (const [key, value] of Object.entries(prefs)) {
    if (value == null) continue
    localStorage.setItem(key, value)
    restored = true
  }
  return restored
}

/** Parse export JSON from Web or legacy format (no version field). */
export function parseSubhealthExport(raw: unknown): SubhealthExportV1 {
  if (!raw || typeof raw !== 'object') {
    throw new Error('无效的文件格式')
  }
  const data = raw as Partial<SubhealthExportV1> & {
    voiceLogs?: unknown
    watchRows?: unknown
    dietHistory?: unknown
    bloodPressureReadings?: unknown
    /** @deprecated 旧版血糖字段，已忽略 */
    glucoseReadings?: unknown
    profile?: unknown
    localPrefs?: unknown
  }

  if (!Array.isArray(data.voiceLogs)) {
    throw new Error('文件中未找到饮食记录（voiceLogs）')
  }

  const voiceLogs = data.voiceLogs.filter(isVoiceLog)
  if (voiceLogs.length === 0 && data.voiceLogs.length > 0) {
    throw new Error('饮食记录格式无法识别')
  }

  const watchRows = Array.isArray(data.watchRows)
    ? (data.watchRows as DailyWatchRow[])
    : undefined

  const dietHistory = Array.isArray(data.dietHistory)
    ? (data.dietHistory as DietHistoryPattern[])
    : undefined

  const bloodPressureReadings = Array.isArray(data.bloodPressureReadings)
    ? (data.bloodPressureReadings as BloodPressureReading[])
    : undefined

  const profile =
    data.profile && typeof data.profile === 'object'
      ? (data.profile as UserProfile)
      : undefined

  const localPrefs =
    data.localPrefs && typeof data.localPrefs === 'object'
      ? (data.localPrefs as SubhealthLocalPrefs)
      : undefined

  return {
    version: EXPORT_VERSION,
    exportedAt:
      typeof data.exportedAt === 'string'
        ? data.exportedAt
        : new Date().toISOString(),
    voiceLogs,
    watchRows,
    dietHistory,
    bloodPressureReadings,
    profile,
    localPrefs,
  }
}

export function buildSubhealthExport(input: {
  voiceLogs: VoiceExtraction[]
  watchRows?: DailyWatchRow[]
  dietHistory?: DietHistoryPattern[]
  bloodPressureReadings?: BloodPressureReading[]
  profile?: UserProfile
  includeLocalPrefs?: boolean
}): SubhealthExportV1 {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    voiceLogs: input.voiceLogs,
    watchRows: input.watchRows,
    dietHistory: input.dietHistory,
    bloodPressureReadings: input.bloodPressureReadings,
    profile: input.profile,
    localPrefs: input.includeLocalPrefs !== false ? collectLocalPrefs() : undefined,
  }
}

export const APP_SYNC_PATH = '/data/app-sync.json'
export const APP_SYNC_APPLIED_KEY = 'subhealth_app_sync_applied_at'
