import { useMemo, useRef, useState } from 'react'
import type { WuyinPrescription, PersonalCircadianPlan } from '../../types/tcm'
import type { MoodTag } from '../../types/mood'
import { WUYIN_PRESCRIPTION_RULES, WUYIN_TONES } from '../../config/wuyinToneMap'
import { recommendWuyinAudio, type WuyinAudioTrack } from '../../lib/wuyinAudioLibrary'
import { getWuyinContextLine } from '../../lib/wuyinContextLine'
import { getPracticeEntryHint } from '../../lib/wuyinPracticeStreak'
import { hapticPulse } from '../../lib/haptic'
import { useWuyinPracticeStats } from '../../hooks/useWuyinPracticeStats'
import { useWuyinListeningWindow } from '../../hooks/useWuyinListeningWindow'
import { useWuyinListeningPrefs } from '../../hooks/useWuyinListeningPrefs'
import { useAppStore } from '../../store/useAppStore'
import { WuyinToneSigil } from '../tcm/dojo/WuyinToneSigil'
import { MoodBubbleBar } from '../tcm/dojo/MoodBubbleBar'
import { WeatherSceneBg } from './WeatherSceneBg'
import { WuyinPrescriptionWaterfall } from '../tcm/dojo/WuyinPrescriptionWaterfall'
import { CircadianRiverStrip } from '../tcm/dojo/CircadianRiverStrip'
import { WuyinPracticeEntry } from '../tcm/dojo/WuyinPracticeEntry'
import { DojoBreathPhaseCue } from '../tcm/dojo/DojoBreathPhaseCue'
import { DojoWuyinDetails } from '../tcm/dojo/DojoWuyinDetails'

interface Props {
  wuyin?: WuyinPrescription | null
  circadian?: PersonalCircadianPlan | null
  /** bento 拆板：therapy | rhythm；默认 grid 双栏 */
  layout?: 'grid' | 'therapy' | 'rhythm'
  /** 三轨横向排列（首页 therapy） */
  tracksHorizontal?: boolean
}

function prescriptionForMood(base: WuyinPrescription, mood: MoodTag): WuyinPrescription {
  const rule = WUYIN_PRESCRIPTION_RULES.find((r) => r.moodTag === mood)
  if (!rule?.toneId) return base
  const tone = WUYIN_TONES[rule.toneId]
  return {
    ...base,
    toneId: rule.toneId,
    label: `${tone.label}音`,
    frequencyHz: tone.frequencyHz,
    durationSec: rule.durationSec || base.durationSec,
    humPattern: rule.humPattern,
    instructionText: rule.instructionText || base.instructionText,
    matchedRuleId: rule.ruleId,
  }
}

/**
 * 首页「今日音疗」— 五音 + 作息（天气视觉 Phase 2）
 */
export function WellnessDojo({ wuyin, circadian, layout = 'grid', tracksHorizontal = false }: Props) {
  const wellness = useAppStore((s) => s.wellness)
  const inferredMood = wellness?.mood?.dominant ?? null
  const watchRows = useAppStore((s) => s.watchRows)
  const [selectedMood, setSelectedMood] = useState<MoodTag | null>(null)
  const [wheelAnimating, setWheelAnimating] = useState(false)
  const [activeTrack, setActiveTrack] = useState<WuyinAudioTrack | null>(null)
  const practiceStats = useWuyinPracticeStats()
  const streakHint = getPracticeEntryHint(practiceStats)
  const waterfallRef = useRef<HTMLDivElement>(null)

  const effectiveMood = selectedMood ?? inferredMood ?? 'unknown'

  const displayPrescription = useMemo(() => {
    if (!wuyin) return null
    if (selectedMood) return prescriptionForMood(wuyin, selectedMood)
    return wuyin
  }, [wuyin, selectedMood])

  const listeningWindow = useWuyinListeningWindow(circadian, displayPrescription)
  const listeningPrefs = useWuyinListeningPrefs()

  const contextLine = useMemo(() => {
    if (!displayPrescription) return ''
    return getWuyinContextLine(
      displayPrescription,
      effectiveMood as Parameters<typeof getWuyinContextLine>[1],
      wellness?.bodyWeather ?? null,
    )
  }, [displayPrescription, effectiveMood, wellness?.bodyWeather])

  const tracks = useMemo(() => {
    if (!displayPrescription) return []
    return recommendWuyinAudio(displayPrescription, effectiveMood)
  }, [displayPrescription, effectiveMood])

  const handleMoodSelect = (mood: MoodTag) => {
    setSelectedMood(mood)
    setActiveTrack(null)
    setWheelAnimating(true)
    hapticPulse(10)
    window.setTimeout(() => setWheelAnimating(false), 1400)
  }

  const weatherId = wellness?.bodyWeather?.weatherId ?? 'partly_cloudy'

  if (!wuyin && !circadian) return null

  const showTherapyBoard =
    Boolean(displayPrescription) && (layout === 'grid' || layout === 'therapy')
  const showRhythmBoard =
    Boolean(circadian || displayPrescription) && (layout === 'grid' || layout === 'rhythm')
  const splitLayout = layout === 'grid' && showTherapyBoard && showRhythmBoard

  const therapyHorizontal = tracksHorizontal || layout === 'therapy'

  const therapyBoard =
    showTherapyBoard && displayPrescription ? (
      <div className="weather-dojo weather-dojo--therapy weather-chronicle">
        <div className="weather-dojo__bridge" aria-hidden />
        <div className="weather-dojo__inner">
          <WeatherSceneBg weatherId={weatherId} />

          <div
            className={`weather-dojo__content${
              therapyHorizontal ? ' weather-dojo__content--therapy-unified' : ''
            }`}
          >
            {therapyHorizontal ? (
              <section className="dojo-panel dojo-panel--therapy" aria-label="今日疗音">
                <header className="mb-3 text-left">
                  <p className="dojo-header-kicker text-sm font-medium tracking-[0.12em]">
                    今日疗音
                  </p>
                  {streakHint && (
                    <p className="dojo-streak-badge dojo-streak-badge--header mt-2 inline-block">
                      {streakHint}
                    </p>
                  )}
                </header>

                <div className="dojo-therapy-body">
                  <div className="dojo-therapy-body__left">
                    <div className="dojo-therapy-body__sigil mb-3">
                      <WuyinToneSigil
                        toneId={displayPrescription.toneId}
                        animating={wheelAnimating}
                        compact
                      />
                    </div>

                    <div className="mb-3 flex justify-center">
                      <DojoBreathPhaseCue pattern={displayPrescription.humPattern} active={false} />
                    </div>

                    <div className="mb-1">
                      <MoodBubbleBar
                        selected={selectedMood}
                        inferred={inferredMood}
                        onSelect={handleMoodSelect}
                        inline
                      />
                    </div>
                  </div>

                  <div className="dojo-therapy-body__right">
                    <WuyinPrescriptionWaterfall
                      tracks={tracks}
                      activeTrackId={activeTrack?.id ?? null}
                      onSelect={setActiveTrack}
                      orientation="bars"
                    />
                  </div>
                </div>

                <DojoWuyinDetails
                  prescription={displayPrescription}
                  contextLine={contextLine}
                  moodLabel={wellness?.mood?.gentleNote}
                  moodMetaphors={
                    wellness?.mood?.gentleNote ? [wellness.mood.gentleNote] : undefined
                  }
                />
              </section>
            ) : (
              <>
                <section className="dojo-panel dojo-panel--wheel" aria-label="五音轮盘与情绪">
                  <header className="mb-4 text-center">
                    <p className="dojo-header-kicker text-sm font-medium tracking-[0.12em]">
                      今日疗音
                    </p>
                    {streakHint && (
                      <p className="dojo-streak-badge dojo-streak-badge--header mt-2 inline-block">
                        {streakHint}
                      </p>
                    )}
                  </header>

                  <div className="mb-3">
                    <WuyinToneSigil toneId={displayPrescription.toneId} animating={wheelAnimating} />
                  </div>

                  <div className="mb-4 flex justify-center">
                    <DojoBreathPhaseCue pattern={displayPrescription.humPattern} active={false} />
                  </div>

                  <div className="mb-4">
                    <MoodBubbleBar
                      selected={selectedMood}
                      inferred={inferredMood}
                      onSelect={handleMoodSelect}
                    />
                  </div>

                  <DojoWuyinDetails
                    prescription={displayPrescription}
                    contextLine={contextLine}
                    moodLabel={wellness?.mood?.gentleNote}
                    moodMetaphors={
                      wellness?.mood?.gentleNote ? [wellness.mood.gentleNote] : undefined
                    }
                  />
                </section>

                <section
                  className="dojo-panel dojo-panel--tracks"
                  aria-label="今日处方三轨"
                  ref={waterfallRef}
                >
                  <WuyinPrescriptionWaterfall
                    tracks={tracks}
                    activeTrackId={activeTrack?.id ?? null}
                    onSelect={setActiveTrack}
                    orientation="vertical"
                  />
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    ) : null

  const rhythmBoard =
    showRhythmBoard ? (
      <div className="weather-dojo weather-dojo--rhythm weather-chronicle">
        <div className="weather-dojo__bridge" aria-hidden />
        <div className="weather-dojo__inner">
          <div className="weather-dojo__content">
            <header className="dojo-board-header mb-1 text-center">
              <p className="dojo-header-kicker text-sm font-medium tracking-[0.12em]">
                作息与练习
              </p>
              <h2 className="dojo-header-title mt-1 text-lg font-semibold">
                子午流注 · 跟哼
              </h2>
            </header>

            {circadian && (
              <section className="dojo-panel dojo-panel--circadian" aria-label="子午流注作息">
                <CircadianRiverStrip
                  plan={circadian}
                  watchRows={watchRows}
                  listeningWindow={listeningWindow}
                  gateLeadMin={listeningPrefs.gateLeadMin}
                />
              </section>
            )}

            {displayPrescription && (
              <section className="dojo-panel dojo-panel--practice" aria-label="跟哼练习">
                <WuyinPracticeEntry prescription={displayPrescription} />
                <p className="mt-3 text-[10px] leading-relaxed text-[var(--dojo-text-soft)]">
                  歌单 OpenLo-Fi（CC0）；跟哼为五音参考频率。非医疗声波治疗。
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    ) : null

  if (layout === 'therapy') return therapyBoard
  if (layout === 'rhythm') return rhythmBoard

  return (
    <div
      className={`wellness-dojo-grid${splitLayout ? '' : ' wellness-dojo-grid--single'}`}
    >
      {therapyBoard}
      {rhythmBoard}
    </div>
  )
}
