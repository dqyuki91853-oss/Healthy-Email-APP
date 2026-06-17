import type { FollowUpQuestion } from '../types/voice'

const GENERIC_PORTION_RE = /主要吃了什么|大概多大份|整体描述笼统/
const GENERIC_DECOMPOSE_RE = /主要配料|主要吃了哪些|里主要吃了/

function aspectKey(q: FollowUpQuestion): string {
  return `${q.followUpType ?? q.field}-${q.targetFood ?? '_'}-${q.field}`
}

function isGenericPortion(q: FollowUpQuestion): boolean {
  return q.field === 'portion' && (!q.targetFood || GENERIC_PORTION_RE.test(q.question))
}

function isRedundantWithDecompose(q: FollowUpQuestion, hasDecompose: boolean): boolean {
  if (!hasDecompose) return false
  if (isGenericPortion(q)) return true
  if (q.field === 'portion' && GENERIC_PORTION_RE.test(q.question)) return true
  if (GENERIC_DECOMPOSE_RE.test(q.question) && q.followUpType !== 'decompose') return true
  return false
}

function isSameAspect(a: FollowUpQuestion, b: FollowUpQuestion): boolean {
  if (a.id === b.id) return true
  const keyA = aspectKey(a)
  const keyB = aspectKey(b)
  if (keyA !== keyB) return false
  return a.question.slice(0, 10) === b.question.slice(0, 10)
}

/** 语义去重：同一餐次避免「拆解 + 分量 + 主要吃了什么」重复追问 */
export function dedupeFollowUpQuestions(questions: FollowUpQuestion[]): FollowUpQuestion[] {
  const sorted = [...questions].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  const hasDecompose = sorted.some((q) => q.followUpType === 'decompose')
  const hasStructuredPortion = sorted.some(
    (q) => q.followUpType === 'portion' && q.targetFood && q.portionOptions?.length,
  )
  const result: FollowUpQuestion[] = []
  const seenAspects = new Set<string>()

  for (const q of sorted) {
    if (isRedundantWithDecompose(q, hasDecompose)) continue
    if (hasStructuredPortion && isGenericPortion(q)) continue

    const key = aspectKey(q)
    if (seenAspects.has(key)) continue

    if (result.some((existing) => isSameAspect(existing, q))) continue

    seenAspects.add(key)
    result.push(q)
  }

  return result
}

/** 复合菜每餐最多 2 题：拆解 + 一个细节/专属份量 */
export function capCompoundFollowUps(questions: FollowUpQuestion[], max = 2): FollowUpQuestion[] {
  const deduped = dedupeFollowUpQuestions(questions)
  const decompose = deduped.find((q) => q.followUpType === 'decompose')
  if (!decompose) return deduped.slice(0, max)

  const rest = deduped.filter((q) => q.id !== decompose.id)
  const secondary =
    rest.find((q) => q.followUpType === 'detail') ??
    rest.find((q) => q.followUpType === 'portion' && q.targetFood === decompose.targetFood) ??
    rest[0]

  return secondary ? [decompose, secondary] : [decompose]
}
