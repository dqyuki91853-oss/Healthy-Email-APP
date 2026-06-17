interface Props {
  score: number | null
  dateRange?: { start: string; end: string } | null
}

function formatShortDateRange(range: { start: string; end: string }): string {
  const [_sy, sm, sd] = range.start.split('-')
  const [_ey, em, ed] = range.end.split('-')
  return `${parseInt(sm)}/${parseInt(sd)}–${parseInt(em)}/${parseInt(ed)}`
}

/**
 * Postmark-style stamp with dashed border, rotated.
 * Displays the weekly score and date range on the envelope.
 */
export function PostmarkStamp({ score, dateRange }: Props) {
  const dateStr = dateRange ? formatShortDateRange(dateRange) : ''

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-[6px] border border-dashed bg-white/85 px-2 py-1"
      style={{
        width: 76,
        minHeight: 58,
        borderColor: 'var(--color-border)',
        transform: 'rotate(-8deg)',
        boxShadow: '0 1px 4px rgba(44,44,44,0.06)',
      }}
      aria-label={score != null ? `本周评分 ${score} 分` : '本周评分加载中'}
    >
      <span className="text-[9px] font-medium text-[var(--color-muted)] leading-none">
        本周
      </span>
      <span
        className="text-[22px] font-bold leading-tight"
        style={{
          fontFamily: 'var(--font-accent)',
          color: score != null ? 'var(--color-coral)' : 'var(--color-border)',
        }}
      >
        {score ?? '—'}
      </span>
      {dateStr && (
        <span className="text-[8px] text-[var(--color-muted)] leading-none mt-0.5">
          {dateStr}
        </span>
      )}
    </div>
  )
}
