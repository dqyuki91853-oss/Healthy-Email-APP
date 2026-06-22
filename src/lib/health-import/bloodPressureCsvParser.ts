import type { BloodPressureReading } from '../../types/bloodPressure'

function parseCsvLine(line: string): string[] {
  const cols: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      cols.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  cols.push(cur.trim())
  return cols
}

function findColumn(headers: string[], names: string[]): number {
  return headers.findIndex((h) => names.includes(h))
}

function parseTimestamp(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed
  if (/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}/.test(trimmed)) {
    return trimmed.replace(' ', 'T')
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T12:00:00`
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function parseIntCell(raw: string): number | null {
  const n = Number(String(raw ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? Math.round(n) : null
}

/** 解析血压仪 / 健康 App 导出的 CSV。 */
export function parseBloodPressureCsv(text: string): BloodPressureReading[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) throw new Error('CSV 文件为空或格式不正确')

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/^\ufeff/, ''))
  const timeIdx = findColumn(headers, [
    'timestamp',
    'time',
    'datetime',
    'date_time',
    'measured_at',
    'date',
    '时间',
    '日期',
    '测量时间',
  ])
  const sysIdx = findColumn(headers, [
    'systolic',
    'sys',
    'sbp',
    '收缩压',
    '高压',
    'systolic_mmhg',
  ])
  const diaIdx = findColumn(headers, [
    'diastolic',
    'dia',
    'dbp',
    '舒张压',
    '低压',
    'diastolic_mmhg',
  ])
  const pulseIdx = findColumn(headers, ['pulse', 'hr', 'heart_rate', '脉搏', '心率', 'pulse_bpm'])

  if (timeIdx < 0 || sysIdx < 0 || diaIdx < 0) {
    throw new Error('CSV 需包含时间列、收缩压列与舒张压列')
  }

  const readings: BloodPressureReading[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const measuredAt = parseTimestamp(cols[timeIdx] ?? '')
    const systolicMmHg = parseIntCell(cols[sysIdx] ?? '')
    const diastolicMmHg = parseIntCell(cols[diaIdx] ?? '')
    const pulseRaw = pulseIdx >= 0 ? parseIntCell(cols[pulseIdx] ?? '') : null

    if (
      !measuredAt ||
      systolicMmHg == null ||
      diastolicMmHg == null ||
      systolicMmHg < 60 ||
      systolicMmHg > 250 ||
      diastolicMmHg < 40 ||
      diastolicMmHg > 150 ||
      diastolicMmHg > systolicMmHg
    ) {
      continue
    }

    readings.push({
      id: `csv-${measuredAt}-${systolicMmHg}-${diastolicMmHg}`,
      measuredAt,
      systolicMmHg,
      diastolicMmHg,
      pulseBpm: pulseRaw ?? undefined,
      source: 'csv',
    })
  }

  if (readings.length === 0) {
    throw new Error('未能解析出有效血压记录，请检查列名与数值')
  }

  return readings
}
