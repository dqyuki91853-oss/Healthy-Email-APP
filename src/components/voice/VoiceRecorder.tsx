import { useState, useRef, useEffect } from 'react'
import { Mic, Square, PenLine, Sparkles, MessageCircleQuestion, RefreshCw } from 'lucide-react'
import { createSpeechRecognizer, isSpeechSupported } from '../../services/speech'
import { extractFromTranscript, buildVoiceLog, learnFromExtraction } from '../../services/llm'
import { recordFollowUpSkipped, recordFollowUpShown, getFollowUpSettings } from '../../services/followUpTracker'
import { inferMealSlotFromTranscript } from '../../services/mealContext'
import { getRecordDate } from '../../lib/dates'
import { isLlmAvailable } from '../../config/llm'
import { buildStableKey } from '../../lib/followUpAspect'
import {
  applyFollowUpAnswersToExtraction,
  buildAnswerRecords,
  mergeAnswerRecords,
} from '../../services/applyFollowUpAnswers'
import { MAX_FOLLOWUP_ROUNDS } from '../../config/followUpLimits'
import { useAppStore } from '../../store/useAppStore'
import { Card } from '../ui/Card'
import { FollowUpCard } from './FollowUpCard'
import type { MealSlot, VoiceExtraction } from '../../types/voice'
import { todayStr } from '../../lib/dates'
import { isTauri } from '../../lib/platform'

interface VoiceRecorderProps {
  /** 与页面日期跟踪联动 */
  recordDateOverride?: string
}

export function VoiceRecorder({ recordDateOverride }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [preview, setPreview] = useState<VoiceExtraction | null>(null)
  const [recordDate, setRecordDate] = useState(todayStr())
  const [mealSlot, setMealSlot] = useState<MealSlot>('unknown')
  const [llmKey, setLlmKey] = useState<string | undefined>()
  const llmReady = isLlmAvailable(llmKey)
  const recRef = useRef<SpeechRecognition | null>(null)
  const followUpCountedRef = useRef<string | null>(null)
  const addVoiceLog = useAppStore((s) => s.addVoiceLog)
  const voiceLogs = useAppStore((s) => s.voiceLogs)

  useEffect(() => {
    getFollowUpSettings().then((s) => setLlmKey(s.llmApiKey))
  }, [])

  useEffect(() => {
    if (recordDateOverride) setRecordDate(recordDateOverride)
  }, [recordDateOverride])

  const buildMealContext = (date: string, slot: MealSlot, text: string, excludeId?: string) => {
    const dayLogs = voiceLogs.filter(
      (l) => getRecordDate(l) === date && l.id !== excludeId,
    )
    const effectiveSlot =
      slot === 'unknown' ? inferMealSlotFromTranscript(text) ?? 'unknown' : slot
    return { recordDate: date, mealSlot: effectiveSlot, dayLogs }
  }

  const runExtraction = async (
    text: string,
    supplementalContext?: string,
    previousQuestionKeys?: string[],
    skipFollowUpLimit = false,
  ) => {
    setExtracting(true)
    try {
      const date = preview?.recordDate ?? recordDate
      let slot = preview?.mealSlot ?? mealSlot
      if (slot === 'unknown') {
        const inferred = inferMealSlotFromTranscript(text)
        if (inferred) setMealSlot(inferred)
        slot = inferred ?? slot
      }
      const extraction = await extractFromTranscript(text, {
        supplementalContext,
        mealContext: buildMealContext(date, slot, text, preview?.id),
        previousQuestionKeys,
        skipFollowUpLimit,
      })
      const newPreview = buildVoiceLog(text, extraction, date, slot === 'unknown' ? undefined : slot)
      setPreview(newPreview)
      return newPreview
    } finally {
      setExtracting(false)
    }
  }

  const mergePreviewAfterFollowUp = (
    base: VoiceExtraction,
    newPreview: VoiceExtraction,
    questions: VoiceExtraction['followUpQuestions'],
    answers: Record<string, string>,
    allKeys: string[],
    previousIds: string[],
    currentIds: string[],
  ): VoiceExtraction => {
    const round = base.followUpRound ?? 1
    const answerRecords = mergeAnswerRecords(
      base.followupMeta?.answers,
      buildAnswerRecords(questions, answers, round),
    )

    let merged: VoiceExtraction = {
      ...newPreview,
      followupMeta: {
        ...newPreview.followupMeta,
        roundsTriggered: (base.followupMeta?.roundsTriggered ?? 0) + 1,
        questionsAsked: [...previousIds, ...currentIds],
        questionsSkipped: base.followupMeta?.questionsSkipped ?? [],
        unresolvedFlags: newPreview.followupMeta?.unresolvedFlags ?? [],
        askedStableKeys: allKeys,
        answers: answerRecords,
      },
    }

    const atRoundCap = (merged.followUpRound ?? 1) >= MAX_FOLLOWUP_ROUNDS
    if (merged.needsFollowUp && atRoundCap) {
      merged = applyFollowUpAnswersToExtraction(merged, questions, answers)
      merged = {
        ...merged,
        followupMeta: {
          ...merged.followupMeta!,
          answers: answerRecords,
          askedStableKeys: allKeys,
        },
      }
    }

    return merged
  }

  const startRecording = () => {
    setTranscript('')
    setPreview(null)
    if (isSpeechSupported()) {
      const rec = createSpeechRecognizer(
        (text) => setTranscript(text),
        () => setRecording(false),
      )
      recRef.current = rec
      rec?.start()
    }
    setRecording(true)
  }

  const stopRecording = async () => {
    recRef.current?.stop()
    setRecording(false)
    if (!transcript.trim()) return
    await runExtraction(transcript)
  }

  const handleFollowUpSubmit = async (answers: Record<string, string>) => {
    if (!preview) return
    const supplemental = preview.followUpQuestions
      .map((q) => `${q.question} → ${answers[q.id] ?? ''}`)
      .filter((s) => !s.endsWith('→ '))
      .join('\n')

    const currentKeys = preview.followUpQuestions.map((q) => buildStableKey(q))
    const currentIds = preview.followUpQuestions.map((q) => q.id)
    const previousKeys = preview.followupMeta?.askedStableKeys ?? []
    const previousIds = preview.followupMeta?.questionsAsked ?? []
    const allKeys = [...previousKeys, ...currentKeys]

    const newPreview = await runExtraction(preview.transcript, supplemental, allKeys)
    if (!newPreview) return

    setPreview(
      mergePreviewAfterFollowUp(
        preview,
        newPreview,
        preview.followUpQuestions,
        answers,
        allKeys,
        previousIds,
        currentIds,
      ),
    )
  }

  const handleFollowUpSkip = async () => {
    if (!preview) return
    await recordFollowUpSkipped()
    const skippedIds = preview.followUpQuestions.map((q) => q.id)
    const currentKeys = preview.followUpQuestions.map((q) => buildStableKey(q))
    const previousKeys = preview.followupMeta?.askedStableKeys ?? []
    setPreview({
      ...preview,
      needsFollowUp: false,
      followUpQuestions: [],
      followupMeta: {
        roundsTriggered: preview.followupMeta?.roundsTriggered ?? 1,
        questionsAsked: preview.followupMeta?.questionsAsked ?? [],
        questionsSkipped: [...(preview.followupMeta?.questionsSkipped ?? []), ...skippedIds],
        unresolvedFlags: preview.followUpQuestions.map((q) => q.targetFood ?? q.field),
        askedStableKeys: [...previousKeys, ...currentKeys],
        answers: preview.followupMeta?.answers,
      },
      foods: preview.foods.map((f) => ({ ...f, unresolved: f.confidence < 0.7 || f.portion === 'unknown' })),
    })
  }

  const saveLog = async () => {
    if (!preview) return
    const toSave: VoiceExtraction = {
      ...preview,
      needsFollowUp: false,
      followUpQuestions: [],
      followupMeta: preview.followupMeta,
    }
    learnFromExtraction(toSave)
    await addVoiceLog(toSave)
    setPreview(null)
    setTranscript('')
  }

  const showFollowUp =
    preview?.needsFollowUp &&
    preview.followUpQuestions.length > 0 &&
    (preview.followUpRound ?? 1) <= MAX_FOLLOWUP_ROUNDS

  const canRetryFollowUp =
    preview &&
    !showFollowUp &&
    !extracting &&
    (preview.overallConfidence < 0.7 || (preview.uncertaintySignals?.length ?? 0) > 0) &&
    (preview.followUpRound ?? 0) < MAX_FOLLOWUP_ROUNDS

  useEffect(() => {
    if (!preview || !showFollowUp) {
      followUpCountedRef.current = null
      return
    }
    const key = `${preview.id}:${preview.followUpRound ?? 1}`
    if (followUpCountedRef.current === key) return
    followUpCountedRef.current = key
    void recordFollowUpShown(preview.recordDate, preview.followUpQuestions.length)
  }, [preview, showFollowUp])

  const handleRetryFollowUp = async () => {
    if (!preview) return
    await runExtraction(preview.transcript, undefined, preview.followupMeta?.askedStableKeys, true)
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border px-3 py-2 text-xs ${
          llmReady
            ? 'border-[var(--color-green)]/30 bg-[var(--color-green)]/5 text-[var(--color-green)]'
            : 'border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 text-[var(--color-yellow)]'
        }`}
      >
        {llmReady ? (
          <span className="flex items-center gap-1">
            <Sparkles size={12} /> LLM 智能提取 + 追问已启用
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <MessageCircleQuestion size={12} /> 本地追问模式（设置页可配置 LLM Key 提升准确度）
          </span>
        )}
        {isTauri() && (
          <p className="mt-1 text-[var(--color-muted)]">Mac App 建议文字输入；追问回答支持快捷选项与文字。</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          onClick={() => (recording ? stopRecording() : startRecording())}
          className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${
            recording ? 'bg-[var(--color-red)]/20 ring-4 ring-[var(--color-red)]' : 'bg-[var(--color-surface-2)] hover:bg-[var(--color-accent)]/20'
          }`}
        >
          {recording ? <Square size={32} className="text-[var(--color-red)]" /> : <Mic size={32} />}
        </button>
        <p className="text-sm text-[var(--color-muted)]">
          {recording ? '录音中… 松开或点击结束' : '长按或点击开始录音'}
          {!isSpeechSupported() && '（浏览器不支持语音识别，请使用文字输入）'}
        </p>
      </div>

      <Card>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            记录日期
            <input
              type="date"
              value={recordDate}
              max={todayStr()}
              onChange={(e) => setRecordDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm"
            />
          </label>
          <label className="text-sm">
            餐次
            <select
              value={mealSlot}
              onChange={(e) => setMealSlot(e.target.value as MealSlot)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm"
            >
              <option value="unknown">未标注</option>
              <option value="breakfast">早餐</option>
              <option value="lunch">午餐</option>
              <option value="dinner">晚餐</option>
              <option value="snack">加餐</option>
            </select>
          </label>
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <PenLine size={14} /> 转写文本（可编辑）
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={4}
          placeholder='例如：中午吃了碗面 / 喝了奶茶 / 吃了点海鲜 / 叫了外卖 / 有点焦虑压力7'
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="button"
          disabled={!transcript.trim() || extracting}
          onClick={() => runExtraction(transcript)}
          className="mt-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {extracting ? '分析中…' : '结构化提取'}
        </button>
      </Card>

      {preview && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">提取预览</h3>
            <span className="text-xs text-[var(--color-muted)]">
              {preview.extractionSource === 'llm' ? '✨ LLM' : '本地规则'} ·
              置信度 {(preview.overallConfidence * 100).toFixed(0)}%
              {(preview.followUpRound ?? 0) > 0 && ` · 追问第 ${preview.followUpRound} 轮`}
            </span>
          </div>

          {preview.mealSummary && (
            <p className="mb-3 rounded-lg bg-[var(--color-surface-2)] p-2 text-sm text-[var(--color-muted)]">
              {preview.mealSummary}
            </p>
          )}

          {preview.uncertaintySignals && preview.uncertaintySignals.length > 0 && (
            <div className="mb-3 rounded-lg border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/5 p-2 text-xs">
              <p className="mb-1 font-medium text-[var(--color-yellow)]">抽取不确定性</p>
              {preview.uncertaintySignals.map((s, i) => (
                <p key={i} className="text-[var(--color-muted)]">· {s.detail}</p>
              ))}
            </div>
          )}

          {preview.extractionDisclaimer && (
            <p className="mb-3 text-xs text-[var(--color-muted)]">{preview.extractionDisclaimer}</p>
          )}

          <div className="space-y-2 text-sm">
            {preview.foods.map((f, i) => (
              <div
                key={i}
                className={`rounded-lg p-2 ${f.confidence < 0.55 ? 'bg-[var(--color-gold)]/10' : 'bg-[var(--color-surface-2)]'}`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-[var(--color-muted)]">{(f.confidence * 100).toFixed(0)}%</span>
                </div>
                {(f.cookingMethod || f.components?.length || f.dbMatchHint || f.amountG) && (
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {f.portion !== 'unknown' && `${f.portion} · `}
                    {f.amountG && `${f.amountG}g · `}
                    {f.cookingMethod && `${f.cookingMethod} · `}
                    {f.components?.join(' + ')}
                    {f.dbMatchHint && ` · ${f.dbMatchHint}`}
                  </p>
                )}
                {f.uncertaintyNotes?.map((note) => (
                  <p key={note} className="mt-1 text-xs text-[var(--color-yellow)]/80">⚠ {note}</p>
                ))}
              </div>
            ))}
            {preview.emotions.length > 0 && <p>情绪：{preview.emotions.join('、')}</p>}
            {preview.symptoms.length > 0 && <p>症状：{preview.symptoms.join('、')}</p>}
            {preview.stressScore != null && <p>压力评分：{preview.stressScore}/10</p>}
          </div>

          {preview.followupMeta?.answers && preview.followupMeta.answers.length > 0 && (
            <div className="mt-3 rounded-lg bg-[var(--color-surface-2)] p-2 text-xs">
              <p className="mb-1 font-medium text-[var(--color-muted)]">已答追问</p>
              {preview.followupMeta.answers.map((a) => (
                <p key={a.questionId} className="text-[var(--color-muted)]">
                  · {a.question} → <span className="text-[var(--color-text)]">{a.answer}</span>
                </p>
              ))}
            </div>
          )}

          {showFollowUp ? (
            <div className="mt-4">
              <FollowUpCard
                questions={preview.followUpQuestions}
                contextHint={preview.followUpHint}
                mealSlot={preview.mealSlot}
                roundIndex={(preview.followUpRound ?? 1) - 1}
                onSubmit={handleFollowUpSubmit}
                onSkip={handleFollowUpSkip}
                loading={extracting}
              />
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {canRetryFollowUp && (
                <button
                  type="button"
                  disabled={extracting}
                  onClick={handleRetryFollowUp}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-teal)]/40 bg-[var(--color-teal)]/10 px-4 py-2 text-sm text-[var(--color-teal)] disabled:opacity-50"
                >
                  <RefreshCw size={14} />
                  {extracting ? '生成追问中…' : '智能追问补充'}
                </button>
              )}
              <button
                type="button"
                onClick={saveLog}
                className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm text-white"
              >
                保存记录
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
