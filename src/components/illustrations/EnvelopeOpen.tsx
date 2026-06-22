import { PostmarkStamp } from './PostmarkStamp'
import { WeatherStamp } from '../bodyWeather/WeatherStamp'
import { EnvelopeBotanicalSvg } from './EnvelopeBotanicalSvg'
import { buildEnvelopeDecorCopy } from '../../lib/envelopeDecorCopy'
import type { BodyWeatherId } from '../../types/bodyWeather'

interface Props {
  score: number | null
  dateRange?: { start: string; end: string } | null
  weatherId?: BodyWeatherId | null
  weatherLabel?: string
  nickname?: string
  onClick?: () => void
  showPaper?: boolean
  showBotanical?: boolean
  className?: string
}

/**
 * 方形信封 — 果蔬花装饰贴合信体轮廓，文案由天气关键词合成。
 */
export function EnvelopeOpen({
  score,
  dateRange,
  weatherId,
  weatherLabel,
  nickname,
  onClick,
  showPaper = true,
  showBotanical = true,
  className = '',
}: Props) {
  const decor = buildEnvelopeDecorCopy(weatherId, weatherLabel)

  return (
    <div
      className={`envelope-open relative mx-auto transition-all duration-300 ease-out ${className}`}
      style={{
        width: 'min(100%, 360px)',
        maxWidth: 380,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      aria-label={onClick ? '打开本周健康来信' : undefined}
    >
      <svg
        viewBox="0 0 360 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="envelope-open__svg h-auto w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="env-square-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBF5" />
            <stop offset="50%" stopColor="#FAF4E8" />
            <stop offset="100%" stopColor="#F0E8DA" />
          </linearGradient>
          <linearGradient id="env-square-flap" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#EDE4D4" />
            <stop offset="100%" stopColor="#F7F0E4" />
          </linearGradient>
          <radialGradient id="env-wax-seal" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#C46A52" />
            <stop offset="100%" stopColor="#9A4A38" />
          </radialGradient>
        </defs>

        {showPaper && (
          <>
            <rect
              x="64"
              y="16"
              width="232"
              height="96"
              rx="6"
              fill="white"
              stroke="#E8E0D4"
              strokeWidth="0.75"
            />
            <line x1="84" y1="48" x2="276" y2="48" stroke="#E8E0D4" strokeWidth="0.75" />
            <line x1="84" y1="68" x2="276" y2="68" stroke="#E8E0D4" strokeWidth="0.75" />
            <line x1="84" y1="86" x2="252" y2="86" stroke="#E8E0D4" strokeWidth="0.75" />
            <text
              x="180"
              y="44"
              textAnchor="middle"
              fill="#6B7280"
              fontSize="10.5"
              fontStyle="italic"
              fontFamily="Georgia, serif"
            >
              {decor.paperLine.length > 28 ? `${decor.paperLine.slice(0, 27)}…` : decor.paperLine}
            </text>
            <text
              x="180"
              y="62"
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize="9"
              fontFamily="var(--font-sans), sans-serif"
            >
              {decor.paperSub.length > 32 ? `${decor.paperSub.slice(0, 31)}…` : decor.paperSub}
            </text>
          </>
        )}

        <rect
          x="48"
          y="118"
          width="264"
          height="264"
          rx="14"
          fill="url(#env-square-body)"
          stroke="#E0D4C4"
          strokeWidth="1"
        />

        <path
          d="M48 118 Q180 36 180 32 Q180 36 312 118 Z"
          fill="url(#env-square-flap)"
          stroke="#D8CCBA"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        <path d="M48 118 L312 118" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />

        <path
          d="M180 28 L182 34 L188 34 L183 38 L185 44 L180 40 L175 44 L177 38 L172 34 L178 34 Z"
          fill="#EBC97F"
          opacity="0.95"
        />

        <circle cx="180" cy="132" r="13" fill="url(#env-wax-seal)" opacity="0.92" />
        <circle cx="180" cy="132" r="9" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <text
          x="180"
          y="136"
          textAnchor="middle"
          fill="rgba(255,255,255,0.92)"
          fontSize="9"
          fontWeight="600"
          fontFamily="var(--font-sans), sans-serif"
        >
          信
        </text>

        <text
          x="180"
          y="248"
          textAnchor="middle"
          fill="#9CAF9A"
          fontSize="9.5"
          letterSpacing="0.12em"
          fontFamily="var(--font-sans), sans-serif"
          opacity="0.82"
        >
          {decor.bodyTagline.length > 22 ? `${decor.bodyTagline.slice(0, 21)}…` : decor.bodyTagline}
        </text>

        <text x="68" y="358" fill="#8A8A8A" fontSize="11" fontFamily="var(--font-sans), sans-serif">
          To · {nickname || '健康访客'}
        </text>

        {showBotanical && (
          <EnvelopeBotanicalSvg square keywords={decor.botanicalKeywords} />
        )}
      </svg>

      <div className="absolute" style={{ right: 12, bottom: 28 }}>
        <PostmarkStamp score={score} dateRange={dateRange} />
      </div>

      {weatherId && weatherLabel && (
        <div className="absolute" style={{ right: -2, top: 4 }}>
          <WeatherStamp weatherId={weatherId} label={weatherLabel} size="sm" />
        </div>
      )}
    </div>
  )
}
