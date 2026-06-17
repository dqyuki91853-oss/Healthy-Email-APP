import type { WeeklyLetterData } from '../services/weeklyLetter'

/**
 * Single source of truth for the weekly score displayed across the UI.
 * Every location — postmark, ScoreRing, Sheet title — MUST use this.
 *
 * Returns null when no letter exists yet (→ show skeleton, never a hardcoded number).
 */
export function getDisplayWeeklyScore(
  letter: WeeklyLetterData | null | undefined,
): number | null {
  if (letter?.score != null && letter.score >= 0 && letter.score <= 100) {
    return Math.round(letter.score)
  }
  return null
}
