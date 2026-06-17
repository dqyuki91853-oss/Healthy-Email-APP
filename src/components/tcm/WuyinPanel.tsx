import { useState, useMemo } from 'react'
import { Music2 } from 'lucide-react'
import type { WuyinPrescription } from '../../types/tcm'
import { recommendWuyinAudio, type WuyinAudioTrack } from '../../lib/wuyinAudioLibrary'
import { WuyinAudioCarousel } from './WuyinAudioCarousel'
import { WuyinMiniPlayer } from './WuyinMiniPlayer'
import { WuyinHumFoldout } from './WuyinHumFoldout'

interface Props {
  prescription: WuyinPrescription
  moodTag?: string
}

/**
 * v3 Wuyin panel — the primary Wuyin experience for the homepage.
 *
 * Layout:
 *   1. Header "今日音疗" with tone label
 *   2. WuyinAudioCarousel — horizontal scroll track cards
 *   3. WuyinMiniPlayer — play/pause current track
 *   4. WuyinHumFoldout — collapsible hum practice (secondary)
 *   5. Disclaimer
 */
export function WuyinPanel({ prescription, moodTag }: Props) {
  const [activeTrack, setActiveTrack] = useState<WuyinAudioTrack | null>(null)

  const tracks = useMemo(
    () => recommendWuyinAudio(prescription, moodTag),
    [prescription, moodTag],
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Music2 size={16} className="text-[var(--color-coral)]" />
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-coral)]">
          今日音疗
        </p>
        <span className="rounded-full bg-[var(--color-coral)]/10 px-2 py-0.5 text-[10px] text-[var(--color-coral)]">
          {prescription.label}
        </span>
      </div>

      {/* Audio carousel */}
      <WuyinAudioCarousel
        tracks={tracks}
        activeTrackId={activeTrack?.id ?? null}
        onSelect={setActiveTrack}
      />

      {/* Mini player */}
      <div className="mt-3">
        <WuyinMiniPlayer
          track={activeTrack}
          onEnded={() => setActiveTrack(null)}
        />
      </div>

      {/* Hum foldout (collapsed by default) */}
      <WuyinHumFoldout prescription={prescription} />

      {/* Disclaimer */}
      <p className="mt-3 text-[9px] leading-relaxed text-[var(--color-muted)]">
        歌单来自 OpenLo-Fi（CC0），跟哼区仍为五音参考频率；均非医疗声波治疗。
        若长期情绪低落或失眠，请咨询专业心理/医疗机构。
      </p>
    </div>
  )
}
