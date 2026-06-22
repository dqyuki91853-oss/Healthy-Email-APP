import type { BodySeasonId } from '../types/bodySeason'

export function seasonLabelZh(id: BodySeasonId): string {
  return id === 'spring' ? '春' : id === 'summer' ? '夏' : id === 'autumn' ? '秋' : '冬'
}
