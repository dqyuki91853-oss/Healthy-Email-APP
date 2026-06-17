interface Props {
  streak: number
  total: number
}

/** Phase 3 — 收功完成反馈 */
export function DojoPracticeComplete({ streak, total }: Props) {
  return (
    <div className="dojo-practice-complete">
      <p className="dojo-practice-complete__title" style={{ fontFamily: 'var(--tcm-font-serif)' }}>
        一炷香尽，收功圆满
      </p>
      <p className="dojo-practice-complete__sub">练习完成，做得很好。</p>
      {streak > 1 && (
        <p className="dojo-practice-complete__streak">
          已连续 {streak} 日入道场 · 累计 {total} 次
        </p>
      )}
      {streak <= 1 && total > 0 && (
        <p className="dojo-practice-complete__streak">累计练习 {total} 次</p>
      )}
    </div>
  )
}
