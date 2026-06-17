import { humPatternToAnimClass } from '../../../lib/wuyinBreathingPattern'

interface Props {
  pattern: string
  toneLabel: string
  organLabel: string
  frequencyHz: number
  active?: boolean
}

/** Phase 3 — 全屏呼吸环 */
export function DojoBreathingRing({ pattern, toneLabel, organLabel, frequencyHz, active = true }: Props) {
  const anim = humPatternToAnimClass(pattern)

  return (
    <div className={`dojo-breathing-ring ${active ? 'dojo-breathing-ring--live' : ''}`} aria-hidden={!active}>
      <div className={`dojo-breathing-ring__pulse ${anim}`} />
      <div className={`dojo-breathing-ring__ring dojo-breathing-ring__ring--outer ${anim}`} />
      <div className={`dojo-breathing-ring__ring dojo-breathing-ring__ring--mid ${anim}`} />
      <div className={`dojo-breathing-ring__ring dojo-breathing-ring__ring--inner ${anim}`} />
      <div className={`dojo-breathing-ring__core ${anim}`}>
        <span className="dojo-breathing-ring__char">{toneLabel.charAt(0)}</span>
        <span className="dojo-breathing-ring__meta">
          {organLabel} · {frequencyHz.toFixed(1)} Hz
        </span>
      </div>
    </div>
  )
}
