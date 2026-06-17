import { useCallback, useEffect, useRef, useState } from 'react'
import type { WuyinAudioTrack } from '../../../lib/wuyinAudioLibrary'
import { playWuyinMix, playWuyinTrack } from '../../../services/audioTone'
import { TaijiPlayKnob } from './TaijiPlayKnob'

interface Props {
  tracks: WuyinAudioTrack[]
  activeTrackId: string | null
  onSelect: (track: WuyinAudioTrack) => void
}

const categoryMeta: Record<
  WuyinAudioTrack['category'],
  { emoji: string; label: string; cardClass: string }
> = {
  ambient: { emoji: '🌿', label: '环境音', cardClass: 'dojo-track--ambient' },
  melody: { emoji: '🎵', label: '旋律', cardClass: 'dojo-track--melody' },
  nature: { emoji: '💧', label: '自然音', cardClass: 'dojo-track--nature' },
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function WaveformBars({ playing }: { playing: boolean }) {
  return (
    <div className={`dojo-waveform ${playing ? 'dojo-waveform--live' : ''}`} aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

type PlayMode = 'mix' | 'nature' | null

export function WuyinPrescriptionWaterfall({ tracks, activeTrackId, onSelect }: Props) {
  const [playMode, setPlayMode] = useState<PlayMode>(null)
  const [mix, setMix] = useState(0.5)
  const [progress, setProgress] = useState(0)
  const stopRef = useRef<(() => void) | null>(null)
  const setMixRef = useRef<((m: number) => void) | null>(null)
  const audioRefs = useRef<HTMLAudioElement[]>([])
  const tickRef = useRef<number | null>(null)

  const ambient = tracks.find((t) => t.category === 'ambient')
  const melody = tracks.find((t) => t.category === 'melody')
  const nature = tracks.find((t) => t.category === 'nature')

  const stopAll = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setMixRef.current = null
    for (const a of audioRefs.current) {
      a.pause()
      a.removeAttribute('src')
    }
    audioRefs.current = []
    if (tickRef.current) window.clearInterval(tickRef.current)
    tickRef.current = null
    setProgress(0)
    setPlayMode(null)
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  const tracksKey = tracks.map((t) => t.id).join('|')
  useEffect(() => {
    stopAll()
  }, [tracksKey, stopAll])

  useEffect(() => {
    setMixRef.current?.(mix)
    for (const a of audioRefs.current) {
      if (audioRefs.current.length === 2) {
        a.volume = (a.dataset.layer === 'ambient' ? 1 - mix : mix) * 0.85
      }
    }
  }, [mix])

  const startMix = useCallback(async () => {
    if (!ambient || !melody) return
    stopAll()
    onSelect(melody)
    setPlayMode('mix')

    const duration = Math.min(ambient.durationSec, melody.durationSec)

    if (ambient.src && melody.src) {
      const a1 = new Audio(ambient.src)
      const a2 = new Audio(melody.src)
      a1.dataset.layer = 'ambient'
      a2.dataset.layer = 'melody'
      a1.volume = 0
      a2.volume = 0
      audioRefs.current = [a1, a2]
      const onEnd = () => stopAll()
      a1.addEventListener('ended', onEnd)
      a2.addEventListener('ended', onEnd)
      await Promise.all([a1.play(), a2.play()])
      // Phase 2A：crossfade 淡入
      const targetA = (1 - mix) * 0.85
      const targetM = mix * 0.85
      const steps = 12
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => window.setTimeout(r, 25))
        a1.volume = (targetA * i) / steps
        a2.volume = (targetM * i) / steps
      }
      stopRef.current = () => {
        a1.removeEventListener('ended', onEnd)
        a2.removeEventListener('ended', onEnd)
        a1.pause()
        a2.pause()
      }
    } else {
      const handle = await playWuyinMix(
        { frequencyHz: ambient.frequencyHz, durationSec: duration, category: 'ambient' },
        { frequencyHz: melody.frequencyHz, durationSec: duration, category: 'melody' },
        mix,
      )
      stopRef.current = handle.stop
      setMixRef.current = handle.setMix
    }

    const start = Date.now()
    tickRef.current = window.setInterval(() => {
      const e = (Date.now() - start) / 1000
      if (e >= duration) {
        stopAll()
      } else {
        setProgress(e / duration)
      }
    }, 200)
  }, [ambient, melody, mix, onSelect, stopAll])

  const startNature = useCallback(async () => {
    if (!nature) return
    stopAll()
    onSelect(nature)
    setPlayMode('nature')

    if (nature.src) {
      const audio = new Audio(nature.src)
      audio.volume = 0
      audioRefs.current = [audio]
      const onEnd = () => stopAll()
      audio.addEventListener('ended', onEnd)
      audio.addEventListener('timeupdate', () => {
        if (audio.duration) setProgress(audio.currentTime / audio.duration)
      })
      await audio.play()
      for (let i = 1; i <= 10; i++) {
        await new Promise((r) => window.setTimeout(r, 30))
        audio.volume = (0.85 * i) / 10
      }
      stopRef.current = () => {
        audio.removeEventListener('ended', onEnd)
        audio.pause()
      }
    } else {
      const handle = await playWuyinTrack({
        frequencyHz: nature.frequencyHz,
        durationSec: nature.durationSec,
        category: 'nature',
      })
      stopRef.current = handle.stop
      const start = Date.now()
      tickRef.current = window.setInterval(() => {
        const e = (Date.now() - start) / 1000
        if (e >= nature.durationSec) stopAll()
        else setProgress(e / nature.durationSec)
      }, 200)
    }
  }, [nature, onSelect, stopAll])

  if (tracks.length === 0) {
    return <p className="py-6 text-center text-xs text-[var(--tcm-muted)]">暂无可选音轨</p>
  }

  const ordered = (['ambient', 'melody', 'nature'] as const)
    .map((cat) => tracks.find((t) => t.category === cat))
    .filter(Boolean) as WuyinAudioTrack[]

  return (
    <div className="space-y-3">
      <p
        className="text-xs tracking-widest text-[var(--tcm-muted)]"
        style={{ fontFamily: 'var(--tcm-font-serif)' }}
      >
        今日处方 · 三轨
      </p>
      {ordered.map((track) => {
        const meta = categoryMeta[track.category]
        const isActive = track.id === activeTrackId
        const isMixPlaying = playMode === 'mix' && (track.category === 'ambient' || track.category === 'melody')
        const isNaturePlaying = playMode === 'nature' && track.category === 'nature'
        const isPlaying = isMixPlaying || isNaturePlaying

        const showMixKnob = track.category === 'melody' && ambient && melody

        return (
          <div
            key={track.id}
            className={`dojo-track tcm-paper tcm-noise tcm-ink-border ${meta.cardClass} ${isActive ? 'dojo-track--active' : ''} ${isPlaying ? 'dojo-track--playing dojo-track--crossfade-in' : playMode ? 'dojo-track--idle-fade' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span>{meta.emoji}</span>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--tcm-muted)]">{meta.label}</span>
                </div>
                <p
                  className="text-sm font-medium text-[var(--tcm-text)]"
                  style={{ fontFamily: 'var(--tcm-font-serif)' }}
                >
                  {track.label}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--tcm-muted)]">
                  {track.description}
                </p>
                {track.category === 'melody' && <WaveformBars playing={isPlaying} />}
                {track.category === 'nature' && (
                  <div className="dojo-liquid-bar mt-2">
                    <div className="dojo-liquid-bar__fill" style={{ width: `${isNaturePlaying ? progress * 100 : 0}%` }} />
                  </div>
                )}
                <p className="mt-1 text-[10px] text-[var(--tcm-muted)]">{formatTime(track.durationSec)}</p>
              </div>
              {showMixKnob ? (
                <TaijiPlayKnob
                  playing={playMode === 'mix'}
                  mixable
                  mix={mix}
                  onMixChange={setMix}
                  onToggle={() => (playMode === 'mix' ? stopAll() : void startMix())}
                />
              ) : track.category === 'nature' ? (
                <TaijiPlayKnob
                  playing={isNaturePlaying}
                  onToggle={() => (isNaturePlaying ? stopAll() : void startNature())}
                />
              ) : (
                <TaijiPlayKnob
                  playing={isMixPlaying}
                  onToggle={() => (playMode === 'mix' ? stopAll() : void startMix())}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
