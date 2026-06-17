import { useAppStore } from '../../store/useAppStore'

export function PrivacyBanner() {
  const { privacyAccepted, setPrivacyAccepted } = useAppStore()

  if (privacyAccepted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-3 text-lg font-semibold">隐私与数据处理</h2>
        <ul className="mb-4 space-y-2 text-sm text-[var(--color-muted)]">
          <li>· 所有 Apple Watch 与健康记录默认存储在本地浏览器（IndexedDB），不上传服务器</li>
          <li>· 语音可使用 Web Speech API 本地转写，或您自行配置的云端 Whisper</li>
          <li>· LLM 仅处理脱敏后的饮食/情绪文本片段，不含完整录音</li>
          <li>· 支持导出 JSON/CSV；本应用不构成医学诊断</li>
        </ul>
        <button
          type="button"
          onClick={() => setPrivacyAccepted(true)}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          我已了解并同意
        </button>
      </div>
    </div>
  )
}
