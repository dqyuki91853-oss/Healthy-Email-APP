export interface SpeechResult {
  transcript: string
  confidence: number
}

export function isSpeechSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

export function createSpeechRecognizer(
  onResult: (text: string) => void,
  onEnd: () => void,
  lang = 'zh-CN',
): SpeechRecognition | null {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null

  const rec = new SR()
  rec.lang = lang
  rec.continuous = true
  rec.interimResults = true

  rec.onresult = (event: SpeechRecognitionEvent) => {
    let text = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      text += event.results[i][0].transcript
    }
    onResult(text)
  }
  rec.onend = onEnd
  rec.onerror = onEnd

  return rec
}

/** 单次语音输入，用于追问卡片快捷回答 */
export function startSpeechRecognition(
  onResult: (text: string) => void,
  onEnd: () => void,
  lang = 'zh-CN',
): SpeechRecognition | null {
  const rec = createSpeechRecognizer(onResult, onEnd, lang)
  rec?.start()
  return rec
}
