import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { useWuyinListeningWindow } from '../../hooks/useWuyinListeningWindow'
import { shouldShowListeningToast } from '../../engine/wuyinListeningWindow'
import { DojoListeningToast } from '../tcm/dojo/DojoListeningToast'

/** 首页顶部浮动 Toast — portal 到 body，避免被滚动容器裁切 */
export function DojoListeningToastHost() {
  const location = useLocation()
  const wellness = useAppStore((s) => s.wellness)
  const listeningWindow = useWuyinListeningWindow(wellness?.circadian, wellness?.wuyin)

  if (location.pathname !== '/') return null
  if (!listeningWindow || !shouldShowListeningToast(listeningWindow)) return null

  return createPortal(
    <DojoListeningToast window={listeningWindow} />,
    document.body,
  )
}
