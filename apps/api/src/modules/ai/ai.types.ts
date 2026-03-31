export interface AiProviderRow {
  id: string
  name: string
  provider: string
  model: string
  api_key_encrypted: string
  max_tokens: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface AiScenarioRow {
  scenario: string
  provider_id: string | null
  provider_name: string | null
}

export interface AiHistoryRow {
  id: string
  scenario: string
  provider: string
  model: string
  messages: Array<{ role: string; content: string }>
  tokens_input: number | null
  tokens_output: number | null
  created_at: Date
}

export interface SaveHistoryInput {
  userId: string | null
  scenario: string
  provider: string
  model: string
  messages: Array<{ role: string; content: string }>
  contextSnapshot?: unknown
  tokensInput?: number
  tokensOutput?: number
}
