import { apiClient } from '@/lib/api/client'
import type { AiChatResponse, AiHistoryEntry, AiMessage } from '@adinsight/shared-types'

export const aiChatApi = {
  chat: (message: string, history?: AiMessage[]) =>
    apiClient.post<{ data: AiChatResponse }>('/ai/chat', { message, history }).then((r) => r.data.data),

  analyze: () =>
    apiClient.post<{ data: { analysis: string; historyId: string } }>('/ai/analyze').then((r) => r.data.data),

  getHistory: () =>
    apiClient.get<{ data: AiHistoryEntry[] }>('/ai/history').then((r) => r.data.data),
}
