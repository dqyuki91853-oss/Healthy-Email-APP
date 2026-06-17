import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { GuofengInkWashBg } from '../components/tcm/dojo/GuofengInkWashBg'
import { WuyinPracticeSession } from '../components/tcm/dojo/WuyinPracticeSession'
import { ArrowLeft } from 'lucide-react'

export function WuyinPracticePage() {
  const wuyin = useAppStore((s) => s.wellness?.wuyin)

  return (
    <div className="wellness-dojo wellness-section-v3 dojo-practice-page mx-auto max-w-2xl rounded-3xl">
      <div className="wellness-dojo__inner">
        <GuofengInkWashBg toneId={wuyin?.toneId} />
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-[var(--tcm-muted)] hover:text-[var(--tcm-text)]"
            >
              <ArrowLeft size={16} />
              返回道场
            </Link>
          </div>
          <header className="mb-6 text-center">
            <p
              className="dojo-header-kicker text-xs tracking-[0.2em] text-[var(--tcm-amber)]"
              style={{ fontFamily: 'var(--tcm-font-serif)' }}
            >
              跟哼练习
            </p>
            <h1
              className="dojo-header-title mt-1 text-xl text-[var(--tcm-text)]"
              style={{ fontFamily: 'var(--tcm-font-serif)' }}
            >
              {wuyin ? `${wuyin.label} · 呼吸道场` : '五音练习'}
            </h1>
          </header>
          {wuyin ? (
            <WuyinPracticeSession prescription={wuyin} />
          ) : (
            <p className="tcm-glass rounded-2xl p-6 text-center text-sm text-[var(--tcm-muted)]">
              暂无处方，请先在首页记录身心状态。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
