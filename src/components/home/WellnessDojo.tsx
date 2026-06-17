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
import { WuyinToneWheel } from '../tcm/dojo/WuyinToneWheel'
import { MoodBubbleBar } from '../tcm/dojo/MoodBubbleBar'
import { GuofengInkWashBg } from '../tcm/dojo/GuofengInkWashBg'
import { WuyinPrescriptionWaterfall } from '../tcm/dojo/WuyinPrescriptionWaterfall'
import { CircadianRiverStrip } from '../tcm/dojo/CircadianRiverStrip'
import { WuyinPracticeEntry } from '../tcm/dojo/WuyinPracticeEntry'
import { DojoBreathPhaseCue } from '../tcm/dojo/DojoBreathPhaseCue'
import { DojoWuyinDetails } from '../tcm/dojo/DojoWuyinDetails'
import { DojoListeningWindowStrip } from '../tcm/dojo/DojoListeningWindowStrip'

interface Props {
  wuyin?: WuyinPrescription | null
  circadian?: PersonalCircadianPlan | null
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
 * 东方禅意 × 数据疗愈「数字道场」
 * Phase 1–4 Web 预览版
 */
export function WellnessDojo({ wuyin, circadian }: Props) {
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

  if (!wuyin && !circadian) return null

  return (
    <div className="wellness-dojo wellness-section-v3">
      <div className="wellness-dojo__bridge" aria-hidden />
      <div className="wellness-dojo__inner">
        <GuofengInkWashBg toneId={displayPrescription?.toneId} />

        {displayPrescription && (
          <>
            <header className="relative z-10 mb-4 text-center">
              <p
                className="dojo-header-kicker text-sm tracking-[0.2em] text-[var(--tcm-amber)]"
                style={{ fontFamily: 'var(--tcm-font-serif)' }}
              >
                今日道场
              </p>
              <h2
                className="dojo-header-title mt-1 text-lg font-medium text-[var(--tcm-text)]"
                style={{ fontFamily: 'var(--tcm-font-serif)' }}
              >
                五音疗愈 · {displayPrescription.label}
              </h2>
              {streakHint && (
                <p className="dojo-streak-badge dojo-streak-badge--header mt-2 inline-block">
                  {streakHint}
                </p>
              )}
            </header>

            <div className="relative z-10 mb-3">
              <WuyinToneWheel toneId={displayPrescription.toneId} animating={wheelAnimating} />
            </div>

            <div className="relative z-10 mb-4 flex justify-center">
              <DojoBreathPhaseCue pattern={displayPrescription.humPattern} active={false} />
            </div>

            <div className="relative z-10 mb-5">
              <MoodBubbleBar
                selected={selectedMood}
                inferred={inferredMood}
                onSelect={handleMoodSelect}
              />
            </div>

            <div className="relative z-10 mb-4">
              <DojoWuyinDetails
                prescription={displayPrescription}
                contextLine={contextLine}
                moodLabel={wellness?.mood?.gentleNote}
                moodMetaphors={
                  wellness?.mood?.gentleNote ? [wellness.mood.gentleNote] : undefined
                }
              />
            </div>

            {listeningWindow && circadian && (
              <div className="relative z-10">
                <DojoListeningWindowStrip
                  window={listeningWindow}
                  prescription={displayPrescription}
                  onListen={() => waterfallRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
              </div>
            )}

            <div className="relative z-10 mb-4" ref={waterfallRef}>
              <WuyinPrescriptionWaterfall
                tracks={tracks}
                activeTrackId={activeTrack?.id ?? null}
                onSelect={setActiveTrack}
              />
            </div>

            <div className="relative z-10 mb-4">
              <WuyinPracticeEntry prescription={displayPrescription} />
            </div>

            <p className="relative z-10 text-[9px] leading-relaxed text-[var(--tcm-muted)]">
              歌单 OpenLo-Fi（CC0）；跟哼为五音参考频率。非医疗声波治疗。
            </p>
          </>
        )}

        {circadian && (
          <div className={`relative z-10 ${wuyin ? 'mt-5' : ''}`}>
            <CircadianRiverStrip
              plan={circadian}
              watchRows={watchRows}
              listeningWindow={listeningWindow}
              gateLeadMin={listeningPrefs.gateLeadMin}
            />
          </div>
        )}
      </div>
    </div>
  )
}
