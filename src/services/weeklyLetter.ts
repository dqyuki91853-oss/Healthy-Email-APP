import type { DailyWatchRow, PersonalBaseline, UserProfile } from '../types/health'
import type { VoiceExtraction } from '../types/voice'
import type { BodySeasonId } from '../types/bodySeason'
import type { BodyWeatherId } from '../types/bodyWeather'
import { callLLMGeneral } from './llm'
import { isLlmAvailable } from '../config/llm'

import type { WellnessSnapshot } from '../types/wellness'
import { getLetterPracticeHint, getWuyinPracticeStats } from '../lib/wuyinPracticeStreak'
import { formatReplyHintForLetter, getLatestReply } from '../lib/bodyReplyStore'
import { archiveWeeklyLetter } from '../lib/letterArchiveStore'

export interface WeeklyLetterData {
  score: number | null
  letter: string | null
  insufficientData: boolean
  dateRange: { start: string; end: string } | null
}

export interface CachedLetter {
  cacheKey: string
  generatedAt: string
  data: WeeklyLetterData
  weatherId?: BodyWeatherId | null
  weatherLabel?: string | null
  seasonId?: BodySeasonId | null
  seasonLabel?: string | null
}

const CACHE_KEY = 'subhealth_weekly_letter'
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

// ── Cache helpers ──

export function buildCacheKey(
  watchRows: DailyWatchRow[],
  voiceLogs: VoiceExtraction[],
  profile: UserProfile,
): string {
  const lastDate = watchRows.length > 0 ? watchRows[watchRows.length - 1].date : 'none'
  const voiceCount = voiceLogs.length
  const a = profile.age ?? 0
  const s = profile.sex ?? ''
  const w = profile.bodyMassKg ?? 0
  return `${lastDate}_${voiceCount}_${a}_${s}_${w}`
}

export function getCachedLetter(): WeeklyLetterData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedLetter = JSON.parse(raw)
    const age = Date.now() - new Date(cached.generatedAt).getTime()
    if (age > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return cached.data
  } catch {
    return null
  }
}

export function setCachedLetter(
  cacheKey: string,
  data: WeeklyLetterData,
  wellness?: WellnessSnapshot | null,
): void {
  try {
    const entry: CachedLetter = {
      cacheKey,
      generatedAt: new Date().toISOString(),
      data,
      weatherId: wellness?.bodyWeather?.weatherId ?? null,
      weatherLabel: wellness?.bodyWeather?.label ?? null,
      seasonId: wellness?.bodySeason?.seasonId ?? null,
      seasonLabel: wellness?.bodySeason?.label ?? null,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage full — ignore
  }
}

export function getCachedEntry(): CachedLetter | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedLetter = JSON.parse(raw)
    const age = Date.now() - new Date(cached.generatedAt).getTime()
    if (age > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return cached
  } catch {
    return null
  }
}

import { startOfWeek as _startOfWeek } from 'date-fns'

export function shouldAutoRefreshForNewWeek(): boolean {
  const cached = getCachedEntry()
  if (!cached) return true // never generated
  try {
    const last = _startOfWeek(new Date(cached.generatedAt), { weekStartsOn: 1 })
    const now = _startOfWeek(new Date(), { weekStartsOn: 1 })
    return now.getTime() > last.getTime()
  } catch {
    return false
  }
}

export function setLetterCacheSentinel(cacheKey: string): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ cacheKey, generatedAt: new Date().toISOString(), data: { sentinel: true } }),
    )
  } catch {
    // ignore
  }
}

// ── Helpers ──

const PURINE_KEYWORDS = ['红肉', '牛肉', '羊肉', '内脏', '猪肝', '海鲜', '虾', '蟹', '啤酒', '生蚝']
const FRUCTOSE_KEYWORDS = ['可乐', '汽水', '奶茶', '果汁', '蜂蜜', '含糖']
const HIGH_GI_KEYWORDS = ['白米饭', '面条', '面包', '蛋糕', '甜点', '油条']
const FISH_DHA_KEYWORDS = ['鱼', '三文鱼', '鲑鱼', '金枪鱼', '鳕鱼']
const VEGETABLE_KEYWORDS = ['蔬菜', '青菜', '西兰花', '菠菜', '生菜', '番茄', '黄瓜', '胡萝卜']
const ALCOHOL_KEYWORDS = ['酒', '啤酒', '白酒', '红酒', '威士忌', '鸡尾酒']

function avg(vals: (number | null)[]): number | null {
  const valid = vals.filter((v): v is number => v != null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function countInFoods(voiceLogs: VoiceExtraction[], keywords: string[]): number {
  let count = 0
  for (const log of voiceLogs) {
    for (const food of log.foods) {
      const text = [food.name, ...(food.components ?? []), ...(food.categories ?? [])].join(' ')
      if (keywords.some((k) => text.includes(k))) count++
    }
  }
  return count
}

function pick<T>(arr: T[]): T | undefined {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined
}

function buildReplyAcknowledgment(): string | null {
  const latest = getLatestReply()
  if (!latest) return null
  const lines = [
    '读到了你上次的留言——谢谢愿意跟我分享。',
    '你上次的回信我记在心里了，这周继续一起留意身体。',
    '谢谢你上次的回信，我会把你的心意带进这周的提醒里。',
  ]
  return pick(lines) ?? lines[0]
}

/** Data summary for LLM input only — never shown in UI */
function buildWeeklyDataSummary(
  watchRows: DailyWatchRow[],
  voiceLogs: VoiceExtraction[],
  baselines: PersonalBaseline[],
  _profile: UserProfile,
): string {
  void baselines;
  const week = watchRows.slice(-7)
  const dateRange = week.length > 0 ? `${week[0].date} 至 ${week[week.length - 1].date}` : '无数据'

  const avgSteps = avg(week.map((r) => r.dailySteps))
  const avgExercise = avg(week.map((r) => r.exerciseMinutes))
  const avgSleep = avg(week.map((r) => r.sleepHours))
  const avgRhr = avg(week.map((r) => r.restingHr))
  const avgHrv = avg(week.map((r) => r.hrvSdnn))

  const weekStart = week.length > 0 ? week[0].date : ''
  const weekVoiceLogs = voiceLogs.filter((v) => v.recordDate >= weekStart)
  const totalMeals = weekVoiceLogs.length
  const purineCount = countInFoods(weekVoiceLogs, PURINE_KEYWORDS)
  const fructoseCount = countInFoods(weekVoiceLogs, FRUCTOSE_KEYWORDS)
  const highGiCount = countInFoods(weekVoiceLogs, HIGH_GI_KEYWORDS)
  const fishCount = countInFoods(weekVoiceLogs, FISH_DHA_KEYWORDS)
  const vegetableCount = countInFoods(weekVoiceLogs, VEGETABLE_KEYWORDS)
  const alcoholCount = countInFoods(weekVoiceLogs, ALCOHOL_KEYWORDS)

  const allFoodNames = weekVoiceLogs.flatMap((v) => v.foods.map((f) => f.name))

  const lines = [
    `日期：${dateRange}（${week.length}天）`,
    avgSteps != null ? `日均步数 ${avgSteps.toFixed(0)}` : '',
    avgExercise != null ? `日均运动 ${avgExercise.toFixed(0)}分钟` : '',
    avgSleep != null ? `平均睡眠 ${avgSleep.toFixed(1)}小时` : '',
    avgRhr != null ? `静息心率 ${avgRhr.toFixed(0)}bpm` : '',
    avgHrv != null ? `HRV ${avgHrv.toFixed(0)}ms` : '',
    totalMeals > 0 ? `共记录${totalMeals}餐：${allFoodNames.join('、')}` : '',
    purineCount > 0 ? `高嘌呤 ${purineCount}次` : '',
    fructoseCount > 0 ? `含糖饮料 ${fructoseCount}次` : '',
    highGiCount > 0 ? `高GI ${highGiCount}次` : '',
    fishCount > 0 ? `鱼类 ${fishCount}次` : '',
    vegetableCount > 0 ? `蔬菜 ${vegetableCount}次` : '',
    vegetableCount === 0 && totalMeals > 0 ? `蔬菜不足` : '',
    alcoholCount > 0 ? `酒精 ${alcoholCount}次` : '',
  ].filter(Boolean)
  return lines.join('；')
}

// ── LLM prompt (v2 §6.1) ──

const SYSTEM_PROMPT = `你是健康来信助手。根据用户 7 天数据写一封 400–600 字中文信。

结构：
1. 称呼 + 本周评分(0-100) + 一句总结
2. 这周可以留意的饮食（点名具体食物，建议少吃）
3. 下周可以试试多吃的（1-2 类食物，用「如果方便」）
4. 至少一句具体表扬（步数/睡眠/运动/坚持记录）
5. 温暖结尾，署名「你的健康小助手」

严禁：证据等级、阈值、HRV%、临床术语、数据表格、批评恐吓
语气：像朋友写信，鼓励为主
若提供「用户上一封回信」，请自然回应一两句，不要生硬引用原文

输出纯 JSON：{"score":82,"letter":"亲爱的小伙伴：\\n\\n……"}`

// ── Fallback letter (v2 §6.2) ──

function prependWellnessOpener(letter: string, wellness?: WellnessSnapshot | null): string {
  if (!wellness) return letter
  const opener = wellness.bodyWeather.letterOpener
  const moodNote = wellness.mood.gentleNote
  const parts = [opener]
  if (moodNote && wellness.mood.source !== 'voice') {
    parts.push(moodNote)
  }
  if (letter.includes(opener)) return letter
  return `${parts.join('\n\n')}\n\n${letter}`
}

function buildFallbackLetter(
  watchRows: DailyWatchRow[],
  voiceLogs: VoiceExtraction[],
  _baselines: PersonalBaseline[],
  _profile: UserProfile,
  wellness?: WellnessSnapshot | null,
): WeeklyLetterData {
  const week = watchRows.slice(-7)
  const dateRange =
    week.length > 0 ? { start: week[0].date, end: week[week.length - 1].date } : null

  const weekStart = week.length > 0 ? week[0].date : ''
  const weekVoiceLogs = voiceLogs.filter((v) => v.recordDate >= weekStart)

  // Score
  const avgSteps = avg(week.map((r) => r.dailySteps)) ?? 0
  const avgSleep = avg(week.map((r) => r.sleepHours)) ?? 0
  const avgExercise = avg(week.map((r) => r.exerciseMinutes)) ?? 0
  let score = 70
  if (avgSteps > 8000) score += 10
  else if (avgSteps > 5000) score += 5
  if (avgSleep > 7) score += 10
  else if (avgSleep > 6) score += 5
  if (avgExercise > 20) score += 5
  score = Math.min(100, Math.max(0, score))

  const mood = score >= 80 ? '整体状态相当不错' : '还有提升空间'

  // Diet warnings
  const purineCount = countInFoods(weekVoiceLogs, PURINE_KEYWORDS)
  const fructoseCount = countInFoods(weekVoiceLogs, FRUCTOSE_KEYWORDS)
  const highGiCount = countInFoods(weekVoiceLogs, HIGH_GI_KEYWORDS)
  const fishCount = countInFoods(weekVoiceLogs, FISH_DHA_KEYWORDS)
  const vegetableCount = countInFoods(weekVoiceLogs, VEGETABLE_KEYWORDS)

  let dietWarning = ''
  const purineFoods = weekVoiceLogs.flatMap((v) => v.foods.map((f) => f.name)).filter((n) => PURINE_KEYWORDS.some((k) => n.includes(k)))
  const sugarFoods = weekVoiceLogs.flatMap((v) => v.foods.map((f) => f.name)).filter((n) => FRUCTOSE_KEYWORDS.some((k) => n.includes(k)))

  if (purineCount > 0 && purineFoods.length > 0) {
    dietWarning = `我注意到你这周吃了不少${pick(purineFoods) ?? '高嘌呤食物'}，下次可以稍微减少一些。`
  } else if (fructoseCount > 0 && sugarFoods.length > 0) {
    dietWarning = `我注意到你这周喝了${pick(sugarFoods) ?? '含糖饮料'}，下次可以稍微控制一下。`
  } else if (highGiCount > 1) {
    dietWarning = '这周精制碳水摄入偏多，如果方便的话，可以试试把部分白米饭换成杂粮饭。'
  }

  let dietSuggestion = ''
  if (vegetableCount < 3 && purineCount > 0) {
    dietSuggestion = '如果下周方便，可以多安排一些蔬菜或鱼类。'
  } else if (fishCount === 0 && weekVoiceLogs.length > 2) {
    dietSuggestion = '如果方便，下周可以安排一两次鱼类，补充优质的 DHA。'
  } else if (vegetableCount < 2) {
    dietSuggestion = '下周不妨多吃些深色蔬菜，对身体很有好处。'
  } else {
    dietSuggestion = '如果方便，可以继续保持均衡饮食，多吃蔬菜水果。'
  }

  // Compliment
  const compliments: string[] = []
  if (avgSteps > 6000) compliments.push('这周的步数表现很不错')
  else if (avgSteps > 4000) compliments.push('这周坚持走路，很不错')
  if (avgSleep > 7) compliments.push('睡眠质量保持得很好')
  else if (avgSleep > 6) compliments.push('睡眠时长还算稳定')
  if (avgExercise > 15) compliments.push('运动习惯坚持得不错')
  if (weekVoiceLogs.length >= 3) compliments.push('坚持记录饮食真的很棒')
  const practiceHint = getLetterPracticeHint(getWuyinPracticeStats())
  if (practiceHint) compliments.push(practiceHint.replace(/。$/, ''))
  if (compliments.length === 0) compliments.push('这周坚持使用 App 关注自己的健康，本身就是很棒的开始')

  const compliment = pick(compliments) ?? '这周坚持关注自己的健康，很棒'

  const replyAck = buildReplyAcknowledgment()

  const lines = [
    '亲爱的小伙伴：',
    '',
    `这周你的综合状态大约 ${score} 分——${mood}。`,
    '',
    dietWarning,
    '',
    dietSuggestion,
    '',
    `特别想夸夸你：${compliment}。`,
    '',
    ...(replyAck ? [replyAck, ''] : []),
    '祝你新的一周元气满满。',
    '你的健康小助手',
  ].filter((l) => l !== '')

  return {
    score,
    letter: prependWellnessOpener(lines.join('\n'), wellness),
    insufficientData: false,
    dateRange,
  }
}

// ── Main export ──

/** Generate letter + always persist to cache */
export async function generateWeeklyLetterAndCache(
  watchRows: DailyWatchRow[],
  voiceLogs: VoiceExtraction[],
  baselines: PersonalBaseline[],
  profile: UserProfile,
  wellness?: WellnessSnapshot | null,
): Promise<WeeklyLetterData> {
  const previous = getCachedEntry()
  const data = await generateWeeklyLetter(watchRows, voiceLogs, baselines, profile, wellness)
  if (data.letter) {
    if (previous?.data.letter && previous.data.dateRange) {
      archiveWeeklyLetter(previous.data, {
        weatherId: previous.weatherId,
        weatherLabel: previous.weatherLabel,
        seasonId: previous.seasonId,
        seasonLabel: previous.seasonLabel,
      })
    }
    const cacheKey = buildCacheKey(watchRows, voiceLogs, profile)
    setCachedLetter(cacheKey, data, wellness)
  }
  return data
}

export async function generateWeeklyLetter(
  watchRows: DailyWatchRow[],
  voiceLogs: VoiceExtraction[],
  baselines: PersonalBaseline[],
  profile: UserProfile,
  wellness?: WellnessSnapshot | null,
): Promise<WeeklyLetterData> {
  if (watchRows.length < 3) {
    return { score: null, letter: null, insufficientData: true, dateRange: null }
  }

  if (!isLlmAvailable()) {
    return buildFallbackLetter(watchRows, voiceLogs, baselines, profile, wellness)
  }

  const summary = buildWeeklyDataSummary(watchRows, voiceLogs, baselines, profile)
  const week = watchRows.slice(-7)
  const dateRange =
    week.length > 0 ? { start: week[0].date, end: week[week.length - 1].date } : null

  const weatherHint = wellness
    ? `\n【来信开头必须融入】${wellness.bodyWeather.letterOpener}\n【语气参考】${wellness.mood.gentleNote ?? ''}`
    : ''

  const practiceHint = getLetterPracticeHint(getWuyinPracticeStats())
  const practiceHintLine = practiceHint
    ? `\n【可选表扬】若语气自然，可在信中轻轻提及：${practiceHint}`
    : ''

  const replyHint = formatReplyHintForLetter()
  const replyHintLine = replyHint ? `\n【${replyHint}】` : ''

  const userPrompt = `${summary}${weatherHint}${practiceHintLine}${replyHintLine}\n\n请根据以上数据生成本周健康来信。`

  try {
    const raw = await callLLMGeneral(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.7,
      jsonMode: true,
    })

    const json = JSON.parse(raw.replace(/```json?\s*|\s*```/g, '')) as {
      score?: number
      letter?: string
    }

    const score =
      typeof json.score === 'number' && json.score >= 0 && json.score <= 100
        ? Math.round(json.score)
        : null
    const letter =
      typeof json.letter === 'string' && json.letter.trim() ? json.letter.trim() : null

    if (!letter) throw new Error('LLM 未生成有效信件内容')

    return {
      score,
      letter: prependWellnessOpener(letter, wellness),
      insufficientData: false,
      dateRange,
    }
  } catch (err) {
    console.warn('Weekly letter LLM generation failed, using fallback:', err)
    return buildFallbackLetter(watchRows, voiceLogs, baselines, profile, wellness)
  }
}
