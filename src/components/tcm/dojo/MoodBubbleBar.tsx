import type { MoodTag } from '../../../types/mood'
import { hapticPulse } from '../../../lib/haptic'
import { MOOD_BUBBLES } from './toneWheelConfig'

interface Props {
  selected: MoodTag | null
  inferred: MoodTag | null
  onSelect: (mood: MoodTag) => void
}

export function MoodBubbleBar({ selected, inferred, onSelect }: Props) {
  const active = selected ?? inferred

  return (
    <div className="dojo-mood-bar">
      <p className="w-full text-center text-[10px] tracking-wide text-[var(--tcm-muted)]">今日情绪</p>
      <div className="dojo-mood-bar__scroll flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {MOOD_BUBBLES.map((b, i) => {
        const isActive = active === b.mood
        return (
          <button
            key={b.mood}
            type="button"
            onClick={() => {
              hapticPulse(8)
              onSelect(b.mood)
            }}
            className={`dojo-mood-bubble tcm-float-${(i % 5) + 1} ${isActive ? 'dojo-mood-bubble--active' : ''}`}
            aria-pressed={isActive}
          >
            {isActive && <span className="dojo-ripple-ring" aria-hidden />}
            <span className="text-lg leading-none">{b.emoji}</span>
            <span className="text-[11px]">{b.label}</span>
          </button>
        )
      })}
      </div>
    </div>
  )
}
