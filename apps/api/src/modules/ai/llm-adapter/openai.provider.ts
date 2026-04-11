import OpenAI from 'openai'
import type { LlmMessage, LlmChatOptions, LlmChatResult, ProviderConfig } from '../llm.types'

export async function listOpenAIModels(apiKey: string): Promise<{ id: string; name: string }[]> {
  const client = new OpenAI({ apiKey })
  const response = await client.models.list()
  return response.data
    .filter((m) => /^(gpt-|o1|o3|o4)/.test(m.id))
    .sort((a, b) => b.created - a.created)
    .map((m) => ({ id: m.id, name: m.id }))
}

// o-series reasoning models use max_completion_tokens and don't support system role
const isReasoningModel = (model: string) => /^o\d/.test(model)

export async function callOpenAI(
  config: ProviderConfig,
  messages: LlmMessage[],
  options: LlmChatOptions,
): Promise<LlmChatResult> {
  const client = new OpenAI({ apiKey: config.apiKey })
  const maxTokens = options.maxTokens ?? config.maxTokens
  const reasoning = isReasoningModel(config.model)

  const builtMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    // reasoning models don't support system role — prepend as user message instead
    ...(options.systemPrompt && !reasoning
      ? [{ role: 'system' as const, content: options.systemPrompt }]
      : options.systemPrompt && reasoning
        ? [{ role: 'user' as const, content: options.systemPrompt }, { role: 'assistant' as const, content: 'Entendido.' }]
        : []),
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  const response = await client.chat.completions.create({
    model: config.model,
    ...(reasoning ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
    messages: builtMessages,
  })

  const content = response.choices[0]?.message?.content ?? ''

  return {
    content,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    provider: 'openai',
    model: config.model,
  }
}
