import { ScoreRing } from '../ui/ScoreRing'
import { EnvelopeOpen } from '../illustrations/EnvelopeOpen'
import { getDisplayWeeklyScore } from '../../lib/weeklyScore'
import type { WeeklyLetterData } from '../../services/weeklyLetter'
import type { BodyWeatherId } from '../../types/bodyWeather'
import { buildEnvelopeDecorCopy } from '../../lib/envelopeDecorCopy'

interface Props {
  letter: WeeklyLetterData | null
  loading: boolean
  stale: boolean
  weatherLabel?: string
  weatherId?: BodyWeatherId | null
  nickname?: string
  onOpenLetter: () => void
  /** Bento 主视觉 — 大信封区；bowl 例图左锚点 */
  hero?: boolean
  bowl?: boolean
  /** @deprecated 使用 hero */
  compact?: boolean
}

/**
 * 主页信封英雄区 — Bento 主视觉 + 玻璃信笺台。
 */
export function EnvelopeStage({
  letter,
  loading,
  stale,
  weatherLabel,
  weatherId,
  nickname,
  onOpenLetter,
  hero = false,
  bowl = false,
  compact = false,
}: Props) {
  const isHero = hero || compact
  const isBowl = bowl || hero
  const score = getDisplayWeeklyScore(letter)
  const decor = buildEnvelopeDecorCopy(weatherId, weatherLabel)
  const hasUnread = letter?.letter != null && !localStorage.getItem('subhealth_last_seen_letter_v3')
  const ringSize = hero ? 52 : isHero ? 48 : 56

  const stageClass = [
    'envelope-stage relative flex h-full min-h-0 flex-col overflow-visible transition-all duration-700',
    isBowl && 'envelope-stage--bowl',
    !isBowl && isHero && 'envelope-stage--hero items-center justify-center',
    !isBowl && !isHero && 'gap-6 p-6 items-center justify-center',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={stageClass}>
      <div className="envelope-stage__glow" aria-hidden />

      <div className={`envelope-stage__inner relative flex w-full flex-1 flex-col ${isBowl ? 'items-start' : 'items-center justify-center'}`}>
        {isBowl && (
          <div className="envelope-stage__bowl-header mb-2">
            <p className="envelope-stage__bowl-kicker text-[11px] font-semibold uppercase tracking-wide text-[var(--weather-leaf)]">
              本周健康来信
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-[var(--weather-text)]">你的花信</h2>
            <p className="mt-1 max-w-[280px] text-xs leading-snug text-[var(--weather-text-soft)]">
              {decor.paperSub}
            </p>
          </div>
        )}

        {hero && !bowl && (
          <div className="envelope-stage__badge mb-1">
            <span className="envelope-stage__badge-dot" aria-hidden />
            本周健康来信
          </div>
        )}

        {hero && !bowl && (
          <p className="envelope-stage__decor-line text-center text-[11px] leading-snug text-[var(--weather-text-soft)]">
            {decor.paperSub}
          </p>
        )}

        {!hero && !isHero && weatherLabel && (
          <p className="text-xs text-[var(--weather-text-soft)]">
            今天你的身体是{weatherLabel}
          </p>
        )}

        {hero && !bowl && weatherLabel && (
          <p className="envelope-stage__weather-hint text-xs text-[var(--weather-text-soft)]">
            今日身体 · {weatherLabel}
          </p>
        )}

        <div className="envelope-stage__figure transition-transform duration-300 ease-out hover:-translate-y-1.5">
          {loading && !letter?.letter ? (
            <div
              className="animate-pulse rounded-2xl bg-white/40 mx-auto"
              style={{ width: 'min(380px, 92%)', height: hero ? 220 : 200 }}
            />
          ) : (
            <EnvelopeOpen
              score={score}
              dateRange={letter?.dateRange}
              weatherId={weatherId}
              weatherLabel={weatherLabel}
              nickname={nickname}
              onClick={onOpenLetter}
              showPaper
              showBotanical
              className={isBowl ? 'envelope-open--hero envelope-open--bowl' : hero ? 'envelope-open--hero' : undefined}
            />
          )}
        </div>

        <div className={`flex items-center gap-3 ${isBowl ? 'mt-3 w-full' : hero ? 'mt-2' : isHero ? 'mt-1' : ''}`}>
          {loading && score == null ? (
            <div
              className="animate-pulse rounded-full border-[6px] border-white/50"
              style={{ width: ringSize, height: ringSize }}
            />
          ) : score != null ? (
            <ScoreRing score={score} size={ringSize} />
          ) : (
            <div
              className="flex items-center justify-center rounded-full border-[6px] border-white/50 text-base font-semibold text-[var(--weather-text-soft)]"
              style={{ width: ringSize, height: ringSize }}
            >
              —
            </div>
          )}

          <div className="text-left">
            {loading && !letter?.letter ? (
              <p className="text-xs text-[var(--weather-text-soft)] animate-pulse">正在准备来信…</p>
            ) : (
              <p
                className={`font-medium text-[var(--weather-leaf)] ${
                  hero ? 'text-sm' : isHero ? 'text-[11px]' : 'text-xs'
                }`}
              >
                {hero ? '轻触花信，展开本周来信' : isHero ? '点击展开来信' : '轻触信封阅读来信'}
              </p>
            )}
            {stale && (
              <p className="text-[11px] text-[var(--color-coral)]">数据已更新，可重新生成</p>
            )}
            {hasUnread && (
              <span className="inline-block mt-0.5 h-2 w-2 rounded-full bg-[var(--color-coral)]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
