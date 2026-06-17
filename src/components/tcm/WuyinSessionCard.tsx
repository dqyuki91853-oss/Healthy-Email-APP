import { useState, useEffect, useRef, useMemo } from 'react'
import type { WuyinPrescription } from '../../types/tcm'
import { useAppStore } from '../../store/useAppStore'
import { playReferenceTone, playToneForDuration } from '../../services/audioTone'
import { getWuyinContextLine } from '../../lib/wuyinContextLine'
import { ToneStamp } from './ToneStamp'
import { WuyinExpandPanel } from './WuyinExpandPanel'
import { Button } from '../ui/Button'
import { Music2, Square, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  prescription: WuyinPrescription
}

function BreathingPreview({ pattern }: { pattern: string }) {
  const animClass = patternToAnimClass(pattern)
  return (
    <div className="flex items-center justify-center py-2" style={{ opacity: 0.5 }}>
      <style>{breathingStyles}</style>
      <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
        <div className={`absolute rounded-full border-2 border-[var(--color-coral)]/30 ${animClass}`} style={{ width: 48, height: 48 }} />
        <div className={`absolute rounded-full bg-[var(--color-coral)]/15 ${animClass}`} style={{ width: 48, height: 48 }} />
        <Music2 size={12} className="relative z-10 text-[var(--color-coral)]" />
      </div>
    </div>
  )
}

function patternToAnimClass(pattern: string): string {
  switch (pattern) {
    case 'short-hum-6-rounds': return 'wb-short-hum'
    case 'long-exhale-hum': return 'wb-long-exhale'
    case 'low-sustained-hum': return 'wb-low-sustain'
    default: return 'wb-inhale-hum-exhale'
  }
}

export function WuyinSessionCard({ prescription }: Props) {
  const [phase, setPhase] = useState<'idle' | 'preview' | 'session' | 'done'>('idle')
  const [secondsLeft, setSecondsLeft] = useState(prescription.durationSec)
  const [expanded, setExpanded] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)
  const timerRef = useRef<number | null>(null)

  const wellness = useAppStore((s) => s.wellness)
  const moodTag = wellness?.mood?.dominant ?? 'unknown'
  const weather = wellness?.bodyWeather ?? null

  const contextLine = useMemo(
    () => getWuyinContextLine(prescription, moodTag as Parameters<typeof getWuyinContextLine>[1], weather),
    [prescription, moodTag, weather],
  )

  useEffect(() => {
    return () => {
      stopRef.current?.()
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const handlePreview = async () => {
    stopRef.current?.()
    setPhase('preview')
    const handle = await playReferenceTone(prescription.frequencyHz, 2500)
    stopRef.current = handle.stop
    window.setTimeout(() => setPhase('idle'), 2600)
  }

  const handleStart = async () => {
    stopRef.current?.()
    if (timerRef.current) window.clearInterval(timerRef.current)
    setPhase('session')
    setSecondsLeft(prescription.durationSec)
    const handle = await playToneForDuration(prescription.frequencyHz, prescription.durationSec)
    stopRef.current = handle.stop
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          setPhase('done')
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const handleStop = () => {
    stopRef.current?.()
    if (timerRef.current) window.clearInterval(timerRef.current)
    setPhase('idle')
    setSecondsLeft(prescription.durationSec)
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <ToneStamp toneId={prescription.toneId} label={prescription.label} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-[var(--color-coral)]">
            今日音疗 · 放松练习
          </p>
          <h3 className="text-lg font-semibold">{prescription.label}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{contextLine}</p>
        </div>
      </div>

      {/* Idle breathing preview */}
      {phase === 'idle' && <BreathingPreview pattern={prescription.humPattern} />}

      {/* Session breathing (full size) */}
      {phase === 'session' && (
        <div className="flex items-center justify-center py-4">
          <style>{breathingStyles}</style>
          <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
            <div className={`absolute rounded-full border-2 border-[var(--color-coral)]/30 ${patternToAnimClass(prescription.humPattern)}`} style={{ width: 80, height: 80 }} />
            <div className={`absolute rounded-full bg-[var(--color-coral)]/15 ${patternToAnimClass(prescription.humPattern)}`} style={{ width: 80, height: 80 }} />
            <Music2 size={20} className="relative z-10 text-[var(--color-coral)]" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {phase === 'idle' && (
          <>
            <Button variant="secondary" onClick={handlePreview}>试听参考音</Button>
            <Button onClick={handleStart}>开始哼唱 {prescription.durationSec}s</Button>
          </>
        )}
        {phase === 'preview' && <span className="text-sm text-[var(--color-teal)]">播放参考音…</span>}
        {phase === 'session' && (
          <>
            <span className="text-sm font-medium text-[var(--color-teal)]">剩余 {secondsLeft}s</span>
            <Button variant="ghost" onClick={handleStop}>
              <Square size={14} /> 停止
            </Button>
          </>
        )}
        {phase === 'done' && <span className="text-sm text-[var(--color-muted)]">练习完成，做得很好。</span>}
      </div>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? '收起详情' : '了解这音'}
      </button>

      {/* Expand panel */}
      {expanded && (
        <WuyinExpandPanel
          prescription={prescription}
          moodLabel={wellness?.mood?.gentleNote}
          contextLine={contextLine}
          moodMetaphors={wellness?.mood ? [wellness.mood.gentleNote].filter(Boolean) as string[] : undefined}
        />
      )}
    </div>
  )
}

/* ─── Breathing styles (same as original) ─── */
const breathingStyles = `
.wb-inhale-hum-exhale { animation: wbInhaleHumExhale 16s ease-in-out infinite; }
@keyframes wbInhaleHumExhale {
  0% { transform: scale(0.6); opacity: 0.4; }
  25% { transform: scale(1); opacity: 0.9; }
  37% { transform: scale(1); opacity: 0.9; }
  62% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(0.6); opacity: 0.4; }
}
.wb-long-exhale { animation: wbLongExhale 16s ease-in-out infinite; }
@keyframes wbLongExhale {
  0% { transform: scale(0.5); opacity: 0.35; }
  25% { transform: scale(0.85); opacity: 0.8; }
  37% { transform: scale(0.85); opacity: 0.8; }
  62% { transform: scale(0.85); opacity: 0.6; }
  100% { transform: scale(0.5); opacity: 0.35; }
}
.wb-low-sustain { animation: wbLowSustain 18s ease-in-out infinite; }
@keyframes wbLowSustain {
  0% { transform: scale(0.55); opacity: 0.4; }
  22% { transform: scale(0.9); opacity: 0.85; }
  50% { transform: scale(0.9); opacity: 0.75; }
  83% { transform: scale(0.9); opacity: 0.5; }
  100% { transform: scale(0.55); opacity: 0.4; }
}
.wb-short-hum { animation: wbShortHum 4s ease-in-out infinite; }
@keyframes wbShortHum {
  0% { transform: scale(0.65); opacity: 0.45; }
  37% { transform: scale(1); opacity: 0.95; }
  50% { transform: scale(1); opacity: 0.85; }
  62% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(0.65); opacity: 0.45; }
}
@media (prefers-reduced-motion: reduce) {
  .wb-inhale-hum-exhale, .wb-long-exhale, .wb-low-sustain, .wb-short-hum { animation: none !important; }
}
`
