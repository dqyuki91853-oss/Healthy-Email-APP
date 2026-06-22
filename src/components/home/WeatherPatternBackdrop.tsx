import type { BodyWeatherId } from '../../types/bodyWeather'

interface Props {
  weatherId: BodyWeatherId
}

/**
 * p4 风格 — 高对比水纹 + 渐变（少白雾，图案清晰可见）。
 */
export function WeatherPatternBackdrop({ weatherId }: Props) {
  const p = WEATHER_PALETTE[weatherId] ?? WEATHER_PALETTE.partly_cloudy
  const gid = `wp-${weatherId}`

  return (
    <div className="weather-pattern-shell pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden>
      <div
        className="weather-pattern-shell__gradient absolute inset-0"
        style={{
          background: `linear-gradient(145deg, ${p.from} 0%, ${p.mid} 45%, ${p.to} 100%)`,
        }}
      />

      <svg
        className="weather-pattern-shell__ripples absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id={`${gid}-glow`} cx="50%" cy="28%" r="60%">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.85" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="200" cy="70" rx="160" ry="95" fill={`url(#${gid}-glow)`} />

        {/* 主水纹 — 加粗加亮 */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={i}
            cx={200}
            cy={100 + i * 12}
            r={28 + i * 24}
            fill="none"
            stroke={p.ripple}
            strokeWidth={i < 2 ? 2.8 : 2}
            opacity={0.72 - i * 0.09}
          />
        ))}

        {/* 角落装饰圆 */}
        <circle cx="48" cy="240" r="36" fill="none" stroke={p.ripple} strokeWidth="1.8" opacity="0.45" />
        <circle cx="352" cy="220" r="28" fill="none" stroke={p.ripple} strokeWidth="1.5" opacity="0.4" />

        {/* 光斑点阵 */}
        <g opacity="0.45">
          {[...Array(20)].map((_, i) => (
            <circle
              key={i}
              cx={24 + (i % 5) * 88}
              cy={160 + Math.floor(i / 5) * 32}
              r={1.5 + (i % 4) * 0.6}
              fill={p.dot}
            />
          ))}
        </g>

        {/* 斜向高光带 */}
        <path d="M-30 -10 L130 310 L210 310 L20 -10 Z" fill="#FFFFFF" opacity="0.14" />
      </svg>

      {/* 极薄玻璃 — 不再盖住图案 */}
      <div className="weather-pattern-shell__glass absolute inset-0" />
    </div>
  )
}

const WEATHER_PALETTE: Record<
  BodyWeatherId,
  { from: string; mid: string; to: string; glow: string; ripple: string; dot: string }
> = {
  sunny: {
    from: '#FDF0C8',
    mid: '#B8E8D0',
    to: '#88C8E8',
    glow: '#F5D878',
    ripple: '#4A9878',
    dot: '#C89B6B',
  },
  partly_cloudy: {
    from: '#C0D8F4',
    mid: '#98C0EC',
    to: '#78A8DC',
    glow: '#E8F4FF',
    ripple: '#2E6098',
    dot: '#63AD96',
  },
  overcast: {
    from: '#E4E0DA',
    mid: '#CCC6BE',
    to: '#B4AEA6',
    glow: '#F0ECE8',
    ripple: '#686460',
    dot: '#8A8580',
  },
  rainy: {
    from: '#B8D0E8',
    mid: '#98B8D8',
    to: '#7898C0',
    glow: '#D8ECFF',
    ripple: '#284868',
    dot: '#63AD96',
  },
  foggy: {
    from: '#ECE6E0',
    mid: '#D8D0C8',
    to: '#C4BCB4',
    glow: '#FAF6F2',
    ripple: '#787068',
    dot: '#A8A29E',
  },
  rainbow: {
    from: '#F8D8C8',
    mid: '#D8C8F0',
    to: '#A8D0F0',
    glow: '#FFF0D8',
    ripple: '#508878',
    dot: '#A888D0',
  },
}
