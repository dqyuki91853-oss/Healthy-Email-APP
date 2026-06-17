import type {
  FoodCategory,
  FoodEntry,
  FollowUpField,
  FollowUpQuestion,
  UncertaintyKind,
} from '../types/voice'
import { v4 } from '../engine/uuid'
import { capCompoundFollowUps, dedupeFollowUpQuestions } from './followUpDedup'
import {
  COOKING_METHOD_PATTERN,
  COOKING_SENSITIVE_PATTERN,
  COMPOUND_DISH_PATTERN,
  FOOD_PROFILES,
  hasSizedPortion,
  matchCompoundInText,
  matchFoodProfile,
  PROTEIN_PATTERN,
  SOUP_CONSUMED_PATTERN,
  VAGUE_PORTION_PATTERN,
} from './foodProfiles'

export interface UncertaintySignal {
  kind: UncertaintyKind
  severity: 'high' | 'medium'
  target?: string
  detail: string
  category?: FoodCategory
}

export function detectUncertainties(transcript: string, foods: FoodEntry[]): UncertaintySignal[] {
  const t = transcript.trim()
  const signals: UncertaintySignal[] = []
  const foodNames = foods.map((f) => f.name).join(' ')

  // ── 1. 分量模糊（全品类通用）──
  if ((VAGUE_PORTION_PATTERN.test(t) || /吃了?(?:碗|盘|杯|份)/.test(t)) && !hasSizedPortion(t)) {
    signals.push({
      kind: 'portion_vague',
      severity: 'high',
      detail: '分量描述模糊（"一份""一碟""差不多了"等），全品类营养素只能做模式分析',
    })
  }
  for (const food of foods) {
    if (food.portion === 'unknown' && food.confidence < 0.7) {
      signals.push({
        kind: 'portion_vague',
        severity: 'medium',
        target: food.name,
        detail: `「${food.name}」份量仍未明确`,
      })
    }
  }

  // ── 2. 全品类食物笼统（按 foodProfiles 逐类探测）──
  const matchedProfiles = new Set<FoodCategory>()
  for (const profile of FOOD_PROFILES) {
    const textHit = profile.genericPattern.test(t) && !profile.specificPattern.test(t)
    const foodHit = foods.some(
      (f) => profile.genericPattern.test(f.name) && !profile.specificPattern.test(f.name),
    )
    if (textHit || foodHit) {
      matchedProfiles.add(profile.category)
      signals.push({
        kind: 'food_unspecified',
        severity: 'high',
        category: profile.category,
        target: profile.label,
        detail: profile.detectDetail,
      })
    }
  }

  // 短文本仅提及大类而无具体食物条目
  if (foods.length <= 1 && t.length < 25 && matchedProfiles.size === 0) {
    const fallback = matchFoodProfile(t)
    if (fallback) {
      matchedProfiles.add(fallback.category)
      signals.push({
        kind: 'food_unspecified',
        severity: 'high',
        category: fallback.category,
        target: fallback.label,
        detail: fallback.detectDetail,
      })
    }
  }

  // ── 3. 复合菜品未拆解（全品类）──
  const compounds = matchCompoundInText(t)
  for (const dish of compounds) {
    const food = foods.find((f) => f.name.includes(dish) || dish.includes(f.name))
    if (!food?.components || food.components.length < 2) {
      signals.push({
        kind: 'compound_undecomposed',
        severity: 'high',
        target: dish,
        detail: `复合菜品「${dish}」需拆成主料/配菜/汤底/油脂各自估量，不能映射为单一食物`,
      })
    }
  }
  for (const food of foods) {
    if (COMPOUND_DISH_PATTERN.test(food.name) && (!food.components || food.components.length < 2)) {
      if (!signals.some((s) => s.target === food.name && s.kind === 'compound_undecomposed')) {
        signals.push({
          kind: 'compound_undecomposed',
          severity: 'high',
          target: food.name,
          detail: `「${food.name}」为复合菜，未完成组分拆解`,
        })
      }
    }
  }

  // ── 4. 烹饪方式未知（淀粉类、肉类、豆制品等）──
  for (const food of foods) {
    if (
      COOKING_SENSITIVE_PATTERN.test(food.name) &&
      !food.cookingMethod &&
      !COOKING_METHOD_PATTERN.test(t) &&
      !COOKING_METHOD_PATTERN.test(food.name)
    ) {
      signals.push({
        kind: 'cooking_unknown',
        severity: 'medium',
        target: food.name,
        detail: `「${food.name}」烹饪方式不明（蒸 vs 炸营养素差异巨大）`,
      })
    }
  }

  // ── 5. 数据库匹配歧义（蔬菜、豆制品、面食等）──
  const ambiguousTerms: Array<{ re: RegExp; specific: RegExp; label: string; hint: string }> = [
    { re: /青菜|蔬菜|素菜/, specific: /油菜|小白菜|上海青|菠菜|生菜|白菜|空心菜|西兰花/, label: '蔬菜', hint: '小白菜/上海青/油菜' },
    { re: /豆腐/, specific: /嫩豆腐|老豆腐|内酯|熏|炸|红烧/, label: '豆腐', hint: '嫩豆腐/老豆腐/油炸豆腐' },
    { re: /面条|面(?!条|包)/, specific: /拉面|刀削|米粉|米线|挂面|手擀/, label: '面食', hint: '拉面/米粉/刀削面' },
    { re: /牛奶|奶/, specific: /纯牛奶|脱脂|低脂|酸奶|豆奶|燕麦奶/, label: '奶类', hint: '全脂/脱脂/酸奶' },
    { re: /咖啡/, specific: /美式|拿铁|卡布|浓缩|速溶|无糖/, label: '咖啡', hint: '美式/拿铁/加糖' },
  ]
  for (const term of ambiguousTerms) {
    if (term.re.test(t) && !term.specific.test(t) && !term.specific.test(foodNames)) {
      signals.push({
        kind: 'db_ambiguous',
        severity: 'medium',
        target: term.label,
        detail: `「${term.label}」品种不明，中国食物成分表候选：${term.hint}`,
      })
    }
  }

  // ── 6. 蛋白质来源未知（汤面、盖饭、粥、火锅等）──
  const needsProteinContext = /面|粉|饭|粥|汤|火锅|麻辣烫|盖饭|盒饭/.test(t)
  if (needsProteinContext && !PROTEIN_PATTERN.test(t) && !PROTEIN_PATTERN.test(foodNames)) {
    if (matchedProfiles.has('noodle') || matchedProfiles.has('rice') || matchedProfiles.has('congee') || matchedProfiles.has('hotpot') || matchedProfiles.has('soup')) {
      signals.push({
        kind: 'protein_unknown',
        severity: 'high',
        detail: '餐食未说明是否含肉类/海鲜，影响嘌呤与蛋白质模式',
      })
    }
  }

  // ── 7. 汤/汤底摄入未知（面、馄饨、火锅、煲汤等）──
  const soupContext = /面|粉|馄饨|水饺|火锅|麻辣烫|汤|煲|炖/.test(t)
  if (
    soupContext &&
    !SOUP_CONSUMED_PATTERN.test(t) &&
    (matchedProfiles.has('noodle') || matchedProfiles.has('hotpot') || matchedProfiles.has('soup'))
  ) {
    if (!signals.some((s) => s.kind === 'soup_unknown')) {
      signals.push({
        kind: 'soup_unknown',
        severity: 'medium',
        detail: '未说明汤/汤底是否喝完（钠与嘌呤的重要来源）',
      })
    }
  }

  // ── 8. 甜度/糖度未知（奶茶、饮料、咖啡）──
  if ((matchedProfiles.has('milk_tea') || matchedProfiles.has('beverage')) && !/无糖|三分糖|五分糖|七分糖|全糖|半糖|少糖|微糖/.test(t)) {
    signals.push({
      kind: 'sweetness_unknown',
      severity: 'high',
      category: matchedProfiles.has('milk_tea') ? 'milk_tea' : 'beverage',
      detail: '饮品甜度不明，无法估计果糖负荷',
    })
  }

  // ── 9. 数量未知（饺子、水果、零食等）──
  const quantityCategories: FoodCategory[] = ['dim_sum', 'fruit', 'snack', 'dessert', 'bread_pastry']
  for (const cat of quantityCategories) {
    if (matchedProfiles.has(cat) && !/\d+|[一二三四五六七八九十]|几个|半个|一份/.test(t)) {
      signals.push({
        kind: 'quantity_unknown',
        severity: 'medium',
        category: cat,
        detail: '未说明具体数量，份量估算困难',
      })
    }
  }

  return dedupeSignals(signals)
}

function dedupeSignals(signals: UncertaintySignal[]): UncertaintySignal[] {
  const seen = new Set<string>()
  return signals.filter((s) => {
    const key = `${s.kind}:${s.category ?? ''}:${s.target ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function computeOverallConfidence(foods: FoodEntry[], signals: UncertaintySignal[]): number {
  if (foods.length === 0 && signals.length > 0) return 0.3

  const foodAvg = foods.length
    ? foods.reduce((s, f) => s + f.confidence, 0) / foods.length
    : 0.4

  let penalty = 0
  for (const s of signals) {
    penalty += s.severity === 'high' ? 0.1 : 0.05
  }

  return Math.max(0.12, Math.min(0.95, foodAvg - penalty))
}

export function hasCriticalUncertainty(signals: UncertaintySignal[]): boolean {
  const critical = new Set<UncertaintyKind>([
    'portion_vague',
    'compound_undecomposed',
    'food_unspecified',
    'protein_unknown',
    'sweetness_unknown',
  ])
  return signals.some((s) => s.severity === 'high' && critical.has(s.kind))
}

const KIND_PRIORITY: UncertaintyKind[] = [
  'food_unspecified',
  'compound_undecomposed',
  'portion_vague',
  'sweetness_unknown',
  'protein_unknown',
  'quantity_unknown',
  'soup_unknown',
  'db_ambiguous',
  'cooking_unknown',
]

/** 全品类混合式追问：按品类模板 + 通用信号合并，每餐最多 2 题 */
export function buildFollowUpsFromSignals(signals: UncertaintySignal[]): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = []

  // 优先：已识别食物大类的品类模板追问
  const categorySignals = signals.filter((s) => s.category && s.kind === 'food_unspecified')
  const categories = [...new Set(categorySignals.map((s) => s.category!))]

  for (const cat of categories.slice(0, 1)) {
    const profile = FOOD_PROFILES.find((p) => p.category === cat)
    if (profile) {
      for (const fq of profile.followUps) {
        if (fq) questions.push({ ...fq, id: v4() })
      }
    }
  }

  // 甜度追问（奶茶/饮料）
  if (signals.some((s) => s.kind === 'sweetness_unknown') && questions.length < 2) {
    const cat = signals.find((s) => s.kind === 'sweetness_unknown')?.category
    if (cat === 'milk_tea') {
      questions.push(q('甜度多少？（全糖/半糖/无糖）', '液态糖是果糖与 NAFLD 风险核心来源', 'components', ['全糖', '半糖', '三分糖', '无糖']))
    } else {
      questions.push(q('是含糖饮料还是无糖？', '含糖饮料影响果糖与尿酸模式', 'components', ['含糖', '无糖', '果汁', '碳酸饮料']))
    }
  }

  // 复合菜追问 — 有拆解题时不重复问「主要吃了什么」
  const compound = signals.find((s) => s.kind === 'compound_undecomposed')
  if (compound && questions.length < 2) {
    questions.push(q(
      compound.target ? `「${compound.target}」主要配料？汤底/酱汁吃了多少？` : '主要配料？汤底/酱汁吃了多少？',
      '复合菜需拆解主料、油脂与汤底',
      'components',
      ['肉不多', '肉挺多', '汤全喝', '汤喝一半', '加了辣油', '主要吃菜'],
    ))
  }

  // 烹饪方式
  const cooking = signals.find((s) => s.kind === 'cooking_unknown')
  if (cooking && questions.length < 2) {
    questions.push(q(
      cooking.target ? `「${cooking.target}」怎么做的？` : '主菜怎么做的？',
      '同样食材蒸和炸营养素差异巨大',
      'cooking',
      ['蒸', '煮', '炒', '炸', '红烧', '凉拌'],
    ))
  }

  // 数据库歧义
  const dbAmb = signals.find((s) => s.kind === 'db_ambiguous')
  if (dbAmb && questions.length < 2) {
    questions.push(q(
      dbAmb.target ? `「${dbAmb.target}」具体是哪种？` : '具体是哪种食材？',
      '中国食物成分表匹配需消歧',
      'db_match',
      ['上海青', '小白菜', '油菜', '菠菜', '嫩豆腐', '老豆腐'],
    ))
  }

  // 通用分量（无品类命中、且无复合菜拆解时）
  const hasCompound = signals.some((s) => s.kind === 'compound_undecomposed')
  if (questions.length === 0 && !hasCompound && signals.some((s) => s.kind === 'portion_vague')) {
    questions.push(q('整体份量更接近哪种？', '描述笼统时需明确份量档位', 'portion', ['小份', '中份', '大份', '一碗', '半份']))
  }

  // 兜底：按优先级从信号生成
  if (questions.length === 0) {
    const sorted = [...signals].sort(
      (a, b) => KIND_PRIORITY.indexOf(a.kind) - KIND_PRIORITY.indexOf(b.kind),
    )
    for (const signal of sorted.slice(0, 2)) {
      const fq = signalToQuestion(signal)
      if (fq) questions.push(fq)
    }
  }

  return capCompoundFollowUps(dedupeFollowUpQuestions(questions), 2)
}

function q(
  question: string,
  reason: string,
  field: FollowUpField,
  quickOptions: string[],
  priority = 2,
): FollowUpQuestion {
  return { id: v4(), question, reason, field, priority, quickOptions }
}

function signalToQuestion(signal: UncertaintySignal): FollowUpQuestion | null {
  if (signal.category) {
    const profile = FOOD_PROFILES.find((p) => p.category === signal.category)
    if (profile?.followUps[0]) return { ...profile.followUps[0], id: v4() }
  }
  switch (signal.kind) {
    case 'protein_unknown':
      return q('里面有肉或海鲜吗？', '蛋白质来源影响嘌呤与铁摄入模式', 'components', ['有牛肉', '有鸡肉', '有海鲜', '没有肉', '只有蛋'])
    case 'soup_unknown':
      return q('汤/汤底喝了吗？', '汤底是钠与嘌呤的重要来源', 'components', ['全喝了', '喝了一半', '没喝汤'])
    case 'quantity_unknown':
      return q('大概多少个/多少量？', '数量是份量估算的关键', 'portion', ['1个', '2-3个', '小份', '一份', '半份'])
    default:
      return null
  }
}

export function mergeFollowUpQuestions(
  llmQuestions: FollowUpQuestion[],
  signalQuestions: FollowUpQuestion[],
  decisionQuestions: FollowUpQuestion[] = [],
): FollowUpQuestion[] {
  const merged = [...decisionQuestions, ...signalQuestions]
  for (const lq of llmQuestions) {
    if (!merged.some((m) => m.field === lq.field && m.question.slice(0, 8) === lq.question.slice(0, 8))) {
      merged.push(lq)
    }
  }
  const deduped = dedupeFollowUpQuestions(merged)
  return deduped.some((q) => q.followUpType === 'decompose')
    ? capCompoundFollowUps(deduped, 3)
    : deduped
}

export function annotateFoodUncertainties(foods: FoodEntry[], signals: UncertaintySignal[]): FoodEntry[] {
  return foods.map((food) => {
    const related = signals
      .filter((s) => !s.target || food.name.includes(s.target) || s.target.includes(food.name))
      .map((s) => s.detail)
    return related.length ? { ...food, uncertaintyNotes: related } : food
  })
}
