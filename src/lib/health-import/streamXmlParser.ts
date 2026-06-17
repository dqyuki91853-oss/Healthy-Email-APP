import { SaxesParser } from 'saxes'
import type { DailyWatchRow, WalkingSteadiness } from '../../types/health'
import {
  addCumulative,
  addSleepMinutes,
  emptyWatchRow,
  incrementCount,
  normalizeWatchRow,
} from './watchRow'

const WATCH_TYPE_MAP: Record<string, keyof DailyWatchRow | 'spo2' | 'hrv'> = {
  HKQuantityTypeIdentifierStepCount: 'dailySteps',
  HKQuantityTypeIdentifierActiveEnergyBurned: 'activeEnergyKcal',
  HKQuantityTypeIdentifierAppleExerciseTime: 'exerciseMinutes',
  HKQuantityTypeIdentifierRestingHeartRate: 'restingHr',
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: 'hrvSdnn',
  HKQuantityTypeIdentifierVO2Max: 'vo2max',
  HKQuantityTypeIdentifierOxygenSaturation: 'spo2',
  HKQuantityTypeIdentifierWalkingAsymmetryPercentage: 'walkingAsymmetryPct',
  HKQuantityTypeIdentifierAppleSleepingWristTemperature: 'wristTempRaw',
  HKQuantityTypeIdentifierRespiratoryRate: 'respiratoryRateSleep',
  HKQuantityTypeIdentifierHeartRateRecoveryOneMinute: 'cardioRecovery1min',
  HKQuantityTypeIdentifierTimeInDaylight: 'daylightMinutes',
  HKQuantityTypeIdentifierEnvironmentalSoundPressureLevel: 'environmentalNoiseDb',
}

const WALKING_STEADINESS_TYPE = 'HKCategoryTypeIdentifierAppleWalkingSteadiness'
const WALKING_STEADINESS_MAP: Record<string, WalkingSteadiness> = {
  HKCategoryValueAppleWalkingSteadinessOK: 'normal',
  HKCategoryValueAppleWalkingSteadinessLow: 'low',
  HKCategoryValueAppleWalkingSteadinessVeryLow: 'very_low',
}

const SLEEP_TYPE = 'HKCategoryTypeIdentifierSleepAnalysis'
const SLEEP_ASLEEP = new Set([
  'HKCategoryValueSleepAnalysisAsleepCore',
  'HKCategoryValueSleepAnalysisAsleepDeep',
  'HKCategoryValueSleepAnalysisAsleepREM',
  'HKCategoryValueSleepAnalysisAsleepUnspecified',
])
const SLEEP_DEEP = 'HKCategoryValueSleepAnalysisAsleepDeep'
const SLEEP_REM = 'HKCategoryValueSleepAnalysisAsleepREM'
const SLEEP_CORE = 'HKCategoryValueSleepAnalysisAsleepCore'
const SLEEP_IN_BED = 'HKCategoryValueSleepAnalysisInBed'
const SLEEP_AWAKE = 'HKCategoryValueSleepAnalysisAwake'

const SPO2_DESAT = 90

let _parseDtDebugCount = 0
let _parseDtDebugSample = 0

function parseDt(s: string): Date | null {
  // Apple Health date format: "YYYY-MM-DD HH:mm:ss +0800" (timezone without colon)
  // Strategy: manually construct valid ISO 8601 to avoid browser quirks

  // Match the Apple Health format: YYYY-MM-DD HH:mm:ss ±HHMM
  const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/)
  if (m) {
    // Build strict ISO 8601: YYYY-MM-DDTHH:mm:ss±HH:MM
    const iso = `${m[1]}T${m[2]}${m[3]}:${m[4]}`
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return d
    // If ISO fails, debug first few
    if (_parseDtDebugSample < 5) {
      _parseDtDebugSample++
      console.log(`[parseDt] ISO failed for: "${s}" → "${iso}" → Invalid Date`)
    }
  }

  // Fallback: regex didn't match
  _parseDtDebugCount++
  if (_parseDtDebugCount <= 5) {
    console.log(`[parseDt] FAIL #${_parseDtDebugCount}:`, JSON.stringify(s), '| regex match:', !!m)
  }

  return null
}

function dayKey(dt: Date): string {
  return dt.toISOString().slice(0, 10)
}

function normalizeValue(key: string, val: number): number {
  if (key === 'spo2' && val <= 1.5) return val * 100
  if (key === 'walkingAsymmetryPct' && val <= 1) return val * 100
  return val
}

function cleanRhr(v: number): number | null {
  if (v < 30 || v > 120) return null
  return v
}

function ensureDay(days: Map<string, DailyWatchRow>, key: string): DailyWatchRow {
  if (!days.has(key)) days.set(key, emptyWatchRow(key))
  return days.get(key)!
}

/**
 * Process a single Apple Health Record element into the days map.
 * Extracted as a shared helper used by both streaming and non-streaming parsers.
 */
export function processRecord(
  attrs: Record<string, string>,
  days: Map<string, DailyWatchRow>,
  cutoff: Date,
): void {
  const type = attrs.type
  const start = attrs.startDate
  const end = attrs.endDate
  const valueStr = attrs.value
  if (!type || !start) return

  const startDt = parseDt(start)
  if (!startDt || startDt < cutoff) return

  const key = dayKey(startDt)
  const row = ensureDay(days, key)

  if (type === WALKING_STEADINESS_TYPE && valueStr) {
    const level = WALKING_STEADINESS_MAP[valueStr]
    if (level) row.walkingSteadiness = level
    return
  }

  if (type === SLEEP_TYPE && valueStr && end) {
    const endDt = parseDt(end)
    if (!endDt) return
    const mins = (endDt.getTime() - startDt.getTime()) / 60000
    if (mins <= 0 || mins > 24 * 60) return

    if (valueStr === SLEEP_IN_BED) addSleepMinutes(row, 'inBedMin', mins)
    else if (valueStr === SLEEP_AWAKE) incrementCount(row, 'awakeEpisodes')
    else if (SLEEP_ASLEEP.has(valueStr)) {
      addSleepMinutes(row, 'sleepHours', mins)
      if (valueStr === SLEEP_DEEP) addSleepMinutes(row, 'deepSleepMin', mins)
      else if (valueStr === SLEEP_REM) addSleepMinutes(row, 'remSleepMin', mins)
      else if (valueStr === SLEEP_CORE) addSleepMinutes(row, 'coreSleepMin', mins)
    }
    return
  }

  const mapped = WATCH_TYPE_MAP[type]
  if (!mapped || valueStr == null) return

  const raw = parseFloat(valueStr)
  if (isNaN(raw)) return

  if (mapped === 'spo2') {
    const v = normalizeValue('spo2', raw)
    row.spo2Readings.push(v)
    if (v < SPO2_DESAT) incrementCount(row, 'spo2DesatEvents')
    return
  }

  if (mapped === 'hrvSdnn') {
    row.hrvReadings.push(raw)
    row.hrvSdnn = row.hrvReadings.reduce((a, b) => a + b, 0) / row.hrvReadings.length
    return
  }

  const field = mapped as keyof DailyWatchRow
  const v = normalizeValue(field, raw)

  if (field === 'restingHr') {
    row.restingHr = cleanRhr(v)
  } else if (
    field === 'dailySteps' ||
    field === 'activeEnergyKcal' ||
    field === 'exerciseMinutes' ||
    field === 'daylightMinutes'
  ) {
    addCumulative(row, field, v)
  } else if (
    field === 'vo2max' ||
    field === 'cardioRecovery1min' ||
    field === 'environmentalNoiseDb' ||
    field === 'walkingAsymmetryPct' ||
    field === 'wristTempRaw' ||
    field === 'respiratoryRateSleep'
  ) {
    row[field] = v as never
  }
}

/**
 * Locate the byte offset of `<HealthData` after any DOCTYPE/internal DTD.
 * Apple Health export.xml starts with:
 *   <?xml ...?>
 *   <!DOCTYPE HealthData [ ... extensive DTD ... ]>
 *   <HealthData locale="...">
 *
 * Some parsers choke on the large internal DTD subset, so we find the
 * closing `]>` of the DOCTYPE and start from the `<HealthData` that follows.
 *
 * Returns 0 if no DTD is found (we parse from the beginning).
 */
function skipDoctypePreamble(bytes: Uint8Array): number {
  // Look for "]>" followed by whitespace and "<"
  const END_DTD = [0x5d, 0x3e] // "]>" in ASCII/UTF-8
  const TAG_START = 0x3c // "<"

  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] !== END_DTD[0] || bytes[i + 1] !== END_DTD[1]) continue

    // Skip whitespace after "]>" and look for "<"
    let j = i + 2
    while (j < bytes.length && (bytes[j] === 0x20 || bytes[j] === 0x0a || bytes[j] === 0x0d || bytes[j] === 0x09)) {
      j++
    }
    if (j < bytes.length && bytes[j] === TAG_START) {
      console.log(`Detected DOCTYPE DTD ending at byte ${i + 2}, content starts at byte ${j}`)
      return j
    }
  }

  // No DTD found — look for "<HealthData" directly
  const HEALTH_DATA = [0x48, 0x65, 0x61, 0x6c, 0x74, 0x68, 0x44, 0x61, 0x74, 0x61]
  for (let i = 0; i < bytes.length - 11; i++) {
    if (bytes[i] !== TAG_START) continue
    let match = true
    for (let k = 0; k < HEALTH_DATA.length; k++) {
      if (bytes[i + 1 + k] !== HEALTH_DATA[k]) { match = false; break }
    }
    if (match) {
      console.log(`No DTD found, HealthData starts at byte ${i}`)
      return i
    }
  }

  console.log('No DTD or HealthData tag found, parsing from beginning')
  return 0
}

/**
 * Parse Apple Health XML using a streaming SAX parser.
 * Accepts a Uint8Array to avoid creating a giant string from large export.xml files.
 * Processes records one at a time, keeping memory usage low.
 *
 * Skips the DOCTYPE/DTD preamble by scanning for the `<HealthData` start tag
 * in the raw bytes, avoiding parsers tripping on the extensive internal DTD.
 *
 * @param xmlBytes - Raw XML bytes from ZIP or file
 * @param maxDays - Number of days of data to retain (default 365)
 * @param onProgress - Optional callback for progress (0-100)
 */
export function parseAppleHealthXmlStream(
  xmlBytes: Uint8Array,
  maxDays = 365,
  onProgress?: (pct: number) => void,
): DailyWatchRow[] {
  const days = new Map<string, DailyWatchRow>()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - maxDays)

  // Find where the actual XML content starts (skip DOCTYPE/DOD)
  const contentStart = skipDoctypePreamble(xmlBytes)
  const effectiveBytes = xmlBytes.subarray(contentStart)
  console.log(
    `Stream parse: skipping ${contentStart} bytes of preamble, parsing ${effectiveBytes.length} bytes of XML`,
  )

  const parser = new SaxesParser({
    xmlns: false,
    fragment: true,
    position: false,
  })

  let recordCount = 0
  let skippedByCutoff = 0
  let minDate = ''
  let maxDate = ''

  parser.on('opentag', (tag) => {
    if (tag.name !== 'Record') return

    recordCount++
    const attrs = tag.attributes as Record<string, string>
    const type = attrs.type
    const start = attrs.startDate
    if (!type || !start) return

    const startDt = parseDt(start)
    if (!startDt) return

    // Track actual date range
    if (!minDate || start < minDate) minDate = start
    if (!maxDate || start > maxDate) maxDate = start

    if (startDt < cutoff) { skippedByCutoff++; return }

    processRecord(attrs, days, cutoff)
  })

  parser.on('error', (err: Error) => {
    console.warn('XML parse warning:', err.message)
  })

  // Feed data in chunks to avoid creating a giant string
  const CHUNK_SIZE = 1024 * 1024 // 1MB chunks
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let offset = 0

  while (offset < effectiveBytes.length) {
    const end = Math.min(offset + CHUNK_SIZE, effectiveBytes.length)
    const chunk = effectiveBytes.subarray(offset, end)
    const text = decoder.decode(chunk, { stream: true })
    parser.write(text)
    offset = end

    if (onProgress && effectiveBytes.length > 0) {
      onProgress(Math.round((offset / effectiveBytes.length) * 100))
    }
  }

  // Final flush
  const finalText = decoder.decode()
  if (finalText) { parser.write(finalText) }

  parser.close()

  const result = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => normalizeWatchRow(row))

  console.log(
    `[v5] XML stream parse: ${recordCount} records → ${days.size} days (cutoff: ${cutoff.toISOString().slice(0, 10)})`,
  )
  console.log(`Date range: [${minDate || 'N/A'} .. ${maxDate || 'N/A'}] | skipped by cutoff: ${skippedByCutoff}`)

  return result
}
