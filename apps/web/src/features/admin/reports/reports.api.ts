import { apiClient } from '@/lib/api/client'
import type { ScheduledReport } from '@adinsight/shared-types'

export interface CreateReportInput {
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  format: 'pdf' | 'csv' | 'excel'
  scope: 'campaigns' | 'revenue' | 'all'
  recipients: string[]
  periodDays?: number
}

export interface ExportParams {
  scope: 'campaigns' | 'revenue' | 'all'
  format: 'pdf' | 'csv' | 'excel'
  from: string
  to: string
}

export const reportsApi = {
  list: () =>
    apiClient.get<{ data: ScheduledReport[] }>('/reports').then((r) => r.data.data),

  create: (input: CreateReportInput) =>
    apiClient.post<{ data: ScheduledReport }>('/reports', input).then((r) => r.data.data),

  update: (id: string, input: Partial<CreateReportInput & { isActive: boolean }>) =>
    apiClient.put<{ data: ScheduledReport }>(`/reports/${id}`, input).then((r) => r.data.data),

  delete: (id: string) =>
    apiClient.delete(`/reports/${id}`),

  sendNow: (id: string) =>
    apiClient.post(`/reports/${id}/send`),

  exportUrl: (params: ExportParams): string => {
    const q = new URLSearchParams({
      scope: params.scope,
      format: params.format,
      from: params.from,
      to: params.to,
    })
    return `/api/reports/export?${q.toString()}`
  },
}
