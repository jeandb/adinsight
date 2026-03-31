import OpenAI from 'openai'
import type { LlmMessage, LlmChatOptions, LlmChatResult, ProviderConfig } from '../llm.types'

export async function callOpenAI(
  config: ProviderConfig,
  messages: LlmMessage[],
  options: LlmChatOptions,
): Promise<LlmChatResult> {
  const client = new OpenAI({ apiKey: config.apiKey })

  const response = await client.chat.completions.create({
    model: config.model,
    max_tokens: options.maxTokens ?? config.maxTokens,
    messages: [
      ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
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
