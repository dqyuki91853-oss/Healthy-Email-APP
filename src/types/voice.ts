export type PortionSize = 'small' | 'medium' | 'large' | 'unknown'

import type { FollowUpAspect } from '../lib/followUpAspect'

export type FollowUpField =
  | 'portion'
  | 'components'
  | 'cooking'
  | 'emotion'
  | 'symptom'
  | 'timing'
  | 'db_match'
  | 'soup'
  | 'sugar'
  | 'general'

/** 食物大类，驱动分类追问模板 */
export type FoodCategory =
  | 'noodle'
  | 'rice'
  | 'congee'
  | 'dim_sum'
  | 'bread_pastry'
  | 'meat'
  | 'seafood'
  | 'vegetable'
  | 'soup'
  | 'stir_fry'
  | 'hotpot'
  | 'beverage'
  | 'milk_tea'
  | 'alcohol'
  | 'fruit'
  | 'snack'
  | 'takeaway'
  | 'dessert'
  | 'generic'

export type UncertaintyKind =
  | 'portion_vague'
  | 'compound_undecomposed'
  | 'cooking_unknown'
  | 'db_ambiguous'
  | 'food_unspecified'
  | 'protein_unknown'
  | 'soup_unknown'
  | 'sweetness_unknown'
  | 'quantity_unknown'

/** 追问类型：A分量 / B复合拆解 / C细节 */
export type FollowUpType = 'portion' | 'decompose' | 'detail'

/** P0-P4 优先级 */
export type FollowUpPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'

export interface PortionOption {
  label: string
  value: string
  emoji?: string
  approxGrams?: number
}

export interface SubFoodItem {
  name: string
  amountG?: number
  confidence: 'high' | 'medium' | 'low'
  proportion?: number
}

export interface FollowUpQuestion {
  id: string
  question: string
  reason: string
  field: FollowUpField
  /** 兼容旧版 1-10，新版用 priorityLevel */
  priority: number
  priorityLevel?: FollowUpPriority
  followUpType?: FollowUpType
  targetFood?: string
  quickOptions?: string[]
  portionOptions?: PortionOption[]
  /** 类型 B：复合菜默认拆解 */
  compoundSubItems?: SubFoodItem[]
  /** 分类勾选面板（来自复合菜数据库） */
  compoundPickGroups?: Array<{ label: string; items: SubFoodItem[] }>
  compoundCategory?: string
  multiSelect?: boolean
  roundIndex?: number
}

export interface FollowUpAnswerRecord {
  questionId: string
  question: string
  answer: string
  aspect?: FollowUpAspect
  round: number
}

export interface FollowupMeta {
  roundsTriggered: number
  questionsAsked: string[]
  questionsSkipped: string[]
  unresolvedFlags: string[]
  /** P0-b: stable aspect keys for multi-round dedup */
  askedStableKeys?: string[]
  /** Persisted Q&A for diet list / App sync */
  answers?: FollowUpAnswerRecord[]
}

export interface FoodEntry {
  name: string
  cookingMethod?: string
  portion: PortionSize
  confidence: number
  categories: string[]
  components?: string[]
  isComposite?: boolean
  subItems?: SubFoodItem[]
  amountG?: number
  portionConfidence?: number
  missingDetails?: string[]
  /** 抽取不确定说明（非精确营养素，仅供模式分析） */
  uncertaintyNotes?: string[]
  dbMatchHint?: string
  /** 分量待确认 */
  unresolved?: boolean
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'unknown'

export interface VoiceExtraction {
  id: string
  timestamp: string
  /** 记录归属日期 YYYY-MM-DD（可与录入时刻不同，支持补记） */
  recordDate: string
  mealSlot?: MealSlot
  transcript: string
  foods: FoodEntry[]
  emotions: string[]
  symptoms: string[]
  stressScore: number | null
  brainFogScore: number | null
  needsFollowUp: boolean
  followUpQuestions: FollowUpQuestion[]
  overallConfidence: number
  extractionSource: 'llm' | 'local'
  mealSummary?: string
  /** 探测到的不确定性信号（驱动混合式追问） */
  uncertaintySignals?: Array<{
    kind: UncertaintyKind
    severity: string
    detail: string
    category?: FoodCategory
  }>
  extractionDisclaimer?: string
  /** 追问场景说明（餐次/当日已有记录） */
  followUpHint?: string
  followupMeta?: FollowupMeta
  followUpRound?: number
}

export interface DietPatternCounts {
  purineSources: number
  fructoseSources: number
  alcoholEvents: number
  highGlMeals: number
  fiberGapDays: number
  lowIronPattern: boolean
  fodmapFrequency: number
  dhaInsufficient: boolean
  emotionalEating: boolean
  caffeineDependency: boolean
  lowProteinBreakfast: number
}
