import type { WuyinPrescription } from '../../types/tcm'

interface Props {
  prescription: WuyinPrescription
  moodLabel?: string
  contextLine?: string
  moodMetaphors?: string[]
  theme?: 'default' | 'dojo'
}

/** Step-by-step instruction for hum pattern */
function humSteps(pattern: string): string[] {
  switch (pattern) {
    case 'inhale-hum-exhale-4-6-6':
    default:
      return ['① 用鼻子缓缓吸气（约 4 秒）', '② 闭上嘴，轻轻哼（约 6 秒）', '③ 用嘴慢慢呼气（约 6 秒）', '重复 3–4 轮，约 60 秒']
    case 'long-exhale-hum':
      return ['① 轻轻吸气', '② 跟着音高哼，不追求大声', '③ 让呼气自然拉长，像叹气']
    case 'low-sustained-hum':
      return ['① 慢吸气到底', '② 低低地哼，保持稳定的音', '③ 缓缓收尾']
    case 'short-hum-6-rounds':
      return ['① 快速吸一口气', '② 短哼一声（像嗯↗）', '③ 放松呼出', '重复 6 轮']
  }
}

const FIVE_ELEMENT: Record<string, { element: string; meaning: string }> = {
  gong: { element: '土', meaning: '思、虑 → 宫音稳和中正' },
  shang: { element: '金', meaning: '悲、忧 → 商音清肃收敛' },
  jue: { element: '木', meaning: '怒、急 → 角音舒展条达' },
  zhi: { element: '火', meaning: '喜、躁 → 徵音通明升散' },
  yu: { element: '水', meaning: '恐、惊 → 羽音沉静收藏' },
}

export function WuyinExpandPanel({ prescription, moodLabel, contextLine, moodMetaphors, theme = 'default' }: Props) {
  const fe = FIVE_ELEMENT[prescription.toneId] ?? { element: '—', meaning: '' }
  const isDojo = theme === 'dojo'
  const muted = isDojo ? 'text-[var(--tcm-muted)]' : 'text-[var(--color-muted)]'
  const text = isDojo ? 'text-[var(--tcm-text)]' : ''
  const border = isDojo ? 'border-[var(--tcm-border)]' : 'border-[var(--color-border)]'
  const badge = isDojo ? 'bg-[var(--tcm-surface-2)] text-[var(--tcm-muted)]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'

  return (
    <div className={`space-y-4 ${isDojo ? '' : 'mt-4 border-t pt-4'} ${border}`}>
      {/* Why this tone */}
      {contextLine && (
        <div>
          <p className={`text-xs font-medium ${muted}`}>为什么推荐这音</p>
          <p className={`mt-1 text-sm ${text}`}>{contextLine}</p>
        </div>
      )}

      {/* Mood label (white-listed, no medical terms) */}
      {moodLabel && (
        <div>
          <p className={`text-xs font-medium ${muted}`}>情绪感知</p>
          <p className={`mt-1 text-sm ${text}`}>今天身体呈现：{moodLabel}</p>
        </div>
      )}

      {/* Mood inference metaphors */}
      {moodMetaphors && moodMetaphors.length > 0 && (
        <div>
          <p className={`text-xs font-medium ${muted}`}>今天怎么推断的</p>
          <ul className="mt-1 space-y-0.5">
            {moodMetaphors.map((m, i) => (
              <li key={i} className={`text-sm ${muted}`}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Five element context */}
      <div>
        <p className={`text-xs font-medium ${muted}`}>五行参考</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-xs ${badge}`}>{fe.element}</span>
          <span className={`text-sm ${muted}`}>{fe.meaning}</span>
        </div>
      </div>

      {/* Step-by-step */}
      <div>
        <p className={`text-xs font-medium ${muted}`}>练习步骤</p>
        <ul className="mt-1 space-y-1">
          {humSteps(prescription.humPattern).map((step) => (
            <li key={step} className={`text-sm ${muted}`}>{step}</li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <p className={`text-[10px] leading-relaxed ${muted}`}>
        {prescription.disclaimer}
        {' · '}
        五音为传统文化参考，练习为哼唱+慢呼吸放松，非医疗谐振治疗。
      </p>
    </div>
  )
}
