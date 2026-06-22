import type { DailyWatchRow } from '../types/health'
import type { BodySeasonId } from '../types/bodySeason'

/** 早睡：与引擎内「适合早睡」阈值对齐 */
export const EARLY_SLEEP_HOURS = 7
/** 晚睡：连续短睡判定 */
export const LATE_SLEEP_HOURS = 6.5
/** 近 7 天窗口 */
export const PLANT_WINDOW_DAYS = 7
/** 有运动：锻炼分钟或步数 */
export const EXERCISE_MINUTES = 15
export const ACTIVE_STEPS = 5000

export type PlantVigor = 'vibrant' | 'growing' | 'okay' | 'wilted' | 'sleepy'

export const PLANT_WHISPER: Record<PlantVigor, string> = {
  vibrant: '今天精神不错',
  growing: '它在安静地生长',
  okay: '今天和昨天差不多',
  wilted: '叶子有点蔫，它想你了',
  sleepy: '它在打盹…你也是吗',
}

/** 图鉴 / 日记用状态名 */
export const PLANT_STAGE_LABEL: Record<PlantVigor, string> = {
  vibrant: '精神',
  growing: '还好',
  okay: '一般',
  wilted: '蔫了',
  sleepy: '困了',
}

export const PLANT_SPECIES: Record<BodySeasonId, string> = {
  spring: '樱花嫩枝',
  summer: '小向日葵',
  autumn: '银杏小树',
  winter: '小松树',
}

export const PLANT_SEASON_ORDER: BodySeasonId[] = ['spring', 'summer', 'autumn', 'winter']

export const PLANT_VIGOR_ORDER: PlantVigor[] = [
  'vibrant',
  'growing',
  'okay',
  'wilted',
  'sleepy',
]

function recentRows(rows: DailyWatchRow[], days = PLANT_WINDOW_DAYS): DailyWatchRow[] {
  return [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days)
}

function isEarlySleep(hours: number): boolean {
  return hours >= EARLY_SLEEP_HOURS
}

function isLateSleep(hours: number): boolean {
  return hours < LATE_SLEEP_HOURS
}

function hasExercise(row: DailyWatchRow): boolean {
  return (
    (row.exerciseMinutes != null && row.exerciseMinutes >= EXERCISE_MINUTES) ||
    (row.dailySteps != null && row.dailySteps >= ACTIVE_STEPS)
  )
}

function longestLateSleepStreak(rows: DailyWatchRow[]): number {
  let streak = 0
  let max = 0
  for (const row of rows) {
    if (row.sleepHours != null && isLateSleep(row.sleepHours)) {
      streak += 1
      max = Math.max(max, streak)
    } else {
      streak = 0
    }
  }
  return max
}

/**
 * 根据近 7 天睡眠与运动信号，推断小植物状态。
 * 不展示具体天数，只映射为 5 级 vigor。
 */
export function computePlantVigor(rows: DailyWatchRow[]): PlantVigor {
  const window = recentRows(rows)
  const sleepDays = window.filter((r) => r.sleepHours != null)

  if (sleepDays.length < PLANT_WINDOW_DAYS) {
    return 'sleepy'
  }

  if (longestLateSleepStreak(window) >= 3) {
    return 'wilted'
  }

  const earlyCount = sleepDays.filter((r) => isEarlySleep(r.sleepHours!)).length
  const exercised = window.some(hasExercise)

  if (earlyCount >= 5 && exercised) {
    return 'vibrant'
  }

  if (earlyCount >= 3) {
    return 'growing'
  }

  return 'okay'
}
