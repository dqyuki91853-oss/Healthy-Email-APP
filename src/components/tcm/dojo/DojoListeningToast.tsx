import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { WuyinListeningWindow } from '../../../types/tcm'
import { WUYIN_TONES } from '../../../config/wuyinToneMap'
import {
  dismissListeningReminderForToday,
  snoozeListeningReminder,
  WUYIN_SNOOZE_MINUTES,
} from '../../../lib/wuyinListeningPrefs'

interface Props {
  window: WuyinListeningWindow
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return ''
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`
  }
  return `${minutes} 分`
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function windowProgress(win: WuyinListeningWindow, isActive: boolean): number {
  const duration = Math.max(1, parseMinutes(win.windowEnd) - parseMinutes(win.windowStart))
  if (isActive) {
    return Math.min(1, Math.max(0, win.minutesUntilClose / duration))
  }
  const cap = 240
  return Math.min(1, Math.max(0, 1 - win.minutesUntilOpen / cap))
}

function ToastProgressRing({ progress, label }: { progress: number; label: string }) {
  const r = 17
  const c = 2 * Math.PI * r
  const offset = c * (1 - progress)

  return (
    <div className="dojo-listening-toast__ring-wrap">
      <svg className="dojo-listening-toast__ring" viewBox="0 0 44 44" aria-hidden>
        <circle cx="22" cy="22" r={r} className="dojo-listening-toast__ring-track" />
        <circle
          cx="22"
          cy="22"
          r={r}
          className="dojo-listening-toast__ring-fill"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="dojo-listening-toast__ring-label">{label}</span>
    </div>
  )
}

/** 首页右上角浮动 Toast — 竹简玻璃收工提醒 */
export function DojoListeningToast({ window: win }: Props) {
  const navigate = useNavigate()
  const isActive = win.tier === 'primary'
  const tone = WUYIN_TONES[win.toneHint]

  const progress = useMemo(() => windowProgress(win, isActive), [win, isActive])
  const ringLabel = useMemo(() => {
    if (isActive && win.minutesUntilClose > 0) {
      return win.minutesUntilClose >= 60
        ? `${Math.floor(win.minutesUntilClose / 60)}h`
        : `${win.minutesUntilClose}′`
    }
    if (!isActive && win.minutesUntilOpen > 0) {
      return win.minutesUntilOpen >= 60
        ? `${Math.floor(win.minutesUntilOpen / 60)}h`
        : `${win.minutesUntilOpen}′`
    }
    return '·'
  }, [isActive, win.minutesUntilClose, win.minutesUntilOpen])

  const handleGo = () => {
    if (win.suggestedMode === 'hum' && isActive) {
      navigate('/practice/wuyin')
      return
    }
    document.getElementById('wellness-dojo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      className={`dojo-listening-toast ${isActive ? 'dojo-listening-toast--active' : 'dojo-listening-toast--upcoming'}`}
      role="status"
      aria-live="polite"
    >
      <div className="dojo-listening-toast__inner">
        <div className="dojo-listening-toast__slats" aria-hidden />

        <button
          type="button"
          className="dojo-listening-toast__close"
          aria-label="稍后提醒"
          onClick={() => snoozeListeningReminder(WUYIN_SNOOZE_MINUTES)}
        >
          <X size={14} />
        </button>

        <div className="dojo-listening-toast__layout">
          <div className="dojo-listening-toast__title-col">
            <span className="dojo-listening-toast__title-vertical">收工提醒</span>
          </div>

          <div className="dojo-listening-toast__content">
            <div className="dojo-listening-toast__head">
              <span className="dojo-listening-toast__eyebrow">
                {isActive ? '聆听窗口' : '收工预告'}
              </span>
              <ToastProgressRing progress={progress} label={ringLabel} />
            </div>

          <p className="dojo-listening-toast__time">
            {win.windowStart} – {win.windowEnd}
            <span className="dojo-listening-toast__meta">{tone.label}音 · {tone.organLabel}</span>
          </p>

          <p className="dojo-listening-toast__body">{win.reasonText}</p>

          {!isActive && win.minutesUntilOpen > 0 && (
            <p className="dojo-listening-toast__countdown">
              距窗口开启约 {formatCountdown(win.minutesUntilOpen)}
            </p>
          )}

          {isActive && win.minutesUntilClose > 0 && (
            <p className="dojo-listening-toast__countdown dojo-listening-toast__countdown--live">
              窗口余 {formatCountdown(win.minutesUntilClose)}
            </p>
          )}

          <button type="button" className="dojo-listening-toast__cta" onClick={handleGo}>
            {isActive && win.suggestedMode === 'hum' ? '去跟哼 →' : '去看看 →'}
          </button>

          <div className="dojo-listening-toast__footer">
            <button type="button" onClick={() => snoozeListeningReminder(WUYIN_SNOOZE_MINUTES)}>
              稍后 {WUYIN_SNOOZE_MINUTES} 分钟
            </button>
            <span aria-hidden>·</span>
            <button type="button" onClick={() => dismissListeningReminderForToday()}>
              今日不再提醒
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
