import Dexie, { type Table } from 'dexie'
import type { DailyWatchRow, PersonalBaseline, UserProfile, HealthImportMeta } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { HealthAlert } from '../types/alerts'

export interface SettingsRecord {
  id: 'default'
  privacyAccepted: boolean
  followUpDailyLimit: number
  followUpAskedToday: number
  followUpDate: string
  /** 按记录日期统计追问次数 YYYY-MM-DD → count */
  followUpCountsByDate?: Record<string, number>
  llmApiKey?: string
  whisperMode: 'local' | 'cloud'
  maxQuestionsPerRound?: number
  confidenceThreshold?: number
  learnThreshold?: number
  skipCooldownMinutes?: number
  doNotDisturb?: boolean
  consecutiveSkipsToday?: number
  lastSkipAt?: string
}

class SubhealthDB extends Dexie {
  watchData!: Table<DailyWatchRow, string>
  baselines!: Table<PersonalBaseline, string>
  voiceLogs!: Table<VoiceExtraction, string>
  alerts!: Table<HealthAlert, string>
  profile!: Table<UserProfile & { id: 'default' }, string>
  importMeta!: Table<HealthImportMeta & { id: number }, number>
  settings!: Table<SettingsRecord, string>

  constructor() {
    super('SubhealthMonitor')
    this.version(1).stores({
      watchData: 'date',
      baselines: 'metric',
      voiceLogs: 'id, timestamp',
      alerts: 'id, createdAt, direction',
      profile: 'id',
      importMeta: '++id, importedAt',
      settings: 'id',
    })
    this.version(2)
      .stores({
        watchData: 'date',
        baselines: 'metric',
        voiceLogs: 'id, timestamp, recordDate',
        alerts: 'id, createdAt, direction',
        profile: 'id',
        importMeta: '++id, importedAt',
        settings: 'id',
      })
      .upgrade(async (tx) => {
        await tx
          .table('voiceLogs')
          .toCollection()
          .modify((log: VoiceExtraction) => {
            if (!log.recordDate) log.recordDate = log.timestamp.slice(0, 10)
          })
      })
    this.version(3)
      .stores({
        watchData: 'date',
        baselines: 'metric',
        voiceLogs: 'id, timestamp, recordDate',
        alerts: 'id, createdAt, direction',
        profile: 'id',
        importMeta: '++id, importedAt',
        settings: 'id',
      })
      .upgrade(async (tx) => {
        const row = await tx.table('settings').get('default')
        if (row) {
          await tx.table('settings').put({
            ...row,
            maxQuestionsPerRound: row.maxQuestionsPerRound ?? 4,
            confidenceThreshold: row.confidenceThreshold ?? 0.7,
            learnThreshold: row.learnThreshold ?? 3,
            skipCooldownMinutes: row.skipCooldownMinutes ?? 60,
            doNotDisturb: row.doNotDisturb ?? false,
            consecutiveSkipsToday: row.consecutiveSkipsToday ?? 0,
          })
        }
      })
  }
}

export async function getAllVoiceLogs(): Promise<VoiceExtraction[]> {
  return db.voiceLogs.orderBy('timestamp').reverse().toArray()
}

/** Upsert voice logs (merge by id — for Web → App sync). */
export async function importVoiceLogs(
  logs: VoiceExtraction[],
): Promise<{ added: number; updated: number }> {
  const existingIds = new Set(await db.voiceLogs.toCollection().primaryKeys())
  let added = 0
  let updated = 0
  for (const log of logs) {
    if (!log.recordDate) log.recordDate = log.timestamp.slice(0, 10)
    if (existingIds.has(log.id)) updated += 1
    else added += 1
  }
  await db.voiceLogs.bulkPut(logs)
  return { added, updated }
}

export const db = new SubhealthDB()

export async function saveWatchData(rows: DailyWatchRow[]) {
  await db.watchData.bulkPut(rows)
}

export async function getWatchData(days = 90): Promise<DailyWatchRow[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return db.watchData.where('date').aboveOrEqual(cutoffStr).sortBy('date')
}

/** 清空所有本地数据 */
export async function clearAllData() {
  await db.watchData.clear()
  await db.baselines.clear()
  await db.voiceLogs.clear()
  await db.alerts.clear()
  await db.profile.clear()
  await db.importMeta.clear()
  await db.settings.clear()
}
