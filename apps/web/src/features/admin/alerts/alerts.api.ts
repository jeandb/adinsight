import { apiClient } from '@/lib/api/client'

export interface AlertRule {
  id: string
  name: string
  metric: string
  operator: string
  threshold: number
  periodDays: number
  platform: string | null
  channelId: string | null
  recipients: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AlertEvent {
  id: string
  ruleId: string
  ruleName: string
  metric: string
  operator: string
  threshold: number
  metricValue: number
  message: string
  notified: boolean
  triggeredAt: string
}

export interface CreateAlertRuleInput {
  name: string
  metric: string
  operator: string
  threshold: number
  periodDays?: number
  platform?: string | null
  channelId?: string | null
  recipients?: string[]
}

export const alertsApi = {
  listRules: () =>
    apiClient.get<{ data: AlertRule[] }>('/alerts').then((r) => r.data.data),

  createRule: (input: CreateAlertRuleInput) =>
    apiClient.post<{ data: AlertRule }>('/alerts', input).then((r) => r.data.data),

  updateRule: (id: string, input: Partial<CreateAlertRuleInput> & { enabled?: boolean }) =>
    apiClient.put<{ data: AlertRule }>(`/alerts/${id}`, input).then((r) => r.data.data),

  deleteRule: (id: string) =>
    apiClient.delete(`/alerts/${id}`),

  listEvents: (limit = 50) =>
    apiClient.get<{ data: AlertEvent[] }>('/alerts/events', { params: { limit } }).then((r) => r.data.data),

  evaluate: () =>
    apiClient.post<{ data: { evaluated: boolean; triggered: number } }>('/alerts/evaluate').then((r) => r.data.data),
}
