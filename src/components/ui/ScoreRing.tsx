interface Props {
  score: number
  size?: number
}

export function ScoreRing({ score, size = 120 }: Props) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color =
    score >= 75
      ? 'var(--color-green)'
      : score >= 50
        ? 'var(--color-yellow)'
        : score >= 30
          ? 'var(--color-orange)'
          : 'var(--color-red)'

  return (
    <svg width={size} height={size} className="rotate-[-90deg]" role="img" aria-label={`健康评分 ${Math.round(score)} 分`}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={8} />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90 font-semibold"
        fill="var(--color-text)"
        fontSize={size * 0.22}
        style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {Math.round(score)}
      </text>
    </svg>
  )
}
