import type { BodySeasonId } from '../../types/bodySeason'

export type SeasonIconSize = 32 | 48 | 64

interface Props {
  seasonId: BodySeasonId
  size?: SeasonIconSize
  className?: string
  title?: string
}

const SEASON_COLORS: Record<BodySeasonId, { primary: string; secondary: string }> = {
  spring: { primary: '#63AD96', secondary: '#A8D5BA' },
  summer: { primary: '#EBC97F', secondary: '#F8E9BB' },
  autumn: { primary: '#C89B6B', secondary: '#DD7C64' },
  winter: { primary: '#6B8CAE', secondary: '#B0C4DE' },
}

export function SeasonIcon({
  seasonId,
  size = 48,
  className = '',
  title,
}: Props) {
  const colors = SEASON_COLORS[seasonId]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {seasonId === 'spring' && <SpringIcon colors={colors} />}
      {seasonId === 'summer' && <SummerIcon colors={colors} />}
      {seasonId === 'autumn' && <AutumnIcon colors={colors} />}
      {seasonId === 'winter' && <WinterIcon colors={colors} />}
    </svg>
  )
}

type IconColors = { primary: string; secondary: string }

function SpringIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      <path
        d="M24 38V22"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <path
        d="M24 28c-6-2-8-6-8-10 0 4 3 7 8 8 5-1 8-4 8-8 0 4-2 8-8 10z"
        fill={colors.secondary}
      />
      <circle cx="24" cy="18" r="3" fill={colors.primary} />
    </>
  )
}

function SummerIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      <circle cx="24" cy="22" r="8" fill={colors.primary} opacity={0.9} />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={24 + Math.cos(rad) * 11}
            y1={22 + Math.sin(rad) * 11}
            x2={24 + Math.cos(rad) * 15}
            y2={22 + Math.sin(rad) * 15}
            stroke={colors.secondary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })}
      <path
        d="M8 36c4-2 8-3 16-3s12 1 16 3"
        stroke={colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />
    </>
  )
}

function AutumnIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      <path
        d="M24 38V26"
        stroke={colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M16 30c2-4 5-6 8-8 3 2 6 4 8 8-3 1-6 1-8 0-2 1-5 1-8 0z"
        fill={colors.secondary}
        opacity={0.85}
      />
      <ellipse cx="14" cy="34" rx="4" ry="2.5" fill={colors.primary} opacity={0.7} />
      <ellipse cx="34" cy="36" rx="3.5" ry="2" fill={colors.primary} opacity={0.55} />
    </>
  )
}

function WinterIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      <path
        d="M10 34h28"
        stroke={colors.secondary}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d="M24 10v28M16 18l16 16M32 18L16 34"
        stroke={colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx="14" cy="12" r="1.5" fill={colors.secondary} />
      <circle cx="34" cy="14" r="1.2" fill={colors.secondary} opacity={0.8} />
    </>
  )
}

export const SEASON_ICON_IDS: BodySeasonId[] = ['spring', 'summer', 'autumn', 'winter']
