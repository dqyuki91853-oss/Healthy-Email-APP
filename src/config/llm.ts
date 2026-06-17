export interface LlmConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export function getDefaultLlmConfig(): LlmConfig {
  return {
    apiKey: import.meta.env.VITE_LLM_API_KEY ?? '',
    baseUrl: (import.meta.env.VITE_LLM_API_BASE ?? 'https://api.deepseek.com/v1').replace(/\/$/, ''),
    model: import.meta.env.VITE_LLM_MODEL ?? 'deepseek-chat',
  }
}

export function resolveLlmConfig(storedKey?: string): LlmConfig | null {
  const defaults = getDefaultLlmConfig()
  const apiKey = (storedKey?.trim() || defaults.apiKey.trim())
  if (!apiKey) return null
  return { ...defaults, apiKey }
}

export function isLlmAvailable(storedKey?: string): boolean {
  return resolveLlmConfig(storedKey) !== null
}
