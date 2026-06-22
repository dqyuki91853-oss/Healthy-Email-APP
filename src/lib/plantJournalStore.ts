import { format, parseISO } from 'date-fns'
import type { BodySeasonId } from '../types/bodySeason'
import type { DailyWatchRow } from '../types/health'
import {
  computePlantVigor,
  PLANT_SPECIES,
  PLANT_STAGE_LABEL,
  PLANT_WHISPER,
  type PlantVigor,
} from './bodyPlantState'

const STORAGE_KEY = 'subhealth_plant_journal'

export type PlantJournalKind = 'seed' | 'first_seen' | 'state_change'

export interface PlantJournalEntry {
  id: string
  date: string
  seasonId: BodySeasonId
  plantStage: PlantVigor
  whisper: string
  kind: PlantJournalKind
}

export function loadPlantJournal(): PlantJournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PlantJournalEntry[]
    return Array.isArray(parsed)
      ? [...parsed].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
      : []
  } catch {
    return []
  }
}

function savePlantJournal(entries: PlantJournalEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // ignore
  }
}

export function clearPlantJournal(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getLastJournalEntry(): PlantJournalEntry | null {
  const entries = loadPlantJournal()
  return entries.length > 0 ? entries[entries.length - 1] : null
}

export function getSeenStagesForSeason(seasonId: BodySeasonId): Set<PlantVigor> {
  const seen = new Set<PlantVigor>()
  for (const entry of loadPlantJournal()) {
    if (entry.seasonId === seasonId && entry.kind !== 'seed') {
      seen.add(entry.plantStage)
    }
  }
  return seen
}

function buildWhisper(
  kind: PlantJournalKind,
  seasonId: BodySeasonId,
  stage: PlantVigor,
): string {
  const species = PLANT_SPECIES[seasonId]
  if (kind === 'seed') {
    return `植物园开启，种下第一棵${species}`
  }
  const label = PLANT_STAGE_LABEL[stage]
  if (kind === 'first_seen') {
    return `${species} 首次出现「${label}」`
  }
  return `${species} 进入「${label}」状态`
}

/** 日记列表展示用一行文案 */
export function formatJournalLine(entry: PlantJournalEntry): string {
  return entry.whisper
}

export function formatJournalDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MM-dd')
  } catch {
    return dateStr
  }
}

/**
 * 首页打开时记录植物状态变化。
 * 与上次记录的状态不同时写入一条日记；首次访问写入「种下」记录。
 */
export function recordPlantJournalVisit(
  seasonId: BodySeasonId,
  watchRows: DailyWatchRow[],
  date = format(new Date(), 'yyyy-MM-dd'),
): PlantJournalEntry | null {
  const vigor = computePlantVigor(watchRows)
  const journal = loadPlantJournal()

  if (journal.length === 0) {
    const seed: PlantJournalEntry = {
      id: crypto.randomUUID(),
      date,
      seasonId,
      plantStage: vigor,
      whisper: buildWhisper('seed', seasonId, vigor),
      kind: 'seed',
    }
    savePlantJournal([seed])
    return seed
  }

  const last = journal[journal.length - 1]
  if (last.plantStage === vigor && last.date === date) {
    return null
  }
  if (last.plantStage === vigor) {
    return null
  }

  const seenBefore = journal.some(
    (e) => e.seasonId === seasonId && e.plantStage === vigor && e.kind !== 'seed',
  )
  const kind: PlantJournalKind = seenBefore ? 'state_change' : 'first_seen'

  const entry: PlantJournalEntry = {
    id: crypto.randomUUID(),
    date,
    seasonId,
    plantStage: vigor,
    whisper: buildWhisper(kind, seasonId, vigor),
    kind,
  }

  savePlantJournal([...journal, entry])
  return entry
}

/** 卡片底部 whisper：优先用状态文案，与日记分离 */
export function plantCardWhisper(vigor: PlantVigor): string {
  return PLANT_WHISPER[vigor]
}
