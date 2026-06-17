import type { BodyWeatherId } from '../../types/bodyWeather'
import { Cloud, CloudRain, CloudSun, Rainbow, Sun, CloudFog } from 'lucide-react'

const WEATHER_ICONS: Record<BodyWeatherId, typeof Sun> = {
  sunny: Sun,
  partly_cloudy: CloudSun,
  overcast: Cloud,
  rainy: CloudRain,
  foggy: CloudFog,
  rainbow: Rainbow,
}

const STAMP_COLORS: Record<BodyWeatherId, string> = {
  sunny: '#63AD96',
  partly_cloudy: '#EBC97F',
  overcast: '#8A8A8A',
  rainy: '#6B8CAE',
  foggy: '#B0A8A0',
  rainbow: '#DD7C64',
}

interface Props {
  weatherId: BodyWeatherId
  label: string
  size?: 'sm' | 'md'
}

export function WeatherStamp({ weatherId, label, size = 'md' }: Props) {
  const Icon = WEATHER_ICONS[weatherId]
  const dim = size === 'sm' ? 48 : 64

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-2"
      style={{
        width: dim,
        height: dim,
        borderColor: STAMP_COLORS[weatherId],
        color: STAMP_COLORS[weatherId],
        transform: 'rotate(-8deg)',
      }}
      aria-label={`今日身体天气：${label}`}
    >
      <Icon size={size === 'sm' ? 18 : 22} strokeWidth={2} />
      <span className="mt-0.5 text-[10px] font-semibold leading-none">{label.slice(0, 2)}</span>
    </div>
  )
}
