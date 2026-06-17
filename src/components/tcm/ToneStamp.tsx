import type { WuyinToneId } from '../../types/tcm'

interface Props {
  toneId: WuyinToneId
  label: string
}

const TONE_STYLES: Record<WuyinToneId, { bg: string; border: string; color: string }> = {
  gong: { bg: '#F5F0E0', border: '#D4C88C', color: '#8B7D3C' },
  shang: { bg: '#F5F2F0', border: '#C8C0B8', color: '#8A7E6E' },
  jue: { bg: '#EAF0EB', border: '#A0C0A0', color: '#5C7A5C' },
  zhi: { bg: '#FDF0ED', border: '#DD7C64', color: '#C45A42' },
  yu: { bg: '#F0F0F5', border: '#8A8AA0', color: '#4A4A60' },
}

export function ToneStamp({ toneId, label }: Props) {
  const style = TONE_STYLES[toneId]
  return (
    <div
      className="inline-flex shrink-0 select-none items-center justify-center rounded-lg border-2 px-3 py-1.5 font-semibold"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.color,
        transform: 'rotate(-6deg)',
        fontSize: 22,
        lineHeight: 1,
        minWidth: 56,
        minHeight: 56,
        fontFamily: 'var(--font-accent)',
      }}
      title={label}
    >
      {label.slice(0, 2)}
    </div>
  )
}
