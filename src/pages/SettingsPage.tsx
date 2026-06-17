import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { db } from '../db'
import { getFollowUpSettings } from '../services/followUpTracker'
import { isLlmAvailable } from '../config/llm'
import { parseAppleHealthZip } from '../lib/health-import/zipParser'
import { parseAppleHealthXml } from '../lib/health-import/xmlParser'
import { parseAppleHealthXmlStream } from '../lib/health-import/streamXmlParser'
import { parseHealthCsv } from '../lib/health-import/csvParser'
import { Sparkles, CheckCircle, Trash2, Upload, Download } from 'lucide-react'
import { buildSubhealthExport, parseSubhealthExport } from '../lib/dataSync'
import { getAllHistoryPatterns } from '../services/dietHistory'
import { isTauri } from '../lib/platform'
import {
  clearListeningReminderSuppress,
  getWuyinListeningPrefs,
  saveWuyinListeningPrefs,
  WUYIN_GATE_LEAD_DEFAULT_MIN,
} from '../lib/wuyinListeningPrefs'

const STREAMING_THRESHOLD = 50 * 1024 * 1024

function isJsonSyncFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith('.json') || file.type.includes('json')
}

export function SettingsPage() {
  const { profile, setProfile, watchRows, voiceLogs, clearAllData, importWatchData, importSyncedData } =
    useAppStore()
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importProgress, setImportProgress] = useState<number | null>(null)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [includeWatchOnSync, setIncludeWatchOnSync] = useState(false)
  const [followUpLimit, setFollowUpLimit] = useState(3)
  const [maxPerRound, setMaxPerRound] = useState(4)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7)
  const [learnThreshold, setLearnThreshold] = useState(3)
  const [skipCooldown, setSkipCooldown] = useState(60)
  const [doNotDisturb, setDoNotDisturb] = useState(false)
  const [llmKey, setLlmKey] = useState('')
  const [askedToday, setAskedToday] = useState(0)
  const [saved, setSaved] = useState(false)
  const [wuyinReminderEnabled, setWuyinReminderEnabled] = useState(true)
  const [wuyinGateLeadMin, setWuyinGateLeadMin] = useState(WUYIN_GATE_LEAD_DEFAULT_MIN)
  const [wuyinPrefsSaved, setWuyinPrefsSaved] = useState(false)

  useEffect(() => {
    getFollowUpSettings().then((s) => {
      setFollowUpLimit(s.followUpDailyLimit)
      setMaxPerRound(s.maxQuestionsPerRound)
      setConfidenceThreshold(s.confidenceThreshold)
      setLearnThreshold(s.learnThreshold)
      setSkipCooldown(s.skipCooldownMinutes)
      setDoNotDisturb(s.doNotDisturb)
      setLlmKey(s.llmApiKey ?? '')
      setAskedToday(s.followUpAskedToday)
    })
    const wuyinPrefs = getWuyinListeningPrefs()
    setWuyinReminderEnabled(wuyinPrefs.enabled)
    setWuyinGateLeadMin(wuyinPrefs.gateLeadMin)
  }, [])

  const saveWuyinPrefs = (patch: Parameters<typeof saveWuyinListeningPrefs>[0]) => {
    const next = saveWuyinListeningPrefs(patch)
    setWuyinReminderEnabled(next.enabled)
    setWuyinGateLeadMin(next.gateLeadMin)
    setWuyinPrefsSaved(true)
    window.setTimeout(() => setWuyinPrefsSaved(false), 2000)
  }

  const exportJson = async () => {
    const data = buildSubhealthExport({
      voiceLogs,
      watchRows,
      dietHistory: getAllHistoryPatterns(),
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subhealth-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSyncImport = async (file: File) => {
    setSyncLoading(true)
    setSyncError(null)
    setSyncStatus(null)
    try {
      const text = await file.text()
      const payload = parseSubhealthExport(JSON.parse(text))
      const result = await importSyncedData(payload, {
        includeWatchRows: includeWatchOnSync,
      })
      const total = result.voiceLogsAdded + result.voiceLogsUpdated
      const parts = [
        `饮食 ${total} 条（新增 ${result.voiceLogsAdded}，更新 ${result.voiceLogsUpdated}）`,
      ]
      if (result.watchRowsImported) parts.push(`健康数据 ${result.watchRowsImported} 天`)
      if (result.dietHistoryMerged) parts.push(`饮食习惯 ${result.dietHistoryMerged} 条`)
      setSyncStatus(`已同步：${parts.join('；')}`)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : '导入失败')
    } finally {
      setSyncLoading(false)
    }
  }

  const saveSettings = async () => {
    const existing = await getFollowUpSettings()
    await db.settings.put({
      ...existing,
      followUpDailyLimit: followUpLimit,
      maxQuestionsPerRound: maxPerRound,
      confidenceThreshold,
      learnThreshold,
      skipCooldownMinutes: skipCooldown,
      doNotDisturb,
      llmApiKey: llmKey || undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleHealthImport = async (file: File) => {
    if (isJsonSyncFile(file)) {
      setImportError(null)
      setImportStatus('检测到 JSON，已转为饮食记录同步…')
      await handleSyncImport(file)
      return
    }
    setImportLoading(true)
    setImportError(null)
    setImportStatus(null)
    setImportProgress(null)
    try {
      let rows
      if (file.name.endsWith('.zip')) {
        rows = await parseAppleHealthZip(file, setImportProgress)
        setImportStatus(`已解析 ZIP：${rows.length} 天数据`)
      } else if (file.name.endsWith('.xml') || file.name.endsWith('导出.xml')) {
        if (file.size > STREAMING_THRESHOLD) {
          const buffer = await file.arrayBuffer()
          rows = parseAppleHealthXmlStream(new Uint8Array(buffer), 8, setImportProgress)
        } else {
          const text = await file.text()
          rows = parseAppleHealthXml(text)
        }
        setImportStatus(`已解析 XML：${rows.length} 天数据`)
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text()
        rows = parseHealthCsv(text)
        setImportStatus(`已解析 CSV：${rows.length} 天数据`)
      } else {
        throw new Error('Apple Health 导入仅支持 .zip、.xml 或 .csv；饮食记录请导入 .json 文件')
      }
      setImportProgress(null)
      await importWatchData(rows)
    } catch (e) {
      setImportError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setImportLoading(false)
    }
  }

  const llmActive = isLlmAvailable(llmKey)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="设置" />

      <Card>
        <h3 className="mb-3 font-medium">个人资料</h3>
        <div className="grid gap-3">
          <label className="text-sm">
            性别
            <select
              value={profile.sex ?? ''}
              onChange={(e) => setProfile({ sex: e.target.value as 'male' | 'female' | 'other' })}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2"
            >
              <option value="">未设置</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </label>
          <label className="text-sm">
            年龄
            <input
              type="number"
              value={profile.age ?? ''}
              onChange={(e) => setProfile({ age: parseInt(e.target.value, 10) || undefined })}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2"
            />
          </label>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">智能追问与 LLM</h3>
          {llmActive ? (
            <span className="flex items-center gap-1 text-xs text-[var(--color-green)]">
              <Sparkles size={12} /> 已连接
            </span>
          ) : (
            <span className="text-xs text-[var(--color-muted)]">未配置</span>
          )}
        </div>
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          今日已追问 {askedToday}/{followUpLimit} 次。
        </p>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            每日追问上限
            <input type="number" min={0} max={10} value={followUpLimit}
              onChange={(e) => setFollowUpLimit(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2" />
          </label>
          <label className="text-sm">
            每轮最多题数
            <input type="number" min={1} max={6} value={maxPerRound}
              onChange={(e) => setMaxPerRound(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2" />
          </label>
          <label className="text-sm">
            置信度阈值
            <input type="number" min={0.5} max={0.95} step={0.05} value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2" />
          </label>
          <label className="text-sm">
            跳过冷却（分钟）
            <input type="number" min={0} max={240} value={skipCooldown}
              onChange={(e) => setSkipCooldown(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2" />
          </label>
        </div>
        <label className="block text-sm">
          LLM API Key（DeepSeek / OpenAI 兼容）
          <input type="password" value={llmKey}
            onChange={(e) => setLlmKey(e.target.value)}
            placeholder="sk-… 留空则使用 .env.local"
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2" />
        </label>
        <div className="mt-3">
          <Button onClick={saveSettings}>
            {saved && <CheckCircle size={14} />}
            保存设置
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">五音收工提醒</h3>
          {wuyinPrefsSaved && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-green)]">
              <CheckCircle size={12} /> 已保存
            </span>
          )}
        </div>
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          首页道场显示「收工聆听窗口」提示，结合个人作息与五音处方。App 打包后将支持系统本地通知。
        </p>
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">启用收工五音提醒</p>
            <p className="text-xs text-[var(--color-muted)]">关闭后不再显示聆听窗口条（已完成练习仍会提示）</p>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 rounded accent-[var(--color-teal)]"
            checked={wuyinReminderEnabled}
            onChange={(e) => saveWuyinPrefs({ enabled: e.target.checked })}
          />
        </label>
        <label className="mt-4 block text-sm">
          窗口提前量（分钟）
          <input
            type="number"
            min={0}
            max={60}
            value={wuyinGateLeadMin}
            onChange={(e) => setWuyinGateLeadMin(parseInt(e.target.value, 10) || 0)}
            onBlur={() => saveWuyinPrefs({ gateLeadMin: wuyinGateLeadMin })}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2"
          />
          <span className="mt-1 block text-[11px] text-[var(--color-muted)]">
            在 personalSleepGate 之前多少分钟开始高亮聆听窗口（默认 {WUYIN_GATE_LEAD_DEFAULT_MIN} 分钟）
          </span>
        </label>
        <button
          type="button"
          className="mt-3 text-xs text-[var(--color-muted)] underline hover:text-[var(--color-text)]"
          onClick={() => {
            clearListeningReminderSuppress()
            setWuyinPrefsSaved(true)
            window.setTimeout(() => setWuyinPrefsSaved(false), 2000)
          }}
        >
          清除「稍后 / 今日不再提醒」屏蔽
        </button>
      </Card>

      <Card>
        <h3 className="mb-3 font-medium">显示偏好</h3>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">高级健康数据</p>
            <p className="text-xs text-[var(--color-muted)]">显示 EvidenceBadge、ReliabilityBadge 等详细指标</p>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 rounded accent-[var(--color-teal)]"
            onChange={(e) => {
              localStorage.setItem('subhealth_advanced_mode', String(e.target.checked))
            }}
            defaultChecked={localStorage.getItem('subhealth_advanced_mode') === 'true'}
          />
        </label>
      </Card>

      <Card>
        <h3 className="mb-3 font-medium">数据同步（Web ↔ App）</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          {isTauri()
            ? '浏览器与 Mac App 数据不互通。请先在 Web 端导出 JSON，再在此导入饮食记录（文件扩展名 .json）。'
            : '导出后可在 Mac App 设置页导入；同一文件也可在浏览器间迁移。'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportJson}>
            <Download size={14} />
            导出 JSON
          </Button>
        </div>
        <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-teal)]/40 bg-[var(--color-teal)]/5 p-4 transition-colors hover:border-[var(--color-teal)]">
          <Upload size={24} className="text-[var(--color-teal)]" />
          <span className="text-sm font-medium">
            {syncLoading ? '导入中…' : '选择 .json 导入饮食记录'}
          </span>
          <span className="text-[11px] text-[var(--color-muted)]">
            subhealth-export-*.json
          </span>
          <input
            type="file"
            accept=".json,application/json,text/json"
            className="hidden"
            disabled={syncLoading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleSyncImport(file)
              e.target.value = ''
            }}
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={includeWatchOnSync}
            onChange={(e) => setIncludeWatchOnSync(e.target.checked)}
          />
          同时导入 Apple Watch 健康数据（watchRows）
        </label>
        {syncStatus && (
          <p className="mt-2 text-xs text-[var(--color-green)]">{syncStatus}</p>
        )}
        {syncError && <p className="mt-2 text-xs text-[var(--color-red)]">{syncError}</p>}
      </Card>

      <Card>
        <h3 className="mb-3 font-medium">Apple Health 导入</h3>
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          仅用于 iPhone「健康」导出的 .zip / export.xml / .csv。
          <strong className="font-medium text-[var(--color-text)]"> 不是</strong> 饮食 JSON 文件。
        </p>
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] p-6 transition-colors hover:border-[var(--color-teal)]">
          <Upload size={28} className="text-[var(--color-muted)]" />
          <span className="text-sm">
            {importLoading
              ? importProgress != null
                ? `解析中… ${importProgress}%`
                : '解析中…'
              : '选择 Health 导出文件'}
          </span>
          {importProgress != null && (
            <div className="h-1.5 w-40 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-border)]">
              <div
                className="h-full rounded-[var(--radius-pill)] bg-[var(--color-teal)] transition-all"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          )}
          <input
            type="file"
            accept=".zip,.xml,.csv,application/zip,text/xml,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleHealthImport(file)
              e.target.value = ''
            }}
          />
        </label>
        {importStatus && <p className="mt-2 text-xs text-[var(--color-green)]">{importStatus}</p>}
        {importError && <p className="mt-2 text-xs text-[var(--color-red)]">{importError}</p>}
      </Card>

      <Card>
        <h3 className="mb-3 font-medium text-[var(--color-red)]">清空数据</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          删除所有本地数据（健康数据、语音记录、预警、设置等），此操作不可撤销。
        </p>
        <Button
          variant="danger"
          onClick={() => {
            if (window.confirm('确认清空所有本地数据？此操作不可撤销。')) {
              clearAllData().then(() => {
                alert('数据已清空')
                window.location.reload()
              })
            }
          }}
        >
          <Trash2 size={14} />
          清空所有数据
        </Button>
      </Card>
    </div>
  )
}
