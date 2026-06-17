import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react'
import { hapticPulse } from '../../../lib/haptic'

interface Props {
  playing: boolean
  disabled?: boolean
  onToggle: () => void
  /** 0 = 环境音为主，1 = 旋律为主 */
  mix?: number
  onMixChange?: (mix: number) => void
  mixable?: boolean
}

export function TaijiPlayKnob({
  playing,
  disabled,
  onToggle,
  mix = 0.5,
  onMixChange,
  mixable,
}: Props) {
  const dragging = useRef(false)
  const startAngle = useRef(0)
  const startMix = useRef(mix)

  const angleFromMix = (m: number) => -135 + m * 270
  const mixFromAngle = (deg: number) => Math.max(0, Math.min(1, (deg + 135) / 270))

  const pointerAngle = (clientX: number, clientY: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI
  }

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!mixable || !onMixChange) {
        onToggle()
        return
      }
      const rect = e.currentTarget.getBoundingClientRect()
      const angle = pointerAngle(e.clientX, e.clientY, rect)
      // 点击靠近中心 → 播放；边缘拖拽 → mix
      const dist = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2))
      if (dist < rect.width * 0.28) {
        onToggle()
        return
      }
      dragging.current = true
      startAngle.current = angle
      startMix.current = mix
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [mix, mixable, onMixChange, onToggle],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!dragging.current || !onMixChange) return
      const rect = e.currentTarget.getBoundingClientRect()
      const angle = pointerAngle(e.clientX, e.clientY, rect)
      const delta = angle - startAngle.current
      const newMix = mixFromAngle(angleFromMix(startMix.current) + delta)
      onMixChange(newMix)
      hapticPulse(6)
    },
    [onMixChange],
  )

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    dragging.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  const rotation = mixable ? angleFromMix(mix) : 0

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="dojo-taiji-knob shrink-0"
        aria-label={playing ? '暂停' : '播放'}
        title={mixable ? '点击中心播放 · 拖边缘调节 Mix' : playing ? '暂停' : '播放'}
      >
        <span
          className={`dojo-taiji-knob__disc ${playing ? 'dojo-taiji-knob__disc--spin' : ''} ${mixable ? 'dojo-taiji-knob__disc--mixable' : ''}`}
          style={{ transform: mixable ? `rotate(${rotation}deg)` : undefined }}
        >
          <span className="dojo-taiji-knob__yang" />
          <span className="dojo-taiji-knob__yin" />
        </span>
      </button>
      {mixable && (
        <p className="dojo-mix-label">
          环境 {Math.round((1 - mix) * 100)}% · 旋律 {Math.round(mix * 100)}%
        </p>
      )}
    </div>
  )
}
