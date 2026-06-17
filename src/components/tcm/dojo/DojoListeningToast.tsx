import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import type { WuyinListeningWindow } from '../../../types/tcm'
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

/** 首页右上角浮动 Toast — 收工提醒 */
export function DojoListeningToast({ window: win }: Props) {
  const navigate = useNavigate()
  const isActive = win.tier === 'primary'

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
        <button
          type="button"
          className="dojo-listening-toast__close"
          aria-label="稍后提醒"
          onClick={() => snoozeListeningReminder(WUYIN_SNOOZE_MINUTES)}
        >
          <X size={14} />
        </button>

        <div className="dojo-listening-toast__head">
          <Bell size={14} className="shrink-0 text-[var(--tcm-amber)]" />
          <span className="dojo-listening-toast__title">
            {isActive ? '收工聆听窗口' : '收工提醒'}
          </span>
          <span className="dojo-listening-toast__time">
            {win.windowStart} – {win.windowEnd}
          </span>
        </div>

        <p className="dojo-listening-toast__body">{win.reasonText}</p>

        {!isActive && win.minutesUntilOpen > 0 && (
          <p className="dojo-listening-toast__countdown">
            距窗口开启约 {formatCountdown(win.minutesUntilOpen)}
          </p>
        )}

        {isActive && win.minutesUntilClose > 0 && (
          <p className="dojo-listening-toast__countdown dojo-listening-toast__countdown--live">
            窗口剩余约 {formatCountdown(win.minutesUntilClose)}
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
  )
}
