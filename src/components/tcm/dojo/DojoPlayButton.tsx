import { Pause, Play } from 'lucide-react'

interface Props {
  playing: boolean
  disabled?: boolean
  onToggle: () => void
}

/** 国风圆形播放/暂停按钮 */
export function DojoPlayButton({ playing, disabled, onToggle }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`dojo-play-btn ${playing ? 'dojo-play-btn--playing' : ''}`}
      aria-label={playing ? '暂停' : '播放'}
      title={playing ? '暂停' : '播放'}
    >
      {playing ? <Pause size={16} strokeWidth={2.2} /> : <Play size={16} strokeWidth={2.2} className="ml-0.5" />}
    </button>
  )
}
