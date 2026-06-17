import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { WuyinAudioTrack } from '../../lib/wuyinAudioLibrary'

interface Props {
  tracks: WuyinAudioTrack[]
  activeTrackId: string | null
  onSelect: (track: WuyinAudioTrack) => void
}

const categoryMeta: Record<string, { emoji: string; label: string }> = {
  ambient: { emoji: '🌿', label: '环境音' },
  melody: { emoji: '🎵', label: '旋律' },
  nature: { emoji: '💧', label: '自然声' },
}

/**
 * Horizontal scroll carousel of Wuyin audio track cards.
 * Each card shows label, description, mood tag, and duration.
 * Selected state indicated by border highlight.
 */
export function WuyinAudioCarousel({ tracks, activeTrackId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -200 : 200
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  if (tracks.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-[var(--color-muted)]">
        暂无可选音轨
      </p>
    )
  }

  return (
    <div className="relative">
      <style>{carouselStyles}</style>
      {/* Scroll buttons */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute -left-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
        aria-label="向左滚动"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Track cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-1 py-2 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {tracks.map((track) => {
          const isActive = track.id === activeTrackId
          const meta = categoryMeta[track.category] ?? { emoji: '🎵', label: '' }

          return (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelect(track)}
              className={`flex shrink-0 flex-col gap-1.5 rounded-2xl p-3 text-left transition-all scroll-mx-1 ${
                isActive
                  ? 'bg-[var(--color-teal)]/10 ring-2 ring-[var(--color-teal)]/40'
                  : 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] ring-1 ring-transparent'
              }`}
              style={{
                width: 170,
                scrollSnapAlign: 'start',
              }}
            >
              {/* Top row: emoji + category label */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{meta.emoji}</span>
                <span className="text-[10px] text-[var(--color-muted)]">{meta.label}</span>
              </div>

              {/* Track label */}
              <p className="text-[13px] font-semibold leading-snug">{track.label}</p>

              {/* Description */}
              <p className="line-clamp-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
                {track.description}
              </p>

              {/* Bottom: duration + mood */}
              <div className="mt-auto flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
                <Clock size={10} />
                <span>{Math.floor(track.durationSec / 60)}:{(track.durationSec % 60).toString().padStart(2, '0')}</span>
                <span className="ml-auto rounded-full bg-[var(--color-border)]/50 px-1.5 py-0.5 text-[9px]">
                  {track.moodTag}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute -right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
        aria-label="向右滚动"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

const carouselStyles = `
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
`
