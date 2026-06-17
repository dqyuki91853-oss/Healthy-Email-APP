/** Runtime helpers for Web vs Tauri desktop shell. */
import { isTauri as tauriRuntime } from '@tauri-apps/api/core'

export function isTauri(): boolean {
  return tauriRuntime()
}

export function isDesktopApp(): boolean {
  return isTauri()
}
