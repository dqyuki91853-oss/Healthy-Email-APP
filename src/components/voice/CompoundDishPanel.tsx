import type { SubFoodItem } from '../../types/voice'

interface Props {
  subItems: SubFoodItem[]
  pickGroups?: Array<{ label: string; items: SubFoodItem[] }>
  selected: string[]
  onToggle: (name: string) => void
}

export function CompoundDishPanel({ subItems, pickGroups, selected, onToggle }: Props) {
  const groups = pickGroups?.length
    ? pickGroups
    : [{ label: '可选子项', items: subItems }]

  if (!groups.some((g) => g.items.length)) return null

  return (
    <div className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
      <p className="mb-2 text-xs text-[var(--color-muted)]">
        从常见选品中勾选（数据来自复合菜分类库，可多选）
      </p>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-xs font-medium text-[var(--color-yellow)]/90">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const checked = selected.includes(item.name)
                return (
                  <label
                    key={`${group.label}-${item.name}`}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-[var(--color-surface-2)]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(item.name)}
                      className="rounded"
                    />
                    <span className="flex-1 text-sm">{item.name}</span>
                    {item.amountG != null && item.amountG > 0 && (
                      <span className="text-xs text-[var(--color-muted)]">≈{item.amountG}g</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
