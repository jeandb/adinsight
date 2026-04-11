import type { LlmMessage, LlmChatOptions, LlmChatResult, ProviderConfig } from '../llm.types'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export async function listGeminiModels(apiKey: string): Promise<{ id: string; name: string }[]> {
  const url = `${GEMINI_BASE}/models?key=${apiKey}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Gemini models API error: ${response.status}`)

  const data = await response.json() as {
    models?: { name: string; displayName: string; supportedGenerationMethods?: string[] }[]
  }

  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => ({ id: m.name.replace('models/', ''), name: m.displayName }))
}

// Gemini uses 'model' instead of 'assistant' for the AI turn role
function toGeminiRole(role: 'user' | 'assistant'): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user'
}

export async function callGemini(
  config: ProviderConfig,
  messages: LlmMessage[],
  options: LlmChatOptions,
): Promise<LlmChatResult> {
  const url = `${GEMINI_BASE}/models/${config.model}:generateContent?key=${config.apiKey}`

  const body = {
    // System prompt goes in systemInstruction, not in the contents array
    ...(options.systemPrompt
      ? { system_instruction: { parts: [{ text: options.systemPrompt }] } }
      : {}),
    contents: messages.map((m) => ({
      role: toGeminiRole(m.role),
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: options.maxTokens ?? config.maxTokens,
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  }

  const content = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('') ?? ''

  return {
    content,
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    provider: 'gemini',
    model: config.model,
  }
}
