import { format, startOfWeek } from 'date-fns'
import type { BodyReply } from '../types/bodyReply'
import { BODY_REPLY_MAX_LENGTH } from '../types/bodyReply'

const STORAGE_KEY = 'subhealth_body_replies'

function weekKeyFromDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function loadBodyReplies(): BodyReply[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BodyReply[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveBodyReplies(replies: BodyReply[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(replies))
  } catch {
    // localStorage full — ignore
  }
}

export function getLatestReply(): BodyReply | null {
  const replies = loadBodyReplies()
  if (replies.length === 0) return null
  return [...replies].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

export function getReplyForWeek(weekKey: string): BodyReply | null {
  return loadBodyReplies().find((r) => r.weekKey === weekKey) ?? null
}

export function saveBodyReply(
  text: string,
  letterDateRange?: { start: string; end: string },
): BodyReply | null {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > BODY_REPLY_MAX_LENGTH) return null

  const anchorDate = letterDateRange?.end ?? format(new Date(), 'yyyy-MM-dd')
  const weekKey = weekKeyFromDate(anchorDate)

  const existing = getReplyForWeek(weekKey)
  const reply: BodyReply = {
    id: existing?.id ?? crypto.randomUUID(),
    weekKey,
    letterDateRange,
    text: trimmed,
    createdAt: new Date().toISOString(),
  }

  const others = loadBodyReplies().filter((r) => r.weekKey !== weekKey)
  saveBodyReplies([...others, reply].sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
  return reply
}

/** LLM / fallback hint from the user's most recent reply. */
export function formatReplyHintForLetter(): string | null {
  const latest = getLatestReply()
  if (!latest) return null
  const excerpt =
    latest.text.length > 120 ? `${latest.text.slice(0, 120)}…` : latest.text
  return `用户上一封回信说：「${excerpt}」——若自然，请在信中轻轻回应（不要生硬引用）。`
}

export function weekKeyForLetterRange(dateRange: { start: string; end: string } | null): string {
  const anchor = dateRange?.end ?? format(new Date(), 'yyyy-MM-dd')
  return weekKeyFromDate(anchor)
}
