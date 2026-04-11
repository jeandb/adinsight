import { apiClient } from '@/lib/api/client'
import type { DashboardFilters } from '@/hooks/use-filters'

export interface KpiValues {
  spendCents: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpl: number
  leads: number
  roas: number
  purchases: number
  revenueCents: number
  cpa: number
}

export interface KpiData {
  current: KpiValues
  previous: KpiValues
  deltas: Record<keyof KpiValues, number>
}

export interface TimeseriesPoint {
  date: string
  value: number
}

export interface DistributionItem {
  label: string
  color: string
  value: number
  percentage: number
}

export interface TopCampaign {
  id: string
  name: string
  platformType: string
  channelName: string | null
  channelColor: string | null
  spendCents: number
  leads: number
  purchases: number
  revenueCents: number
  roas: number
  cpl: number
  cpa: number
}

export interface CampaignRow {
  id: string
  name: string
  platformType: string
  channelName: string | null
  channelColor: string | null
  objective: string
  status: string
  spendCents: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpl: number
  leads: number
  purchases: number
  revenueCents: number
  cpa: number
  roas: number
}

export interface CampaignsMeta {
  page: number
  limit: number
  total: number
}

function toParams(filters: DashboardFilters): Record<string, string> {
  const p: Record<string, string> = { period: filters.period }
  if (filters.date_from) p.date_from = filters.date_from
  if (filters.date_to) p.date_to = filters.date_to
  if (filters.channel_id) p.channel_id = filters.channel_id
  if (filters.platform) p.platform = filters.platform
  if (filters.objective) p.objective = filters.objective
  return p
}

export const dashboardApi = {
  getKpis: (filters: DashboardFilters) =>
    apiClient
      .get<{ data: KpiData }>('/dashboard/kpis', { params: toParams(filters) })
      .then((r) => r.data.data),

  getTimeseries: (filters: DashboardFilters, metric: string) =>
    apiClient
      .get<{ data: TimeseriesPoint[] }>('/dashboard/timeseries', {
        params: { ...toParams(filters), metric },
      })
      .then((r) => r.data.data),

  getDistribution: (filters: DashboardFilters, groupBy: string, metric: string) =>
    apiClient
      .get<{ data: DistributionItem[] }>('/dashboard/distribution', {
        params: { ...toParams(filters), group_by: groupBy, metric },
      })
      .then((r) => r.data.data),

  getTopCampaigns: (filters: DashboardFilters, sortBy: string, limit = 5) =>
    apiClient
      .get<{ data: TopCampaign[] }>('/dashboard/top-campaigns', {
        params: { ...toParams(filters), sort_by: sortBy, limit },
      })
      .then((r) => r.data.data),

  getCampaigns: (
    filters: DashboardFilters,
    page: number,
    limit: number,
    sortBy: string,
    sortDir: string,
    search?: string,
  ) =>
    apiClient
      .get<{ data: CampaignRow[]; meta: CampaignsMeta }>('/dashboard/campaigns', {
        params: {
          ...toParams(filters),
          page,
          limit,
          sort_by: sortBy,
          sort_dir: sortDir,
          ...(search ? { search } : {}),
        },
      })
      .then((r) => ({ rows: r.data.data, meta: r.data.meta })),
}
