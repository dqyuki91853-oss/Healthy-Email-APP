import type { CaseFile, CaseFileStatus } from '../types/caseFile'

const STORAGE_KEY = 'subhealth_case_files'

export function loadCaseFiles(): CaseFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CaseFile[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCaseFiles(cases: CaseFile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
}

export function updateCaseFileStatus(id: string, status: CaseFileStatus): CaseFile[] {
  const next = loadCaseFiles().map((c) => (c.id === id ? { ...c, status } : c))
  saveCaseFiles(next)
  return next
}

export function visibleCaseFiles(cases: CaseFile[]): CaseFile[] {
  return cases.filter((c) => c.status !== 'dismissed')
}

export function latestOpenCase(cases: CaseFile[]): CaseFile | null {
  return (
    visibleCaseFiles(cases)
      .filter((c) => c.status === 'open' || c.status === 'testing')
      .sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))[0] ?? null
  )
}
