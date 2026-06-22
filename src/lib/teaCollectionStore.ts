import { format } from 'date-fns'
import type { BodySeasonId } from '../types/bodySeason'
import type { BodyWeatherId } from '../types/bodyWeather'
import { teaKey, TEA_COLLECTION_TOTAL } from '../config/bodyTeaGuide'

const STORAGE_KEY = 'subhealth_tea_collection'

export interface TeaCollectionEntry {
  teaKey: string
  unlockedAt: string
}

export { TEA_COLLECTION_TOTAL }

export function loadTeaCollection(): TeaCollectionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TeaCollectionEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveTeaCollection(entries: TeaCollectionEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // ignore quota errors
  }
}

export function isTeaUnlocked(key: string): boolean {
  return loadTeaCollection().some((e) => e.teaKey === key)
}

export function getTeaUnlockDate(key: string): string | null {
  return loadTeaCollection().find((e) => e.teaKey === key)?.unlockedAt ?? null
}

export function getUnlockedTeaCount(): number {
  return loadTeaCollection().length
}

/**
 * 首页茶语卡片展示时解锁对应组合。已解锁则不再写入。
 * @returns 是否为新解锁
 */
export function unlockTea(
  weatherId: BodyWeatherId,
  seasonId: BodySeasonId,
  date = format(new Date(), 'yyyy-MM-dd'),
): boolean {
  const key = teaKey(weatherId, seasonId)
  if (isTeaUnlocked(key)) return false

  const entries = [...loadTeaCollection(), { teaKey: key, unlockedAt: date }]
  saveTeaCollection(entries)
  return true
}

export function clearTeaCollection(): void {
  localStorage.removeItem(STORAGE_KEY)
}
