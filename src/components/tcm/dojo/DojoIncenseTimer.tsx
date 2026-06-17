interface Props {
  totalSec: number
  secondsLeft: number
  active?: boolean
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Phase 3 — 线香计时：随练习进度燃尽 */
export function DojoIncenseTimer({ totalSec, secondsLeft, active = true }: Props) {
  const progress = totalSec > 0 ? 1 - secondsLeft / totalSec : 0
  const burnPct = Math.min(100, Math.max(0, progress * 100))

  return (
    <div className={`dojo-incense ${active ? 'dojo-incense--live' : ''}`} aria-label={`剩余 ${secondsLeft} 秒`}>
      <p className="dojo-incense__label" style={{ fontFamily: 'var(--tcm-font-serif)' }}>
        一炷香
      </p>
      <div className="dojo-incense__holder">
        <div className="dojo-incense__stick">
          <div className="dojo-incense__ash" style={{ height: `${burnPct}%` }} />
          <div
            className="dojo-incense__ember"
            style={{ bottom: `calc(${burnPct}% - 2px)` }}
          />
        </div>
        <div className="dojo-incense__plate" />
      </div>
      {active && burnPct > 2 && (
        <div className="dojo-incense__smoke" aria-hidden>
          <span className="dojo-incense__wisp" />
          <span className="dojo-incense__wisp dojo-incense__wisp--2" />
          <span className="dojo-incense__wisp dojo-incense__wisp--3" />
        </div>
      )}
      <p className="dojo-incense__time">{formatTime(secondsLeft)}</p>
      <p className="dojo-incense__hint">余香</p>
    </div>
  )
}
