import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Headphones, Wind } from 'lucide-react'
import type { WuyinListeningWindow, WuyinPrescription } from '../../../types/tcm'
import { WUYIN_TONES } from '../../../config/wuyinToneMap'

interface Props {
  window: WuyinListeningWindow
  prescription: WuyinPrescription
  onListen?: () => void
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return ''
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`
  }
  return `${minutes} 分`
}

/** Phase W1 — 收工聆听窗口条 */
export function DojoListeningWindowStrip({ window: win, prescription, onListen }: Props) {
  const navigate = useNavigate()
  const tone = WUYIN_TONES[prescription.toneId]

  if (win.tier === 'closed' && !win.completedInWindow) {
    return null
  }

  if (win.completedInWindow) {
    return (
      <div className="dojo-listening-window dojo-listening-window--done tcm-glass mb-4 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-[var(--tcm-text)]">
          <Check size={16} className="shrink-0 text-[var(--tcm-amber)]" />
          <span style={{ fontFamily: 'var(--tcm-font-serif)' }}>今日收工练习已完成 ✓</span>
        </div>
      </div>
    )
  }

  const showHum = win.suggestedMode === 'hum' || win.suggestedMode === 'either'
  const showListen = win.suggestedMode === 'listen' || win.suggestedMode === 'either'

  return (
    <div
      className={`dojo-listening-window tcm-glass mb-4 rounded-2xl px-4 py-3 ${win.tier === 'primary' ? 'dojo-listening-window--primary' : ''}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-[10px] tracking-widest text-[var(--tcm-amber)]" style={{ fontFamily: 'var(--tcm-font-serif)' }}>
          {win.tier === 'primary' ? '收工聆听窗口' : '五音聆听参考'}
        </span>
        {win.tier === 'primary' && (
          <span className="dojo-listening-window__time text-[10px] text-[var(--tcm-muted)]">
            {win.windowStart} – {win.windowEnd}
          </span>
        )}
      </div>

      <p className="text-[12px] leading-relaxed text-[var(--tcm-text)]">{win.reasonText}</p>

      {win.meridianToneHint && win.meridianToneHint !== prescription.toneId && (
        <p className="mt-1 text-[10px] text-[var(--tcm-muted)]">
          文化参考：{WUYIN_TONES[win.meridianToneHint].label}音 · 今日处方 {tone.label}音
        </p>
      )}

      {win.minutesUntilOpen > 0 && win.tier === 'secondary' && (
        <p className="mt-1 text-[10px] text-[var(--tcm-muted)]">
          距窗口开启约 {formatCountdown(win.minutesUntilOpen)}
        </p>
      )}

      {win.minutesUntilClose > 0 && win.tier === 'primary' && (
        <p className="mt-1 text-[10px] text-[var(--tcm-amber)]">
          窗口剩余约 {formatCountdown(win.minutesUntilClose)}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {showHum && (
          <button
            type="button"
            onClick={() => navigate('/practice/wuyin')}
            className="dojo-listening-window__btn dojo-listening-window__btn--hum"
          >
            <Wind size={14} />
            现在跟哼
            <ChevronRight size={12} />
          </button>
        )}
        {showListen && onListen && (
          <button
            type="button"
            onClick={onListen}
            className="dojo-listening-window__btn dojo-listening-window__btn--listen"
          >
            <Headphones size={14} />
            先听三轨
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
