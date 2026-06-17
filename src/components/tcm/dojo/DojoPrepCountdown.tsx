interface Props {
  count: number
}

/** Phase 3 — 入道场前 3 秒准备倒计时 */
export function DojoPrepCountdown({ count }: Props) {
  return (
    <div className="dojo-prep-countdown" role="status" aria-live="assertive">
      <p className="dojo-prep-countdown__label" style={{ fontFamily: 'var(--tcm-font-serif)' }}>
        准备
      </p>
      <span className="dojo-prep-countdown__num">{count}</span>
    </div>
  )
}
