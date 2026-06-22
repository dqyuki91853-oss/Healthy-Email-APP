import {
  APP_SYNC_APPLIED_KEY,
  APP_SYNC_PATH,
  parseSubhealthExport,
  restoreLocalPrefs,
  type SubhealthExportV1,
} from './dataSync'
import { isTauri } from './platform'

/** Mac App：从 public/data/app-sync.json 自动导入（比上次更新则合并） */
export async function maybeImportAppSync(
  importFn: (payload: SubhealthExportV1, opts?: { includeWatchRows?: boolean }) => Promise<unknown>,
): Promise<boolean> {
  if (!isTauri()) return false

  try {
    const res = await fetch(APP_SYNC_PATH)
    if (!res.ok) return false
    const raw = await res.json()
    const payload = parseSubhealthExport(raw)
    const lastApplied = localStorage.getItem(APP_SYNC_APPLIED_KEY)
    if (lastApplied && lastApplied >= payload.exportedAt) return false

    await importFn(payload, { includeWatchRows: true })
    restoreLocalPrefs(payload.localPrefs)
    localStorage.setItem(APP_SYNC_APPLIED_KEY, payload.exportedAt)
    return true
  } catch {
    return false
  }
}
