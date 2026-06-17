import type { WuyinToneId } from '../../../types/tcm'
import { toneHaloGradient } from './toneWheelConfig'

interface Props {
  toneId?: WuyinToneId
}

/**
 * 国风背景：水墨底图 + 黄绿磨砂 + 轮盘中心光晕
 * toneId 变化时光晕平滑过渡（Phase 6）
 */
export function GuofengInkWashBg({ toneId }: Props) {
  return (
    <div
      className="dojo-guofeng-bg pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      aria-hidden
    >
      <div className="dojo-guofeng-bg__photo" />
      <div className="dojo-guofeng-bg__wash" />
      <div className="dojo-guofeng-bg__ripples" />
      <div className="dojo-guofeng-bg__gold" />
      <div className="dojo-guofeng-bg__grain" />
      <div
        className="dojo-guofeng-bg__wheel-halo"
        style={toneId ? { background: toneHaloGradient(toneId) } : undefined}
      />
      <div className="dojo-guofeng-bg__frost" />
      <div className="dojo-guofeng-bg__frost-edge" />
    </div>
  )
}
