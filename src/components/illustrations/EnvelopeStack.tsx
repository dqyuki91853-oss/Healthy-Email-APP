import { WeatherStamp } from '../bodyWeather/WeatherStamp'
import { PostmarkStamp } from './PostmarkStamp'
import type { BodyWeatherId } from '../../types/bodyWeather'

interface Props {
  weatherId?: BodyWeatherId | null
  weatherLabel?: string
  score: number | null
  dateRange?: { start: string; end: string } | null
  onClick?: () => void
  hasUnread?: boolean
}

const LAYERS: { color: string; tx: number; ty: number; rot: number }[] = [
  { color: '#EBC97F', tx: 10, ty: 14, rot: -2.5 },
  { color: '#F1C6CD', tx: 5, ty: 7, rot: 1.5 },
  { color: '#63AD96', tx: 0, ty: 0, rot: 0 },
]

/**
 * Single envelope SVG shape used for each layer.
 */
function EnvelopeShape({ color, width = 200, height = 140 }: { color: string; width?: number; height?: number }) {
  const bodyH = height * 0.72
  const bodyY = height - bodyH
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body shadow */}
      <rect x="3" y={bodyY + 2} width={width - 6} height={bodyH - 2} rx="8" fill="rgba(0,0,0,0.06)" />
      {/* Body */}
      <rect x="2" y={bodyY} width={width - 4} height={bodyH} rx="8" fill={color} />
      {/* Flap (folded down triangle) */}
      <path
        d={`M2 ${bodyY} L${width / 2} ${bodyY + bodyH * 0.58} L${width - 2} ${bodyY}`}
        fill={color}
        style={{ filter: 'brightness(0.92)' }}
      />
      {/* Flap edge line for definition */}
      <path
        d={`M2 ${bodyY} L${width / 2} ${bodyY + bodyH * 0.58} L${width - 2} ${bodyY}`}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Bottom edge highlight */}
      <line x1="2" y1={bodyY + bodyH - 1} x2={width - 2} y2={bodyY + bodyH - 1} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    </svg>
  )
}

/**
 * Three-layer envelope stack illustration.
 * Top envelope is clickable and shows WeatherStamp + PostmarkStamp.
 */
export function EnvelopeStack({ weatherId, weatherLabel, score, dateRange, onClick, hasUnread }: Props) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 220, height: 170 }}
    >
      {/* Background layers */}
      {LAYERS.map((layer, i) => {
        const isTop = i === LAYERS.length - 1
        return (
          <div
            key={i}
            className="absolute transition-all duration-300 ease-out"
            style={{
              transform: `translate(${layer.tx}px, ${layer.ty}px) rotate(${layer.rot}deg)`,
              zIndex: i,
              ...(isTop
                ? {
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 4px 16px rgba(44,44,44,0.12))',
                  }
                : {
                    filter: 'drop-shadow(0 2px 8px rgba(44,44,44,0.06))',
                  }),
            }}
          >
            <div
              className={isTop ? 'transition-all duration-200 hover:-translate-y-1 hover:drop-shadow-lg active:scale-[0.98]' : ''}
              onClick={isTop ? onClick : undefined}
              role={isTop ? 'button' : undefined}
              tabIndex={isTop ? 0 : undefined}
              onKeyDown={isTop ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() } : undefined}
              aria-label={isTop ? `打开本周健康来信${score != null ? `，评分 ${score} 分` : ''}` : undefined}
            >
              <EnvelopeShape color={layer.color} />

              {/* Overlays on top envelope */}
              {isTop && (
                <>
                  {/* WeatherStamp — bottom-right corner */}
                  {weatherId && weatherLabel && (
                    <div className="absolute" style={{ right: 14, bottom: 22 }}>
                      <WeatherStamp weatherId={weatherId} label={weatherLabel} size="sm" />
                    </div>
                  )}

                  {/* PostmarkStamp — top-right area */}
                  <div className="absolute" style={{ right: 4, top: 8 }}>
                    <PostmarkStamp score={score} dateRange={dateRange} />
                  </div>

                  {/* Unread dot */}
                  {hasUnread && (
                    <div
                      className="absolute rounded-full bg-[var(--color-coral)]"
                      style={{ width: 10, height: 10, top: 10, right: 82 }}
                      aria-label="有未读来信"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
