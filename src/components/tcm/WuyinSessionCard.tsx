import { useState, useEffect, useRef, useMemo } from 'react'
import type { WuyinPrescription } from '../../types/tcm'
import { useAppStore } from '../../store/useAppStore'
import { playReferenceTone, playToneForDuration } from '../../services/audioTone'
import { getWuyinContextLine } from '../../lib/wuyinContextLine'
import { ToneStamp } from './ToneStamp'
import { WuyinExpandPanel } from './WuyinExpandPanel'
import { Button } from '../ui/Button'
import { humPatternToAnimClass } from '../../lib/wuyinBreathingPattern'
import { Music2, Square, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  prescription: WuyinPrescription
  theme?: 'default' | 'dojo'
}

function BreathingPreview({
  pattern,
  size,
  iconSize,
  ringBorder,
  ringFill,
  ringIcon,
}: {
  pattern: string
  size: number
  iconSize: number
  ringBorder: string
  ringFill: string
  ringIcon: string
}) {
  const animClass = humPatternToAnimClass(pattern)
  return (
    <div className="flex items-center justify-center py-2" style={{ opacity: 0.65 }}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className={`absolute rounded-full border-2 ${ringBorder} ${animClass}`} style={{ width: size, height: size }} />
        <div className={`absolute rounded-full ${ringFill} ${animClass}`} style={{ width: size, height: size }} />
        <Music2 size={iconSize} className={`relative z-10 ${ringIcon}`} />
      </div>
    </div>
  )
}

export function WuyinSessionCard({ prescription, theme = 'default' }: Props) {
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

  const isDojo = theme === 'dojo'
  const ringSize = isDojo && phase === 'session' ? 120 : phase === 'session' ? 80 : isDojo ? 64 : 48
  const iconSize = phase === 'session' ? (isDojo ? 28 : 20) : isDojo ? 16 : 12
  const ringBorder = isDojo ? 'border-[var(--tcm-amber)]/35' : 'border-[var(--color-coral)]/30'
  const ringFill = isDojo ? 'bg-[var(--tcm-amber)]/12' : 'bg-[var(--color-coral)]/15'
  const ringIcon = isDojo ? 'text-[var(--tcm-amber)]' : 'text-[var(--color-coral)]'

  return (
    <div
      className={
        isDojo
          ? 'tcm-glass tcm-paper rounded-2xl p-6'
          : 'rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6'
      }
      style={isDojo ? undefined : { boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <ToneStamp toneId={prescription.toneId} label={prescription.label} />
        <div className="min-w-0 flex-1">
          <p
            className={
              isDojo
                ? 'text-xs tracking-[0.15em] text-[var(--tcm-amber)]'
                : 'text-xs uppercase tracking-wide text-[var(--color-coral)]'
            }
            style={isDojo ? { fontFamily: 'var(--tcm-font-serif)' } : undefined}
          >
            今日音疗 · 放松练习
          </p>
          <h3
            className={
              isDojo
                ? 'text-lg text-[var(--tcm-text)]'
                : 'text-lg font-semibold'
            }
            style={isDojo ? { fontFamily: 'var(--tcm-font-serif)' } : undefined}
          >
            {prescription.label}
          </h3>
          <p className={`mt-1 text-sm ${isDojo ? 'text-[var(--tcm-muted)]' : 'text-[var(--color-muted)]'}`}>
            {contextLine}
          </p>
        </div>
      </div>

      {/* Idle breathing preview */}
      {phase === 'idle' && (
        <BreathingPreview
          pattern={prescription.humPattern}
          size={ringSize}
          iconSize={iconSize}
          ringBorder={ringBorder}
          ringFill={ringFill}
          ringIcon={ringIcon}
        />
      )}

      {/* Session breathing (full size) */}
      {phase === 'session' && (
        <div className={`flex items-center justify-center ${isDojo ? 'py-8' : 'py-4'}`}>
          <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
            <div
              className={`absolute rounded-full border-2 ${ringBorder} ${humPatternToAnimClass(prescription.humPattern)}`}
              style={{ width: ringSize, height: ringSize }}
            />
            <div
              className={`absolute rounded-full ${ringFill} ${humPatternToAnimClass(prescription.humPattern)}`}
              style={{ width: ringSize, height: ringSize }}
            />
            <Music2 size={iconSize} className={`relative z-10 ${ringIcon}`} />
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
        {phase === 'preview' && (
          <span className={`text-sm ${isDojo ? 'text-[var(--tcm-wood)]' : 'text-[var(--color-teal)]'}`}>
            播放参考音…
          </span>
        )}
        {phase === 'session' && (
          <>
            <span className={`text-sm font-medium ${isDojo ? 'text-[var(--tcm-wood)]' : 'text-[var(--color-teal)]'}`}>
              剩余 {secondsLeft}s
            </span>
            <Button variant="ghost" onClick={handleStop}>
              <Square size={14} /> 停止
            </Button>
          </>
        )}
        {phase === 'done' && (
          <span className={`text-sm ${isDojo ? 'text-[var(--tcm-muted)]' : 'text-[var(--color-muted)]'}`}>
            练习完成，做得很好。
          </span>
        )}
      </div>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`mt-3 flex items-center gap-1 text-xs transition-colors ${
          isDojo
            ? 'text-[var(--tcm-muted)] hover:text-[var(--tcm-text)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        }`}
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

