import type { BodySeasonId } from '../../types/bodySeason'
import type { DailyWatchRow } from '../../types/health'
import { computePlantVigor, PLANT_WHISPER, type PlantVigor } from '../../lib/bodyPlantState'

interface Props {
  seasonId?: BodySeasonId | null
  watchRows: DailyWatchRow[]
}

const SEASON_PALETTE: Record<
  BodySeasonId,
  { leaf: string; accent: string; stem: string; muted: string }
> = {
  spring: { leaf: '#A8D5BA', accent: '#F8B4C8', stem: '#63AD96', muted: '#8FBFA8' },
  summer: { leaf: '#6BAF4A', accent: '#EBC97F', stem: '#4A8F32', muted: '#8AAF72' },
  autumn: { leaf: '#D4A84B', accent: '#C89B6B', stem: '#8B6914', muted: '#B89860' },
  winter: { leaf: '#3D6B4F', accent: '#B0C4DE', stem: '#2F5240', muted: '#5A7A68' },
}

const VIGOR_MOD: Record<PlantVigor, { sat: number; droop: number; bloom: number }> = {
  vibrant: { sat: 1.15, droop: 0, bloom: 1 },
  growing: { sat: 1, droop: 0, bloom: 0.6 },
  okay: { sat: 0.85, droop: 4, bloom: 0.35 },
  wilted: { sat: 0.6, droop: 14, bloom: 0 },
  sleepy: { sat: 0.7, droop: 2, bloom: 0.15 },
}

function PlantSvg({ season, vigor }: { season: BodySeasonId; vigor: PlantVigor }) {
  const palette = SEASON_PALETTE[season]
  const mod = VIGOR_MOD[vigor]
  const leaf = palette.leaf
  const accent = palette.accent
  const stem = palette.stem
  const muted = palette.muted
  const droop = mod.droop

  return (
    <svg
      className="body-plant-garden__plant"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{
        filter: `saturate(${mod.sat})`,
        ['--plant-sway' as string]: vigor === 'wilted' ? '0deg' : '2.5deg',
      }}
    >
      {/* 土壤 */}
      <rect x="28" y="96" width="64" height="10" rx="4" fill="#6B4E3D" opacity="0.85" />
      {/* 花盆 */}
      <path
        d="M32 96h56l-6 14H38l-6-14Z"
        fill="var(--color-cream)"
        stroke="#A67C52"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M30 96h60" stroke="#A67C52" strokeWidth="1.6" strokeLinecap="round" />

      {season === 'spring' && (
        <g className="body-plant-garden__foliage" style={{ transform: `translateY(${droop}px)` }}>
          <path
            d="M60 94V58"
            stroke={stem}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M60 72c-14-4-20-12-18-22 4 8 10 14 18 16 8-2 14-8 18-16 2 10-4 18-18 22Z"
            fill={leaf}
            opacity="0.9"
          />
          <circle cx="48" cy="52" r="4" fill={accent} opacity={mod.bloom} />
          <circle cx="60" cy="46" r="4.5" fill={accent} opacity={mod.bloom * 0.9} />
          <circle cx="72" cy="53" r="3.5" fill={accent} opacity={mod.bloom * 0.8} />
        </g>
      )}

      {season === 'summer' && (
        <g className="body-plant-garden__foliage" style={{ transform: `translateY(${droop}px)` }}>
          <path d="M60 94V70" stroke={stem} strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="44" cy="78" rx="10" ry="6" fill={leaf} opacity="0.85" />
          <ellipse cx="76" cy="80" rx="9" ry="5.5" fill={leaf} opacity="0.8" />
          <circle
            cx="60"
            cy="52"
            r={vigor === 'sleepy' ? 14 : 18}
            fill={accent}
            opacity={vigor === 'wilted' ? 0.55 : 0.95}
          />
          <circle cx="60" cy="52" r="8" fill="#8B5A14" opacity={mod.bloom * 0.7} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180
            const inner = vigor === 'sleepy' ? 12 : 16
            const outer = vigor === 'sleepy' ? 16 : 22
            return (
              <line
                key={deg}
                x1={60 + Math.cos(rad) * inner}
                y1={52 + Math.sin(rad) * inner}
                x2={60 + Math.cos(rad) * outer}
                y2={52 + Math.sin(rad) * outer}
                stroke={leaf}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={mod.bloom}
              />
            )
          })}
        </g>
      )}

      {season === 'autumn' && (
        <g className="body-plant-garden__foliage" style={{ transform: `translateY(${droop}px)` }}>
          <path d="M60 94V62" stroke={stem} strokeWidth="2" strokeLinecap="round" />
          <path
            d="M48 70c6-8 12-12 12-18 0 6-4 12-12 16-8-4-12-10-12-16 0 6 6 10 12 18Z"
            fill={leaf}
            opacity="0.9"
          />
          <path
            d="M72 74c-5-7-9-11-9-16 0 5 3 10 9 13 6-3 9-8 9-13 0 5-4 9-9 16Z"
            fill={muted}
            opacity="0.85"
          />
          <ellipse cx="42" cy="88" rx="5" ry="3" fill={accent} opacity={0.5 + mod.bloom * 0.3} />
        </g>
      )}

      {season === 'winter' && (
        <g className="body-plant-garden__foliage" style={{ transform: `translateY(${droop}px)` }}>
          <path d="M60 94V48" stroke={stem} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M60 58 L48 72 L60 66 L72 72 Z" fill={leaf} opacity="0.9" />
          <path d="M60 68 L46 84 L60 78 L74 84 Z" fill={muted} opacity="0.85" />
          <path d="M60 78 L50 92 L60 88 L70 92 Z" fill={leaf} opacity="0.8" />
          {vigor !== 'wilted' && (
            <>
              <circle cx="38" cy="44" r="1.8" fill={accent} opacity={0.7} />
              <circle cx="82" cy="50" r="1.4" fill={accent} opacity={0.55} />
              <circle cx="70" cy="38" r="1.2" fill={accent} opacity={0.45} />
            </>
          )}
        </g>
      )}
    </svg>
  )
}

export function BodyPlantGarden({ seasonId, watchRows }: Props) {
  const season = seasonId ?? 'spring'
  const vigor = computePlantVigor(watchRows)
  const whisper = PLANT_WHISPER[vigor]

  return (
    <section
      className={`body-plant-garden body-plant-garden--${vigor}`}
      aria-labelledby="body-plant-title"
    >
      <header className="body-plant-garden__header">
        <p className="body-plant-garden__kicker">小植园</p>
      </header>

      <div className="body-plant-garden__body">
        <PlantSvg season={season} vigor={vigor} />
      </div>

      <p id="body-plant-title" className="body-plant-garden__whisper">
        {whisper}
      </p>
    </section>
  )
}
