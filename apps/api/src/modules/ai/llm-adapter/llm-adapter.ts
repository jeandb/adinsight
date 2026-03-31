import { db } from '../../../shared/database/client'
import { decrypt } from '../../../shared/crypto'
import { callAnthropic } from './anthropic.provider'
import type { LlmMessage, LlmChatOptions, LlmChatResult, ProviderConfig } from '../llm.types'

async function getProviderConfig(scenario: string): Promise<ProviderConfig | null> {
  const { rows } = await db.query<{
    provider: string
    model: string
    api_key_encrypted: string
    max_tokens: number
  }>(
    `SELECT ap.provider, ap.model, ap.api_key_encrypted, ap.max_tokens
     FROM ai_scenario_assignments sa
     JOIN ai_providers ap ON ap.id = sa.provider_id
     WHERE sa.scenario = $1 AND ap.is_active = TRUE`,
    [scenario],
  )

  if (!rows[0]) return null

  const row = rows[0]
  return {
    provider: row.provider as ProviderConfig['provider'],
    model: row.model,
    apiKey: decrypt(row.api_key_encrypted),
    maxTokens: row.max_tokens,
  }
}

export const llmAdapter = {
  async chat(
    messages: LlmMessage[],
    options: LlmChatOptions,
  ): Promise<LlmChatResult> {
    const config = await getProviderConfig(options.scenario)
    if (!config) {
      throw new Error(`Nenhum provider de IA configurado para o cenário "${options.scenario}"`)
    }

    switch (config.provider) {
      case 'anthropic':
        return callAnthropic(config, messages, options)
      default:
        throw new Error(`Provider "${config.provider}" não implementado`)
    }
  },

  async isConfigured(scenario: string): Promise<boolean> {
    const config = await getProviderConfig(scenario)
    return config !== null
  },
}
