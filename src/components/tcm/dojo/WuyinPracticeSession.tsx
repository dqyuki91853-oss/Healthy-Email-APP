import { useEffect, useMemo, useRef, useState } from 'react'
import type { WuyinPrescription } from '../../../types/tcm'
import { WUYIN_TONES } from '../../../config/wuyinToneMap'
import { useAppStore } from '../../../store/useAppStore'
import { playCompletionChime, playReferenceTone, playToneForDuration } from '../../../services/audioTone'
import { getWuyinContextLine } from '../../../lib/wuyinContextLine'
import { recordWuyinPractice } from '../../../lib/wuyinPracticeStreak'
import { humPatternPhaseHint } from '../../../lib/wuyinBreathingPattern'
import { ToneStamp } from '../ToneStamp'
import { WuyinExpandPanel } from '../WuyinExpandPanel'
import { DojoBreathPhaseCue } from './DojoBreathPhaseCue'
import { DojoBreathingRing } from './DojoBreathingRing'
import { DojoIncenseTimer } from './DojoIncenseTimer'
import { DojoPrepCountdown } from './DojoPrepCountdown'
import { DojoPracticeComplete } from './DojoPracticeComplete'
import { Button } from '../../ui/Button'
import { ChevronDown, ChevronUp, Square } from 'lucide-react'

interface Props {
  prescription: WuyinPrescription
}

type Phase = 'idle' | 'preview' | 'preparing' | 'session' | 'done'

/** Phase 3 — 沉浸式跟哼练习（呼吸环 + 线香计时 + 收功） */
export function WuyinPracticeSession({ prescription }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [prepCount, setPrepCount] = useState(3)
  const [secondsLeft, setSecondsLeft] = useState(prescription.durationSec)
  const [expanded, setExpanded] = useState(false)
  const [practiceStats, setPracticeStats] = useState({ streak: 0, total: 0 })
  const stopRef = useRef<(() => void) | null>(null)
  const timerRef = useRef<number | null>(null)
  const prepRef = useRef<number | null>(null)

  const wellness = useAppStore((s) => s.wellness)
  const moodTag = wellness?.mood?.dominant ?? 'unknown'
  const weather = wellness?.bodyWeather ?? null
  const tone = WUYIN_TONES[prescription.toneId]

  const contextLine = useMemo(
    () => getWuyinContextLine(prescription, moodTag as Parameters<typeof getWuyinContextLine>[1], weather),
    [prescription, moodTag, weather],
  )

  useEffect(() => {
    return () => {
      stopRef.current?.()
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (prepRef.current) window.clearInterval(prepRef.current)
    }
  }, [])

  const cleanup = () => {
    stopRef.current?.()
    stopRef.current = null
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (prepRef.current) {
      window.clearInterval(prepRef.current)
      prepRef.current = null
    }
  }

  const beginSession = async () => {
    setPhase('session')
    setSecondsLeft(prescription.durationSec)
    const handle = await playToneForDuration(prescription.frequencyHz, prescription.durationSec)
    stopRef.current = handle.stop
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          cleanup()
          const stats = recordWuyinPractice()
          setPracticeStats(stats)
          void playCompletionChime()
          setPhase('done')
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const handlePreview = async () => {
    cleanup()
    setPhase('preview')
    const handle = await playReferenceTone(prescription.frequencyHz, 2500)
    stopRef.current = handle.stop
    window.setTimeout(() => setPhase('idle'), 2600)
  }

  const handleStart = () => {
    cleanup()
    setPhase('preparing')
    setPrepCount(3)
    prepRef.current = window.setInterval(() => {
      setPrepCount((c) => {
        if (c <= 1) {
          if (prepRef.current) window.clearInterval(prepRef.current)
          prepRef.current = null
          void beginSession()
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleStop = () => {
    cleanup()
    setPhase('idle')
    setSecondsLeft(prescription.durationSec)
    setPrepCount(3)
  }

  const handleRestart = () => {
    setSecondsLeft(prescription.durationSec)
    setPrepCount(3)
    setPhase('idle')
  }

  const phaseHint = humPatternPhaseHint(prescription.humPattern)
  const immersive = phase === 'session' || phase === 'preparing' || phase === 'preview'

  return (
    <div className={`dojo-practice-session ${immersive ? 'dojo-practice-session--immersive' : ''}`}>
      {phase === 'preparing' && (
        <div className="dojo-practice-immersive" role="region" aria-label="准备入道场">
          <DojoPrepCountdown count={prepCount} />
          <p className="dojo-practice-immersive__hint" style={{ fontFamily: 'var(--tcm-font-serif)' }}>
            调息 · 放松肩颈
          </p>
          <Button variant="ghost" onClick={handleStop}>
            取消
          </Button>
        </div>
      )}

      {phase === 'session' && (
        <div className="dojo-practice-immersive" role="region" aria-label="跟哼练习中">
          <DojoBreathingRing
            pattern={prescription.humPattern}
            toneLabel={tone.label}
            organLabel={tone.organLabel}
            frequencyHz={prescription.frequencyHz}
          />
          <DojoBreathPhaseCue pattern={prescription.humPattern} active />
          <p className="dojo-practice-immersive__instruction">{prescription.instructionText}</p>
          <DojoIncenseTimer
            totalSec={prescription.durationSec}
            secondsLeft={secondsLeft}
          />
          <div className="dojo-practice-immersive__controls">
            <span className="text-sm text-[var(--tcm-wood)]">跟哼中 · 剩余 {secondsLeft}s</span>
            <Button variant="ghost" onClick={handleStop}>
              <Square size={14} /> 收功
            </Button>
          </div>
        </div>
      )}

      {phase !== 'session' && phase !== 'preparing' && (
        <div className="tcm-glass tcm-paper rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <ToneStamp toneId={prescription.toneId} label={prescription.label} />
            <div className="min-w-0 flex-1">
              <p
                className="text-xs tracking-[0.15em] text-[var(--tcm-amber)]"
                style={{ fontFamily: 'var(--tcm-font-serif)' }}
              >
                呼吸道场
              </p>
              <h3 className="text-lg text-[var(--tcm-text)]" style={{ fontFamily: 'var(--tcm-font-serif)' }}>
                {prescription.label}
              </h3>
              <p className="mt-1 text-sm text-[var(--tcm-muted)]">{contextLine}</p>
            </div>
          </div>

          {phase === 'idle' && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <DojoBreathingRing
                pattern={prescription.humPattern}
                toneLabel={tone.label}
                organLabel={tone.organLabel}
                frequencyHz={prescription.frequencyHz}
                active={false}
              />
              <DojoBreathPhaseCue pattern={prescription.humPattern} active={false} />
              <p className="text-xs text-[var(--tcm-muted)]">{phaseHint}</p>
            </div>
          )}

          {phase === 'preview' && (
            <p className="mt-6 text-center text-sm text-[var(--tcm-wood)]">播放参考音…</p>
          )}

          {phase === 'done' && (
            <div className="mt-6">
              <DojoPracticeComplete streak={practiceStats.streak} total={practiceStats.total} />
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {phase === 'idle' && (
              <>
                <Button variant="secondary" onClick={handlePreview}>试听参考音</Button>
                <Button onClick={handleStart}>入道场 · {prescription.durationSec}s</Button>
              </>
            )}
            {phase === 'done' && (
              <>
                <Button variant="secondary" onClick={handleRestart}>再来一炷</Button>
                <Button onClick={handleStart}>继续练习</Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-[var(--tcm-muted)] hover:text-[var(--tcm-text)]"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? '收起详情' : '了解这音'}
          </button>

          {expanded && (
            <div className="mt-3 border-t border-[var(--tcm-border)] pt-3">
              <WuyinExpandPanel
                prescription={prescription}
                moodLabel={wellness?.mood?.gentleNote}
                contextLine={contextLine}
                moodMetaphors={
                  wellness?.mood ? ([wellness.mood.gentleNote].filter(Boolean) as string[]) : undefined
                }
                theme="dojo"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
