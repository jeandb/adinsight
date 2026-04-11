import Anthropic from '@anthropic-ai/sdk'
import type { LlmMessage, LlmChatOptions, LlmChatResult, ProviderConfig } from '../llm.types'

export async function listAnthropicModels(apiKey: string): Promise<{ id: string; name: string }[]> {
  const client = new Anthropic({ apiKey })
  const response = await client.models.list({ limit: 50 })
  return response.data.map((m) => ({ id: m.id, name: m.display_name ?? m.id }))
}

export async function callAnthropic(
  config: ProviderConfig,
  messages: LlmMessage[],
  options: LlmChatOptions,
): Promise<LlmChatResult> {
  const client = new Anthropic({ apiKey: config.apiKey })

  const response = await client.messages.create({
    model: config.model,
    max_tokens: options.maxTokens ?? config.maxTokens,
    system: options.systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const content = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('')

  return {
    content,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    provider: 'anthropic',
    model: config.model,
  }
}
