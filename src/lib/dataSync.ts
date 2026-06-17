import type { DailyWatchRow } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { DietHistoryPattern } from '../services/dietHistory'

export const EXPORT_VERSION = 1 as const

export interface SubhealthExportV1 {
  version: typeof EXPORT_VERSION
  exportedAt: string
  voiceLogs: VoiceExtraction[]
  watchRows?: DailyWatchRow[]
  dietHistory?: DietHistoryPattern[]
}

export interface ImportSyncResult {
  voiceLogsAdded: number
  voiceLogsUpdated: number
  watchRowsImported: number
  dietHistoryMerged: number
}

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

/** Parse export JSON from Web or legacy format (no version field). */
export function parseSubhealthExport(raw: unknown): SubhealthExportV1 {
  if (!raw || typeof raw !== 'object') {
    throw new Error('无效的文件格式')
  }
  const data = raw as Partial<SubhealthExportV1> & {
    voiceLogs?: unknown
    watchRows?: unknown
    dietHistory?: unknown
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

  return {
    version: EXPORT_VERSION,
    exportedAt:
      typeof data.exportedAt === 'string'
        ? data.exportedAt
        : new Date().toISOString(),
    voiceLogs,
    watchRows,
    dietHistory,
  }
}

export function buildSubhealthExport(input: {
  voiceLogs: VoiceExtraction[]
  watchRows?: DailyWatchRow[]
  dietHistory?: DietHistoryPattern[]
}): SubhealthExportV1 {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    voiceLogs: input.voiceLogs,
    watchRows: input.watchRows,
    dietHistory: input.dietHistory,
  }
}
