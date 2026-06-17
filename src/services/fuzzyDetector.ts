import { matchCompoundTemplate } from '../config/compoundTemplates'
import type { FoodEntry, FollowUpPriority, FollowUpType } from '../types/voice'
import type { UncertaintySignal } from './uncertaintyDetector'

export interface FuzzyGap {
  foodName: string
  foodIndex: number
  followUpType: FollowUpType
  priorityLevel: FollowUpPriority
  priority: number
  field: string
  reason: string
  portionConfidence: number
  isComposite: boolean
  missingDetails: string[]
  compoundCategory?: string
}

const VAGUE_PORTION = /一点|一些|不少|挺多|很多|正常|适量|随便|大概|差不多|吃了/
const VAGUE_AMOUNT = /一碗|一份|一盘|一份儿|半碗|小份|大份|中份/

function portionConfidence(food: FoodEntry, transcript: string): number {
  if (food.portionConfidence != null) return food.portionConfidence
  if (food.amountG != null && food.amountG > 0) return 0.85
  if (food.portion && food.portion !== 'unknown' && food.portion !== 'medium') return 0.75
  const ctx = `${food.name} ${transcript}`
  if (VAGUE_PORTION.test(ctx) && !VAGUE_AMOUNT.test(ctx)) return 0.35
  if (VAGUE_AMOUNT.test(ctx)) return 0.55
  if (food.portion === 'unknown') return 0.4
  return food.confidence ?? 0.6
}

function inferMissingDetails(food: FoodEntry, transcript: string): string[] {
  const missing: string[] = []
  const text = `${food.name} ${transcript}`
  if (!food.cookingMethod && /炒|炸|烤|蒸|煮|焖|炖|煎/.test(text) === false) {
    if (/肉|鱼|虾|鸡|牛|猪/.test(food.name)) missing.push('烹饪方式')
  }
  if (/面|饭|粥/.test(food.name) && !/汤|喝/.test(text)) missing.push('是否喝汤')
  if (/火锅|麻辣烫/.test(text) && !/锅底|清汤|麻辣|番茄/.test(text)) missing.push('锅底类型')
  if (/奶茶|咖啡/.test(text) && !/糖|甜|冰|热/.test(text)) missing.push('糖度/温度')
  if (/酒|啤酒|红酒/.test(text) && !/\d+ml|\d+杯|瓶/.test(text)) missing.push('饮用量')
  return missing
}

function priorityFromGap(
  type: FollowUpType,
  portionConf: number,
  isComposite: boolean,
): { level: FollowUpPriority; score: number } {
  if (type === 'portion' && portionConf < 0.4) return { level: 'P0', score: 10 }
  if (type === 'decompose' && isComposite) return { level: 'P1', score: 9 }
  if (type === 'portion' && portionConf < 0.6) return { level: 'P2', score: 7 }
  if (type === 'detail') return { level: 'P3', score: 5 }
  return { level: 'P4', score: 3 }
}

/** 第一层：模糊检测引擎 */
export function runFuzzyDetection(
  transcript: string,
  foods: FoodEntry[],
  signals: UncertaintySignal[] = [],
): FuzzyGap[] {
  const gaps: FuzzyGap[] = []

  foods.forEach((food, foodIndex) => {
    const pConf = portionConfidence(food, transcript)
    const compound = matchCompoundTemplate(food.name, transcript)
    const isComposite = Boolean(food.isComposite ?? compound)
    const missing = food.missingDetails?.length
      ? food.missingDetails
      : inferMissingDetails(food, transcript)

    if (pConf < 0.9) {
      const { level, score } = priorityFromGap('portion', pConf, isComposite)
      gaps.push({
        foodName: food.name,
        foodIndex,
        followUpType: 'portion',
        priorityLevel: level,
        priority: score,
        field: 'portion',
        reason: pConf < 0.6 ? '分量描述模糊，影响热量估算' : '建议轻量确认分量',
        portionConfidence: pConf,
        isComposite,
        missingDetails: missing,
        compoundCategory: compound?.category,
      })
    }

    if (isComposite && compound) {
      const { level, score } = priorityFromGap('decompose', pConf, true)
      gaps.push({
        foodName: food.name,
        foodIndex,
        followUpType: 'decompose',
        priorityLevel: level,
        priority: score,
        field: 'components',
        reason: '复合菜品需拆解子项以估算营养',
        portionConfidence: pConf,
        isComposite: true,
        missingDetails: compound.followUpFields,
        compoundCategory: compound.category,
      })
    }

    for (const detail of missing.slice(0, 2)) {
      const { level, score } = priorityFromGap('detail', pConf, isComposite)
      gaps.push({
        foodName: food.name,
        foodIndex,
        followUpType: 'detail',
        priorityLevel: level,
        priority: score,
        field: detail.includes('汤') ? 'soup' : detail.includes('糖') ? 'sugar' : 'cooking',
        reason: `缺少「${detail}」信息`,
        portionConfidence: pConf,
        isComposite,
        missingDetails: [detail],
        compoundCategory: compound?.category,
      })
    }
  })

  for (const sig of signals) {
    if (sig.kind === 'portion_vague' || sig.kind === 'compound_undecomposed') {
      const target = sig.target ?? ''
      const exists = gaps.some(
        (g) => g.foodName === target && g.followUpType !== 'detail',
      )
      if (!exists && target) {
        gaps.push({
          foodName: target,
          foodIndex: foods.findIndex((f) => f.name === target),
          followUpType: sig.kind === 'compound_undecomposed' ? 'decompose' : 'portion',
          priorityLevel: 'P1',
          priority: 8,
          field: sig.kind === 'compound_undecomposed' ? 'components' : 'portion',
          reason: sig.detail,
          portionConfidence: 0.45,
          isComposite: sig.kind === 'compound_undecomposed',
          missingDetails: [],
        })
      }
    }
  }

  return gaps.sort((a, b) => b.priority - a.priority)
}

export function confidenceTier(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.9) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}
