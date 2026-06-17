import { COMPOUND_TEMPLATES, matchCompoundTemplate } from '../config/compoundTemplates'
import {
  buildCatalogDecomposeQuestion,
  buildCatalogPortionQuestion,
  buildCatalogSecondaryQuestion,
  matchCompoundCatalog,
} from '../config/compoundDishCatalog'
import { PORTION_OPTIONS } from '../config/portionReferences'
import type { FollowUpQuestion, FoodEntry } from '../types/voice'
import { shouldSkipPortionFollowUp } from './dietHistory'
import type { FuzzyGap } from './fuzzyDetector'
import { confidenceTier } from './fuzzyDetector'
import { buildGapStableKey } from '../lib/followUpAspect'
import { capCompoundFollowUps } from './followUpDedup'

export interface FollowUpDecisionConfig {
  confidenceThreshold: number
  maxQuestionsPerRound: number
  learnThreshold: number
  doNotDisturb: boolean
  /** Keys from previous rounds to skip (format: `${followUpType}-${foodName}-${field}`) */
  previousQuestionKeys?: string[]
}

const DEFAULT_CONFIG: FollowUpDecisionConfig = {
  confidenceThreshold: 0.7,
  maxQuestionsPerRound: 4,
  learnThreshold: 3,
  doNotDisturb: false,
}

function buildPortionQuestion(gap: FuzzyGap, tier: 'medium' | 'low'): FollowUpQuestion {
  const isRice = /饭|面|粥/.test(gap.foodName)
  const isMeat = /肉|牛|猪|鸡|鱼|虾/.test(gap.foodName)
  const options = isMeat
    ? PORTION_OPTIONS.meat
    : isRice
      ? PORTION_OPTIONS.rice
      : PORTION_OPTIONS.bowl

  return {
    id: `portion-${gap.foodIndex}-${gap.foodName}`,
    question:
      tier === 'low'
        ? `「${gap.foodName}」吃了多少？选一个最接近的参考量`
        : `确认一下「${gap.foodName}」的分量？`,
    reason: gap.reason,
    field: 'portion',
    priority: gap.priority,
    priorityLevel: gap.priorityLevel,
    followUpType: 'portion',
    targetFood: gap.foodName,
    portionOptions: options.map((o) => ({
      label: o.label,
      value: o.value,
      emoji: 'emoji' in o ? (o as { emoji: string }).emoji : undefined,
    })),
    quickOptions: options.map((o) => o.label),
    roundIndex: 0,
  }
}

function buildDecomposeQuestion(gap: FuzzyGap, transcript: string): FollowUpQuestion {
  const catalog = matchCompoundCatalog(gap.foodName, transcript)
  if (catalog) {
    return buildCatalogDecomposeQuestion(
      gap.foodName,
      catalog,
      gap.priority,
      gap.priorityLevel,
    )
  }

  const template =
    matchCompoundTemplate(gap.foodName, transcript) ??
    COMPOUND_TEMPLATES.find((t) => t.category === gap.compoundCategory)

  return {
    id: `decompose-${gap.foodIndex}-${gap.foodName}`,
    question: `「${gap.foodName}」里主要吃了哪些？可勾选或语音补充`,
    reason: gap.reason,
    field: 'components',
    priority: gap.priority,
    priorityLevel: gap.priorityLevel,
    followUpType: 'decompose',
    targetFood: gap.foodName,
    compoundSubItems: template?.defaultSubItems ?? [],
    compoundCategory: template?.category ?? gap.compoundCategory,
    multiSelect: true,
    quickOptions: template?.followUpFields,
    roundIndex: 0,
  }
}

function buildCatalogAwarePortionQuestion(gap: FuzzyGap, transcript: string): FollowUpQuestion | null {
  const catalog = matchCompoundCatalog(gap.foodName, transcript)
  if (catalog) {
    return buildCatalogPortionQuestion(gap.foodName, catalog, gap.priority, gap.priorityLevel)
  }
  return null
}

function buildDetailQuestion(gap: FuzzyGap): FollowUpQuestion {
  const detail = gap.missingDetails[0] ?? '细节'
  return {
    id: `detail-${gap.foodIndex}-${detail}`,
    question: `关于「${gap.foodName}」：${detail}是？`,
    reason: gap.reason,
    field: detail.includes('汤') ? 'soup' : detail.includes('糖') ? 'sugar' : 'cooking',
    priority: gap.priority,
    priorityLevel: gap.priorityLevel,
    followUpType: 'detail',
    targetFood: gap.foodName,
    quickOptions: quickOptionsForDetail(detail),
    roundIndex: 0,
  }
}

function quickOptionsForDetail(detail: string): string[] {
  if (detail.includes('烹饪')) return ['炒', '炸', '蒸', '煮', '烤', '生吃']
  if (detail.includes('汤')) return ['全喝了', '喝了一半', '没喝汤']
  if (detail.includes('锅底')) return ['清汤', '麻辣', '番茄', '菌汤']
  if (detail.includes('糖')) return ['无糖', '三分糖', '半糖', '全糖']
  if (detail.includes('量')) return ['1杯', '2杯', '半瓶', '1瓶']
  return ['是', '否', '不确定']
}

/** 第二层：追问决策引擎 */
export function buildFollowUpDecision(
  gaps: FuzzyGap[],
  transcript: string,
  foods: FoodEntry[],
  config: Partial<FollowUpDecisionConfig> = {},
): FollowUpQuestion[] {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  if (cfg.doNotDisturb) return []

  const overallConf =
    foods.length > 0
      ? foods.reduce((s, f) => s + (f.confidence ?? 0.5), 0) / foods.length
      : 0.5

  if (overallConf >= 0.9 && gaps.every((g) => g.portionConfidence >= 0.9)) {
    return []
  }

  const seen = new Set<string>(cfg.previousQuestionKeys ?? [])
  const questions: FollowUpQuestion[] = []
  const addedDecomposeFor = new Set<string>()

  // Filter out gaps that match previously asked questions (cross-round dedup)
  const freshGaps = cfg.previousQuestionKeys?.length
    ? gaps.filter((gap) => {
        const dedupeKey = buildGapStableKey(gap)
        return !seen.has(dedupeKey)
      })
    : gaps

  for (const gap of freshGaps) {
    if (questions.length >= cfg.maxQuestionsPerRound) break

    const dedupeKey = buildGapStableKey(gap)
    if (seen.has(dedupeKey)) continue

    if (gap.followUpType === 'portion') {
      if (addedDecomposeFor.has(gap.foodName)) continue

      const catalogPortion = buildCatalogAwarePortionQuestion(gap, transcript)
      if (catalogPortion) {
        questions.push(catalogPortion)
        seen.add(dedupeKey)
        continue
      }

      const hist = shouldSkipPortionFollowUp(gap.foodName, cfg.learnThreshold)
      if (hist.skip) continue
      if (gap.portionConfidence >= 0.9) continue

      const tier = confidenceTier(gap.portionConfidence)
      if (tier === 'high') continue
      if (tier === 'medium' && gap.portionConfidence >= cfg.confidenceThreshold) {
        gap.priority = Math.min(gap.priority, 5)
        gap.priorityLevel = 'P3'
      }
      questions.push(buildPortionQuestion(gap, tier === 'low' ? 'low' : 'medium'))
      seen.add(dedupeKey)
    } else if (gap.followUpType === 'decompose') {
      questions.push(buildDecomposeQuestion(gap, transcript))
      addedDecomposeFor.add(gap.foodName)
      seen.add(dedupeKey)

      const catalog = matchCompoundCatalog(gap.foodName, transcript)
      const secondary = catalog ? buildCatalogSecondaryQuestion(gap.foodName, catalog) : null
      if (secondary && questions.length < cfg.maxQuestionsPerRound) {
        questions.push(secondary)
      }
    } else if (gap.followUpType === 'detail') {
      if (addedDecomposeFor.has(gap.foodName)) continue
      if (gap.portionConfidence < cfg.confidenceThreshold || gap.priorityLevel !== 'P4') {
        questions.push(buildDetailQuestion(gap))
        seen.add(dedupeKey)
      }
    }
  }

  const capped = capCompoundFollowUps(questions, 2)
  return capped.sort((a, b) => b.priority - a.priority).slice(0, cfg.maxQuestionsPerRound)
}

/** 合并多轮追问到单卡片（最多 4 子问题） */
export function mergeFollowUpRound(questions: FollowUpQuestion[]): FollowUpQuestion[] {
  if (questions.length <= 4) return questions
  return questions.slice(0, 4)
}
