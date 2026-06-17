import { useState } from 'react'
import { ChevronDown, ChevronUp, Mic } from 'lucide-react'
import { WuyinSessionCard } from './WuyinSessionCard'
import type { WuyinPrescription } from '../../types/tcm'

interface Props {
  prescription: WuyinPrescription
}

/**
 * Collapsible wrapper around the hum practice session.
 * Secondary to the audio carousel — folded by default on the v3 homepage.
 */
export function WuyinHumFoldout({ prescription }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-3 border-t border-[var(--color-border)] pt-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <Mic size={16} className="shrink-0 text-[var(--color-coral)]" />
        <span className="flex-1 font-medium">跟哼练习</span>
        <span className="text-xs text-[var(--color-muted)]">
          {prescription.label} · {prescription.durationSec}s
        </span>
        {open ? <ChevronUp size={14} className="text-[var(--color-muted)]" /> : <ChevronDown size={14} className="text-[var(--color-muted)]" />}
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="mt-2 animate-[slideDown_0.25s_ease-out]">
          <WuyinSessionCard prescription={prescription} />
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes slideDown {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </div>
  )
}
