/**
 * Pre-process Apple Health export.xml → public/watch-data.json
 * Usage: node scripts/import-health.mjs "/path/to/导出.xml" [maxDays]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { XMLParser } from 'fast-xml-parser'

const __dirname = dirname(fileURLToPath(import.meta.url))
const xmlPath = process.argv[2]
const maxDays = parseInt(process.argv[3] ?? '365', 10)

if (!xmlPath) {
  console.error('Usage: node scripts/import-health.mjs <path-to-export.xml> [maxDays]')
  process.exit(1)
}

const WATCH_TYPE_MAP = {
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

function parseDt(s) {
  const d = new Date(s.replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

function dayKey(dt) {
  return dt.toISOString().slice(0, 10)
}

function emptyRow(date) {
  return {
    date,
    dailySteps: 0,
    activeEnergyKcal: 0,
    exerciseMinutes: 0,
    restingHr: null,
    hrvSdnn: null,
    hrvReadings: [],
    spo2Readings: [],
    spo2DesatEvents: 0,
    respiratoryRateSleep: null,
    walkingAsymmetryPct: null,
    wristTempRaw: null,
    sleepHours: 0,
    deepSleepMin: 0,
    remSleepMin: 0,
    coreSleepMin: 0,
    inBedMin: 0,
    awakeEpisodes: 0,
    vo2max: null,
    cardioRecovery1min: null,
    daylightMinutes: 0,
    environmentalNoiseDb: null,
  }
}

function cleanRhr(v) {
  return v < 30 || v > 120 ? null : v
}

console.log(`Reading ${xmlPath}…`)
const t0 = Date.now()
const xmlContent = readFileSync(xmlPath, 'utf-8')
console.log(`Read ${(xmlContent.length / 1e6).toFixed(1)} MB in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'Record',
})

console.log('Parsing XML…')
const t1 = Date.now()
const doc = parser.parse(xmlContent)
const records = doc?.HealthData?.Record ?? []
console.log(`Parsed ${records.length.toLocaleString()} records in ${((Date.now() - t1) / 1000).toFixed(1)}s`)

const cutoff = new Date()
cutoff.setDate(cutoff.getDate() - maxDays)
const days = new Map()

for (const rec of records) {
  const type = rec['@_type']
  const start = rec['@_startDate']
  const end = rec['@_endDate']
  const valueStr = rec['@_value']
  if (!type || !start) continue

  const startDt = parseDt(start)
  if (!startDt || startDt < cutoff) continue

  const key = dayKey(startDt)
  if (!days.has(key)) days.set(key, emptyRow(key))
  const row = days.get(key)

  if (type === SLEEP_TYPE && valueStr && end) {
    const endDt = parseDt(end)
    if (!endDt) continue
    const mins = (endDt - startDt) / 60000
    if (mins <= 0 || mins > 24 * 60) continue
    if (valueStr === SLEEP_IN_BED) row.inBedMin += mins
    else if (valueStr === SLEEP_AWAKE) row.awakeEpisodes += 1
    else if (SLEEP_ASLEEP.has(valueStr)) {
      row.sleepHours += mins / 60
      if (valueStr === SLEEP_DEEP) row.deepSleepMin += mins
      else if (valueStr === SLEEP_REM) row.remSleepMin += mins
      else if (valueStr === SLEEP_CORE) row.coreSleepMin += mins
    }
    continue
  }

  const mapped = WATCH_TYPE_MAP[type]
  if (!mapped || valueStr == null) continue
  const raw = parseFloat(valueStr)
  if (isNaN(raw)) continue

  if (mapped === 'spo2') {
    const v = raw <= 1.5 ? raw * 100 : raw
    row.spo2Readings.push(v)
    if (v < SPO2_DESAT) row.spo2DesatEvents += 1
    continue
  }

  if (mapped === 'hrvSdnn') {
    row.hrvReadings.push(raw)
    row.hrvSdnn = raw
    continue
  }

  if (mapped === 'restingHr') row.restingHr = cleanRhr(raw)
  else if (mapped === 'dailySteps' || mapped === 'activeEnergyKcal' || mapped === 'exerciseMinutes' || mapped === 'daylightMinutes') {
    row[mapped] += raw
  } else {
    row[mapped] = raw
  }
}

const rows = [...days.values()]
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((row) => ({
    ...row,
    sleepHours: Math.round(row.sleepHours * 100) / 100,
  }))

const outDir = join(__dirname, '../public/data')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'watch-data.json')
const meta = {
  importedAt: new Date().toISOString(),
  source: xmlPath,
  recordCount: rows.length,
  dateRange: rows.length
    ? { start: rows[0].date, end: rows[rows.length - 1].date }
    : { start: '', end: '' },
  rows,
}

writeFileSync(outPath, JSON.stringify(meta))
console.log(`Wrote ${rows.length} days → ${outPath}`)
if (rows.length) {
  console.log(`Date range: ${meta.dateRange.start} → ${meta.dateRange.end}`)
}
