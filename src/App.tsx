import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { PrivacyBanner } from './components/layout/PrivacyBanner'
import { useAppStore } from './store/useAppStore'
import { resetListeningReminderOnPageLoad } from './lib/wuyinListeningPrefs'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { UploadPage } from './pages/UploadPage'
import { VoiceLogPage } from './pages/VoiceLogPage'
import { DietPage } from './pages/DietPage'
import { SleepPage } from './pages/SleepPage'
import { HeartPage } from './pages/HeartPage'
import { MetabolicPage } from './pages/MetabolicPage'
import { MentalPage } from './pages/MentalPage'
import { WomenPage } from './pages/WomenPage'
import { AlertsPage } from './pages/AlertsPage'
import { SettingsPage } from './pages/SettingsPage'
import { WuyinPracticePage } from './pages/WuyinPracticePage'
import { ChroniclePage } from './pages/ChroniclePage'
import { CollectionPage } from './pages/CollectionPage'
import { SeasonsPage } from './pages/SeasonsPage'
import { BloodPressurePage } from './pages/BloodPressurePage'

export default function App() {
  const loadData = useAppStore((s) => s.loadData)
  const loading = useAppStore((s) => s.loading)

  useEffect(() => {
    resetListeningReminderOnPageLoad()
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-muted)]">
        加载本地数据…
      </div>
    )
  }

  return (
    <BrowserRouter>
      <PrivacyBanner />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="voice-log" element={<VoiceLogPage />} />
          <Route path="diet" element={<DietPage />} />
          <Route path="sleep" element={<SleepPage />} />
          <Route path="heart" element={<HeartPage />} />
          <Route path="metabolic" element={<MetabolicPage />} />
          <Route path="mental" element={<MentalPage />} />
          <Route path="women" element={<WomenPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="collection" element={<CollectionPage />} />
          <Route path="chronicle" element={<Navigate to="/collection" replace />} />
          <Route path="chronicle-old" element={<ChroniclePage />} />
          <Route path="seasons" element={<SeasonsPage />} />
          <Route path="blood-pressure" element={<BloodPressurePage />} />
          <Route path="glucose" element={<Navigate to="/blood-pressure" replace />} />
          <Route path="practice/wuyin" element={<WuyinPracticePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
