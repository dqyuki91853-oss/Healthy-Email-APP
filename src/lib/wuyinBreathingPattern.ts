export type BreathPhaseId = 'inhale' | 'hum' | 'exhale'

export interface BreathPhaseStep {
  id: BreathPhaseId
  label: string
  durationMs: number
}

export interface BreathPhaseCycle {
  steps: BreathPhaseStep[]
  totalMs: number
}

export function humPatternToAnimClass(pattern: string): string {
  switch (pattern) {
    case 'short-hum-6-rounds':
      return 'wb-short-hum'
    case 'long-exhale-hum':
      return 'wb-long-exhale'
    case 'low-sustained-hum':
      return 'wb-low-sustain'
    default:
      return 'wb-inhale-hum-exhale'
  }
}

export function getBreathPhaseCycle(pattern: string): BreathPhaseCycle {
  switch (pattern) {
    case 'short-hum-6-rounds':
      return {
        totalMs: 4000,
        steps: [
          { id: 'inhale', label: '吸气', durationMs: 1480 },
          { id: 'hum', label: '哼', durationMs: 1000 },
          { id: 'exhale', label: '呼气', durationMs: 1520 },
        ],
      }
    case 'long-exhale-hum':
      return {
        totalMs: 16000,
        steps: [
          { id: 'inhale', label: '吸气', durationMs: 4000 },
          { id: 'hum', label: '长哼', durationMs: 5920 },
          { id: 'exhale', label: '缓呼', durationMs: 6080 },
        ],
      }
    case 'low-sustained-hum':
      return {
        totalMs: 18000,
        steps: [
          { id: 'inhale', label: '深吸', durationMs: 3960 },
          { id: 'hum', label: '低哼', durationMs: 10980 },
          { id: 'exhale', label: '延息', durationMs: 3060 },
        ],
      }
    default:
      return {
        totalMs: 16000,
        steps: [
          { id: 'inhale', label: '吸气', durationMs: 4000 },
          { id: 'hum', label: '哼', durationMs: 5920 },
          { id: 'exhale', label: '呼气', durationMs: 6080 },
        ],
      }
  }
}

export function humPatternPhaseHint(pattern: string): string {
  switch (pattern) {
    case 'short-hum-6-rounds':
      return '短哼 · 六息一轮'
    case 'long-exhale-hum':
      return '吸气 · 长哼 · 缓呼'
    case 'low-sustained-hum':
      return '深吸 · 低哼 · 延息'
    default:
      return '吸 4 · 哼 6 · 呼 6'
  }
}

export function getHumSteps(pattern: string): string[] {
  switch (pattern) {
    case 'long-exhale-hum':
      return ['① 轻轻吸气', '② 跟着音高哼，不追求大声', '③ 让呼气自然拉长，像叹气']
    case 'low-sustained-hum':
      return ['① 慢吸气到底', '② 低低地哼，保持稳定的音', '③ 缓缓收尾']
    case 'short-hum-6-rounds':
      return ['① 快速吸一口气', '② 短哼一声（像嗯↗）', '③ 放松呼出', '重复 6 轮']
    default:
      return ['① 用鼻子缓缓吸气（约 4 秒）', '② 闭上嘴，轻轻哼（约 6 秒）', '③ 用嘴慢慢呼气（约 6 秒）', '重复 3–4 轮']
  }
}
