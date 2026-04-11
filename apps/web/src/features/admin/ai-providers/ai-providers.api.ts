import { apiClient } from '@/lib/api/client'
import type { AiProvider, AiScenarioAssignment } from '@adinsight/shared-types'

export const aiProvidersApi = {
  listProviders: () =>
    apiClient.get<{ data: AiProvider[] }>('/ai/providers').then((r) => r.data.data),

  createProvider: (input: {
    name: string
    provider: 'anthropic' | 'openai' | 'gemini'
    model: string
    apiKey: string
    maxTokens?: number
  }) =>
    apiClient.post<{ data: AiProvider }>('/ai/providers', input).then((r) => r.data.data),

  updateProvider: (id: string, input: Partial<{
    name: string
    model: string
    apiKey: string
    maxTokens: number
    isActive: boolean
  }>) =>
    apiClient.put<{ data: AiProvider }>(`/ai/providers/${id}`, input).then((r) => r.data.data),

  deleteProvider: (id: string) =>
    apiClient.delete(`/ai/providers/${id}`),

  listScenarios: () =>
    apiClient.get<{ data: AiScenarioAssignment[] }>('/ai/scenarios').then((r) => r.data.data),

  assignScenario: (scenario: string, providerId: string | null) =>
    apiClient.put<{ data: AiScenarioAssignment[] }>(`/ai/scenarios/${scenario}`, { providerId }).then((r) => r.data.data),

  listModels: (providerId: string) =>
    apiClient.get<{ data: { id: string; name: string }[] }>(`/ai/providers/${providerId}/models`).then((r) => r.data.data),
}
