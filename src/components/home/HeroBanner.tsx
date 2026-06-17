import { ScoreRing } from '../ui/ScoreRing'
import { Button } from '../ui/Button'
import type { BodyWeatherId } from '../../types/bodyWeather'

interface Props {
  score: number
  weatherLabel?: string
  weatherId?: BodyWeatherId | null
}

/** Weather-aware gradient tints */
function heroGradient(weatherId?: BodyWeatherId | null): string {
  switch (weatherId) {
    case 'rainy':
      return 'linear-gradient(135deg, #D8D4CC 0%, #C8C8C8 60%)'
    case 'overcast':
      return 'linear-gradient(135deg, #E8E4DE 0%, #D4D0C8 60%)'
    case 'foggy':
      return 'linear-gradient(135deg, #EEEAE4 0%, #E8E0D4 60%)'
    case 'rainbow':
      return 'linear-gradient(135deg, #FDF0E0 0%, #F8E9BB 60%)'
    case 'sunny':
      return 'linear-gradient(135deg, #FDFBF2 0%, #F8E9BB 60%)'
    default:
      return 'linear-gradient(135deg, #F8E9BB 0%, #EBC97F 60%)'
  }
}

export function HeroBanner({ score, weatherLabel, weatherId }: Props) {
  const handleScrollToLetter = () => {
    const el = document.getElementById('weekly-letter')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-6 rounded-[28px] p-8 transition-all duration-700"
      style={{
        background: heroGradient(weatherId),
        boxShadow: 'var(--shadow-card)',
        minHeight: 140,
      }}
    >
      {/* Left: greeting */}
      <div>
        <h2 className="text-[28px] font-bold leading-tight">欢迎回来</h2>
        <p className="mt-1 text-sm text-[#8A8A8A]">
          {weatherLabel ? `今天你的身体是${weatherLabel} · 本周来信已准备好` : '本周健康来信已准备好'}
        </p>
      </div>

      {/* Center: ScoreRing */}
      <div className="flex-shrink-0">
        <ScoreRing score={score} size={88} />
      </div>

      {/* Right: CTA */}
      <div className="flex-shrink-0">
        <Button onClick={handleScrollToLetter}>
          阅读本周来信
        </Button>
      </div>
    </div>
  )
}
