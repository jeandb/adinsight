import { AppError } from '../../shared/middleware/error.middleware'
import { mask } from '../../shared/crypto'
import { aiRepository } from './ai.repository'
import { llmAdapter } from './llm-adapter/llm-adapter'
import { skillComposer } from './skill-composer/skill-composer'
import { intentDetector } from './intent-detector/intent-detector'
import { contextBuilder } from './context-builder/context-builder'
import type { AiMessage } from '@adinsight/shared-types'
import type { AiProviderRow } from './ai.types'

function sanitizeProvider(row: AiProviderRow | null) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    model: row.model,
    apiKeyMasked: mask(row.api_key_encrypted),
    maxTokens: row.max_tokens,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const aiService = {
  async listProviders() {
    const rows = await aiRepository.listProviders()
    return rows.map(sanitizeProvider)
  },

  async createProvider(input: {
    name: string
    provider: string
    model: string
    apiKey: string
    maxTokens?: number
  }) {
    const row = await aiRepository.createProvider({
      name: input.name,
      provider: input.provider,
      model: input.model,
      apiKey: input.apiKey,
      maxTokens: input.maxTokens ?? 4096,
    })
    return sanitizeProvider(row)
  },

  async updateProvider(
    id: string,
    input: { name?: string; model?: string; apiKey?: string; maxTokens?: number; isActive?: boolean },
  ) {
    const row = await aiRepository.updateProvider(id, input)
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Provider não encontrado')
    return sanitizeProvider(row)
  },

  async deleteProvider(id: string) {
    const row = await aiRepository.findProviderById(id)
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Provider não encontrado')
    await aiRepository.deleteProvider(id)
  },

  async listScenarios() {
    const rows = await aiRepository.listScenarios()
    return rows.map((r) => ({
      scenario: r.scenario,
      providerId: r.provider_id,
      providerName: r.provider_name,
    }))
  },

  async assignScenario(scenario: string, providerId: string | null) {
    await aiRepository.assignScenario(scenario, providerId)
    const rows = await aiRepository.listScenarios()
    return rows.map((r) => ({
      scenario: r.scenario,
      providerId: r.provider_id,
      providerName: r.provider_name,
    }))
  },

  async chat(userId: string, message: string, history: AiMessage[] = []) {
    const configured = await llmAdapter.isConfigured('chat')
    if (!configured) {
      throw new AppError(422, 'NO_PROVIDER', 'Nenhum modelo de IA configurado. Configure um provider em Admin → Modelos de IA.')
    }

    const skills = intentDetector.detectSkills(message)
    const systemPrompt = skillComposer.buildSystemPrompt(skills)

    // Only fetch and inject data context when the user asked something data-related
    const needsContext = intentDetector.hasDataIntent(message)
    const context = needsContext ? await contextBuilder.buildContext() : null

    const allMessages: AiMessage[] = [
      ...history,
      {
        role: 'user',
        content: needsContext && context && history.length === 0
          ? `${context}\n\n---\n\n${message}`
          : message,
      },
    ]

    const result = await llmAdapter.chat(allMessages, {
      scenario: 'chat',
      systemPrompt,
    })

    const fullMessages = [...allMessages, { role: 'assistant' as const, content: result.content }]

    const historyId = await aiRepository.saveHistory({
      userId,
      scenario: 'chat',
      provider: result.provider,
      model: result.model,
      messages: fullMessages,
      tokensInput: result.inputTokens,
      tokensOutput: result.outputTokens,
    })

    return {
      reply: result.content,
      historyId,
      tokensInput: result.inputTokens,
      tokensOutput: result.outputTokens,
    }
  },

  async analyze(userId: string) {
    const configured = await llmAdapter.isConfigured('on-demand')
    if (!configured) {
      throw new AppError(422, 'NO_PROVIDER', 'Nenhum modelo de IA configurado para análise.')
    }

    const allSkills = [
      'campaign-performance-analyst',
      'budget-optimizer',
      'period-comparator',
      'cross-data-analyst',
    ]
    const systemPrompt = skillComposer.buildSystemPrompt(allSkills)
    const context = await contextBuilder.buildContext()

    const messages: AiMessage[] = [{
      role: 'user',
      content: `${context}\n\n---\n\nFaça uma análise completa de performance das campanhas dos últimos 30 dias. Identifique destaques positivos, pontos de atenção e recomendações prioritárias.`,
    }]

    const result = await llmAdapter.chat(messages, {
      scenario: 'on-demand',
      systemPrompt,
    })

    const fullMessages = [...messages, { role: 'assistant' as const, content: result.content }]

    const historyId = await aiRepository.saveHistory({
      userId,
      scenario: 'on-demand',
      provider: result.provider,
      model: result.model,
      messages: fullMessages,
      tokensInput: result.inputTokens,
      tokensOutput: result.outputTokens,
    })

    return {
      analysis: result.content,
      historyId,
      tokensInput: result.inputTokens,
      tokensOutput: result.outputTokens,
    }
  },

  async getHistory(userId: string) {
    const rows = await aiRepository.listHistory(userId)
    return rows.map((r) => ({
      id: r.id,
      scenario: r.scenario,
      provider: r.provider,
      model: r.model,
      messages: r.messages,
      tokensInput: r.tokens_input,
      tokensOutput: r.tokens_output,
      createdAt: r.created_at,
    }))
  },
}
