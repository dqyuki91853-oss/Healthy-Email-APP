import { XMLParser } from 'fast-xml-parser'
import type { DailyWatchRow } from '../../types/health'
import { normalizeWatchRow } from './watchRow'
import { processRecord } from './streamXmlParser'


interface XmlRecord {
  '@_type'?: string
  '@_value'?: string
  '@_startDate'?: string
  '@_endDate'?: string
}

/**
 * Parse Apple Health XML using fast-xml-parser (full DOM parse).
 * Suitable for small to medium XML files (< 100MB).
 * For large files, use parseAppleHealthXmlStream instead.
 */
export function parseAppleHealthXml(xmlContent: string, maxDays = 365): DailyWatchRow[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'Record',
  })

  const doc = parser.parse(xmlContent)
  const records: XmlRecord[] = doc?.HealthData?.Record ?? []
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - maxDays)

  const days = new Map<string, DailyWatchRow>()

  for (const rec of records) {
    processRecord(
      {
        type: rec['@_type'] ?? '',
        value: rec['@_value'] ?? '',
        startDate: rec['@_startDate'] ?? '',
        endDate: rec['@_endDate'] ?? '',
      },
      days,
      cutoff,
    )
  }

  return [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => normalizeWatchRow(row))
}

export function computeDerived(row: DailyWatchRow) {
  const sleepMins = row.sleepHours != null ? row.sleepHours * 60 : null
  const deepSleepPct =
    sleepMins != null && sleepMins > 0 && row.deepSleepMin != null
      ? (row.deepSleepMin / sleepMins) * 100
      : null
  const sleepEfficiency =
    row.inBedMin != null && row.inBedMin > 0 && sleepMins != null
      ? Math.min(100, (sleepMins / row.inBedMin) * 100)
      : null
  const spo2NightAvg =
    row.spo2Readings.length > 0
      ? row.spo2Readings.reduce((a, b) => a + b, 0) / row.spo2Readings.length
      : null
  const hrvIntradayCv =
    row.hrvReadings.length >= 2
      ? (() => {
          const m = row.hrvReadings.reduce((a, b) => a + b, 0) / row.hrvReadings.length
          if (m === 0) return null
          const variance =
            row.hrvReadings.reduce((s, x) => s + (x - m) ** 2, 0) / row.hrvReadings.length
          return (Math.sqrt(variance) / m) * 100
        })()
      : null

  return { deepSleepPct, sleepEfficiency, spo2NightAvg, hrvIntradayCv }
}
