interface Tab {
  key: string
  label: string
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export function PillTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="inline-flex rounded-[var(--radius-pill)] bg-[var(--color-surface-2)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-[var(--radius-pill)] px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
            active === tab.key
              ? 'bg-[var(--color-text)] text-white shadow-[var(--shadow-card)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
