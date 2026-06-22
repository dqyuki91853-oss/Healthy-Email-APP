#!/usr/bin/env node
/**
 * Merge Downloads export + watch-data seed → backups/ + public/data/app-sync.json
 * Run: node scripts/build-full-backup.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const today = new Date().toISOString().slice(0, 10)

const sources = [
  join(process.env.HOME, 'Downloads/subhealth-export-2026-06-17.json'),
  join(root, 'backups/subhealth-full-backup-2026-06-22.json'),
].filter((p) => {
  try {
    readFileSync(p)
    return true
  } catch {
    return false
  }
})

const seedPath = join(root, 'public/data/watch-data.json')
const seed = JSON.parse(readFileSync(seedPath, 'utf8'))

let voiceLogs = []
let dietHistory = []
let localPrefs = undefined
let profile = seed.profile ?? {}

for (const src of sources) {
  const data = JSON.parse(readFileSync(src, 'utf8'))
  if (data.voiceLogs?.length) voiceLogs = mergeVoiceLogs(voiceLogs, data.voiceLogs)
  if (data.dietHistory?.length) dietHistory = mergeDietHistory(dietHistory, data.dietHistory)
  if (data.localPrefs) localPrefs = { ...localPrefs, ...data.localPrefs }
  if (data.profile && Object.keys(data.profile).length) profile = data.profile
}

const watchByDate = new Map()
for (const r of seed.rows ?? []) watchByDate.set(r.date, r)
for (const src of sources) {
  const data = JSON.parse(readFileSync(src, 'utf8'))
  for (const r of data.watchRows ?? []) watchByDate.set(r.date, r)
}
const watchRows = [...watchByDate.values()].sort((a, b) => a.date.localeCompare(b.date))

const backup = {
  version: 1,
  exportedAt: new Date().toISOString(),
  source: `build-full-backup.mjs (${sources.map((s) => s.split('/').pop()).join(' + ')})`,
  voiceLogs,
  watchRows,
  dietHistory,
  profile,
  localPrefs,
  seedId: seed.seedId,
}

const backupsDir = join(root, 'backups')
mkdirSync(backupsDir, { recursive: true })
const backupPath = join(backupsDir, `subhealth-full-backup-${today}.json`)
const latestPath = join(backupsDir, 'latest-for-app.json')
const appSyncPath = join(root, 'public/data/app-sync.json')
const downloadsCopy = join(process.env.HOME, 'Downloads', `subhealth-full-backup-${today}.json`)

writeFileSync(backupPath, JSON.stringify(backup, null, 2))
writeFileSync(latestPath, JSON.stringify(backup, null, 2))
writeFileSync(appSyncPath, JSON.stringify(backup, null, 2))
copyFileSync(backupPath, downloadsCopy)

console.log('Backup written:')
console.log(' ', backupPath)
console.log(' ', latestPath)
console.log(' ', appSyncPath)
console.log(' ', downloadsCopy)
console.log(`voiceLogs: ${voiceLogs.length}, watchRows: ${watchRows.length}, dietHistory: ${dietHistory.length}`)

function mergeVoiceLogs(a, b) {
  const m = new Map(a.map((l) => [l.id, l]))
  for (const l of b) m.set(l.id, l)
  return [...m.values()]
}

function mergeDietHistory(a, b) {
  const m = new Map(a.map((p) => [p.foodName, p]))
  for (const p of b) {
    const prev = m.get(p.foodName)
    m.set(p.foodName, prev ? { ...prev, count: Math.max(prev.count, p.count) } : p)
  }
  return [...m.values()]
}
