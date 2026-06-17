import type { WuyinToneId } from '../../../types/tcm'
import type { MoodTag } from '../../../types/mood'
import { TANG } from '../../../config/tangPalette'

export const WHEEL_TONE_ORDER: WuyinToneId[] = ['gong', 'shang', 'jue', 'zhi', 'yu']

export interface ToneWheelSegment {
  toneId: WuyinToneId
  label: string
  element: string
  /** 大唐原色，不做灰化 */
  color: string
  glow: string
}

export const TONE_WHEEL_SEGMENTS: ToneWheelSegment[] = [
  { toneId: 'gong', label: '宫', element: '土', color: TANG.earth, glow: 'rgba(222,153,96,0.65)' },
  { toneId: 'shang', label: '商', element: '金', color: TANG.ivory, glow: 'rgba(238,230,203,0.55)' },
  { toneId: 'jue', label: '角', element: '木', color: TANG.wood, glow: 'rgba(130,178,155,0.65)' },
  { toneId: 'zhi', label: '徵', element: '火', color: TANG.fire, glow: 'rgba(183,63,66,0.65)' },
  { toneId: 'yu', label: '羽', element: '水', color: TANG.water, glow: 'rgba(67,108,133,0.65)' },
]

export const MOOD_BUBBLES: Array<{ mood: MoodTag; emoji: string; label: string }> = [
  { mood: 'low_mood', emoji: '😔', label: '低落' },
  { mood: 'irritable', emoji: '😣', label: '烦躁' },
  { mood: 'fatigue', emoji: '😴', label: '疲惫' },
  { mood: 'anxiety', emoji: '😰', label: '焦虑' },
  { mood: 'calm', emoji: '😌', label: '平静' },
]

export function toneRotationDeg(activeToneId: WuyinToneId): number {
  const idx = WHEEL_TONE_ORDER.indexOf(activeToneId)
  if (idx < 0) return 0
  return -idx * 72
}

/** 轮盘中心五音字 — 统一白色，衬于深色 hub */
export function toneLabelColor(_toneId: WuyinToneId): string {
  return '#FFFFFF'
}

/** 背景光晕随当前五音微调（Phase 6 crossfade） */
export function toneHaloGradient(toneId: WuyinToneId): string {
  const seg = TONE_WHEEL_SEGMENTS.find((s) => s.toneId === toneId)
  const glow = seg?.glow ?? 'rgba(130,178,155,0.35)'
  return `radial-gradient(
    ellipse 52% 44% at 50% 36%,
    ${glow} 0%,
    rgba(130, 178, 155, 0.1) 45%,
    transparent 68%
  )`
}
