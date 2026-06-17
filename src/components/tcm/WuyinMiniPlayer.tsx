import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Music, Volume2 } from 'lucide-react'
import { playWuyinTrack } from '../../services/audioTone'
import type { WuyinAudioTrack } from '../../lib/wuyinAudioLibrary'

interface Props {
  track: WuyinAudioTrack | null
  onEnded: () => void
}

/**
 * Mini audio player for Wuyin ambient/melody/nature tracks.
 * Prefers bundled CC0 mp3; falls back to Web Audio synth.
 */
export function WuyinMiniPlayer({ track, onEnded }: Props) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const stopRef = useRef<(() => void) | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const modeRef = useRef<'mp3' | 'synth' | null>(null)
  const mp3CleanupRef = useRef<(() => void) | null>(null)

  const stopPlayback = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    mp3CleanupRef.current?.()
    mp3CleanupRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
      audioRef.current = null
    }
    modeRef.current = null
  }, [])

  const bindMp3Listeners = useCallback((audio: HTMLAudioElement) => {
    mp3CleanupRef.current?.()
    const onTimeUpdate = () => setElapsed(audio.currentTime)
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDurationSec(audio.duration)
      }
    }
    const handleEnded = () => {
      setPlaying(false)
      setElapsed(0)
      stopPlayback()
      onEnded()
    }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    mp3CleanupRef.current = () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onEnded, stopPlayback])

  useEffect(() => () => stopPlayback(), [stopPlayback])

  useEffect(() => {
    stopPlayback()
    setPlaying(false)
    setElapsed(0)
    setDurationSec(track?.durationSec ?? 0)
  }, [track?.id, stopPlayback])

  const startSynth = useCallback(async (t: WuyinAudioTrack, fromElapsed: number) => {
    const remaining = t.durationSec - fromElapsed
    const handle = await playWuyinTrack({
      frequencyHz: t.frequencyHz,
      durationSec: Math.max(remaining, 1),
      category: t.category,
    })
    stopRef.current = handle.stop
    modeRef.current = 'synth'
    setDurationSec(t.durationSec)
    setPlaying(true)

    const start = performance.now() - fromElapsed * 1000
    const tick = () => {
      const next = (performance.now() - start) / 1000
      if (next >= t.durationSec) {
        setPlaying(false)
        setElapsed(0)
        stopPlayback()
        onEnded()
        return
      }
      setElapsed(next)
      if (modeRef.current === 'synth') requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [onEnded, stopPlayback])

  const handleToggle = useCallback(async () => {
    if (playing) {
      if (modeRef.current === 'mp3' && audioRef.current) {
        audioRef.current.pause()
        setPlaying(false)
        return
      }
      stopPlayback()
      setPlaying(false)
      return
    }
    if (!track) return

    if (track.src) {
      try {
        const audio = audioRef.current ?? new Audio(track.src)
        if (!audioRef.current) {
          audio.src = track.src
          audioRef.current = audio
        }
        audio.loop = false
        modeRef.current = 'mp3'
        bindMp3Listeners(audio)
        if (elapsed > 0) audio.currentTime = elapsed
        await audio.play()
        setPlaying(true)
        return
      } catch {
        stopPlayback()
      }
    }

    try {
      await startSynth(track, elapsed)
    } catch {
      // Audio not supported — silently ignore
    }
  }, [playing, track, elapsed, stopPlayback, startSynth, bindMp3Listeners])

  const progress = durationSec > 0 ? (elapsed / durationSec) * 100 : 0
  const remaining = Math.max(0, Math.floor(durationSec - elapsed))

  const categoryEmoji =
    track?.category === 'ambient' ? '🌿' :
    track?.category === 'melody' ? '🎵' :
    track?.category === 'nature' ? '💧' : ''

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface-2)] p-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={!track}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal)] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        aria-label={playing ? '暂停' : '播放'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>

      <div className="min-w-0 flex-1">
        {track ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">{categoryEmoji}</span>
              <span className="truncate text-[13px] font-medium">{track.label}</span>
              <span className="shrink-0 text-[10px] text-[var(--color-muted)]">
                {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-[var(--color-teal)] transition-[width] duration-200 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-muted)]">
            <Music size={14} />
            <span>选择一首音轨开始</span>
          </div>
        )}
      </div>

      {playing && (
        <Volume2 size={14} className="shrink-0 animate-pulse text-[var(--color-teal)]/60" />
      )}
    </div>
  )
}
