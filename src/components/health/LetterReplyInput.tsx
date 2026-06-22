import { useState, useCallback } from 'react'
import { Send } from 'lucide-react'
import type { WeeklyLetterData } from '../../services/weeklyLetter'
import {
  getReplyForWeek,
  saveBodyReply,
  weekKeyForLetterRange,
} from '../../lib/bodyReplyStore'
import type { BodyReply } from '../../types/bodyReply'
import { BODY_REPLY_MAX_LENGTH } from '../../types/bodyReply'
import { Button } from '../ui/Button'

interface Props {
  dateRange: WeeklyLetterData['dateRange']
  onSaved?: () => void
}

export function LetterReplyInput({ dateRange, onSaved }: Props) {
  const weekKey = weekKeyForLetterRange(dateRange)
  const [reply, setReply] = useState<BodyReply | null>(() => getReplyForWeek(weekKey))
  const [editing, setEditing] = useState(() => !getReplyForWeek(weekKey))
  const [text, setText] = useState(() => getReplyForWeek(weekKey)?.text ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(() => {
    setError(null)
    const result = saveBodyReply(text, dateRange ?? undefined)
    if (!result) {
      setError(`请写 1–${BODY_REPLY_MAX_LENGTH} 字后再寄出。`)
      return
    }
    setReply(result)
    setEditing(false)
    onSaved?.()
  }, [text, dateRange, onSaved])

  return (
    <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-4">
      <p className="mb-2 text-sm font-medium text-[var(--color-text)]">给身体写封回信</p>
      <p className="mb-3 text-xs text-[var(--color-muted)]">
        下周来信会轻轻读到你的留言（≤{BODY_REPLY_MAX_LENGTH} 字）
      </p>

      {!editing && reply ? (
        <div className="rounded-[var(--radius-sm)] bg-white/60 px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-teal)]">
            已寄出
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
            {reply.text}
          </p>
          <button
            type="button"
            className="mt-2 text-xs text-[var(--color-muted)] underline hover:text-[var(--color-teal)]"
            onClick={() => {
              setText(reply.text)
              setEditing(true)
            }}
          >
            修改回信
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, BODY_REPLY_MAX_LENGTH))}
            rows={4}
            placeholder="例如：这周睡得晚，下周想试试早点收工…"
            className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-[var(--color-teal)]"
            aria-label="给身体回信"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-[var(--color-muted)]">
              {text.length}/{BODY_REPLY_MAX_LENGTH}
            </span>
            <Button type="button" variant="secondary" className="py-2 text-xs" onClick={handleSubmit}>
              <Send size={14} />
              寄出回信
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-[var(--color-coral)]">{error}</p>}
        </>
      )}
    </div>
  )
}
