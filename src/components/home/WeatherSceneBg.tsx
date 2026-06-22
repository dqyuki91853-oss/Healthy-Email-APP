import type { BodyWeatherId } from '../../types/bodyWeather'
import { BodyWeatherScene } from '../bodyWeather/BodyWeatherScene'

interface Props {
  weatherId: BodyWeatherId
}

/**
 * Weather-themed dojo background — BodyWeatherScene + sky frost overlay.
 * Replaces GuofengInkWashBg on the homepage only; practice page keeps国风.
 */
export function WeatherSceneBg({ weatherId }: Props) {
  return (
    <div
      className="weather-scene-bg pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      aria-hidden
    >
      <div className="weather-scene-bg__scene">
        <BodyWeatherScene weatherId={weatherId} decorative />
      </div>
      <div className="weather-scene-bg__wash" />
      <div className="weather-scene-bg__frost" />
      <div className="weather-scene-bg__edge" />
    </div>
  )
}
