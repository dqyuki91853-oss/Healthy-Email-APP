import { useCallback, useEffect, useRef, useState } from 'react'
import type { WuyinAudioTrack } from '../../../lib/wuyinAudioLibrary'
import { playWuyinTrack } from '../../../services/audioTone'
import { DojoPlayButton } from './DojoPlayButton'

interface Props {
  tracks: WuyinAudioTrack[]
  activeTrackId: string | null
  onSelect: (track: WuyinAudioTrack) => void
  orientation?: 'vertical' | 'horizontal' | 'bars'
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
  const clamped = Math.max(0, sec)
  const m = Math.floor(clamped / 60)
  const s = Math.floor(clamped % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function WaveformBars({ playing, variant }: { playing: boolean; variant: WuyinAudioTrack['category'] }) {
  return (
    <div
      className={`dojo-waveform dojo-waveform--${variant} ${playing ? 'dojo-waveform--live' : ''}`}
      aria-hidden
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

interface PlaybackSnapshot {
  trackId: string
  elapsedSec: number
  durationSec: number
}

export function WuyinPrescriptionWaterfall({
  tracks,
  activeTrackId,
  onSelect,
  orientation = 'vertical',
}: Props) {
  const [soloTrackId, setSoloTrackId] = useState<string | null>(null)
  const [playback, setPlayback] = useState<PlaybackSnapshot | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const audioRefs = useRef<HTMLAudioElement[]>([])
  const tickRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)

  const clearTick = useCallback(() => {
    if (tickRef.current) window.clearInterval(tickRef.current)
    tickRef.current = null
  }, [])

  const stopAll = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    for (const a of audioRefs.current) {
      a.pause()
      a.removeAttribute('src')
    }
    audioRefs.current = []
    clearTick()
    setPlayback(null)
    setSoloTrackId(null)
  }, [clearTick])

  useEffect(() => () => stopAll(), [stopAll])

  const tracksKey = tracks.map((t) => t.id).join('|')
  useEffect(() => {
    stopAll()
  }, [tracksKey, stopAll])

  const beginTick = useCallback(
    (durationSec: number, trackId: string) => {
      startTimeRef.current = Date.now()
      setSoloTrackId(trackId)
      setPlayback({ trackId, elapsedSec: 0, durationSec })

      clearTick()
      tickRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        if (elapsed >= durationSec) {
          stopAll()
        } else {
          setPlayback({ trackId, elapsedSec: elapsed, durationSec })
        }
      }, 200)
    },
    [clearTick, stopAll],
  )

  const fadeInVolume = useCallback(async (elements: HTMLAudioElement[], targetVolume: number) => {
    const steps = 10
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => window.setTimeout(r, 30))
      for (const el of elements) {
        el.volume = (targetVolume * i) / steps
      }
    }
  }, [])

  const playMp3Solo = useCallback(
    async (track: WuyinAudioTrack) => {
      if (!track.src) return false
      const audio = new Audio(track.src)
      audio.volume = 0
      audioRefs.current = [audio]
      const onEnd = () => stopAll()
      audio.addEventListener('ended', onEnd)
      await audio.play()
      await fadeInVolume([audio], 0.85)
      stopRef.current = () => {
        audio.removeEventListener('ended', onEnd)
        audio.pause()
      }
      beginTick(track.durationSec, track.id)
      return true
    },
    [beginTick, fadeInVolume, stopAll],
  )

  const startSolo = useCallback(
    async (track: WuyinAudioTrack) => {
      if (soloTrackId === track.id) {
        stopAll()
        return
      }
      stopAll()
      onSelect(track)

      const played = track.src ? await playMp3Solo(track) : false
      if (!played) {
        const handle = await playWuyinTrack({
          frequencyHz: track.frequencyHz,
          durationSec: track.durationSec,
          category: track.category,
        })
        stopRef.current = handle.stop
        beginTick(track.durationSec, track.id)
      }
    },
    [beginTick, onSelect, playMp3Solo, soloTrackId, stopAll],
  )

  if (tracks.length === 0) {
    return <p className="py-6 text-center text-xs text-[var(--tcm-muted)]">暂无可选音轨</p>
  }

  const ordered = (['ambient', 'melody', 'nature'] as const)
    .map((cat) => tracks.find((t) => t.category === cat))
    .filter(Boolean) as WuyinAudioTrack[]

  const isTrackPlaying = (track: WuyinAudioTrack): boolean =>
    playback?.trackId === track.id

  const displayTime = (track: WuyinAudioTrack): string => {
    if (!isTrackPlaying(track) || !playback) {
      return formatTime(track.durationSec)
    }
    return formatTime(playback.durationSec - playback.elapsedSec)
  }

  if (orientation === 'bars') {
    return (
      <div className="dojo-tracks-bars">
        <p
          className="dojo-tracks-bars__label text-xs tracking-widest text-[var(--tcm-muted)]"
          style={{ fontFamily: 'var(--tcm-font-serif)' }}
        >
          今日处方 · 三轨
        </p>
        <div className="dojo-tracks-bars__list space-y-2">
          {ordered.map((track) => {
            const meta = categoryMeta[track.category]
            const isActive = track.id === activeTrackId
            const isPlaying = isTrackPlaying(track)
            const isSoloPlaying = soloTrackId === track.id

            return (
              <div
                key={track.id}
                className={`dojo-track-bar tcm-paper tcm-ink-border ${meta.cardClass} ${isActive ? 'dojo-track-bar--active' : ''} ${isPlaying ? 'dojo-track-bar--playing' : ''}`}
              >
                <span className="dojo-track-bar__emoji shrink-0" aria-hidden>
                  {meta.emoji}
                </span>
                <div className="dojo-track-bar__body min-w-0 flex-1">
                  <p
                    className="dojo-track-bar__title truncate text-xs font-medium text-[var(--tcm-text)]"
                    style={{ fontFamily: 'var(--tcm-font-serif)' }}
                  >
                    {meta.label} · {track.label}
                  </p>
                  <p className="dojo-track-bar__desc truncate text-[10px] text-[var(--tcm-muted)]">
                    {track.description}
                  </p>
                </div>
                <span
                  className={`dojo-track-bar__time shrink-0 text-[10px] tabular-nums ${isPlaying ? 'text-[var(--tcm-amber)]' : 'text-[var(--tcm-muted)]'}`}
                >
                  {isPlaying ? displayTime(track) : formatTime(track.durationSec)}
                </span>
                <DojoPlayButton
                  playing={isSoloPlaying}
                  onToggle={() => void startSolo(track)}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={orientation === 'horizontal' ? 'dojo-tracks-grid' : 'space-y-3'}>
      <p
        className={`text-xs tracking-widest text-[var(--tcm-muted)] ${orientation === 'horizontal' ? 'col-span-full' : ''}`}
        style={{ fontFamily: 'var(--tcm-font-serif)' }}
      >
        今日处方 · 三轨
      </p>
      {ordered.map((track) => {
        const meta = categoryMeta[track.category]
        const isActive = track.id === activeTrackId
        const isPlaying = isTrackPlaying(track)
        const isSoloPlaying = soloTrackId === track.id

        return (
          <div
            key={track.id}
            className={`dojo-track tcm-paper tcm-noise tcm-ink-border ${meta.cardClass} ${isActive ? 'dojo-track--active' : ''} ${isPlaying ? 'dojo-track--playing dojo-track--crossfade-in' : soloTrackId ? 'dojo-track--idle-fade' : ''}`}
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
                <WaveformBars playing={isPlaying} variant={track.category} />
                <p
                  className={`mt-1 text-[10px] tabular-nums ${isPlaying ? 'text-[var(--tcm-amber)]' : 'text-[var(--tcm-muted)]'}`}
                >
                  {isPlaying ? `${displayTime(track)} 剩余` : displayTime(track)}
                </p>
              </div>
              <DojoPlayButton
                playing={isSoloPlaying}
                onToggle={() => void startSolo(track)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
