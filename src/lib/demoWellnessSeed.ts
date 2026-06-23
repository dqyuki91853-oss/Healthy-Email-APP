import { emptyWatchRow } from './health-import/watchRow'
import type { DailyWatchRow } from '../types/health'
import type { BloodPressureReading } from '../types/bloodPressure'
import type { VoiceExtraction, FoodEntry } from '../types/voice'
import type { DietHistoryPattern } from '../services/dietHistory'
import type { SubhealthExportV1 } from './dataSync'

export const DEMO_SEED_ID = 'demo-wellness-14d-v1'

function offsetDate(daysAgo: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function mealTimestamp(date: string, hour: number, minute = 0): string {
  return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`
}

function food(name: string, portion: FoodEntry['portion'] = 'medium'): FoodEntry {
  return {
    name,
    portion,
    confidence: 0.92,
    categories: ['generic'],
  }
}

function voiceLog(
  id: string,
  recordDate: string,
  mealSlot: VoiceExtraction['mealSlot'],
  hour: number,
  transcript: string,
  foods: FoodEntry[],
): VoiceExtraction {
  return {
    id,
    timestamp: mealTimestamp(recordDate, hour),
    recordDate,
    mealSlot,
    transcript,
    foods,
    emotions: [],
    symptoms: [],
    stressScore: null,
    brainFogScore: null,
    needsFollowUp: false,
    followUpQuestions: [],
    overallConfidence: 0.9,
    extractionSource: 'local',
  }
}

/** 14 天 Watch + 饮食演示数据（档案馆 / 四季最低 14 天） */
export function buildDemoWatchRows(): DailyWatchRow[] {
  const rows: DailyWatchRow[] = []

  for (let i = 13; i >= 0; i--) {
    const date = offsetDate(i)
    const dayIndex = 13 - i
    const isSunday = new Date(`${date}T12:00:00`).getDay() === 0
    const lateDinnerDay = dayIndex % 2 === 0

    // 前段略低、后段回升 → 触发「春」季 + 睡眠-HRV 相关
    const recovery = dayIndex / 13
    const sleepBase = lateDinnerDay ? 5.65 + (dayIndex % 3) * 0.08 : 7.35 + (dayIndex % 4) * 0.12
    const sleepHours = Math.round((sleepBase + recovery * 0.35) * 100) / 100
    const hrvFromSleep = 26 + sleepHours * 4.8 + recovery * 6
    const hrvSdnn = Math.round((isSunday ? hrvFromSleep - 9 : hrvFromSleep) * 100) / 100

    const stepsBase = 5200 + recovery * 2800 + (dayIndex % 5) * 180
    const dailySteps = Math.round(stepsBase)
    const restingHr = Math.round(68 - recovery * 4 + (lateDinnerDay ? 1 : 0))

    rows.push({
      ...emptyWatchRow(date),
      dailySteps,
      activeEnergyKcal: Math.round(dailySteps * 0.07 + 120),
      exerciseMinutes: dayIndex % 3 === 0 ? 35 : dayIndex % 2 === 0 ? 18 : 8,
      restingHr,
      hrvSdnn,
      hrvReadings: [hrvSdnn * 0.9, hrvSdnn, hrvSdnn * 1.05],
      spo2Readings: [96, 97, 98, 97],
      respiratoryRateSleep: 13.5,
      sleepHours,
      deepSleepMin: Math.round(sleepHours * 60 * 0.18),
      remSleepMin: Math.round(sleepHours * 60 * 0.22),
      coreSleepMin: Math.round(sleepHours * 60 * 0.55),
      inBedMin: Math.round(sleepHours * 60 + 25),
      awakeEpisodes: lateDinnerDay ? 5 : 2,
      daylightMinutes: 45 + dayIndex * 8,
      wristTempRaw: 35.82 + (dayIndex % 5) * 0.02,
    })
  }

  return rows
}

export function buildDemoVoiceLogs(): VoiceExtraction[] {
  const logs: VoiceExtraction[] = []
  const breakfasts = ['燕麦粥', '全麦吐司', '豆浆油条']
  const lunches = ['鸡胸肉沙拉', '番茄鸡蛋面', '便当']
  const lateDinners = ['麻辣烫', '黄焖鸡米饭', '火锅']
  const earlyDinners = ['清蒸鱼', '蔬菜汤', '糙米饭']

  for (let i = 13; i >= 0; i--) {
    const date = offsetDate(i)
    const dayIndex = 13 - i
    const lateDinnerDay = dayIndex % 2 === 0

    logs.push(
      voiceLog(
        `demo-bf-${date}`,
        date,
        'breakfast',
        8,
        breakfasts[dayIndex % breakfasts.length],
        [food(breakfasts[dayIndex % breakfasts.length], 'medium')],
      ),
      voiceLog(
        `demo-ln-${date}`,
        date,
        'lunch',
        12,
        lunches[dayIndex % lunches.length],
        [food(lunches[dayIndex % lunches.length], 'medium')],
      ),
    )

    if (lateDinnerDay) {
      const name = lateDinners[dayIndex % lateDinners.length]
      logs.push(
        voiceLog(`demo-dn-${date}`, date, 'dinner', 21, name, [food(name, 'large')]),
      )
    } else {
      const name = earlyDinners[dayIndex % earlyDinners.length]
      logs.push(
        voiceLog(`demo-dn-${date}`, date, 'dinner', 18, name, [food(name, 'medium')]),
      )
    }

    if (dayIndex % 4 === 1) {
      logs.push(
        voiceLog(`demo-sn-${date}`, date, 'snack', 15, '苹果', [food('苹果', 'small')]),
      )
    }
  }

  return logs
}

/** 14 天晨/晚血压演示数据 + 偶数日晚餐后反应读数 */
export function buildDemoBloodPressureReadings(): BloodPressureReading[] {
  const readings: BloodPressureReading[] = []

  for (let i = 13; i >= 0; i--) {
    const date = offsetDate(i)
    const dayIndex = 13 - i
    const lateDinnerDay = dayIndex % 2 === 0

    readings.push({
      id: `demo-bp-am-${date}`,
      measuredAt: mealTimestamp(date, 8, 30),
      systolicMmHg: 118 + (dayIndex % 3),
      diastolicMmHg: 74 + (dayIndex % 2),
      pulseBpm: 72,
      source: 'device',
      deviceModel: 'demo-omron',
    })

    readings.push({
      id: `demo-bp-pm-${date}`,
      measuredAt: mealTimestamp(date, lateDinnerDay ? 21 : 19, 30),
      systolicMmHg: 115 + (dayIndex % 2),
      diastolicMmHg: 73 + (dayIndex % 2),
      pulseBpm: 70,
      source: 'device',
      deviceModel: 'demo-omron',
    })

    if (lateDinnerDay) {
      readings.push({
        id: `demo-bp-post-${date}`,
        measuredAt: mealTimestamp(date, 21, 50),
        systolicMmHg: 132 + (dayIndex % 4),
        diastolicMmHg: 82 + (dayIndex % 2),
        pulseBpm: 78,
        source: 'device',
        deviceModel: 'demo-omron',
      })
    }
  }

  return readings
}

export function buildDemoDietHistory(): DietHistoryPattern[] {
  const today = offsetDate(0)
  return [
    { foodName: '燕麦粥', count: 5, defaultPortion: 'medium', defaultAmountG: 250, lastSeen: today },
    { foodName: '鸡胸肉沙拉', count: 4, defaultPortion: 'medium', defaultAmountG: 320, lastSeen: today },
    { foodName: '麻辣烫', count: 4, defaultPortion: 'large', defaultAmountG: 450, lastSeen: offsetDate(2) },
    { foodName: '黄焖鸡米饭', count: 3, defaultPortion: 'medium', lastSeen: offsetDate(4) },
    { foodName: '番茄鸡蛋面', count: 3, defaultPortion: 'medium', lastSeen: offsetDate(1) },
    { foodName: '火锅', count: 2, defaultPortion: 'large', lastSeen: offsetDate(6) },
  ]
}

export interface DemoWellnessSeed {
  seedId: string
  watchRows: DailyWatchRow[]
  voiceLogs: VoiceExtraction[]
  dietHistory: DietHistoryPattern[]
  bloodPressureReadings: BloodPressureReading[]
  exportPayload: SubhealthExportV1
}

export function buildDemoWellnessSeed(): DemoWellnessSeed {
  const watchRows = buildDemoWatchRows()
  const voiceLogs = buildDemoVoiceLogs()
  const dietHistory = buildDemoDietHistory()
  const bloodPressureReadings = buildDemoBloodPressureReadings()

  return {
    seedId: DEMO_SEED_ID,
    watchRows,
    voiceLogs,
    dietHistory,
    bloodPressureReadings,
    exportPayload: {
      version: 1,
      exportedAt: new Date().toISOString(),
      watchRows,
      voiceLogs,
      dietHistory,
      bloodPressureReadings,
      profile: { age: 32, sex: 'female' },
    },
  }
}

export function demoWatchDataJson(demo = buildDemoWellnessSeed()): string {
  const start = demo.watchRows[0]?.date
  const end = demo.watchRows[demo.watchRows.length - 1]?.date
  return JSON.stringify(
    {
      seedId: demo.seedId,
      importedAt: new Date().toISOString(),
      source: 'demo-wellness-seed',
      recordCount: demo.watchRows.length,
      dateRange: { start, end },
      profile: { age: 32, sex: 'female' },
      rows: demo.watchRows,
    },
    null,
    2,
  )
}
