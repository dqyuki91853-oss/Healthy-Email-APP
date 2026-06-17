import type { ReactNode } from 'react'

interface Props {
  /** Full-width top row — EnvelopeStage */
  hero: ReactNode
  /** Bottom row body — WellnessSection + WeeklyActivitySection in 55/45 grid */
  body: ReactNode
}

/**
 * v3 two-row dashboard layout.
 *
 * Desktop (≥1024px): hero full-width top + body 55/45 grid below,
 *   one screen, overflow hidden; only section interiors scroll.
 * Mobile (<1024px): single-column stack, full page scroll.
 */
export function HomeDashboard({ hero, body }: Props) {
  return (
    <>
      <style>{v3Styles}</style>
      <div className="home-v3">
        {/* Row 1: Hero — full width envelope stage */}
        <div className="row-hero">
          {hero}
        </div>

        {/* Row 2: Body — WellnessSection (55%) + WeeklyActivity (45%) */}
        <div className="row-body">
          {body}
        </div>
      </div>
    </>
  )
}

const v3Styles = `
.home-v3 {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 100px);
  overflow: hidden;
}

/* Full-width top hero row — EnvelopeStage lives here */
.row-hero {
  flex: 0 0 auto;
  min-height: min(300px, 38vh);
}

/* Bottom body row — 55/45 grid: 五音+作息 expanded, 本周活动 compact */
.row-body {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(320px, 55fr) minmax(260px, 45fr);
  gap: 16px;
}

.row-body > * {
  min-height: 0;
  overflow-y: auto;
}

@media (max-width: 1023px) {
  .home-v3 {
    height: auto;
    overflow: visible;
  }

  .row-hero {
    min-height: 240px;
  }

  .row-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: none;
  }
}
`
