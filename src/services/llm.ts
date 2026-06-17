import type { FoodEntry, FollowUpQuestion, PortionSize, VoiceExtraction } from '../types/voice'
import { resolveLlmConfig } from '../config/llm'
import { v4 } from '../engine/uuid'
import {
  getFollowUpCountForDate,
  getFollowUpSettings,
  selectFollowUpQuestions,
  shouldAskFollowUp,
  shouldAskFollowUpWithGaps,
} from './followUpTracker'
import {
  buildLlmMealContextBlock,
  enhanceFollowUpsForMeal,
  type MealExtractContext,
} from './mealContext'
import { todayStr } from '../lib/dates'
import {
  annotateFoodUncertainties,
  buildFollowUpsFromSignals,
  computeOverallConfidence,
  detectUncertainties,
  hasCriticalUncertainty,
  mergeFollowUpQuestions,
} from './uncertaintyDetector'
import { applyHistoryDefaults, learnFromExtraction } from './dietHistory'
import { runFuzzyDetection } from './fuzzyDetector'
import { buildFollowUpDecision, mergeFollowUpRound } from './followUpDecision'
import { matchCompoundTemplate } from '../config/compoundTemplates'

const PURINE_KEYWORDS = ['红肉', '牛肉', '羊肉', '内脏', '猪肝', '海鲜', '虾', '蟹', '啤酒', '生蚝']
const FRUCTOSE_KEYWORDS = ['可乐', '汽水', '奶茶', '果汁', '蜂蜜', '含糖']
const HIGH_GI_KEYWORDS = ['白米饭', '面条', '面包', '蛋糕', '甜点', '油条']
const FODMAP_KEYWORDS = ['洋葱', '大蒜', '豆类', '牛奶', '芝士']
const FISH_KEYWORDS = ['鱼', '三文鱼', '鲑鱼', '金枪鱼']
const CAFFEINE_KEYWORDS = ['咖啡', '浓茶', '红牛', '咖啡因']
const ALCOHOL_KEYWORDS = ['酒', '啤酒', '白酒', '红酒', '威士忌']
const EMOTION_KEYWORDS: Record<string, string[]> = {
  焦虑: ['焦虑', '紧张', '担心'],
  低落: ['低落', '沮丧', '难过', '抑郁'],
  易怒: ['易怒', '烦躁', '生气'],
  平静: ['平静', '还好', '不错'],
}
const SYMPTOM_KEYWORDS = ['腹胀', '不适', '疲劳', '头痛', '关节']

const EXTRACTION_DISCLAIMER =
  '饮食条目为模式/频率分析用途，营养素为估算值非精确计算；中文复杂饮食的 LLM 抽取尚无成熟开源基准。'

const SYSTEM_PROMPT = `你是亚健康监测 App 的「文字→结构化食物」抽取层助手。这是整个链路最核心也最容易出错的环节。

【认知约束——必须遵守】
- LLM 复杂食物名称到营养素估计目前没有成熟的开源验证基准
- 中文高多样性饮食场景仍是待验证问题；你的输出是「模式分析」而非精确营养计算
- 对不确定项诚实地降低 confidence，并生成追问，不要过度自信

【四类核心难点】
1. 分量模糊："一份""一碟""差不多了" → 无法精确估计，需追问碗/盘大小
2. 复合菜品："红烧牛肉面"必须拆成 面+牛肉+红油+蔬菜+汤底 各自估量，禁止映射为单一食物
3. 烹饪差异：同样土豆蒸≠炸，烹饪方式不明时必须标注并追问
4. 数据库歧义："青菜"可能是小白菜/上海青/油菜，优先标注 dbMatchHint 为中国食物成分表候选

【混合式追问策略——不是每顿都问，全品类适用】
追问分三层：①模糊检测 ②决策合并 ③UI 展示。置信度 >90% 不追问；60–90% 轻量确认；<60% 详细追问。
仅当存在上述难点时生成 followUpQuestions。每轮最多 4 个合并式追问（类型 A 分量 / B 复合拆解 / C 细节）。
品类追问示例（根据用户口述选用，不要套用无关品类）：
- 面食笼统："中午吃了碗面" → 什么面？多大碗？有肉吗？汤喝了吗？
- 米饭笼统："吃了饭" → 什么菜搭配？多少饭？
- 粥类："喝了粥" → 什么粥？多大碗？有配料吗？
- 饺子/包子："吃了饺子" → 什么馅？多少个？水煮还是蒸？
- 肉类笼统："吃了肉" → 什么肉？怎么做的？多少？
- 海鲜："吃了海鲜" → 具体什么？怎么做的？
- 蔬菜歧义："吃了青菜" → 具体品种？怎么做的？
- 火锅/麻辣烫 → 什么锅底？涮了什么？喝汤吗？
- 奶茶/饮料 → 什么品牌/种类？甜度？多大杯？
- 酒精 → 什么酒？多少？
- 水果/零食 → 什么？多少？
- 外卖笼统 → 点的什么？主菜？份量？
- 整体笼统："吃了点东西" → 主食+主菜？份量？

【餐次衍生追问——用户消息中会提供餐次与当日已有记录】
- 早餐：侧重蛋白质搭配、空腹咖啡/茶
- 午餐：侧重外食主菜构成、荤素搭配
- 晚餐：侧重份量是否偏多、餐后甜品/宵夜
- 加餐：侧重零食种类、进食动机（饿/压力/习惯）
- 若当日已有饮食记录，勿重复追问已明确信息（面种、汤底、甜度等）

【抽取任务】
1. 拆解独立食物条目，复合菜必须给出 components
2. 标注 cookingMethod、portion、categories（亚健康相关标签）
3. 提取情绪、症状、压力/脑雾评分（1-10，未提及为 null）
4. 同音纠错（"黄烧牛肉"→"红烧牛肉"）写入 notes

【categories 可选】
purine, red_meat, seafood, organ, beer, fructose, sugary_drink, juice, honey, alcohol,
high_gi, refined_carb, low_fiber, high_fodmap, fish, dha, caffeine, emotional_eating,
late_snack, low_protein_breakfast, low_iron

【输出】仅合法 JSON：
{
  "foods": [{
    "name": "食物名",
    "cookingMethod": "蒸|炒|炸|煮|红烧|null",
    "portion": "small|medium|large|unknown",
    "confidence": 0.0-1.0,
    "categories": [],
    "components": ["拆解组分"],
    "notes": "歧义说明",
    "dbMatchHint": "中国食物成分表候选名"
  }],
  "emotions": [],
  "symptoms": [],
  "stressScore": null,
  "brainFogScore": null,
  "overallConfidence": 0.0-1.0,
  "mealSummary": "一句话总结（含不确定性说明）",
  "followUpQuestions": [{
    "question": "合并式精准追问",
    "reason": "对应四类难点中的哪一种",
    "field": "portion|components|cooking|db_match|emotion|symptom|timing|general",
    "priority": 1,
    "quickOptions": ["快捷选项"]
  }]
}`

interface LlmRawResponse {
  foods?: Array<{
    name?: string
    cookingMethod?: string | null
    portion?: string
    confidence?: number
    categories?: string[]
    components?: string[]
    notes?: string
    dbMatchHint?: string
  }>
  emotions?: string[]
  symptoms?: string[]
  stressScore?: number | null
  brainFogScore?: number | null
  overallConfidence?: number
  mealSummary?: string
  followUpQuestions?: Array<{
    question?: string
    reason?: string
    field?: string
    priority?: number
    quickOptions?: string[]
  }>
}

function matchCategories(text: string): string[] {
  const cats: string[] = []
  if (PURINE_KEYWORDS.some((k) => text.includes(k))) cats.push('purine', 'red_meat')
  if (FRUCTOSE_KEYWORDS.some((k) => text.includes(k))) cats.push('fructose', 'sugary_drink')
  if (HIGH_GI_KEYWORDS.some((k) => text.includes(k))) cats.push('high_gi', 'refined_carb')
  if (FODMAP_KEYWORDS.some((k) => text.includes(k))) cats.push('high_fodmap')
  if (FISH_KEYWORDS.some((k) => text.includes(k))) cats.push('fish', 'dha')
  if (CAFFEINE_KEYWORDS.some((k) => text.includes(k))) cats.push('caffeine')
  if (ALCOHOL_KEYWORDS.some((k) => text.includes(k))) cats.push('alcohol')
  if (text.includes('零食') || text.includes('宵夜')) cats.push('emotional_eating', 'late_snack')
  if (text.includes('早餐') && (text.includes('没吃') || text.includes('面包'))) cats.push('low_protein_breakfast')
  if (!text.includes('蔬菜') && text.includes('饭')) cats.push('low_fiber')
  return cats
}

function normalizePortion(p?: string): PortionSize {
  if (p === 'small' || p === 'medium' || p === 'large') return p
  if (p === '小份' || p === '小') return 'small'
  if (p === '大份' || p === '大') return 'large'
  return 'unknown'
}

function localExtractFoods(text: string): FoodEntry[] {
  const segments = text.split(/[，,、；;然后还有吃了]/).map((s) => s.trim()).filter(Boolean)
  if (segments.length === 0 && text.trim()) {
    return [{
      name: text.trim().slice(0, 40),
      portion: /[大中小]碗/.test(text) ? (text.includes('大') ? 'large' : text.includes('小') ? 'small' : 'medium') : 'unknown',
      confidence: /吃了.*面/.test(text) ? 0.38 : 0.5,
      categories: matchCategories(text),
      components: /面/.test(text) ? undefined : undefined,
    }]
  }
  return segments.slice(0, 6).map((seg) => {
    const vague = /一份|一碟|差不多|有点|吃了点/.test(seg)
    const confidence = seg.length < 4 ? 0.35 : vague ? 0.48 : /面$|碗面/.test(seg) ? 0.42 : 0.68
    return {
      name: seg.slice(0, 40),
      portion: seg.includes('大') ? 'large' : seg.includes('小') ? 'small' : vague ? 'unknown' : 'medium',
      confidence,
      categories: matchCategories(seg),
      components: COMPOUND_HINT.test(seg) ? undefined : seg.includes('面') ? undefined : undefined,
    }
  })
}

const COMPOUND_HINT = /红烧|牛肉面|炸酱|麻辣烫|盖饭|炒饭/

function localExtract(
  transcript: string,
  settings: Awaited<ReturnType<typeof getFollowUpSettings>>,
): Omit<VoiceExtraction, 'id' | 'timestamp' | 'recordDate' | 'mealSlot'> {
  let foods = applyHistoryDefaults(
    enrichFoods(transcript, localExtractFoods(transcript)),
    settings.learnThreshold,
  )
  const signals = detectUncertainties(transcript, foods)
  const annotatedFoods = annotateFoodUncertainties(foods, signals)
  const followUpQuestions = buildThreeLayerFollowUps(transcript, foods, signals, [], settings)
  const overallConfidence = computeOverallConfidence(foods, signals)

  return {
    transcript,
    foods: annotatedFoods,
    emotions: Object.entries(EMOTION_KEYWORDS).filter(([, keys]) => keys.some((k) => transcript.includes(k))).map(([e]) => e),
    symptoms: SYMPTOM_KEYWORDS.filter((k) => transcript.includes(k)),
    stressScore: (() => { const m = transcript.match(/压力[：:]?\s*(\d+)/); return m ? parseInt(m[1], 10) : null })(),
    brainFogScore: (() => { const m = transcript.match(/脑雾[：:]?\s*(\d+)/); return m ? parseInt(m[1], 10) : null })(),
    needsFollowUp: followUpQuestions.length > 0,
    followUpQuestions,
    overallConfidence,
    extractionSource: 'local',
    uncertaintySignals: signals.map((s) => ({ kind: s.kind, severity: s.severity, detail: s.detail })),
    extractionDisclaimer: EXTRACTION_DISCLAIMER,
  }
}

async function callLlm(
  transcript: string,
  supplementalContext?: string,
  mealContext?: MealExtractContext,
): Promise<LlmRawResponse> {
  const settings = await getFollowUpSettings()
  const config = resolveLlmConfig(settings.llmApiKey)
  if (!config) throw new Error('未配置 LLM API Key')

  const mealBlock = mealContext ? `\n\n【餐饮场景】\n${buildLlmMealContextBlock(mealContext, transcript)}` : ''
  const userContent = supplementalContext
    ? `【原始口述】\n${transcript}\n\n【用户补充回答】\n${supplementalContext}\n\n请结合补充信息重新抽取，提高 confidence，减少不必要的追问。${mealBlock}`
    : `${transcript}${mealBlock}`

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.15,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`LLM 请求失败 (${res.status})${err ? `: ${err.slice(0, 150)}` : ''}`)
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM 返回为空')

  return JSON.parse(content.replace(/```json?\s*|\s*```/g, '')) as LlmRawResponse
}

function enrichFoods(transcript: string, foods: FoodEntry[]): FoodEntry[] {
  return foods.map((f) => {
    const compound = matchCompoundTemplate(f.name, transcript)
    return {
      ...f,
      isComposite: Boolean(f.isComposite ?? compound),
      subItems: f.subItems ?? compound?.defaultSubItems,
    }
  })
}

function buildThreeLayerFollowUps(
  transcript: string,
  foods: FoodEntry[],
  signals: ReturnType<typeof detectUncertainties>,
  llmFollowUps: FollowUpQuestion[],
  settings: Awaited<ReturnType<typeof getFollowUpSettings>>,
  previousQuestionKeys?: string[],
): FollowUpQuestion[] {
  const gaps = runFuzzyDetection(transcript, foods, signals)
  const decisionQs = buildFollowUpDecision(gaps, transcript, foods, {
    confidenceThreshold: settings.confidenceThreshold,
    maxQuestionsPerRound: settings.maxQuestionsPerRound,
    learnThreshold: settings.learnThreshold,
    doNotDisturb: settings.doNotDisturb,
    previousQuestionKeys,
  })
  const signalFollowUps = buildFollowUpsFromSignals(signals)
  const merged = mergeFollowUpQuestions(llmFollowUps, signalFollowUps, decisionQs)
  const rounded = mergeFollowUpRound(merged)

  // Cross-round dedup: filter out questions whose key matches previously asked ones
  if (previousQuestionKeys && previousQuestionKeys.length > 0) {
    const prevSet = new Set(previousQuestionKeys)
    return rounded.filter((q) => {
      const key = `${q.followUpType ?? ''}-${q.targetFood ?? ''}-${q.field}`
      return !prevSet.has(key)
    })
  }
  return rounded
}

function mapLlmResponse(
  transcript: string,
  raw: LlmRawResponse,
  settings: Awaited<ReturnType<typeof getFollowUpSettings>>,
  previousQuestionKeys?: string[],
): Omit<VoiceExtraction, 'id' | 'timestamp' | 'recordDate' | 'mealSlot'> {
  let foods: FoodEntry[] = (raw.foods ?? []).map((f) => ({
    name: f.name ?? '未知食物',
    cookingMethod: f.cookingMethod ?? undefined,
    portion: normalizePortion(f.portion),
    confidence: Math.min(1, Math.max(0, f.confidence ?? 0.6)),
    categories: f.categories ?? [],
    components: f.components,
    dbMatchHint: f.dbMatchHint,
  }))

  foods = applyHistoryDefaults(enrichFoods(transcript, foods), settings.learnThreshold)

  const llmFollowUps: FollowUpQuestion[] = (raw.followUpQuestions ?? [])
    .filter((q) => q.question)
    .map((q) => ({
      id: v4(),
      question: q.question!,
      reason: q.reason ?? '抽取信息不足',
      field: (q.field as FollowUpQuestion['field']) ?? 'general',
      priority: q.priority ?? 2,
      quickOptions: q.quickOptions,
    }))

  const signals = detectUncertainties(transcript, foods)
  const mergedFollowUps = buildThreeLayerFollowUps(transcript, foods, signals, llmFollowUps, settings, previousQuestionKeys)
  const annotatedFoods = annotateFoodUncertainties(foods, signals)

  const llmConfidence = raw.overallConfidence ?? (
    foods.length ? foods.reduce((s, f) => s + f.confidence, 0) / foods.length : 0.5
  )
  const detectorConfidence = computeOverallConfidence(foods, signals)
  const overallConfidence = Math.min(llmConfidence, detectorConfidence)

  return {
    transcript,
    foods: annotatedFoods,
    emotions: raw.emotions ?? [],
    symptoms: raw.symptoms ?? [],
    stressScore: raw.stressScore ?? null,
    brainFogScore: raw.brainFogScore ?? null,
    needsFollowUp: false,
    followUpQuestions: mergedFollowUps,
    overallConfidence,
    extractionSource: 'llm',
    mealSummary: raw.mealSummary,
    uncertaintySignals: signals.map((s) => ({ kind: s.kind, severity: s.severity, detail: s.detail })),
    extractionDisclaimer: EXTRACTION_DISCLAIMER,
  }
}

function backfillFollowUpQuestions(
  transcript: string,
  foods: FoodEntry[],
  questions: FollowUpQuestion[],
): FollowUpQuestion[] {
  if (questions.length > 0) return questions
  const signals = detectUncertainties(transcript, foods)
  if (signals.length === 0) return []
  return buildFollowUpsFromSignals(signals)
}

function shouldUseGapDrivenFollowUp(
  result: Omit<VoiceExtraction, 'id' | 'timestamp' | 'recordDate' | 'mealSlot'>,
  critical: boolean,
  settings: Awaited<ReturnType<typeof getFollowUpSettings>>,
): boolean {
  if (result.extractionSource === 'local') return true
  if (result.overallConfidence < settings.confidenceThreshold) return true
  if (critical) return true
  if ((result.uncertaintySignals?.length ?? 0) > 0 && result.overallConfidence < 0.75) return true
  return false
}

function finalizeExtraction(
  result: Omit<VoiceExtraction, 'id' | 'timestamp' | 'recordDate' | 'mealSlot'>,
  settings: Awaited<ReturnType<typeof getFollowUpSettings>>,
  options: ExtractOptions,
): Omit<VoiceExtraction, 'id' | 'timestamp' | 'recordDate' | 'mealSlot'> {
  const critical = hasCriticalUncertainty(
    (result.uncertaintySignals ?? []).map((s) => ({
      kind: s.kind,
      severity: s.severity as 'high' | 'medium',
      detail: s.detail,
    })),
  )

  let followUpHint: string | undefined
  let mergedQuestions = result.followUpQuestions

  if (options.mealContext) {
    const enhanced = enhanceFollowUpsForMeal(mergedQuestions, options.mealContext, result.transcript)
    mergedQuestions = enhanced.questions
    followUpHint = enhanced.hint
  }

  mergedQuestions = backfillFollowUpQuestions(result.transcript, result.foods, mergedQuestions)

  const selected = selectFollowUpQuestions(mergedQuestions, settings.maxQuestionsPerRound)
  const recordDate = options.mealContext?.recordDate ?? todayStr()
  const askedOnDate = getFollowUpCountForDate(settings, recordDate)

  const gapDriven = shouldUseGapDrivenFollowUp(result, critical, settings) && selected.length > 0
  const needsFollowUp = options.skipFollowUpLimit
    ? selected.length > 0 && (result.overallConfidence < settings.confidenceThreshold || critical)
    : gapDriven
      ? shouldAskFollowUpWithGaps(selected, askedOnDate, settings)
      : shouldAskFollowUp(
          result.overallConfidence,
          selected,
          askedOnDate,
          settings,
          critical && result.overallConfidence < 0.75,
        )

  const unresolvedFlags = selected.map((q) => q.targetFood ?? q.field).filter(Boolean)
  const followupMeta = needsFollowUp
    ? {
        roundsTriggered: (result.followupMeta?.roundsTriggered ?? 0) + 1,
        questionsAsked: selected.map((q) => q.id),
        questionsSkipped: result.followupMeta?.questionsSkipped ?? [],
        unresolvedFlags,
        askedStableKeys: result.followupMeta?.askedStableKeys,
        answers: result.followupMeta?.answers,
      }
    : result.followupMeta

  if (needsFollowUp && selected.length > 0) {
    return {
      ...result,
      needsFollowUp: true,
      followUpQuestions: selected,
      followUpHint,
      followupMeta,
      followUpRound: (result.followUpRound ?? 0) + 1,
      foods: result.foods.map((f) => ({
        ...f,
        unresolved: unresolvedFlags.some((flag) => f.name.includes(flag) || flag === f.name),
      })),
    }
  }
  return { ...result, needsFollowUp: false, followUpQuestions: [], followUpHint, followupMeta }
}

export interface ExtractOptions {
  supplementalContext?: string
  skipFollowUpLimit?: boolean
  mealContext?: MealExtractContext
  /** Keys from previously asked questions (format: `${followUpType}-${foodName}-${field}`) to prevent repeats */
  previousQuestionKeys?: string[]
}

export async function extractFromTranscript(
  transcript: string,
  options: ExtractOptions = {},
): Promise<Omit<VoiceExtraction, 'id' | 'timestamp' | 'recordDate' | 'mealSlot'>> {
  const settings = await getFollowUpSettings()

  try {
    const raw = await callLlm(transcript, options.supplementalContext, options.mealContext)
    const result = mapLlmResponse(transcript, raw, settings, options.previousQuestionKeys)
    return finalizeExtraction(result, settings, options)
  } catch (err) {
    console.warn('LLM extraction failed, falling back to local:', err)
    const mergedTranscript = options.supplementalContext
      ? `${transcript}\n${options.supplementalContext}`
      : transcript
    const local = localExtract(mergedTranscript, settings)
    return finalizeExtraction(local, settings, options)
  }
}

export { learnFromExtraction }

/**
 * General-purpose LLM call. Reuses resolveLlmConfig for API credentials.
 * Unlike the private callLlm (tightly coupled to food extraction),
 * this is a minimal, reusable function for any LLM task.
 */
export async function callLLMGeneral(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; jsonMode?: boolean },
): Promise<string> {
  const settings = await getFollowUpSettings()
  const config = resolveLlmConfig(settings.llmApiKey)
  if (!config) throw new Error('LLM API Key 未配置')

  const body: Record<string, unknown> = {
    model: config.model,
    temperature: options?.temperature ?? 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }
  if (options?.jsonMode !== false) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`LLM 请求失败 (${res.status})${err ? `: ${err.slice(0, 150)}` : ''}`)
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM 返回为空')
  return content
}

export function buildVoiceLog(
  transcript: string,
  extraction: Omit<VoiceExtraction, 'id' | 'timestamp' | 'recordDate'>,
  recordDate: string,
  mealSlot?: VoiceExtraction['mealSlot'],
): VoiceExtraction {
  return {
    id: v4(),
    timestamp: new Date().toISOString(),
    recordDate,
    mealSlot,
    ...extraction,
    transcript,
  }
}
