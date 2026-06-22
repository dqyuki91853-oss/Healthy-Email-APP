import type { BodySeasonHistoryEntry, BodySeasonId, BodySeasonSnapshot } from '../types/bodySeason'

const PREFS_KEY = 'subhealth_chronicle_prefs'

export interface ChroniclePrefs {
  seasonId: BodySeasonId | null
  /** 用户已读 Modal 对应的 seasonId */
  seasonModalSeenFor: BodySeasonId | null
  seasonHistory: BodySeasonHistoryEntry[]
}

const DEFAULT_PREFS: ChroniclePrefs = {
  seasonId: null,
  seasonModalSeenFor: null,
  seasonHistory: [],
}

export function loadChroniclePrefs(): ChroniclePrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<ChroniclePrefs>
    return {
      seasonId: parsed.seasonId ?? null,
      seasonModalSeenFor: parsed.seasonModalSeenFor ?? null,
      seasonHistory: Array.isArray(parsed.seasonHistory) ? parsed.seasonHistory : [],
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

function saveChroniclePrefs(prefs: ChroniclePrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function persistBodySeason(snapshot: BodySeasonSnapshot): void {
  const prefs = loadChroniclePrefs()
  const prev = prefs.seasonId

  if (prev === snapshot.seasonId) {
    return
  }

  const history = [...prefs.seasonHistory]
  if (prev != null) {
    const last = history[history.length - 1]
    if (last && last.seasonId === prev && last.endedAt == null) {
      last.endedAt = snapshot.date
    }
  }

  history.push({
    seasonId: snapshot.seasonId,
    startedAt: snapshot.date,
    endedAt: null,
  })

  saveChroniclePrefs({
    seasonId: snapshot.seasonId,
    seasonModalSeenFor: null,
    seasonHistory: history.slice(-12),
  })
}

export function markSeasonModalSeen(seasonId: BodySeasonId): void {
  const prefs = loadChroniclePrefs()
  saveChroniclePrefs({ ...prefs, seasonModalSeenFor: seasonId })
}

export function shouldShowSeasonModal(season: BodySeasonSnapshot | null | undefined): boolean {
  if (!season?.justChanged) return false
  const prefs = loadChroniclePrefs()
  return prefs.seasonModalSeenFor !== season.seasonId
}

export function getSeasonHistory(): BodySeasonHistoryEntry[] {
  return loadChroniclePrefs().seasonHistory
}
