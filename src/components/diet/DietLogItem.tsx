import { useState } from 'react'
import { Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import type { VoiceExtraction } from '../../types/voice'

const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
  unknown: '未标注',
}

function confidenceColor(conf: number): string {
  if (conf >= 0.9) return 'text-[var(--color-green)]'
  if (conf >= 0.6) return 'text-[var(--color-yellow)]'
  return 'text-orange-400'
}

function confidenceBg(conf: number): string {
  if (conf >= 0.9) return 'border-[var(--color-green)]/20'
  if (conf >= 0.6) return 'border-[var(--color-yellow)]/20'
  return 'border-[var(--color-orange)]/30 bg-[var(--color-orange)]/5'
}

interface Props {
  log: VoiceExtraction
  onDelete: (id: string) => void
  deleting?: boolean
}

export function DietLogItem({ log, onDelete, deleting }: Props) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hasAnswers = (log.followupMeta?.answers?.length ?? 0) > 0
  const hasUnresolved =
    log.followupMeta?.unresolvedFlags?.length ||
    log.foods.some((f) => f.unresolved || f.confidence < 0.6)

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete(log.id)
    setConfirmDelete(false)
  }

  return (
    <div
      className={`group rounded-lg border p-3 text-sm ${confidenceBg(log.overallConfidence)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            {log.mealSlot && (
              <span className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">
                {MEAL_LABELS[log.mealSlot] ?? log.mealSlot}
              </span>
            )}
            <span className={confidenceColor(log.overallConfidence)}>
              置信度 {(log.overallConfidence * 100).toFixed(0)}%
            </span>
            <span>{log.extractionSource === 'llm' ? 'LLM' : '本地'}</span>
            {hasUnresolved && (
              <span className="flex items-center gap-0.5 text-orange-400">
                <AlertTriangle size={12} /> 信息待补全
              </span>
            )}
          </div>
          <p className="mt-1">{log.transcript}</p>
          {log.foods.length > 0 && (
            <div className="mt-2 space-y-1">
              {log.foods.map((f, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium">{f.name}</span>
                  <span className={confidenceColor(f.confidence)}>
                    {(f.confidence * 100).toFixed(0)}%
                  </span>
                  {f.unresolved && <span className="text-orange-400">⚠️</span>}
                  {f.isComposite && (
                    <span className="rounded bg-[var(--color-surface-2)] px-1 py-0.5">复合菜</span>
                  )}
                  {f.amountG && <span className="text-[var(--color-muted)]">{f.amountG}g · </span>}
                  {f.components?.length ? (
                    <span className="text-[var(--color-muted)]">{f.components.join(' + ')} · </span>
                  ) : null}
                  {f.cookingMethod && (
                    <span className="text-[var(--color-muted)]">{f.cookingMethod} · </span>
                  )}
                  {f.dbMatchHint && (
                    <span className="text-[var(--color-muted)]">{f.dbMatchHint}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {hasAnswers && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowAnswers((v) => !v)}
                className="flex items-center gap-1 text-xs text-[var(--color-teal)]"
              >
                {showAnswers ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                追问补充 ({log.followupMeta!.answers!.length})
              </button>
              {showAnswers && (
                <div className="mt-1 space-y-0.5 rounded-lg bg-[var(--color-surface-2)] p-2 text-xs text-[var(--color-muted)]">
                  {log.followupMeta!.answers!.map((a) => (
                    <p key={a.questionId}>
                      <span className="text-[var(--color-yellow)]">Q</span> {a.question}
                      <br />
                      <span className="text-[var(--color-teal)]">A</span> {a.answer}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          {log.emotions.length > 0 && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">情绪：{log.emotions.join('、')}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {confirmDelete && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="rounded-md bg-[var(--color-red)] px-2 py-1 text-white disabled:opacity-50"
              >
                {deleting ? '删除中…' : '确认删除'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-md px-2 py-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
              >
                取消
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            className={`rounded-lg p-2 transition-colors hover:bg-[var(--color-red)]/10 hover:text-[var(--color-red)] disabled:opacity-30 ${
              confirmDelete
                ? 'text-[var(--color-red)]'
                : 'text-[var(--color-muted)]'
            }`}
            title="删除记录"
            aria-label="删除记录"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
