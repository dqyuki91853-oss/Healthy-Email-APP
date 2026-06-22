import { describe, it, expect } from 'vitest'
import { parseBloodPressureCsv } from './bloodPressureCsvParser'

describe('parseBloodPressureCsv', () => {
  it('parses systolic and diastolic columns', () => {
    const csv = `timestamp,systolic,diastolic,pulse
2026-06-10 08:30,118,76,72
2026-06-10 21:00,128,82,68`
    const rows = parseBloodPressureCsv(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0].systolicMmHg).toBe(118)
    expect(rows[0].diastolicMmHg).toBe(76)
    expect(rows[0].pulseBpm).toBe(72)
  })

  it('accepts Chinese column headers', () => {
    const csv = `测量时间,收缩压,舒张压
2026-06-11T12:00:00,120,80`
    const rows = parseBloodPressureCsv(csv)
    expect(rows[0].systolicMmHg).toBe(120)
  })

  it('throws when required columns missing', () => {
    expect(() => parseBloodPressureCsv('a,b\n1,2')).toThrow(/收缩压/)
  })
})
