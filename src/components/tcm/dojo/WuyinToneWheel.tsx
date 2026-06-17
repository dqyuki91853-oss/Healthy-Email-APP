import type { WuyinToneId } from '../../../types/tcm'
import { WUYIN_TONES } from '../../../config/wuyinToneMap'
import { tangAlpha } from '../../../config/tangPalette'
import { TONE_WHEEL_SEGMENTS, toneLabelColor, toneRotationDeg } from './toneWheelConfig'

interface Props {
  toneId: WuyinToneId
  animating?: boolean
}

const INACTIVE_OPACITY = 0.52
const ACTIVE_OPACITY = 1

function buildConicGradient(activeId: WuyinToneId): string {
  const stops = TONE_WHEEL_SEGMENTS.map((seg, i) => {
    const start = i * 72
    const end = start + 72
    const alpha = seg.toneId === activeId ? ACTIVE_OPACITY : INACTIVE_OPACITY
    return `${tangAlpha(seg.color, alpha)} ${start}deg ${end}deg`
  })
  return `conic-gradient(from -90deg, ${stops.join(', ')})`
}

export function WuyinToneWheel({ toneId, animating }: Props) {
  const tone = WUYIN_TONES[toneId]
  const rotation = toneRotationDeg(toneId)
  const activeSeg = TONE_WHEEL_SEGMENTS.find((s) => s.toneId === toneId)
  const labelColor = toneLabelColor(toneId)

  return (
    <div className="relative mx-auto flex flex-col items-center">
      <div className="dojo-wheel-stage">
        <div className="dojo-wheel-wrap relative">
        {/* Phase 2A：频谱光晕 */}
        <div
          className={`dojo-wheel-spectrum ${animating ? 'dojo-wheel-spectrum--pulse' : ''}`}
          style={{
            background: `conic-gradient(from ${rotation - 90}deg, ${TONE_WHEEL_SEGMENTS.map((s) => s.glow).join(', ')})`,
            transition: 'background 0.9s ease, opacity 0.6s ease',
          }}
          aria-hidden
        />

        {/* 圆形轮盘 — conic-gradient 保证外缘正圆 */}
        <div
          className={`dojo-wheel-rotor ${animating ? 'dojo-wheel-nudge' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            ['--wheel-deg' as string]: `${rotation}deg`,
          }}
        >
          <div
            key={toneId}
            className="dojo-wheel-disc dojo-wheel-disc--crossfade"
            style={{ background: buildConicGradient(toneId) }}
          />
          {/* 扇区分隔：极细透明缝，避免「方」块感 */}
          <div className="dojo-wheel-disc dojo-wheel-disc--seams" aria-hidden />
        </div>

        {/* 中心 hub */}
        <div className="dojo-wheel-hub" aria-hidden />

        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center"
          aria-label={`五音轮盘，当前 ${tone.label}音`}
        >
          <span
            className="text-[1.65rem] font-semibold leading-none"
            style={{ fontFamily: 'var(--tcm-font-serif)', color: labelColor }}
          >
            {tone.label}
          </span>
          <span className="dojo-wheel-hub__meta mt-1 text-[10px]">
            {tone.organLabel} · {tone.frequencyHz.toFixed(1)} Hz
          </span>
        </div>
      </div>
      </div>

      <p className="mt-2 max-w-[240px] text-center text-[11px] leading-relaxed text-[var(--tcm-muted)]">
        {tone.emotionLabel} → {tone.label}音
        {activeSeg && (
          <span className="text-[var(--tcm-amber)]"> · {activeSeg.element}</span>
        )}
      </p>
    </div>
  )
}
