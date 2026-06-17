import type { FollowUpQuestion } from '../types/voice'

export type FollowUpAspect = 'portion' | 'components' | 'cooking' | 'soup' | 'sugar' | 'timing' | 'db_match' | 'other'

/** Normalize a follow-up question to a stable aspect category */
export function normalizeAspect(q: FollowUpQuestion): FollowUpAspect {
  // 1. Field-based mapping
  if (q.field === 'portion') return 'portion'
  if (q.field === 'components') return 'components'
  if (q.field === 'cooking') return 'cooking'
  if (q.field === 'soup') return 'soup'
  if (q.field === 'sugar') return 'sugar'
  if (q.field === 'timing') return 'timing'
  if (q.field === 'db_match') return 'db_match'
  if (q.field === 'emotion' || q.field === 'symptom') return 'other'

  // 2. Question text fallback
  const qText = q.question ?? ''

  if (/多少|几克|分量|多大|几碗|毫升|几两|几份/.test(qText)) return 'portion'
  if (/什么面|有哪些|成分|里面|搭配|拆解/.test(qText)) return 'components'
  if (/怎么[做煮炒]|烹饪|做法|汤底|锅底/.test(qText)) return 'cooking'
  if (/汤|锅底|麻辣|清汤/.test(qText)) return 'soup'
  if (/甜[度不]|糖分|含糖|多糖|少糖/.test(qText)) return 'sugar'
  if (/几点|什么[时]候|哪[一餐顿]/.test(qText)) return 'timing'
  if (/具体[是吃]|叫[什么]|指的是|确认/.test(qText)) return 'db_match'

  // 3. followUpType fallback
  if (q.followUpType === 'portion') return 'portion'
  if (q.followUpType === 'decompose') return 'components'
  if (q.followUpType === 'detail') return 'other'

  return 'other'
}

/** Normalize food name for stable key comparison */
function normalizeFoodKey(foodName: string): string {
  if (!foodName) return '_'
  // Strip common modifiers for fuzzy matching
  return foodName
    .replace(/[份碗盘大中小微]份?$/, '')
    .replace(/[的了]$/, '')
    .trim()
}

/** Build a stable, dedup-safe key for a follow-up question */
export function buildStableKey(q: FollowUpQuestion): string {
  const foodKey = normalizeFoodKey(q.targetFood ?? '')
  return `${q.followUpType ?? 'general'}-${foodKey}-${normalizeAspect(q)}`
}

/** Build a stable key from a gap-style object for cross-layer dedup */
export function buildGapStableKey(gap: {
  followUpType?: string
  foodName?: string
  field?: string
}): string {
  const foodKey = normalizeFoodKey(gap.foodName ?? '')
  const f = gap.field ?? ''
  const ft = gap.followUpType ?? 'general'

  // Infer aspect from field string
  let aspect = 'other'
  if (f === 'portion' || ft === 'portion') aspect = 'portion'
  else if (f === 'components' || ft === 'decompose') aspect = 'components'
  else if (f === 'cooking') aspect = 'cooking'
  else if (f === 'soup') aspect = 'soup'
  else if (f === 'sugar') aspect = 'sugar'
  else if (f === 'timing') aspect = 'timing'
  else if (f === 'db_match') aspect = 'db_match'
  else if (ft === 'detail') aspect = 'other'

  return `${ft}-${foodKey}-${aspect}`
}

/** Deduplicate questions by stable key, removing those already asked */
export function dedupeByStableKey(
  questions: FollowUpQuestion[],
  previousKeys: string[],
): FollowUpQuestion[] {
  const prevSet = new Set(previousKeys)
  const seen = new Set<string>()
  return questions.filter((q) => {
    const key = buildStableKey(q)
    if (prevSet.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
