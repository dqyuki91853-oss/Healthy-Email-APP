import type { ReactNode } from 'react'

interface Props {
  envelope: ReactNode
  weather?: ReactNode
  tea?: ReactNode
  plant?: ReactNode
  seasons?: ReactNode
  therapy?: ReactNode
  rhythm?: ReactNode
}

/**
 * 首页 — 例图果蔬碗布局：信封左上，天气/茶语/植物园/四季在右环绕；下方横向五音+作息。
 */
export function HomeDashboard({
  envelope,
  weather,
  tea,
  plant,
  seasons,
  therapy,
  rhythm,
}: Props) {
  return (
    <div className="home-studio">
      <section className="home-card home-studio__hero-card">
        <div className="home-studio__hero-layout">
          <div className="home-studio__hero-envelope">{envelope}</div>

          <div className="home-studio__hero-rail">
            {weather && (
              <section className="home-card home-card--weather-nested">{weather}</section>
            )}

            {(tea || plant || seasons) && (
              <div className="home-studio__hero-chronicle">
                {(tea || plant) && (
                  <div className="home-studio__hero-wellness">
                    {tea && (
                      <section className="home-card home-card--tea-nested">{tea}</section>
                    )}
                    {plant && (
                      <section className="home-card home-card--plant-nested">{plant}</section>
                    )}
                  </div>
                )}
                {seasons && (
                  <section className="home-card home-card--panel home-card--panel-nested">
                    {seasons}
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {(therapy || rhythm) && (
        <div className="home-studio__dojo-horizontal" id="wellness-dojo">
          {therapy && <div className="home-studio__dojo-therapy">{therapy}</div>}
          {rhythm && <div className="home-studio__dojo-rhythm">{rhythm}</div>}
        </div>
      )}
    </div>
  )
}
