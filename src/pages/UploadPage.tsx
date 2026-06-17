import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { parseAppleHealthZip } from '../lib/health-import/zipParser'
import { parseAppleHealthXml } from '../lib/health-import/xmlParser'
import { parseAppleHealthXmlStream } from '../lib/health-import/streamXmlParser'
import { parseHealthCsv } from '../lib/health-import/csvParser'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/layout/PageHeader'

const STREAMING_THRESHOLD = 50 * 1024 * 1024

export function UploadPage() {
  const importWatchData = useAppStore((s) => s.importWatchData)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    setError(null)
    setStatus(null)
    setProgress(null)
    try {
      let rows
      if (file.name.endsWith('.zip')) {
        rows = await parseAppleHealthZip(file, setProgress)
        setStatus(`已解析 ZIP：${rows.length} 天数据`)
      } else if (file.name.endsWith('.xml') || file.name.endsWith('导出.xml')) {
        if (file.size > STREAMING_THRESHOLD) {
          const buffer = await file.arrayBuffer()
          rows = parseAppleHealthXmlStream(new Uint8Array(buffer), 8, setProgress)
        } else {
          const text = await file.text()
          rows = parseAppleHealthXml(text)
        }
        setStatus(`已解析 XML：${rows.length} 天数据`)
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text()
        rows = parseHealthCsv(text)
        setStatus(`已解析 CSV：${rows.length} 天数据`)
      } else {
        throw new Error('支持 .zip（Apple Health 导出）、.xml 或 .csv')
      }
      setProgress(null)
      await importWatchData(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="数据导入" subtitle="支持 Apple Health 导出 ZIP、export.xml 或通用 CSV" />

      <Card variant="cream">
        <label className="flex cursor-pointer flex-col items-center gap-4 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] p-12 transition-colors hover:border-[var(--color-teal)]">
          <Upload size={40} className="text-[var(--color-muted)]" />
          <span className="text-sm font-medium">
            {loading
              ? progress != null
                ? `解析中… ${progress}%`
                : '解析中…'
              : '点击选择文件'}
          </span>
          {progress != null && (
            <div className="h-2 w-48 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-border)]">
              <div
                className="h-full rounded-[var(--radius-pill)] bg-[var(--color-teal)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <input
            type="file"
            accept=".zip,.xml,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </Card>

      {status && <p className="text-sm text-[var(--color-green)]">{status}</p>}
      {error && <p className="text-sm text-[var(--color-red)]">{error}</p>}

      <Card>
        <h3 className="mb-3 font-medium">数据清洗说明</h3>
        <ul className="space-y-1 text-sm text-[var(--color-muted)]">
          <li>· 静息心率：剔除 &lt;30 或 &gt;120 bpm 异常值</li>
          <li>· HRV：标记为 AW 短时程 PRV，非 24h SDNN</li>
          <li>· SpO₂：低氧区 (&lt;90%) 数据标记 AW 偏差风险</li>
          <li>· VO₂ max：标注系统性低估 4-8.5 mL/kg/min</li>
          <li>· 深睡：标注 AW 平均低估约 43 分钟</li>
        </ul>
      </Card>
    </div>
  )
}
