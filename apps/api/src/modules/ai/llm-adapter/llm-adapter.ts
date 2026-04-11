import { db } from '../../../shared/database/client'
import { decrypt } from '../../../shared/crypto'
import { callAnthropic, listAnthropicModels } from './anthropic.provider'
import { callOpenAI, listOpenAIModels } from './openai.provider'
import { callGemini, listGeminiModels } from './gemini.provider'
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
      case 'openai':
        return callOpenAI(config, messages, options)
      case 'gemini':
        return callGemini(config, messages, options)
      default:
        throw new Error(`Provider "${config.provider}" não implementado`)
    }
  },

  async isConfigured(scenario: string): Promise<boolean> {
    const config = await getProviderConfig(scenario)
    return config !== null
  },

  async listModels(providerId: string): Promise<{ id: string; name: string }[]> {
    const { rows } = await db.query<{ provider: string; api_key_encrypted: string }>(
      'SELECT provider, api_key_encrypted FROM ai_providers WHERE id = $1',
      [providerId],
    )
    if (!rows[0]) throw new Error('Provider não encontrado')
    const apiKey = decrypt(rows[0].api_key_encrypted)

    switch (rows[0].provider) {
      case 'anthropic': return listAnthropicModels(apiKey)
      case 'openai':    return listOpenAIModels(apiKey)
      case 'gemini':    return listGeminiModels(apiKey)
      default:          return []
    }
  },
}
