import { format } from 'date-fns'
import type { BodySeasonId } from '../types/bodySeason'
import type { BodyWeatherId } from '../types/bodyWeather'
import type { WeeklyLetterData } from '../services/weeklyLetter'
import { getReplyForWeek, weekKeyForLetterRange } from './bodyReplyStore'

const STORAGE_KEY = 'subhealth_letter_archive'
export const LETTER_ARCHIVE_MAX = 52

export interface LetterArchiveEntry {
  id: string
  archivedAt: string
  dateRange: { start: string; end: string }
  score: number | null
  letter: string
  weatherId: BodyWeatherId | null
  weatherLabel: string | null
  seasonId: BodySeasonId | null
  seasonLabel: string | null
  replyText: string | null
}

export interface LetterArchiveContext {
  weatherId?: BodyWeatherId | null
  weatherLabel?: string | null
  seasonId?: BodySeasonId | null
  seasonLabel?: string | null
}

function dateRangeKey(range: { start: string; end: string }): string {
  return `${range.start}_${range.end}`
}

export function loadLetterArchive(): LetterArchiveEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LetterArchiveEntry[]
    if (!Array.isArray(parsed)) return []
    return [...parsed].sort((a, b) => b.dateRange.end.localeCompare(a.dateRange.end))
  } catch {
    return []
  }
}

function saveLetterArchive(entries: LetterArchiveEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // ignore
  }
}

export function clearLetterArchive(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function buildLetterArchiveEntry(
  data: WeeklyLetterData,
  context: LetterArchiveContext = {},
): LetterArchiveEntry | null {
  if (!data.letter?.trim() || !data.dateRange) return null

  const weekKey = weekKeyForLetterRange(data.dateRange)
  const reply = getReplyForWeek(weekKey)

  return {
    id: crypto.randomUUID(),
    archivedAt: new Date().toISOString(),
    dateRange: data.dateRange,
    score: data.score,
    letter: data.letter.trim(),
    weatherId: context.weatherId ?? null,
    weatherLabel: context.weatherLabel ?? null,
    seasonId: context.seasonId ?? null,
    seasonLabel: context.seasonLabel ?? null,
    replyText: reply?.text ?? null,
  }
}

/**
 * 将一周来信写入归档。同一 dateRange 只保留最新一条。
 */
export function archiveWeeklyLetter(
  data: WeeklyLetterData,
  context: LetterArchiveContext = {},
): LetterArchiveEntry | null {
  const entry = buildLetterArchiveEntry(data, context)
  if (!entry) return null

  const key = dateRangeKey(entry.dateRange)
  const merged = [
    ...loadLetterArchive().filter((e) => dateRangeKey(e.dateRange) !== key),
    entry,
  ].sort((a, b) => b.dateRange.end.localeCompare(a.dateRange.end))

  saveLetterArchive(merged.slice(0, LETTER_ARCHIVE_MAX))
  return entry
}

export function formatLetterDateRange(range: { start: string; end: string }): string {
  const fmt = (d: string) => {
    try {
      return format(new Date(`${d}T12:00:00`), 'M/d')
    } catch {
      return d
    }
  }
  return `${fmt(range.start)} - ${fmt(range.end)}`
}

export function letterPreview(text: string, maxLines = 2): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.slice(0, maxLines).join('\n')
}
