export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDateZh(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
}

export function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

export function weekRange(anchor: string): string[] {
  const d = new Date(anchor + 'T12:00:00')
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    return x.toISOString().slice(0, 10)
  })
}

export function isInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

export function getRecordDate(log: { recordDate?: string; timestamp: string }): string {
  return log.recordDate ?? log.timestamp.slice(0, 10)
}
