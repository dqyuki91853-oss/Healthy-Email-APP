import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildDemoWellnessSeed, demoWatchDataJson } from './demoWellnessSeed'
import { computeBaselines } from './baselines'
import { computeBodySeason } from '../engine/bodySeason'
import { discoverPatterns } from '../engine/patternDiscovery'

describe('buildDemoWellnessSeed', () => {
  it('produces 14 days with season and archive patterns', () => {
    const demo = buildDemoWellnessSeed()
    expect(demo.watchRows).toHaveLength(14)
    expect(demo.voiceLogs.length).toBeGreaterThan(28)

    const baselines = computeBaselines(demo.watchRows)
    const targetDate = demo.watchRows[demo.watchRows.length - 1].date
    const season = computeBodySeason(demo.watchRows, baselines, null, targetDate)
    expect(season).not.toBeNull()

    const discovery = discoverPatterns(demo.watchRows, demo.voiceLogs, [], targetDate)
    expect(discovery.insufficientData).toBe(false)
    expect(discovery.newCases.length).toBeGreaterThan(0)
  })

  it('writes public demo seed when WRITE_DEMO_SEED=1', () => {
    if (process.env.WRITE_DEMO_SEED !== '1') return

    const root = join(import.meta.dirname, '../..')
    const demo = buildDemoWellnessSeed()

    writeFileSync(join(root, 'public/data/watch-data.json'), demoWatchDataJson(demo))
    writeFileSync(
      join(root, 'public/data/app-sync.json'),
      JSON.stringify(demo.exportPayload, null, 2),
    )
  })
})
