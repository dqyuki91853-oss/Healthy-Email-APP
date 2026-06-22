import { useEffect } from 'react'
import type { BodySeasonId } from '../../types/bodySeason'
import type { BodyWeatherId } from '../../types/bodyWeather'
import { recommendTea, TEA_NATURE_LABEL } from '../../config/bodyTeaGuide'
import { unlockTea } from '../../lib/teaCollectionStore'

interface Props {
  weatherId?: BodyWeatherId | null
  seasonId?: BodySeasonId | null
}

const NATURE_LABEL = TEA_NATURE_LABEL

function TeaCupIcon() {
  return (
    <svg
      className="body-tea-card__cup"
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 22h32c2 0 4 2 4 4v10c0 8-6 14-14 14H22c-8 0-14-6-14-14V26c0-2 2-4 4-4Z"
        fill="var(--color-cream)"
        stroke="var(--color-teal)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M48 28h6c3 0 5 2 5 5s-2 5-5 5h-6"
        stroke="var(--color-teal)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <ellipse cx="28" cy="22" rx="14" ry="3" fill="rgba(99, 173, 150, 0.12)" />
      <path
        d="M20 18c2-4 6-6 8-6s6 2 8 6"
        stroke="var(--color-teal)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <g className="body-tea-card__steam">
        <path d="M24 10c0-3 2-5 2-8" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M32 8c0-4 2-6 2-9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M40 11c0-3 2-5 2-8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function BodyTeaCard({ weatherId, seasonId }: Props) {
  const tea = recommendTea(weatherId, seasonId)

  useEffect(() => {
    if (weatherId && seasonId) {
      unlockTea(weatherId, seasonId)
    }
  }, [weatherId, seasonId])

  return (
    <section
      className={`body-tea-card body-tea-card--${tea.nature}`}
      aria-labelledby="body-tea-title"
    >
      <header className="body-tea-card__header">
        <p className="body-tea-card__kicker">今日茶语</p>
      </header>

      <div className="body-tea-card__body">
        <div className="body-tea-card__visual">
          <TeaCupIcon />
          <span className="body-tea-card__leaf" aria-hidden>
            {tea.leaf}
          </span>
        </div>

        <h2 id="body-tea-title" className="body-tea-card__name">
          {tea.name}
        </h2>
        <p className="body-tea-card__whisper">{tea.whisper}</p>
      </div>

      <footer className="body-tea-card__footer">
        <span className="body-tea-card__nature">· {NATURE_LABEL[tea.nature]} ·</span>
      </footer>
    </section>
  )
}
