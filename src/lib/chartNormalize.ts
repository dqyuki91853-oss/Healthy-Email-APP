/**
 * Normalize a numeric series to 0–100 for trend visualization.
 *
 * Small-value series (sleep hours, exercise minutes) are flattened
 * when sharing a Y-axis with large-value series (steps). Normalizing
 * each series independently ensures every metric has a visible waveform
 * in compact dashboard charts.
 *
 * Guarantees a minimum 15% span — a single flat line (e.g. 7.0h every day)
 * still produces a gentle curve rather than a dead-flat stroke.
 */

export function normalizeSeries(values: (number | null)[]): (number | null)[] {
  const valid = values.filter((v): v is number => v != null)
  if (valid.length < 2) return values.map(() => null)

  let min = Math.min(...valid)
  let max = Math.max(...valid)

  // Ensure minimum 15 % span to prevent visually flat lines
  const span = max - min
  const minSpan = Math.max(max, 1) * 0.15
  if (span < minSpan) {
    const mid = (min + max) / 2
    const half = minSpan / 2
    min = mid - half
    max = mid + half
  }

  const range = max - min
  if (range <= 0) return values.map(() => 50)

  return values.map((v) => (v != null ? ((v - min) / range) * 100 : null))
}
