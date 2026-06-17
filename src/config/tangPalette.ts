/**
 * 大唐系列配色 — 严格基准（高饱和，不做灰化混色）
 * 宫土 · 商金 · 角木 · 徵火 · 羽水
 */
export const TANG = {
  /** 羽 · 水 */
  water: '#436C85',
  /** 徵 · 火 */
  fire: '#B73F42',
  /** 宫 · 土 */
  earth: '#DE9960',
  /** 角 · 木 */
  wood: '#82B29B',
  /** 商 · 金 */
  ivory: '#EEE6CB',
  /** 道场底色 */
  ink: '#0E1218',
  /** 面板 */
  slate: '#161C26',
} as const

export function tangGlow(hex: string, alpha = 0.55): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 将 hex 转为 rgba，用于 conic-gradient 扇区 */
export function tangAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 五音轮盘 conic-gradient 色序：宫→商→角→徵→羽 */
export const TANG_WHEEL_COLORS = [
  TANG.earth,
  TANG.ivory,
  TANG.wood,
  TANG.fire,
  TANG.water,
] as const
