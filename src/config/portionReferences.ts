/** 实物参考体系 — 按题型/品类展示，避免重复 100g */
export interface PortionReference {
  category: string
  emoji: string
  label: string
  approxGrams: number
}

export const PORTION_REFERENCES: PortionReference[] = [
  { category: '米饭/面食', emoji: '✊', label: '1拳头 ≈ 150g 熟饭/熟面', approxGrams: 150 },
  { category: '肉类', emoji: '🃏', label: '1扑克牌厚 ≈ 80–100g 瘦肉', approxGrams: 90 },
  { category: '鱼类', emoji: '🖐️', label: '1手掌大 ≈ 120g 整鱼/鱼排', approxGrams: 120 },
  { category: '叶菜', emoji: '🤲', label: '1双手捧 ≈ 100g 生叶菜', approxGrams: 100 },
  { category: '根茎类', emoji: '🌽', label: '1段玉米/1个中等土豆 ≈ 150g', approxGrams: 150 },
  { category: '坚果', emoji: '🖐️', label: '1小把 ≈ 30g 坚果', approxGrams: 30 },
  { category: '油脂/酱料', emoji: '👍', label: '1拇指尖 ≈ 15g 油/酱', approxGrams: 15 },
]

/** 按追问类型返回 1–2 条相关参考，不在顶部堆砌 */
export function getContextualPortionHints(
  followUpType?: string,
  compoundCategory?: string,
): PortionReference[] {
  if (compoundCategory === 'malatang' || compoundCategory === 'hotpot') {
    return [
      { category: '涮品', emoji: '🥢', label: '每样涮品 ≈ 40–80g', approxGrams: 60 },
      { category: '肉类', emoji: '🃏', label: '1盘肉 ≈ 100g', approxGrams: 100 },
    ]
  }
  if (compoundCategory === 'noodle' || followUpType === 'portion') {
    return PORTION_REFERENCES.filter((r) => r.category === '米饭/面食' || r.category === '肉类').slice(0, 2)
  }
  if (followUpType === 'decompose') {
    return []
  }
  return PORTION_REFERENCES.slice(0, 2)
}

export const PORTION_OPTIONS = {
  meat: [
    { label: '小份（约80g，半个拳头）', value: 'small_80g', emoji: '✊' },
    { label: '中份（约150g，一个拳头）', value: 'medium_150g', emoji: '✊' },
    { label: '大份（约250g）', value: 'large_250g', emoji: '✊✊' },
    { label: '超大（约350g+）', value: 'xlarge_350g', emoji: '✊✊✊' },
  ],
  rice: [
    { label: '小碗（约100g）', value: 'bowl_small', emoji: '🥣' },
    { label: '中碗（约150g）', value: 'bowl_medium', emoji: '✊' },
    { label: '大碗（约250g）', value: 'bowl_large', emoji: '🍚' },
  ],
  bowl: [
    { label: '小碗', value: 'small' },
    { label: '中碗', value: 'medium' },
    { label: '大碗', value: 'large' },
    { label: '超大', value: 'xlarge' },
  ],
}
