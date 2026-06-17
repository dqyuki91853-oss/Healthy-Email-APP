import type { FollowUpQuestion, FoodEntry, PortionSize, VoiceExtraction, FollowUpAnswerRecord } from '../types/voice'
import { normalizeAspect } from '../lib/followUpAspect'

export type { FollowUpAnswerRecord }

function parsePortionFromAnswer(answer: string): PortionSize {
  const a = answer.toLowerCase()
  if (/小|少|半碗|small|80/.test(a)) return 'small'
  if (/大|多|超大|large|250|350/.test(a)) return 'large'
  if (/中|一碗|medium|150/.test(a)) return 'medium'
  return 'medium'
}

function parseGramsFromAnswer(answer: string): number | undefined {
  const m = answer.match(/(\d+)\s*g/i) ?? answer.match(/(\d+)\s*克/)
  if (m) return parseInt(m[1], 10)
  if (/小|少|半碗/.test(answer)) return 80
  if (/大|超大/.test(answer)) return 250
  if (/中|一碗|拳头/.test(answer)) return 150
  return undefined
}

function findFoodIndex(foods: FoodEntry[], targetFood?: string): number {
  if (!targetFood) return foods.length > 0 ? 0 : -1
  const idx = foods.findIndex(
    (f) => f.name.includes(targetFood) || targetFood.includes(f.name),
  )
  return idx >= 0 ? idx : 0
}

/** Merge follow-up answers into food entries (local / round-cap fallback). */
export function applyFollowUpAnswersToExtraction(
  extraction: VoiceExtraction,
  questions: FollowUpQuestion[],
  answers: Record<string, string>,
): VoiceExtraction {
  const foods = extraction.foods.map((f) => ({ ...f }))

  for (const q of questions) {
    const ans = answers[q.id]?.trim()
    if (!ans || foods.length === 0) continue

    const idx = findFoodIndex(foods, q.targetFood)
    if (idx < 0) continue
    const food = foods[idx]

    if (q.followUpType === 'portion') {
      food.portion = parsePortionFromAnswer(ans)
      food.amountG = parseGramsFromAnswer(ans) ?? food.amountG
      food.portionConfidence = 0.88
      food.unresolved = false
      food.confidence = Math.min(0.95, Math.max(food.confidence, 0.78))
      food.dbMatchHint = food.dbMatchHint ?? `分量：${ans}`
    } else if (q.followUpType === 'decompose') {
      food.components = ans
        .split(/[、,，+/]/)
        .map((s) => s.trim())
        .filter(Boolean)
      food.isComposite = true
      food.unresolved = false
      food.confidence = Math.min(0.92, Math.max(food.confidence, 0.75))
    } else {
      if (q.field === 'cooking' || /炸|蒸|煮|烤|炒/.test(ans)) {
        food.cookingMethod = ans
      }
      food.missingDetails = [...(food.missingDetails ?? []), ans]
      food.unresolved = false
      food.confidence = Math.min(0.9, Math.max(food.confidence, 0.72))
    }
  }

  const overallConfidence =
    foods.length > 0
      ? foods.reduce((s, f) => s + f.confidence, 0) / foods.length
      : extraction.overallConfidence

  return {
    ...extraction,
    foods,
    overallConfidence,
    needsFollowUp: false,
    followUpQuestions: [],
    followupMeta: {
      roundsTriggered: extraction.followupMeta?.roundsTriggered ?? 1,
      questionsAsked: extraction.followupMeta?.questionsAsked ?? [],
      questionsSkipped: extraction.followupMeta?.questionsSkipped ?? [],
      unresolvedFlags: [],
      askedStableKeys: extraction.followupMeta?.askedStableKeys,
      answers: extraction.followupMeta?.answers,
    },
  }
}

export function buildAnswerRecords(
  questions: FollowUpQuestion[],
  answers: Record<string, string>,
  round: number,
): FollowUpAnswerRecord[] {
  return questions
    .filter((q) => answers[q.id]?.trim())
    .map((q) => ({
      questionId: q.id,
      question: q.question,
      answer: answers[q.id].trim(),
      aspect: normalizeAspect(q),
      round,
    }))
}

export function mergeAnswerRecords(
  existing: FollowUpAnswerRecord[] | undefined,
  incoming: FollowUpAnswerRecord[],
): FollowUpAnswerRecord[] {
  const byId = new Map((existing ?? []).map((a) => [a.questionId, a]))
  for (const a of incoming) byId.set(a.questionId, a)
  return [...byId.values()]
}
