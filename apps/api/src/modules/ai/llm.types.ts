export interface LlmMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LlmChatOptions {
  scenario: 'chat' | 'daily-analysis' | 'on-demand'
  systemPrompt: string
  maxTokens?: number
}

export interface LlmChatResult {
  content: string
  inputTokens: number
  outputTokens: number
  provider: string
  model: string
}

export interface ProviderConfig {
  provider: 'anthropic' | 'openai' | 'gemini'
  model: string
  apiKey: string
  maxTokens: number
}
