import { WUYIN_AUDIO_DEFAULTS } from '../config/wuyinToneMap'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

export interface ToneSessionHandle {
  stop: () => void
}

// ── Simple reference tone (backward compat — hum practice etc.) ──

/** Play a single sine-wave reference tone. Used by WuyinSessionCard for hum practice. */
export async function playReferenceTone(
  frequencyHz: number,
  durationMs = 2000,
): Promise<ToneSessionHandle> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = WUYIN_AUDIO_DEFAULTS.waveform
  osc.frequency.value = frequencyHz

  const now = ctx.currentTime
  const fadeIn = WUYIN_AUDIO_DEFAULTS.fadeInMs / 1000
  const fadeOut = WUYIN_AUDIO_DEFAULTS.fadeOutMs / 1000
  const end = now + durationMs / 1000

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(WUYIN_AUDIO_DEFAULTS.volume, now + fadeIn)
  gain.gain.setValueAtTime(WUYIN_AUDIO_DEFAULTS.volume, end - fadeOut)
  gain.gain.linearRampToValueAtTime(0, end)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(end)

  const stop = () => {
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      osc.stop()
    } catch {
      /* already stopped */
    }
  }

  return { stop }
}

export async function playToneForDuration(
  frequencyHz: number,
  durationSec: number,
): Promise<ToneSessionHandle> {
  return playReferenceTone(frequencyHz, durationSec * 1000)
}

/** Phase 3 — 收功轻铃（五度上行） */
export async function playCompletionChime(): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()

  const now = ctx.currentTime
  const notes = [392, 523.25]
  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = notes[i]
    const t = now + i * 0.18
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.06, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.6)
  }
}


export interface WuyinTrackParams {
  frequencyHz: number
  durationSec: number
  category: 'ambient' | 'melody' | 'nature'
}

/**
 * Play a Wuyin audio track with category-specific sound design.
 *
 * - ambient: evolving pad — 5-oscillator harmonic stack with detuning,
 *   slow tremolo, and per-oscillator frequency drift. Warm, breathing texture.
 * - melody: pentatonic phrase — bell-like timbre (triangle wave fundamentals +
 *   harmonic overtones), note-by-note envelope. Distinct musical character.
 * - nature: filtered noise bed + subdued sine tone. Bandpass filter sweeps
 *   slowly across the frequency range. Organic, textured sound.
 */
export async function playWuyinTrack(
  track: WuyinTrackParams,
): Promise<ToneSessionHandle> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()

  const now = ctx.currentTime
  const duration = track.durationSec

  const allOscillators: OscillatorNode[] = []
  const allBuffers: AudioBufferSourceNode[] = []

  // Master gain with soft envelope
  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)

  const vol = 0.09
  const attack = Math.min(2.5, duration * 0.12)
  const release = Math.min(3.5, duration * 0.25)
  masterGain.gain.setValueAtTime(0, now)
  masterGain.gain.linearRampToValueAtTime(vol, now + attack)
  masterGain.gain.setValueAtTime(vol, now + duration - release)
  masterGain.gain.linearRampToValueAtTime(0, now + duration)

  if (track.category === 'ambient') {
    buildAmbient(ctx, masterGain, track.frequencyHz, duration, allOscillators)
  } else if (track.category === 'melody') {
    buildMelody(ctx, masterGain, track.frequencyHz, duration, allOscillators)
  } else {
    buildNature(ctx, masterGain, track.frequencyHz, duration, allOscillators, allBuffers)
  }

  const cleanup = () => {
    try {
      masterGain.gain.cancelScheduledValues(ctx.currentTime)
      masterGain.gain.setValueAtTime(0, ctx.currentTime)
    } catch { /* ignore */ }
    for (const osc of allOscillators) {
      try { osc.stop() } catch { /* already stopped */ }
    }
    for (const buf of allBuffers) {
      try { buf.stop() } catch { /* already stopped */ }
    }
  }

  return { stop: cleanup }
}

/** 环境 + 旋律双轨 Mix（Web Audio；mp3 由调用方双 Audio 处理） */
export async function playWuyinMix(
  ambient: WuyinTrackParams,
  melody: WuyinTrackParams,
  mixRatio: number,
): Promise<ToneSessionHandle & { setMix: (ratio: number) => void }> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()

  const now = ctx.currentTime
  const duration = Math.min(ambient.durationSec, melody.durationSec)
  const clampMix = (m: number) => Math.max(0, Math.min(1, m))
  let mix = clampMix(mixRatio)

  const masterGain = ctx.createGain()
  masterGain.connect(ctx.destination)

  const ambientBus = ctx.createGain()
  const melodyBus = ctx.createGain()
  ambientBus.connect(masterGain)
  melodyBus.connect(masterGain)

  const applyMix = (m: number) => {
    const vol = 0.09
    ambientBus.gain.setValueAtTime((1 - m) * vol, ctx.currentTime)
    melodyBus.gain.setValueAtTime(m * vol, ctx.currentTime)
  }
  applyMix(mix)

  const attack = Math.min(2.5, duration * 0.12)
  const release = Math.min(3.5, duration * 0.25)
  masterGain.gain.setValueAtTime(0, now)
  masterGain.gain.linearRampToValueAtTime(1, now + attack)
  masterGain.gain.setValueAtTime(1, now + duration - release)
  masterGain.gain.linearRampToValueAtTime(0, now + duration)

  const allOscillators: OscillatorNode[] = []
  const allBuffers: AudioBufferSourceNode[] = []

  buildAmbient(ctx, ambientBus, ambient.frequencyHz, duration, allOscillators)
  buildMelody(ctx, melodyBus, melody.frequencyHz, duration, allOscillators)

  const cleanup = () => {
    try {
      masterGain.gain.cancelScheduledValues(ctx.currentTime)
      masterGain.gain.setValueAtTime(0, ctx.currentTime)
    } catch { /* ignore */ }
    for (const osc of allOscillators) {
      try { osc.stop() } catch { /* already stopped */ }
    }
    for (const buf of allBuffers) {
      try { buf.stop() } catch { /* already stopped */ }
    }
  }

  return {
    stop: cleanup,
    setMix: (m: number) => {
      mix = clampMix(m)
      applyMix(mix)
    },
  }
}

// ── Soundscape builders ──

/**
 * Ambient pad: 5 sine layers with harmonic intervals, detuning, slow tremolo,
 * and per-oscillator frequency drift. Creates a warm, breathing texture.
 */
function buildAmbient(
  ctx: AudioContext,
  dest: GainNode,
  baseFreq: number,
  duration: number,
  oscillators: OscillatorNode[],
) {
  const now = ctx.currentTime

  // Summing node — all tone layers feed into this
  const toneSum = ctx.createGain()
  toneSum.gain.value = 0.55
  toneSum.connect(dest)

  // Tremolo LFO — modulates toneSum.gain for a breathing effect
  const lfo = ctx.createOscillator()
  const lfoDepth = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.value = 0.1 // very slow, ~10s cycle
  lfoDepth.gain.value = 0.2 // ±20% amplitude modulation
  lfo.connect(lfoDepth)
  lfoDepth.connect(toneSum.gain)
  lfo.start(now)
  lfo.stop(now + duration + 1)
  oscillators.push(lfo)

  // Harmonic layers: fundamental, detuned copy, fifth, octave, sub-octave
  const layers = [
    { freq: baseFreq,       gain: 0.40, detune: 0 },
    { freq: baseFreq,       gain: 0.28, detune: 7 },   // slightly detuned → chorus
    { freq: baseFreq * 1.5, gain: 0.12, detune: -5 },  // perfect fifth
    { freq: baseFreq * 2.0, gain: 0.07, detune: 3 },   // octave
    { freq: baseFreq * 0.5, gain: 0.05, detune: -2 },  // sub-octave warmth
  ]

  for (const layer of layers) {
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = layer.freq
    osc.detune.value = layer.detune
    oscGain.gain.value = layer.gain

    // Per-oscillator slow frequency drift — organic, non-static feel
    const driftLfo = ctx.createOscillator()
    const driftDepth = ctx.createGain()
    driftLfo.type = 'sine'
    driftLfo.frequency.value = 0.03 + Math.random() * 0.07 // 0.03–0.10 Hz
    driftDepth.gain.value = 2.5 // ±2.5 cents
    driftLfo.connect(driftDepth)
    driftDepth.connect(osc.frequency)
    driftLfo.start(now)
    driftLfo.stop(now + duration + 1)
    oscillators.push(driftLfo)

    osc.connect(oscGain)
    oscGain.connect(toneSum)
    osc.start(now)
    osc.stop(now + duration + 0.5)
    oscillators.push(osc)
  }
}

/**
 * Melody: pentatonic phrase with bell-like timbre.
 * Each note uses triangle-wave fundamentals + octave harmonics, with a
 * quick-attack/decay envelope for a plucked/bell quality.
 *
 * Pattern varies by baseFreq so different tracks play different sequences.
 */
function buildMelody(
  ctx: AudioContext,
  dest: GainNode,
  baseFreq: number,
  duration: number,
  oscillators: OscillatorNode[],
) {
  const now = ctx.currentTime

  // Chinese pentatonic scale ratios (宫商角徵羽)
  const scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2]

  // Pick a pattern based on the fundamental frequency — gives each
  // melody track a unique sequence while staying pentatonic.
  const seed = Math.round(baseFreq) % 5
  const patterns: number[][] = [
    [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 3, 4],           // rise-fall
    [3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0],           // fall-rise-fall
    [0, 2, 4, 3, 1, 0, 2, 4, 3, 1, 0],              // arpeggiated
    [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 3, 2, 1, 0],     // paired steps
    [4, 2, 0, 1, 3, 4, 2, 0, 1, 3, 4, 0],           // wide intervals
  ]
  const pattern = patterns[seed]
  const noteDuration = duration / pattern.length

  for (let i = 0; i < pattern.length; i++) {
    const noteStart = now + i * noteDuration
    // Leave a small gap between notes for articulation
    const noteEnd = noteStart + noteDuration * 0.88
    const freq = baseFreq * scale[pattern[i]]

    // Bell-like: fundamental (triangle) + octave + octave+5th
    const harmonics = [
      { freq,          gain: 0.35, detune: 0 },
      { freq: freq * 2, gain: 0.14, detune: 3 },
      { freq: freq * 3, gain: 0.05, detune: -2 },
    ]

    for (const h of harmonics) {
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = 'triangle' // softer than sine, bell-like
      osc.frequency.value = h.freq
      osc.detune.value = h.detune

      // Note envelope: fast attack, gentle decay (plucked/bell)
      const noteAttack = 0.015
      const noteHold = noteDuration * 0.25
      oscGain.gain.setValueAtTime(0, noteStart)
      oscGain.gain.linearRampToValueAtTime(h.gain, noteStart + noteAttack)
      oscGain.gain.setValueAtTime(h.gain, noteStart + noteHold)
      oscGain.gain.linearRampToValueAtTime(0.001, noteStart + noteDuration * 0.8)

      osc.connect(oscGain)
      oscGain.connect(dest)
      osc.start(noteStart)
      osc.stop(noteEnd + 0.1)
      oscillators.push(osc)
    }
  }
}

/**
 * Nature: filtered brown-noise bed with a subdued sine tone.
 * A bandpass filter sweeps slowly across the frequency range,
 * mimicking natural soundscapes (wind / water / rustling).
 */
function buildNature(
  ctx: AudioContext,
  dest: GainNode,
  baseFreq: number,
  duration: number,
  oscillators: OscillatorNode[],
  bufferSources: AudioBufferSourceNode[],
) {
  const now = ctx.currentTime

  // ── 1. Filtered noise bed (main texture) ──
  const noiseBuffer = createNoiseBuffer(ctx, duration)
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer
  noise.loop = false

  // Bandpass filter — sweeps from low to high and back
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = baseFreq * 1.2
  filter.Q.value = 0.4 // wide, gentle band

  // Slow sweep
  const sweepStart = baseFreq * 0.7
  const sweepMid = baseFreq * 2.5
  const sweepEnd = baseFreq * 1.1
  filter.frequency.setValueAtTime(sweepStart, now)
  filter.frequency.linearRampToValueAtTime(sweepMid, now + duration * 0.45)
  filter.frequency.linearRampToValueAtTime(sweepEnd, now + duration)

  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.22

  noise.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(dest)
  noise.start(now)
  noise.stop(now + duration + 0.5)
  bufferSources.push(noise)

  // ── 2. Quiet underlying tone ──
  const tone = ctx.createOscillator()
  const toneGain = ctx.createGain()
  tone.type = 'sine'
  tone.frequency.value = baseFreq
  toneGain.gain.value = 0.06

  // Irregular amplitude wobble (sawtooth LFO for asymmetric feel)
  const lfo = ctx.createOscillator()
  const lfoDepth = ctx.createGain()
  lfo.type = 'sawtooth'
  lfo.frequency.value = 0.07
  lfoDepth.gain.value = 0.025
  lfo.connect(lfoDepth)
  lfoDepth.connect(toneGain.gain)
  lfo.start(now)
  lfo.stop(now + duration + 1)
  oscillators.push(lfo)

  tone.connect(toneGain)
  toneGain.connect(dest)
  tone.start(now)
  tone.stop(now + duration + 0.5)
  oscillators.push(tone)
}

// ── Noise buffer generator ──

/** Generate a brown-ish noise buffer (integrated white noise → deeper, more natural sound). */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.ceil(sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  let last = 0
  for (let i = 0; i < length; i++) {
    // Brown noise: integrate white noise samples → -6dB/octave rolloff
    last = last + (Math.random() * 2 - 1) * 0.02
    // Soft clamp to prevent runaway
    if (last > 1) last = 0.95
    if (last < -1) last = -0.95
    data[i] = last * 0.7
  }
  return buffer
}
