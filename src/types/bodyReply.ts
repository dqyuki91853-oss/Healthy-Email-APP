/** User reply to a weekly health letter (FF-5). */
export interface BodyReply {
  id: string
  /** ISO week start (Monday), YYYY-MM-DD */
  weekKey: string
  letterDateRange?: { start: string; end: string }
  text: string
  createdAt: string
}

export const BODY_REPLY_MAX_LENGTH = 500
