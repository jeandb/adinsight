export interface AiProvider {
  id: string
  name: string
  provider: 'anthropic' | 'openai' | 'gemini'
  model: string
  maxTokens: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AiScenarioAssignment {
  scenario: string
  providerId: string | null
  providerName: string | null
}

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiChatRequest {
  message: string
  history?: AiMessage[]
}

export interface AiChatResponse {
  reply: string
  historyId: string
  tokensInput: number
  tokensOutput: number
}

export interface AiHistoryEntry {
  id: string
  scenario: string
  provider: string
  model: string
  messages: AiMessage[]
  tokensInput: number | null
  tokensOutput: number | null
  createdAt: string
}
