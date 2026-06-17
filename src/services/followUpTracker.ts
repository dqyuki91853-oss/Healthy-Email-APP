import { db } from '../db'
import type { FollowUpQuestion } from '../types/voice'
import { getDefaultLlmConfig } from '../config/llm'
import { todayStr } from '../lib/dates'
import { v4 } from '../engine/uuid'
import { capCompoundFollowUps, dedupeFollowUpQuestions } from './followUpDedup'

export interface FollowUpSettings {
  id: 'default'
  privacyAccepted: boolean
  followUpDailyLimit: number
  followUpAskedToday: number
  followUpDate: string
  followUpCountsByDate?: Record<string, number>
  llmApiKey?: string
  whisperMode: 'local' | 'cloud'
  /** 每轮最多追问数 */
  maxQuestionsPerRound: number
  /** 置信度阈值：低于此值详细追问 */
  confidenceThreshold: number
  /** 历史学习阈值：同食物出现 N 次后跳过分量追问 */
  learnThreshold: number
  /** 跳过冷却（分钟） */
  skipCooldownMinutes: number
  /** 勿扰模式：关闭追问 */
  doNotDisturb: boolean
  /** 当日连续跳过次数 */
  consecutiveSkipsToday: number
  /** 上次跳过时间 ISO */
  lastSkipAt?: string
}

const DEFAULTS: Omit<FollowUpSettings, 'id'> = {
  privacyAccepted: false,
  followUpDailyLimit: 3,
  followUpAskedToday: 0,
  followUpDate: todayStr(),
  followUpCountsByDate: {},
  whisperMode: 'local',
  maxQuestionsPerRound: 4,
  confidenceThreshold: 0.7,
  learnThreshold: 3,
  skipCooldownMinutes: 60,
  doNotDisturb: false,
  consecutiveSkipsToday: 0,
}

export async function getFollowUpSettings(): Promise<FollowUpSettings> {
  const settings = await db.settings.get('default')
  const today = todayStr()
  const envKey = getDefaultLlmConfig().apiKey

  if (!settings) {
    const initial: FollowUpSettings = {
      id: 'default',
      ...DEFAULTS,
      llmApiKey: envKey || undefined,
    }
    await db.settings.put(initial)
    return initial
  }

  let updated: FollowUpSettings = {
    ...DEFAULTS,
    ...settings,
    followUpCountsByDate: settings.followUpCountsByDate ?? {},
    maxQuestionsPerRound: settings.maxQuestionsPerRound ?? 4,
    confidenceThreshold: settings.confidenceThreshold ?? 0.7,
    learnThreshold: settings.learnThreshold ?? 3,
    skipCooldownMinutes: settings.skipCooldownMinutes ?? 60,
    doNotDisturb: settings.doNotDisturb ?? false,
    consecutiveSkipsToday: settings.consecutiveSkipsToday ?? 0,
    lastSkipAt: settings.lastSkipAt,
  }

  if (settings.followUpDate !== today) {
    updated = {
      ...updated,
      followUpAskedToday: 0,
      followUpDate: today,
      consecutiveSkipsToday: 0,
    }
    await db.settings.put(updated)
  }

  if (!settings.llmApiKey && envKey) {
    updated = { ...updated, llmApiKey: envKey }
    await db.settings.put(updated)
  }

  return updated
}

export function getFollowUpCountForDate(
  settings: Pick<FollowUpSettings, 'followUpCountsByDate' | 'followUpAskedToday' | 'followUpDate'>,
  recordDate: string,
): number {
  const byDate = settings.followUpCountsByDate ?? {}
  if (byDate[recordDate] != null) return byDate[recordDate]
  if (recordDate === settings.followUpDate || recordDate === todayStr()) {
    return settings.followUpAskedToday
  }
  return 0
}

/** 疲劳保护：连续跳过 3 次则当日不再追问 */
export function isFollowUpFatigued(settings: FollowUpSettings): boolean {
  return settings.consecutiveSkipsToday >= 3
}

/** 跳过冷却期内不再追问 */
export function isInSkipCooldown(settings: FollowUpSettings): boolean {
  if (!settings.lastSkipAt) return false
  const elapsed = Date.now() - new Date(settings.lastSkipAt).getTime()
  return elapsed < settings.skipCooldownMinutes * 60 * 1000
}

/** Local / gap-driven follow-up: respect limits but not confidence gate. */
export function shouldAskFollowUpWithGaps(
  questions: FollowUpQuestion[],
  askedOnRecordDate: number,
  settings: Pick<
    FollowUpSettings,
    'followUpDailyLimit' | 'doNotDisturb' | 'consecutiveSkipsToday' | 'lastSkipAt' | 'skipCooldownMinutes'
  >,
): boolean {
  if (settings.doNotDisturb) return false
  if (questions.length === 0) return false
  if (askedOnRecordDate >= settings.followUpDailyLimit) return false
  if (isFollowUpFatigued(settings as FollowUpSettings)) return false
  if (isInSkipCooldown(settings as FollowUpSettings)) return false
  return true
}

export function shouldAskFollowUp(
  overallConfidence: number,
  questions: FollowUpQuestion[],
  askedOnRecordDate: number,
  settings: Pick<
    FollowUpSettings,
    'followUpDailyLimit' | 'confidenceThreshold' | 'doNotDisturb' | 'consecutiveSkipsToday' | 'lastSkipAt' | 'skipCooldownMinutes'
  >,
  forceCritical = false,
): boolean {
  if (settings.doNotDisturb) return false
  if (questions.length === 0) return false
  if (askedOnRecordDate >= settings.followUpDailyLimit) return false
  if (isFollowUpFatigued(settings as FollowUpSettings)) return false
  if (isInSkipCooldown(settings as FollowUpSettings)) return false
  if (forceCritical) return true
  // >90% 不追问；60-90% 允许轻量确认（由决策层控制题目）
  if (overallConfidence >= 0.9) return false
  if (overallConfidence >= settings.confidenceThreshold && !forceCritical) {
    // 仅有 P3/P4 轻量题时才展示
    const hasImportant = questions.some(
      (q) => q.priorityLevel === 'P0' || q.priorityLevel === 'P1' || q.priorityLevel === 'P2',
    )
    if (!hasImportant) return false
  }
  return true
}

export function selectFollowUpQuestions(
  questions: FollowUpQuestion[],
  maxPerRound = 4,
): FollowUpQuestion[] {
  const deduped = dedupeFollowUpQuestions(questions)
  const capped = deduped.some((q) => q.followUpType === 'decompose')
    ? capCompoundFollowUps(deduped, Math.min(maxPerRound, 2))
    : deduped

  return [...capped]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxPerRound)
    .map((q) => ({
      ...q,
      id: q.id || v4(),
      quickOptions: q.quickOptions?.length ? q.quickOptions : defaultQuickOptions(q.field),
    }))
}

function defaultQuickOptions(field: FollowUpQuestion['field']): string[] | undefined {
  switch (field) {
    case 'portion':
      return ['小份', '中份', '大份', '一碗', '半份']
    case 'cooking':
      return ['蒸', '煮', '炒', '炸', '红烧']
    case 'timing':
      return ['早餐', '午餐', '晚餐', '加餐']
    case 'db_match':
      return ['上海青', '小白菜', '油菜', '菠菜', '生菜']
    case 'components':
      return ['有肉，汤全喝', '有肉，没喝汤', '没肉', '素食']
    case 'emotion':
      return ['确实饿了', '压力大', '无聊习惯', '社交聚会']
    case 'soup':
      return ['全喝了', '喝了一半', '没喝汤']
    case 'sugar':
      return ['无糖', '三分糖', '半糖', '全糖']
    default:
      return undefined
  }
}

export async function recordFollowUpShown(recordDate: string, count: number): Promise<void> {
  const settings = await getFollowUpSettings()
  const byDate = { ...(settings.followUpCountsByDate ?? {}) }
  byDate[recordDate] = (byDate[recordDate] ?? 0) + count

  const today = todayStr()
  const askedToday =
    recordDate === today ? settings.followUpAskedToday + count : settings.followUpAskedToday

  await db.settings.put({
    ...settings,
    followUpCountsByDate: byDate,
    followUpAskedToday: askedToday,
    followUpDate: today,
    consecutiveSkipsToday: 0,
  })
}

export async function recordFollowUpSkipped(): Promise<void> {
  const settings = await getFollowUpSettings()
  await db.settings.put({
    ...settings,
    consecutiveSkipsToday: settings.consecutiveSkipsToday + 1,
    lastSkipAt: new Date().toISOString(),
  })
}
