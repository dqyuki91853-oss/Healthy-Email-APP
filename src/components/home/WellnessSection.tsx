import type { WuyinPrescription, PersonalCircadianPlan } from '../../types/tcm'
import { WuyinPanel } from '../tcm/WuyinPanel'
import { CircadianHintCard } from '../tcm/CircadianHintCard'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  wuyin?: WuyinPrescription | null
  circadian?: PersonalCircadianPlan | null
}

/**
 * v3 WellnessSection — humanistic daily practice card.
 *
 * Combines Wuyin audio/healing (primary, ~72%) and Circadian rhythm strip
 * (secondary, ~28%) into a single white card, matching the "Top Skills"
 * reference position in the bottom-left of the homepage.
 *
 * overflow-y: auto — content scrolls internally, never clips buttons.
 */
export function WellnessSection({ wuyin, circadian }: Props) {
  const moodTag = useAppStore((s) => s.wellness?.mood?.dominant)

  if (!wuyin && !circadian) return null

  return (
    <>
      <style>{wellnessStyles}</style>
      <div className="wellness-section-v3">
        {wuyin && (
          <div className="wuyin-panel-v3">
            <WuyinPanel prescription={wuyin} moodTag={moodTag} />
          </div>
        )}
        {circadian && (
          <div className="circadian-strip-v3">
            <CircadianHintCard plan={circadian} />
          </div>
        )}
      </div>
    </>
  )
}

/** Single white card: Wuyin (~72%) + Circadian strip (~28%) side-by-side.
 *  Wider Wuyin column gives audio carousel more breathing room. */
const wellnessStyles = `
.wellness-section-v3 {
  min-height: 200px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr minmax(140px, 28%);
  gap: 16px;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(44,44,44,0.06);
}

@media (max-width: 640px) {
  .wellness-section-v3 {
    grid-template-columns: 1fr;
    min-height: auto;
  }
}
`
