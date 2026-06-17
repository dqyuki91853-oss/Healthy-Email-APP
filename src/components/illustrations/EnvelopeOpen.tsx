import { PostmarkStamp } from './PostmarkStamp'
import { WeatherStamp } from '../bodyWeather/WeatherStamp'
import type { BodyWeatherId } from '../../types/bodyWeather'

interface Props {
  score: number | null
  dateRange?: { start: string; end: string } | null
  weatherId?: BodyWeatherId | null
  weatherLabel?: string
  nickname?: string
  onClick?: () => void
  /** Whether to show the paper peek + ruled lines */
  showPaper?: boolean
  className?: string
}

/**
 * Single cream envelope with white ruled paper peeking out the top.
 * Matches p2 reference: tactile, playful, "收到邮件" ceremony.
 */
export function EnvelopeOpen({
  score,
  dateRange,
  weatherId,
  weatherLabel,
  nickname,
  onClick,
  showPaper = true,
  className = '',
}: Props) {
  return (
    <div
      className={`relative mx-auto transition-all duration-300 ease-out ${className}`}
      style={{
        width: 'min(360px, 100%)',
        maxWidth: 360,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      aria-label={onClick ? '打开本周健康来信' : undefined}
    >
      <svg
        viewBox="0 0 360 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 12px 40px rgba(44,44,44,0.12))' }}
        aria-hidden="true"
      >
        {/* Paper peeking out top */}
        {showPaper && (
          <>
            <rect x="42" y="12" width="276" height="138" rx="4" fill="white" stroke="#E8E0D4" strokeWidth="0.75" />
            {/* Ruled lines */}
            <line x1="62" y1="42" x2="298" y2="42" stroke="#E8E0D4" strokeWidth="0.75" />
            <line x1="62" y1="66" x2="298" y2="66" stroke="#E8E0D4" strokeWidth="0.75" />
            <line x1="62" y1="90" x2="280" y2="90" stroke="#E8E0D4" strokeWidth="0.75" />
            <line x1="62" y1="114" x2="260" y2="114" stroke="#E8E0D4" strokeWidth="0.75" />
            {/* Italic hint text */}
            <text
              x="180"
              y="56"
              textAnchor="middle"
              fill="#8A8A8A"
              fontSize="13"
              fontStyle="italic"
              fontFamily="Georgia, serif"
            >
              准备好就打开吧。
            </text>
          </>
        )}

        {/* Envelope body */}
        <rect x="10" y="72" width="340" height="148" rx="8" fill="#F5F0E8" />

        {/* Envelope inner shadow at top */}
        <rect x="10" y="72" width="340" height="4" rx="2" fill="rgba(0,0,0,0.04)" />

        {/* Bottom flap */}
        <path d="M10 148 L180 216 L350 148" fill="#EDE6D8" stroke="#E0D8C8" strokeWidth="1.25" />

        {/* "To" label */}
        {nickname && (
          <text x="42" y="195" fill="#8A8A8A" fontSize="12" fontFamily="var(--font-sans), sans-serif">
            To · {nickname}
          </text>
        )}
        {!nickname && (
          <text x="42" y="195" fill="#8A8A8A" fontSize="12" fontFamily="var(--font-sans), sans-serif">
            To · 健康访客
          </text>
        )}
      </svg>

      {/* PostmarkStamp — bottom-right overlay */}
      <div className="absolute" style={{ right: 16, bottom: 36 }}>
        <PostmarkStamp score={score} dateRange={dateRange} />
      </div>

      {/* WeatherStamp — top-right corner overlay */}
      {weatherId && weatherLabel && (
        <div className="absolute" style={{ right: -4, top: 0 }}>
          <WeatherStamp weatherId={weatherId} label={weatherLabel} size="sm" />
        </div>
      )}
    </div>
  )
}
