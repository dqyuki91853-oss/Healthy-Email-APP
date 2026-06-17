import { useState, useEffect, useRef } from 'react'
import type { BodyWeatherId } from '../../types/bodyWeather'

interface Props {
  weatherId: BodyWeatherId
  /** If true, renders as decorative background (absolute positioned, no pointer events) */
  decorative?: boolean
}

/**
 * SVG weather scene with CSS animations — per DESIGN spec section 2.3.3.
 * Respects prefers-reduced-motion: all animations disabled.
 * Includes crossfade transitions when weather changes.
 */
export function BodyWeatherScene({ weatherId, decorative = false }: Props) {
  const [visible, setVisible] = useState(false)
  const prevRef = useRef<BodyWeatherId>(weatherId)

  // Trigger fade-in on mount or weather change
  useEffect(() => {
    if (prevRef.current !== weatherId) {
      setVisible(false)
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      prevRef.current = weatherId
      return () => cancelAnimationFrame(t)
    } else {
      setVisible(true)
    }
  }, [weatherId])

  const containerClass = decorative
    ? 'absolute inset-0 pointer-events-none overflow-hidden rounded-[var(--radius-lg)] opacity-20'
    : 'relative w-full h-32 overflow-hidden rounded-[var(--radius-md)]'

  return (
    <div
      className={containerClass}
      aria-hidden="true"
      style={{
        opacity: visible ? undefined : 0,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      <style>{animStyles}</style>
      <svg
        viewBox="0 0 400 128"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{
          animation: visible ? 'wsSceneEnter 0.5s ease-out' : undefined,
        }}
      >
        {weatherId === 'sunny' && <SunnyScene />}
        {weatherId === 'partly_cloudy' && <PartlyCloudyScene />}
        {weatherId === 'overcast' && <OvercastScene />}
        {weatherId === 'rainy' && <RainyScene />}
        {weatherId === 'foggy' && <FoggyScene />}
        {weatherId === 'rainbow' && <RainbowScene />}
      </svg>
    </div>
  )
}

/* ──────────────── Sunny: glow pulse + horizontal light beams ──────────────── */
function SunnyScene() {
  return (
    <>
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#63AD96" stopOpacity={0.4} />
          <stop offset="45%" stopColor="#63AD96" stopOpacity={0.1} />
          <stop offset="100%" stopColor="#63AD96" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="skyGradSun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDFBF7" stopOpacity={1} />
          <stop offset="100%" stopColor="#FAF8F2" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect width="400" height="128" fill="url(#skyGradSun)" />
      {/* Glow circle — pulsing */}
      <circle cx="200" cy="50" r="75" fill="url(#sunGlow)" className="ws-sun-glow" />
      {/* Sun body */}
      <circle cx="200" cy="48" r="18" fill="#63AD96" opacity={0.85} />
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x2 = 200 + Math.cos(rad) * 32
        const y2 = 48 + Math.sin(rad) * 32
        return (
          <line
            key={angle}
            x1={200 + Math.cos(rad) * 22}
            y1={48 + Math.sin(rad) * 22}
            x2={x2}
            y2={y2}
            stroke="#63AD96"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.5}
            className="ws-sun-ray"
            style={{ animationDelay: `${angle * 15}ms` }}
          />
        )
      })}
      {/* Horizontal light beams — slow drift */}
      <line
        x1={0} y1={24} x2={120} y2={24}
        stroke="#63AD96" strokeWidth={1.5} opacity={0.12} strokeLinecap="round"
        className="ws-light-beam-1"
      />
      <line
        x1={260} y1={80} x2={400} y2={80}
        stroke="#63AD96" strokeWidth={1.5} opacity={0.1} strokeLinecap="round"
        className="ws-light-beam-2"
      />
    </>
  )
}

/* ──────────────── Partly Cloudy: drifting clouds + sky gradient ──────────────── */
function PartlyCloudyScene() {
  return (
    <>
      <defs>
        <linearGradient id="skyGradPc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8F4EB" stopOpacity={1} />
          <stop offset="100%" stopColor="#EDE8DE" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect width="400" height="128" fill="url(#skyGradPc)" />
      {/* Sun (smaller, peeking) */}
      <circle cx="85" cy="35" r="15" fill="#EBC97F" opacity={0.7} className="ws-sun-pc" />
      <circle cx="85" cy="35" r="22" fill="#EBC97F" opacity={0.12} className="ws-sun-pc-glow" />
      {/* Drifting clouds */}
      <g className="ws-cloud-drift-1" opacity={0.55}>
        <CloudShape cx={260} cy={48} scale={1.05} color="#C8C0B4" />
      </g>
      <g className="ws-cloud-drift-2" opacity={0.35}>
        <CloudShape cx={170} cy={72} scale={0.75} color="#D4CCC0" />
      </g>
      <g className="ws-cloud-drift-3" opacity={0.25}>
        <CloudShape cx={320} cy={82} scale={0.6} color="#DDD4C8" />
      </g>
    </>
  )
}

/* ──────────────── Overcast: static cloud layers + muted sky ──────────────── */
function OvercastScene() {
  return (
    <>
      <defs>
        <linearGradient id="skyGradOc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8E4DE" stopOpacity={1} />
          <stop offset="100%" stopColor="#E0DCD4" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect width="400" height="128" fill="url(#skyGradOc)" />
      <g opacity={0.55} className="ws-overcast-drift-1">
        <CloudShape cx={120} cy={38} scale={1.15} color="#8A8A8A" />
      </g>
      <g opacity={0.4} className="ws-overcast-drift-2">
        <CloudShape cx={280} cy={60} scale={0.95} color="#9A9A9A" />
      </g>
      <g opacity={0.28} className="ws-overcast-drift-3">
        <CloudShape cx={200} cy={92} scale={1.35} color="#A8A8A8" />
      </g>
      <g opacity={0.18} className="ws-overcast-drift-4">
        <CloudShape cx={60} cy={78} scale={0.65} color="#B0B0B0" />
      </g>
    </>
  )
}

/* ──────────────── Rainy: 5 rain layers + dark sky gradient ──────────────── */
function RainyScene() {
  return (
    <>
      <defs>
        <linearGradient id="skyGradRain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D8D4CC" stopOpacity={1} />
          <stop offset="100%" stopColor="#E8E4DE" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect width="400" height="128" fill="url(#skyGradRain)" />
      {/* Rain clouds — two layers */}
      <g opacity={0.6}>
        <CloudShape cx={140} cy={28} scale={1.1} color="#6B8CAE" />
      </g>
      <g opacity={0.45}>
        <CloudShape cx={280} cy={34} scale={0.95} color="#6B8CAE" />
      </g>
      {/* Rain layer 1 — fastest, dense */}
      {[30, 70, 110, 150, 190, 230, 270, 310, 350, 390].map((x) => (
        <line
          key={`r1-${x}`}
          x1={x} y1={48} x2={x - 6} y2={74}
          stroke="#6B8CAE" strokeWidth={0.9} opacity={0.32}
          className="ws-rain-1"
          style={{ animationDelay: `${(x * 7) % 500}ms` }}
        />
      ))}
      {/* Rain layer 2 — fast-medium */}
      {[45, 95, 135, 175, 215, 265, 305, 345, 385].map((x) => (
        <line
          key={`r2-${x}`}
          x1={x} y1={44} x2={x - 6} y2={70}
          stroke="#6B8CAE" strokeWidth={0.9} opacity={0.25}
          className="ws-rain-2"
          style={{ animationDelay: `${(x * 13) % 700}ms` }}
        />
      ))}
      {/* Rain layer 3 — medium */}
      {[55, 115, 165, 205, 245, 295, 335, 375].map((x) => (
        <line
          key={`r3-${x}`}
          x1={x} y1={46} x2={x - 6} y2={66}
          stroke="#6B8CAE" strokeWidth={0.8} opacity={0.22}
          className="ws-rain-3"
          style={{ animationDelay: `${(x * 11) % 900}ms` }}
        />
      ))}
      {/* Rain layer 4 — slow */}
      {[38, 98, 158, 218, 278, 338, 398].map((x) => (
        <line
          key={`r4-${x}`}
          x1={x} y1={42} x2={x - 4} y2={60}
          stroke="#6B8CAE" strokeWidth={0.7} opacity={0.18}
          className="ws-rain-4"
          style={{ animationDelay: `${(x * 17) % 1100}ms` }}
        />
      ))}
      {/* Rain layer 5 — slowest, thin */}
      {[25, 85, 145, 195, 255, 315, 365].map((x) => (
        <line
          key={`r5-${x}`}
          x1={x} y1={40} x2={x - 3} y2={56}
          stroke="#6B8CAE" strokeWidth={0.6} opacity={0.14}
          className="ws-rain-5"
          style={{ animationDelay: `${(x * 19) % 1300}ms` }}
        />
      ))}
    </>
  )
}

/* ──────────────── Foggy: opacity breathing + layered mist ──────────────── */
function FoggyScene() {
  return (
    <>
      <defs>
        <linearGradient id="skyGradFog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EEEAE4" stopOpacity={1} />
          <stop offset="100%" stopColor="#F2EFEA" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect width="400" height="128" fill="url(#skyGradFog)" />
      {/* Fog layers with breathing opacity + slow horizontal drift */}
      <g className="ws-fog-breathe ws-fog-drift-1">
        <ellipse cx="100" cy="68" rx="110" ry="24" fill="#B0A8A0" opacity={0.3} />
      </g>
      <g className="ws-fog-breathe ws-fog-drift-2" style={{ animationDelay: '1.2s' }}>
        <ellipse cx="280" cy="52" rx="100" ry="22" fill="#B0A8A0" opacity={0.22} />
      </g>
      <g className="ws-fog-breathe ws-fog-drift-3" style={{ animationDelay: '2.1s' }}>
        <ellipse cx="200" cy="88" rx="140" ry="28" fill="#C0B8B0" opacity={0.16} />
      </g>
      <g className="ws-fog-breathe ws-fog-drift-1" style={{ animationDelay: '3.2s' }}>
        <ellipse cx="50" cy="90" rx="90" ry="18" fill="#BAB2AA" opacity={0.12} />
      </g>
    </>
  )
}

/* ──────────────── Rainbow: arc fade-in + residual drops + sun glow ──────────────── */
function RainbowScene() {
  const arcs = [
    { r: 55, color: '#DD7C64', delay: '0s' },
    { r: 49, color: '#EBC97F', delay: '0.12s' },
    { r: 43, color: '#F8E9BB', delay: '0.24s' },
    { r: 37, color: '#63AD96', delay: '0.36s' },
    { r: 31, color: '#6B8CAE', delay: '0.48s' },
    { r: 25, color: '#F1C6CD', delay: '0.6s' },
  ]

  // Residual rain droplets (post-rain sparkle)
  const drops = [
    { cx: 55, cy: 45, delay: '0.1s' },
    { cx: 85, cy: 55, delay: '0.3s' },
    { cx: 120, cy: 38, delay: '0.5s' },
    { cx: 145, cy: 50, delay: '0.7s' },
    { cx: 70, cy: 60, delay: '0.9s' },
    { cx: 105, cy: 42, delay: '1.1s' },
  ]

  return (
    <>
      <defs>
        <radialGradient id="rainbowGlow" cx="70%" cy="30%" r="45%">
          <stop offset="0%" stopColor="#EBC97F" stopOpacity={0.3} />
          <stop offset="60%" stopColor="#F8E9BB" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#FAF8F4" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="skyGradRb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6F2EC" stopOpacity={1} />
          <stop offset="100%" stopColor="#FAF8F4" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect width="400" height="128" fill="url(#skyGradRb)" />
      {/* Sun glow */}
      <circle cx="290" cy="25" r="40" fill="url(#rainbowGlow)" className="ws-rainbow-glow" />
      {/* Rainbow arcs */}
      <g transform="translate(100, 110)">
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={`M ${-arc.r} 0 A ${arc.r} ${arc.r} 0 0 1 ${arc.r} 0`}
            fill="none"
            stroke={arc.color}
            strokeWidth={4.5}
            strokeLinecap="round"
            opacity={0}
            className="ws-rainbow-arc"
            style={{ animationDelay: arc.delay }}
          />
        ))}
      </g>
      {/* Sun peeking */}
      <circle cx="290" cy="25" r="14" fill="#EBC97F" opacity={0.7} className="ws-rainbow-sun" />
      {/* Residual sparkle drops */}
      {drops.map((d, i) => (
        <circle
          key={`drop-${i}`}
          cx={d.cx} cy={d.cy} r={1.2}
          fill="#6B8CAE" opacity={0}
          className="ws-sparkle"
          style={{ animationDelay: d.delay }}
        />
      ))}
    </>
  )
}

/* ──────────────── Shared cloud shape ──────────────── */
function CloudShape({
  cx,
  cy,
  scale,
  color,
}: {
  cx: number
  cy: number
  scale: number
  color: string
}) {
  const s = scale
  return (
    <g transform={`translate(${cx - 30 * s}, ${cy - 12 * s}) scale(${s})`}>
      <ellipse cx={20} cy={18} rx={18} ry={12} fill={color} />
      <ellipse cx={40} cy={14} rx={16} ry={10} fill={color} />
      <ellipse cx={58} cy={18} rx={18} ry={12} fill={color} />
      <rect x={2} y={16} width={74} height={12} rx={4} fill={color} />
    </g>
  )
}

/* ──────────────── Animation keyframes ──────────────── */
const animStyles = `
/* Scene entry fade */
@keyframes wsSceneEnter {
  from { opacity: 0; transform: scale(0.98); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── Sunny ── */
.ws-sun-glow {
  animation: wsGlowPulse 3s ease-in-out infinite;
  transform-origin: 200px 50px;
}
.ws-sun-ray {
  animation: wsRayFade 2.5s ease-in-out infinite;
  transform-origin: 200px 48px;
}
.ws-light-beam-1 {
  animation: wsBeamDrift 6s ease-in-out infinite;
}
.ws-light-beam-2 {
  animation: wsBeamDrift 8s ease-in-out 2s infinite;
}

@keyframes wsGlowPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50%      { transform: scale(1.1); opacity: 1; }
}
@keyframes wsRayFade {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50%      { opacity: 0.65; transform: scale(1.06); }
}
@keyframes wsBeamDrift {
  0%, 100% { transform: translateX(0); opacity: 0.1; }
  50%      { transform: translateX(30px); opacity: 0.2; }
}

/* ── Partly Cloudy ── */
.ws-sun-pc {
  animation: wsSunPcPulse 4s ease-in-out infinite;
  transform-origin: 85px 35px;
}
.ws-sun-pc-glow {
  animation: wsSunPcGlow 4s ease-in-out infinite;
  transform-origin: 85px 35px;
}
.ws-cloud-drift-1 { animation: wsDrift 8s ease-in-out infinite; }
.ws-cloud-drift-2 { animation: wsDrift 13s ease-in-out infinite reverse; }
.ws-cloud-drift-3 { animation: wsDrift 18s ease-in-out infinite; }

@keyframes wsSunPcPulse {
  0%, 100% { opacity: 0.65; }
  50%      { opacity: 0.85; }
}
@keyframes wsSunPcGlow {
  0%, 100% { opacity: 0.1; transform: scale(1); }
  50%      { opacity: 0.2; transform: scale(1.15); }
}
@keyframes wsDrift {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(18px); }
}

/* ── Rainy ── */
.ws-rain-1 { animation: wsRainFall 0.5s linear infinite; }
.ws-rain-2 { animation: wsRainFall 0.65s linear infinite; }
.ws-rain-3 { animation: wsRainFall 0.85s linear infinite; }
.ws-rain-4 { animation: wsRainFall 1.1s linear infinite; }
.ws-rain-5 { animation: wsRainFall 1.4s linear infinite; }

@keyframes wsRainFall {
  0%   { transform: translateY(0); opacity: 0.32; }
  70%  { transform: translateY(38px); opacity: 0.12; }
  100% { transform: translateY(54px); opacity: 0; }
}

/* ── Foggy ── */
.ws-fog-breathe {
  animation: wsFogBreathe 5s ease-in-out infinite;
}
.ws-fog-drift-1 { animation: wsFogDrift 10s ease-in-out infinite; }
.ws-fog-drift-2 { animation: wsFogDrift 14s ease-in-out 3s infinite; }
.ws-fog-drift-3 { animation: wsFogDrift 18s ease-in-out 6s infinite; }

@keyframes wsFogBreathe {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 0.12; }
}
@keyframes wsFogDrift {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(12px); }
}

/* ── Overcast ── */
.ws-overcast-drift-1 { animation: wsOcDrift 20s ease-in-out infinite; }
.ws-overcast-drift-2 { animation: wsOcDrift 26s ease-in-out 3s infinite reverse; }
.ws-overcast-drift-3 { animation: wsOcDrift 32s ease-in-out 7s infinite; }
.ws-overcast-drift-4 { animation: wsOcDrift 24s ease-in-out 10s infinite reverse; }

@keyframes wsOcDrift {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(10px); }
}

/* ── Rainbow ── */
.ws-rainbow-arc {
  animation: wsArcFadeIn 1.2s ease-out forwards;
}
.ws-rainbow-sun {
  animation: wsFadeIn 1s ease-out 0.7s both;
}
.ws-rainbow-glow {
  animation: wsGlowPulse 3.5s ease-in-out 1.2s infinite;
}
.ws-sparkle {
  animation: wsSparkle 1.5s ease-out forwards;
}

@keyframes wsArcFadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 0.65; transform: translateY(0); }
}
@keyframes wsFadeIn {
  from { opacity: 0; }
  to   { opacity: 0.7; }
}
@keyframes wsSparkle {
  0%   { opacity: 0; transform: scale(0.5) translateY(0); }
  30%  { opacity: 0.5; transform: scale(1) translateY(-2px); }
  100% { opacity: 0; transform: scale(0.8) translateY(-6px); }
}

/* ── Accessibility ── */
@media (prefers-reduced-motion: reduce) {
  .ws-sun-glow, .ws-sun-ray, .ws-light-beam-1, .ws-light-beam-2,
  .ws-sun-pc, .ws-sun-pc-glow,
  .ws-cloud-drift-1, .ws-cloud-drift-2, .ws-cloud-drift-3,
  .ws-rain-1, .ws-rain-2, .ws-rain-3, .ws-rain-4, .ws-rain-5,
  .ws-fog-breathe, .ws-fog-drift-1, .ws-fog-drift-2, .ws-fog-drift-3,
  .ws-overcast-drift-1, .ws-overcast-drift-2, .ws-overcast-drift-3, .ws-overcast-drift-4,
  .ws-rainbow-arc, .ws-rainbow-sun, .ws-rainbow-glow, .ws-sparkle {
    animation: none !important;
  }
}
`
