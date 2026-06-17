import { useEffect, useRef } from 'react'
import { Mailbox } from '../illustrations/Mailbox'

import { WeatherStamp } from '../bodyWeather/WeatherStamp'
import type { BodyWeatherSnapshot } from '../../types/bodyWeather'

interface Props {
  open: boolean
  onClose: () => void
  onView: () => void
  weather?: BodyWeatherSnapshot | null
}

export function NewLetterModal({ open, onClose, onView, weather }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="新的健康来信"
    >
      <div
        className="w-full max-w-sm animate-[scaleIn_0.3s_ease-out] rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-8 text-center"
        style={{ boxShadow: 'var(--shadow-float)' }}
      >
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <Mailbox size={100} />
            {weather && (
              <div className="absolute -right-2 -top-2">
                <WeatherStamp weatherId={weather.weatherId} label={weather.label} size="sm" />
              </div>
            )}
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold" style={{ fontFamily: 'var(--font-accent)', fontSize: '24px' }}>
          收到了新的来信
        </h2>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          你的本周健康周报已生成，快去看看身体有什么话对你说
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-5 py-2.5 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            稍后再说
          </button>
          <button
            type="button"
            onClick={onView}
            className="rounded-[var(--radius-pill)] bg-[var(--color-text)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-text)]/90 transition-colors"
            autoFocus
          >
            去看看
          </button>
        </div>
      </div>
    </div>
  )
}

/* Inline keyframes for scaleIn — added via style tag would be cleaner, but for simplicity we reference a CSS class */
