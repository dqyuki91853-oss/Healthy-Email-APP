import { useState } from 'react'
import { TeaCollectionTab } from '../components/collection/TeaCollectionTab'
import { PlantJournalTab } from '../components/collection/PlantJournalTab'
import { LetterArchiveTab } from '../components/collection/LetterArchiveTab'

type CollectionTab = 'tea' | 'plant' | 'letter'

const TABS: { id: CollectionTab; label: string }[] = [
  { id: 'tea', label: '茶语' },
  { id: 'plant', label: '植物' },
  { id: 'letter', label: '来信' },
]

export function CollectionPage() {
  const [tab, setTab] = useState<CollectionTab>('tea')

  return (
    <div className="collection-page weather-chronicle page-enter mx-auto max-w-3xl">
      <header className="collection-page__header">
        <p className="collection-page__kicker">收集与解锁</p>
        <h1 className="collection-page__title">珍藏馆</h1>
        <p className="collection-page__subtitle">
          茶谱、植物图鉴与来信，都是身体陪你走过的痕迹。
        </p>
      </header>

      <div className="collection-tabs" role="tablist" aria-label="珍藏馆分类">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`collection-tabs__btn ${tab === id ? 'collection-tabs__btn--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="collection-page__panel" role="tabpanel">
        {tab === 'tea' && <TeaCollectionTab />}
        {tab === 'plant' && <PlantJournalTab />}
        {tab === 'letter' && <LetterArchiveTab />}
      </div>
    </div>
  )
}
