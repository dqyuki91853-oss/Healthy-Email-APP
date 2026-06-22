import type { CSSProperties } from 'react'
import type { WuyinToneId } from '../../../types/tcm'
import { WUYIN_TONES } from '../../../config/wuyinToneMap'
import { TONE_WHEEL_SEGMENTS } from './toneWheelConfig'

interface Props {
  toneId: WuyinToneId
  animating?: boolean
  /** 首页横向布局 — 缩小音柱 */
  compact?: boolean
}

/**
 * 五音音柱 — 竖线 + 纺锤光晕 + 五音字（原版图示，替代轮盘）
 */
export function WuyinToneSigil({ toneId, animating, compact = false }: Props) {
  const tone = WUYIN_TONES[toneId]
  const seg = TONE_WHEEL_SEGMENTS.find((s) => s.toneId === toneId)

  return (
    <div
      className={`dojo-tone-sigil${compact ? ' dojo-tone-sigil--compact' : ''}${animating ? ' dojo-tone-sigil--pulse' : ''}`}
      style={
        {
          '--sigil-glow': seg?.glow ?? 'rgba(222,153,96,0.55)',
          '--sigil-tone': seg?.color ?? '#de9960',
        } as CSSProperties
      }
    >
      <p className="dojo-tone-sigil__title">
        五音疗愈 · {tone.label}音 · {tone.organLabel}
      </p>

      <div
        className="dojo-tone-sigil__stage"
        aria-label={`五音 ${tone.label}，${tone.organLabel}`}
      >
        <div className="dojo-tone-sigil__glow" aria-hidden />
        <div className="dojo-tone-sigil__line" aria-hidden />
        <span className="dojo-tone-sigil__char">{tone.label}</span>
      </div>

      <p className="dojo-tone-sigil__meta">
        {tone.emotionLabel} → {tone.label}音
        {seg && <span className="dojo-tone-sigil__element"> · {seg.element}</span>}
      </p>
    </div>
  )
}
