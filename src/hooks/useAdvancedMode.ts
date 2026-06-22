import { useEffect, useState } from 'react'

const ADVANCED_MODE_KEY = 'subhealth_advanced_mode'
export const ADVANCED_MODE_EVENT = 'subhealth-advanced-mode-changed'

export function isAdvancedModeEnabled(): boolean {
  return localStorage.getItem(ADVANCED_MODE_KEY) === 'true'
}

export function setAdvancedModeEnabled(enabled: boolean): void {
  localStorage.setItem(ADVANCED_MODE_KEY, String(enabled))
  window.dispatchEvent(new Event(ADVANCED_MODE_EVENT))
}

export function useAdvancedMode(): boolean {
  const [enabled, setEnabled] = useState(isAdvancedModeEnabled)

  useEffect(() => {
    const refresh = () => setEnabled(isAdvancedModeEnabled())
    window.addEventListener(ADVANCED_MODE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(ADVANCED_MODE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return enabled
}
