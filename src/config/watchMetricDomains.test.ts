import { describe, it, expect } from 'vitest'
import { WATCH_METRIC_INDEX } from './watchMetrics'
import { allDomainMetricKeys } from './watchMetricDomains'

describe('watchMetricDomains', () => {
  it('union of domain keys covers all 22 Watch metrics', () => {
    const domainKeys = new Set(allDomainMetricKeys())
    for (const { key } of WATCH_METRIC_INDEX) {
      expect(domainKeys.has(key)).toBe(true)
    }
    expect(WATCH_METRIC_INDEX).toHaveLength(22)
  })
})
