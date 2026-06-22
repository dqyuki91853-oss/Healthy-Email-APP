import { describe, expect, it } from 'vitest'
import { buildEnvelopeDecorCopy } from './envelopeDecorCopy'

describe('buildEnvelopeDecorCopy', () => {
  it('uses weather keywords for partly_cloudy', () => {
    const copy = buildEnvelopeDecorCopy('partly_cloudy', '多云')
    expect(copy.paperLine).toContain('多云')
    expect(copy.botanicalKeywords).toContain('牵牛')
    expect(copy.botanicalKeywords).toContain('野莓')
    expect(copy.bodyTagline).toMatch(/野莓|青梨/)
  })

  it('falls back when weather missing', () => {
    const copy = buildEnvelopeDecorCopy(null)
    expect(copy.paperLine.length).toBeGreaterThan(4)
    expect(copy.botanicalKeywords.length).toBeGreaterThan(3)
  })
})
