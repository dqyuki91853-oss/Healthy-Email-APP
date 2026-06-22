import type { BodyWeatherId } from '../../types/bodyWeather'

export type WeatherIconSize = 32 | 48 | 64
export type WeatherIconVariant = 'mono' | 'duotone'

interface Props {
  weatherId: BodyWeatherId
  size?: WeatherIconSize
  variant?: WeatherIconVariant
  className?: string
  title?: string
}

const MONO: Record<BodyWeatherId, string> = {
  sunny: '#63AD96',
  partly_cloudy: '#8A8A8A',
  overcast: '#8A8A8A',
  rainy: '#6B8CAE',
  foggy: '#B0A8A0',
  rainbow: '#DD7C64',
}

const DUO: Record<BodyWeatherId, { primary: string; secondary: string }> = {
  sunny: { primary: '#EBC97F', secondary: '#63AD96' },
  partly_cloudy: { primary: '#EBC97F', secondary: '#C8C0B4' },
  overcast: { primary: '#9A9A9A', secondary: '#D0CCD0' },
  rainy: { primary: '#6B8CAE', secondary: '#8A8A8A' },
  foggy: { primary: '#B0A8A0', secondary: '#E8E4DE' },
  rainbow: { primary: '#63AD96', secondary: '#EBC97F' },
}

export function WeatherIcon({
  weatherId,
  size = 48,
  variant = 'duotone',
  className = '',
  title,
}: Props) {
  const colors = variant === 'mono'
    ? { primary: MONO[weatherId], secondary: MONO[weatherId] }
    : DUO[weatherId]

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
      {weatherId === 'sunny' && <SunnyIcon colors={colors} />}
      {weatherId === 'partly_cloudy' && <PartlyCloudyIcon colors={colors} />}
      {weatherId === 'overcast' && <OvercastIcon colors={colors} />}
      {weatherId === 'rainy' && <RainyIcon colors={colors} />}
      {weatherId === 'foggy' && <FoggyIcon colors={colors} />}
      {weatherId === 'rainbow' && <RainbowIcon colors={colors} />}
    </svg>
  )
}

type IconColors = { primary: string; secondary: string }

function SunnyIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      <circle cx="24" cy="24" r="9" fill={colors.primary} opacity={0.95} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 24 + Math.cos(rad) * 12
        const y1 = 24 + Math.sin(rad) * 12
        const x2 = 24 + Math.cos(rad) * 16
        const y2 = 24 + Math.sin(rad) * 16
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={colors.secondary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })}
    </>
  )
}

function CloudPath({ fill }: { fill: string }) {
  return (
    <path
      d="M14 28c0-4.4 3.6-8 8-8 1.2 0 2.3.3 3.3.8 1.2-2.8 3.9-4.8 7.1-4.8 4.2 0 7.6 3.4 7.6 7.6 0 .4 0 .8-.1 1.2 2.5.8 4.3 3.1 4.3 5.9 0 3.4-2.8 6.2-6.2 6.2H14c-3.3 0-6-2.7-6-6s2.7-6 6-6z"
      fill={fill}
    />
  )
}

function PartlyCloudyIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      <circle cx="16" cy="16" r="6" fill={colors.primary} />
      <CloudPath fill={colors.secondary} />
    </>
  )
}

function OvercastIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      <CloudPath fill={colors.secondary} />
      <path
        d="M10 34c0-3.3 2.7-6 6-6h16c3.3 0 6 2.7 6 6"
        fill={colors.primary}
        opacity={0.55}
        transform="translate(0, -4)"
      />
    </>
  )
}

function RainyIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      <CloudPath fill={colors.secondary} />
      {[18, 24, 30, 36].map((x) => (
        <line
          key={x}
          x1={x}
          y1={30}
          x2={x - 3}
          y2={38}
          stroke={colors.primary}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ))}
    </>
  )
}

function FoggyIcon({ colors }: { colors: IconColors }) {
  return (
    <>
      {[18, 24, 30].map((y, i) => (
        <ellipse
          key={y}
          cx="24"
          cy={y}
          rx={16 - i * 2}
          ry="3.5"
          fill={colors.primary}
          opacity={0.35 - i * 0.08}
        />
      ))}
      <ellipse cx="24" cy="34" rx="18" ry="4" fill={colors.secondary} opacity={0.5} />
    </>
  )
}

function RainbowIcon({ colors }: { colors: IconColors }) {
  const arcs = ['#DD7C64', '#EBC97F', '#63AD96', '#6B8CAE']
  return (
    <>
      <circle cx="34" cy="14" r="5" fill={colors.secondary} opacity={0.85} />
      {arcs.map((color, i) => (
        <path
          key={color}
          d={`M ${8 + i * 2} 30 A ${18 - i * 2} ${18 - i * 2} 0 0 1 ${40 - i * 2} 30`}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.85}
        />
      ))}
      <CloudPath fill={colors.primary} />
    </>
  )
}

/** All six weather ids for dev / Storybook grids */
export const WEATHER_ICON_IDS: BodyWeatherId[] = [
  'sunny',
  'partly_cloudy',
  'overcast',
  'rainy',
  'foggy',
  'rainbow',
]
