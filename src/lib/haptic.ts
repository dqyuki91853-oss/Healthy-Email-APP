/** 轻触觉反馈 — 忽略不支持或用户禁用的情况 */
export function hapticPulse(ms = 6): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms)
  }
}
