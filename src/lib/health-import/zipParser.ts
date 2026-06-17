import JSZip from 'jszip'
import { parseAppleHealthXmlStream } from './streamXmlParser'
import type { DailyWatchRow } from '../../types/health'

export async function parseAppleHealthZip(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<DailyWatchRow[]> {
  const zip = await JSZip.loadAsync(file)
  const xmlFile = Object.keys(zip.files).find(
    (name) =>
      name.endsWith('export.xml') ||
      name.endsWith('导出.xml') ||
      name.endsWith('apple_health_export/export.xml') ||
      name === 'export.xml' ||
      name === '导出.xml',
  )

  if (!xmlFile) {
    throw new Error('未在 ZIP 中找到 export.xml / 导出.xml，请确认是 Apple Health 导出包')
  }

  // Use Uint8Array instead of string to avoid "Invalid string length"
  // for large export.xml files (>256MB)
  onProgress?.(5)
  const xmlBytes = await zip.files[xmlFile].async('uint8array')
  onProgress?.(10)

  // Use streaming SAX parser for memory efficiency
  return parseAppleHealthXmlStream(xmlBytes, 8, (xmlPct) => {
    // Map XML parse progress from 10-90 to overall 10-90
    onProgress?.(10 + Math.round(xmlPct * 0.8))
  })
}
