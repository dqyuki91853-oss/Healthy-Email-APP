import { create } from 'zustand'
import { clearAllData, db, saveWatchData, getWatchData, getAllVoiceLogs, importVoiceLogs } from '../db'
import type { DailyWatchRow, PersonalBaseline, UserProfile } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { HealthAlert } from '../types/alerts'
import type { PredictionSnapshot } from '../types/prediction'
import { computeBaselines } from '../lib/baselines'
import { normalizeWatchRow } from '../lib/health-import/watchRow'
import { buildPredictionSnapshot, runPredictionEngine } from '../engine/predictor'
import { clearDietHistory } from '../services/dietHistory'
import { clearBloodPressureReadings, mergeBloodPressureReadings } from '../lib/bloodPressureStore'

import type { WellnessSnapshot } from '../types/wellness'
import type { WeeklyLetterData } from '../services/weeklyLetter'
import { buildWellnessSnapshot } from '../engine/wellnessSnapshot'
import { mergeDietHistory } from '../services/dietHistory'
import {
  type SubhealthExportV1,
  type ImportSyncResult,
} from '../lib/dataSync'
import { buildDemoWellnessSeed, DEMO_SEED_ID } from '../lib/demoWellnessSeed'
import { saveCaseFiles } from '../lib/caseFileStore'
import { maybeImportAppSync } from '../lib/appSyncImport'
import { restoreLocalPrefs, APP_SYNC_PATH, parseSubhealthExport } from '../lib/dataSync'

interface AppState {
  watchRows: DailyWatchRow[]
  baselines: PersonalBaseline[]
  voiceLogs: VoiceExtraction[]
  alerts: HealthAlert[]
  prediction: PredictionSnapshot | null
  profile: UserProfile
  privacyAccepted: boolean
  loading: boolean
  weeklyLetterVersion: number
  /** P0-a: stored letter survives route changes */
  weeklyLetter: WeeklyLetterData | null
  weeklyLetterStale: boolean
  wellness: WellnessSnapshot | null
  loadData: () => Promise<void>
  importWatchData: (rows: DailyWatchRow[]) => Promise<void>
  addVoiceLog: (log: VoiceExtraction) => Promise<void>
  deleteVoiceLog: (id: string) => Promise<void>
  acknowledgeAlert: (id: string) => Promise<void>
  setPrivacyAccepted: (v: boolean) => Promise<void>
  setProfile: (p: Partial<UserProfile>) => Promise<void>
  clearAllData: () => Promise<void>
  loadDemoWellnessSeed: () => Promise<{ watchDays: number; voiceLogs: number; cases: number }>
  importSyncedData: (
    payload: SubhealthExportV1,
    options?: { includeWatchRows?: boolean },
  ) => Promise<ImportSyncResult>
  refreshAlerts: () => void
  regenerateWeeklyLetter: () => void
  setWeeklyLetter: (letter: WeeklyLetterData | null) => void
  setWeeklyLetterStale: (v: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  watchRows: [],
  baselines: [],
  voiceLogs: [],
  alerts: [],
  prediction: null,
  profile: {},
  privacyAccepted: false,
  loading: false,
  weeklyLetterVersion: 0,
  weeklyLetter: null,
  weeklyLetterStale: false,
  wellness: null,

  loadData: async () => {
    set({ loading: true })
    let existing = await db.watchData.count()
    try {
      const res = await fetch('/data/watch-data.json')
      if (res.ok) {
        const meta = await res.json()
        const storedSeedId = localStorage.getItem('subhealth_seed_id')
        const seedChanged = Boolean(meta.seedId && meta.seedId !== storedSeedId)
        if (seedChanged) {
          await clearAllData()
          clearDietHistory()
          existing = 0
        }
        if (existing === 0 && meta.rows?.length) {
          await saveWatchData(meta.rows.map((r: DailyWatchRow) => normalizeWatchRow(r)))
          existing = meta.rows.length
          if (meta.seedId) {
            localStorage.setItem('subhealth_seed_id', meta.seedId)
          }
          if (meta.profile && Object.keys(meta.profile).length) {
            const p = meta.profile as {
              age?: number
              sex?: string
              height_cm?: number
              body_mass_kg?: number
            }
            await db.profile.put({
              id: 'default',
              age: p.age,
              sex: p.sex as UserProfile['sex'],
              heightCm: p.height_cm,
              bodyMassKg: p.body_mass_kg,
            })
          }
        }
      }
    } catch {
      /* no seed file */
    }

    await maybeImportAppSync((payload, opts) => get().importSyncedData(payload, opts))

    let voiceCount = await db.voiceLogs.count()
    if (voiceCount === 0) {
      try {
        const res = await fetch(APP_SYNC_PATH)
        if (res.ok) {
          const payload = parseSubhealthExport(await res.json())
          await get().importSyncedData(payload, { includeWatchRows: true })
        }
      } catch {
        /* no app-sync */
      }
    }

    const [watchRowsFinal, voiceLogsFinal, settingsFinal, profileRowFinal] = await Promise.all([
      getWatchData(365),
      getAllVoiceLogs(),
      db.settings.get('default'),
      db.profile.get('default'),
    ])
    const baselines = computeBaselines(watchRowsFinal)
    await db.baselines.bulkPut(baselines)
    set({
      watchRows: watchRowsFinal,
      baselines,
      voiceLogs: voiceLogsFinal,
      privacyAccepted: settingsFinal?.privacyAccepted ?? false,
      profile: profileRowFinal ?? {},
      loading: false,
    })
    get().refreshAlerts()
  },

  importWatchData: async (rows) => {
    await db.watchData.clear()
    await saveWatchData(rows.map((r) => normalizeWatchRow(r)))
    const watchRows = await getWatchData(8)
    const baselines = computeBaselines(watchRows)
    await db.baselines.bulkPut(baselines)
    set({ watchRows, baselines, weeklyLetterStale: true })
    get().refreshAlerts()
  },

  addVoiceLog: async (log) => {
    await db.voiceLogs.put(log)
    const voiceLogs = await getAllVoiceLogs()
    set({ voiceLogs, weeklyLetterStale: get().weeklyLetter ? true : false })
    get().refreshAlerts()
  },

  deleteVoiceLog: async (id) => {
    await db.voiceLogs.delete(id)
    const voiceLogs = await getAllVoiceLogs()
    set({ voiceLogs, weeklyLetterStale: get().weeklyLetter ? true : false })
    get().refreshAlerts()
  },

  acknowledgeAlert: async (id) => {
    const alert = get().alerts.find((a) => a.id === id)
    if (alert) {
      await db.alerts.update(id, { acknowledged: true })
      set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) })
    }
  },

  setPrivacyAccepted: async (v) => {
    const today = new Date().toISOString().slice(0, 10)
    const existing = await db.settings.get('default')
    await db.settings.put({
      id: 'default',
      privacyAccepted: v,
      followUpDailyLimit: existing?.followUpDailyLimit ?? 3,
      followUpAskedToday: existing?.followUpAskedToday ?? 0,
      followUpDate: existing?.followUpDate ?? today,
      llmApiKey: existing?.llmApiKey,
      whisperMode: existing?.whisperMode ?? 'local',
    })
    set({ privacyAccepted: v })
  },

  setProfile: async (p) => {
    const profile = { ...get().profile, ...p }
    await db.profile.put({ id: 'default', ...profile })
    set({ profile })
  },

  clearAllData: async () => {
    await clearAllData()
    clearDietHistory()
    clearBloodPressureReadings()
    saveCaseFiles([])
    localStorage.removeItem('subhealth_chronicle_prefs')
    set({
      watchRows: [],
      baselines: [],
      voiceLogs: [],
      alerts: [],
      prediction: null,
      profile: {},
      privacyAccepted: false,
      wellness: null,
    })
  },

  loadDemoWellnessSeed: async () => {
    const demo = buildDemoWellnessSeed()
    await clearAllData()
    clearDietHistory()
    clearBloodPressureReadings()
    saveCaseFiles([])
    localStorage.removeItem('subhealth_chronicle_prefs')
    localStorage.removeItem('subhealth_last_seen_letter_v3')

    await saveWatchData(demo.watchRows.map((r) => normalizeWatchRow(r)))
    await importVoiceLogs(demo.voiceLogs)
    mergeDietHistory(demo.dietHistory)
    localStorage.setItem('subhealth_seed_id', DEMO_SEED_ID)

    await db.profile.put({
      id: 'default',
      age: 32,
      sex: 'female',
    })

    const watchRows = await getWatchData(365)
    const voiceLogs = await getAllVoiceLogs()
    const baselines = computeBaselines(watchRows)
    await db.baselines.bulkPut(baselines)

    set({
      watchRows,
      baselines,
      voiceLogs,
      profile: { age: 32, sex: 'female' },
      weeklyLetterStale: true,
      weeklyLetter: null,
    })
    get().refreshAlerts()

    const cases = get().wellness?.caseFiles?.length ?? 0
    return { watchDays: watchRows.length, voiceLogs: voiceLogs.length, cases }
  },

  importSyncedData: async (payload, options = {}) => {
    const { includeWatchRows = false } = options
    const { added, updated } = await importVoiceLogs(payload.voiceLogs)

    let watchRowsImported = 0
    if (includeWatchRows && payload.watchRows?.length) {
      await saveWatchData(payload.watchRows.map((r) => normalizeWatchRow(r)))
      watchRowsImported = payload.watchRows.length
    }

    const dietHistoryMerged = payload.dietHistory?.length
      ? mergeDietHistory(payload.dietHistory)
      : 0

    const bpMerged = payload.bloodPressureReadings?.length
      ? mergeBloodPressureReadings(payload.bloodPressureReadings)
      : 0

    if (payload.profile && Object.keys(payload.profile).length > 0) {
      await db.profile.put({ id: 'default', ...payload.profile })
    }

    const watchRows = await getWatchData(includeWatchRows ? 365 : 365)
    const voiceLogs = await getAllVoiceLogs()
    const baselines = computeBaselines(watchRows)
    await db.baselines.bulkPut(baselines)

    set({
      watchRows,
      baselines,
      voiceLogs,
      weeklyLetterStale: true,
    })
    get().refreshAlerts()

    const prefsRestored = restoreLocalPrefs(payload.localPrefs)

    return {
      voiceLogsAdded: added,
      voiceLogsUpdated: updated,
      watchRowsImported,
      dietHistoryMerged,
      bpMerged,
      prefsRestored,
    }
  },

  refreshAlerts: () => {
    const { watchRows, baselines, voiceLogs, profile } = get()
    const prediction = buildPredictionSnapshot(watchRows, baselines, voiceLogs, profile)
    const alerts = runPredictionEngine(watchRows, baselines, voiceLogs, profile)
    const wellness = buildWellnessSnapshot(watchRows, baselines, voiceLogs)
    set({ alerts, prediction, wellness })
    alerts.forEach((a) => db.alerts.put(a))
  },

  regenerateWeeklyLetter: () => {
    set({
      weeklyLetterVersion: get().weeklyLetterVersion + 1,
      weeklyLetter: null,
      weeklyLetterStale: false,
    })
  },
  setWeeklyLetter: (letter) => set({ weeklyLetter: letter }),
  setWeeklyLetterStale: (v) => set({ weeklyLetterStale: v }),
}))
