import { useMemo, useState } from 'react'
import { VoiceRecorder } from '../components/voice/VoiceRecorder'
import { useAppStore } from '../store/useAppStore'
import { Card } from '../components/ui/Card'
import { DateTracker } from '../components/ui/DateTracker'
import { DietLogItem } from '../components/diet/DietLogItem'
import { getRecordDate, todayStr } from '../lib/dates'

export function VoiceLogPage() {
  const voiceLogs = useAppStore((s) => s.voiceLogs)
  const deleteVoiceLog = useAppStore((s) => s.deleteVoiceLog)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const markedDates = useMemo(
    () => new Set(voiceLogs.map((l) => getRecordDate(l))),
    [voiceLogs],
  )

  const dayLogs = useMemo(
    () => voiceLogs.filter((l) => getRecordDate(l) === selectedDate),
    [voiceLogs, selectedDate],
  )

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteVoiceLog(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">每日记录</h2>
        <p className="text-sm text-[var(--color-muted)]">
          口述饮食、情绪与症状。可选择日期补记，填错可在下方删除。
        </p>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-medium">记录日期</h3>
        <DateTracker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          markedDates={markedDates}
          showWeekStrip
        />
      </Card>

      <VoiceRecorder recordDateOverride={selectedDate} />

      <Card>
        <h3 className="mb-3 font-medium">
          {selectedDate === todayStr() ? '今日' : selectedDate} 记录
          <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">
            {dayLogs.length} 条
          </span>
        </h3>
        {dayLogs.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">该日暂无记录</p>
        ) : (
          <div className="space-y-3">
            {dayLogs.map((log) => (
              <DietLogItem
                key={log.id}
                log={log}
                onDelete={handleDelete}
                deleting={deletingId === log.id}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
