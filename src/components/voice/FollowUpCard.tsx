import { useState } from 'react'
import type { FollowUpQuestion, MealSlot } from '../../types/voice'
import { MessageCircleQuestion, Mic } from 'lucide-react'
import { getContextualPortionHints } from '../../config/portionReferences'
import { CompoundDishPanel } from './CompoundDishPanel'
import { isSpeechSupported, startSpeechRecognition } from '../../services/speech'

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
  unknown: '',
}

const TYPE_LABELS = {
  portion: '分量',
  decompose: '拆解',
  detail: '细节',
} as const

interface Props {
  questions: FollowUpQuestion[]
  contextHint?: string
  mealSlot?: MealSlot
  roundIndex?: number
  onSubmit: (answers: Record<string, string>) => void
  onSkip: () => void
  loading?: boolean
}

export function FollowUpCard({
  questions,
  contextHint,
  mealSlot,
  roundIndex = 0,
  onSubmit,
  onSkip,
  loading,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [compoundSelected, setCompoundSelected] = useState<Record<string, string[]>>({})
  const [voiceTarget, setVoiceTarget] = useState<string | null>(null)

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const toggleCompound = (qId: string, name: string) => {
    setCompoundSelected((prev) => {
      const cur = prev[qId] ?? []
      const next = cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]
      return { ...prev, [qId]: next }
    })
    const selected = compoundSelected[qId] ?? []
    const next = selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]
    setAnswer(qId, next.join('、'))
  }

  const startVoiceAnswer = (qId: string) => {
    if (!isSpeechSupported()) return
    setVoiceTarget(qId)
    startSpeechRecognition(
      (text) => {
        setAnswer(qId, text)
        setVoiceTarget(null)
      },
      () => setVoiceTarget(null),
    )
  }

  const canSubmit = questions.some((q) => {
    const a = answers[q.id]?.trim()
    if (a) return true
    return (compoundSelected[q.id]?.length ?? 0) > 0
  })

  return (
    <div className="rounded-xl border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircleQuestion size={18} className="text-[var(--color-yellow)]" />
        <p className="font-medium text-[var(--color-yellow)]">智能追问</p>
        <span className="text-xs text-[var(--color-muted)]">
          {mealSlot && mealSlot !== 'unknown' ? `${SLOT_LABELS[mealSlot]} · ` : ''}
          第 {roundIndex + 1} 轮 · 最多 {questions.length} 题
        </span>
      </div>

      {contextHint && (
        <p className="mb-3 rounded-lg bg-[var(--color-surface-2)] p-2 text-xs text-[var(--color-muted)]">
          {contextHint}
        </p>
      )}

      <div className="space-y-4">
        {questions.map((q) => {
          const portionHints = getContextualPortionHints(q.followUpType, q.compoundCategory)
          return (
          <div key={q.id} className="rounded-lg border border-[var(--color-border)]/50 p-3">
            <div className="mb-1 flex items-center gap-2">
              {q.followUpType && (
                <span className="rounded bg-[var(--color-gold)]/20 px-1.5 py-0.5 text-xs text-[var(--color-yellow)]">
                  {TYPE_LABELS[q.followUpType]}
                </span>
              )}
              {q.priorityLevel && (
                <span className="text-xs text-[var(--color-muted)]">{q.priorityLevel}</span>
              )}
              {q.targetFood && (
                <span className="text-xs text-[var(--color-muted)]">· {q.targetFood}</span>
              )}
            </div>
            <p className="text-sm font-medium">{q.question}</p>
            <p className="mb-2 text-xs text-[var(--color-muted)]">{q.reason}</p>

            {portionHints.length > 0 && q.followUpType === 'portion' && (
              <div className="mb-2 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                {portionHints.map((r) => (
                  <span key={r.category} className="rounded bg-[var(--color-surface-2)] px-2 py-0.5">
                    {r.emoji} {r.label}
                  </span>
                ))}
              </div>
            )}

            {q.followUpType === 'portion' && q.portionOptions && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {q.portionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAnswer(q.id, opt.label)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                      answers[q.id] === opt.label
                        ? 'bg-[var(--color-gold)]/30 text-white'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-surface)]'
                    }`}
                  >
                    {opt.emoji ? `${opt.emoji} ` : ''}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {q.followUpType === 'decompose' && (q.compoundPickGroups || q.compoundSubItems) && (
              <CompoundDishPanel
                subItems={q.compoundSubItems ?? []}
                pickGroups={q.compoundPickGroups}
                selected={compoundSelected[q.id] ?? []}
                onToggle={(name) => toggleCompound(q.id, name)}
              />
            )}

            {q.quickOptions && q.followUpType !== 'portion' && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {q.quickOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(q.id, opt)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                      answers[q.id] === opt
                        ? 'bg-[var(--color-gold)]/30 text-white'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-surface)]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="文字补充…"
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-gold)]/50"
              />
              {isSpeechSupported() && (
                <button
                  type="button"
                  onClick={() => startVoiceAnswer(q.id)}
                  className={`rounded-lg border px-3 py-2 ${
                    voiceTarget === q.id
                      ? 'border-[var(--color-red)]/50 bg-[var(--color-red)]/10 text-[var(--color-red)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]'
                  }`}
                  title="语音回答"
                >
                  <Mic size={16} />
                </button>
              )}
            </div>
          </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canSubmit || loading}
          onClick={() => onSubmit(answers)}
          className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm text-[var(--color-text)] disabled:opacity-50"
        >
          {loading ? '重新分析…' : '补充并重新提取'}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
        >
          先不补充，按当前信息保存
        </button>
      </div>
    </div>
  )
}
