import type { FoodEntry, VoiceExtraction } from '../types/voice'

export interface DietHistoryPattern {
  foodName: string
  count: number
  defaultPortion?: string
  defaultAmountG?: number
  defaultCooking?: string
  lastSeen: string
}

const STORAGE_KEY = 'subhealth_diet_history'
const SEED_ID_KEY = 'subhealth_seed_id'

export function clearDietHistory() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SEED_ID_KEY)
}

function loadPatterns(): DietHistoryPattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DietHistoryPattern[]) : []
  } catch {
    return []
  }
}

function savePatterns(patterns: DietHistoryPattern[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns.slice(0, 200)))
}

/** 从已确认记录学习用户习惯 */
export function learnFromExtraction(extraction: VoiceExtraction, _learnThreshold = 3) {
  const patterns = loadPatterns()
  const date = extraction.recordDate ?? new Date().toISOString().slice(0, 10)

  for (const food of extraction.foods) {
    if (food.confidence < 0.7 || food.unresolved) continue
    const key = food.name.trim()
    const idx = patterns.findIndex((p) => p.foodName === key)
    const portion =
      food.portion !== 'unknown' ? food.portion : food.amountG ? `${food.amountG}g` : undefined

    if (idx >= 0) {
      patterns[idx].count += 1
      patterns[idx].lastSeen = date
      if (portion) patterns[idx].defaultPortion = portion
      if (food.amountG) patterns[idx].defaultAmountG = food.amountG
      if (food.cookingMethod) patterns[idx].defaultCooking = food.cookingMethod
    } else {
      patterns.push({
        foodName: key,
        count: 1,
        defaultPortion: portion,
        defaultAmountG: food.amountG,
        defaultCooking: food.cookingMethod,
        lastSeen: date,
      })
    }
  }

  savePatterns(patterns.filter((p) => p.count >= 1))
}

export function getHistoryPattern(foodName: string): DietHistoryPattern | undefined {
  return loadPatterns().find((p) => p.foodName === foodName.trim())
}

/** 出现 ≥ learnThreshold 次则跳过分量追问，使用默认值 */
export function shouldSkipPortionFollowUp(
  foodName: string,
  learnThreshold = 3,
): { skip: boolean; defaultPortion?: string; defaultAmountG?: number } {
  const p = getHistoryPattern(foodName)
  if (!p || p.count < learnThreshold) return { skip: false }
  return {
    skip: true,
    defaultPortion: p.defaultPortion,
    defaultAmountG: p.defaultAmountG,
  }
}

export function applyHistoryDefaults(foods: FoodEntry[], learnThreshold = 3): FoodEntry[] {
  return foods.map((f) => {
    const hist = shouldSkipPortionFollowUp(f.name, learnThreshold)
    if (!hist.skip) return f
    return {
      ...f,
      portion: (hist.defaultPortion as FoodEntry['portion']) ?? f.portion,
      amountG: hist.defaultAmountG ?? f.amountG,
      portionConfidence: 0.88,
      dbMatchHint: `历史习惯（${hist.defaultPortion ?? hist.defaultAmountG + 'g'}）`,
    }
  })
}

export function getAllHistoryPatterns(): DietHistoryPattern[] {
  return loadPatterns().sort((a, b) => b.count - a.count)
}

/** Merge learned diet patterns from an export (Web → App). */
export function mergeDietHistory(incoming: DietHistoryPattern[]): number {
  if (incoming.length === 0) return 0
  const patterns = loadPatterns()
  let merged = 0
  for (const item of incoming) {
    if (!item.foodName?.trim()) continue
    const key = item.foodName.trim()
    const idx = patterns.findIndex((p) => p.foodName === key)
    if (idx >= 0) {
      const existing = patterns[idx]
      patterns[idx] = {
        ...existing,
        count: Math.max(existing.count, item.count),
        defaultPortion: item.defaultPortion ?? existing.defaultPortion,
        defaultAmountG: item.defaultAmountG ?? existing.defaultAmountG,
        defaultCooking: item.defaultCooking ?? existing.defaultCooking,
        lastSeen: item.lastSeen > existing.lastSeen ? item.lastSeen : existing.lastSeen,
      }
    } else {
      patterns.push({ ...item, foodName: key })
    }
    merged += 1
  }
  savePatterns(patterns)
  return merged
}
