export type PeriodKey = 'last_7d' | 'last_14d' | 'last_30d' | 'this_month' | 'last_month' | 'custom'
export type PlatformFilter = 'META' | 'GOOGLE' | 'TIKTOK' | 'PINTEREST'
export type MetricKey = 'spend' | 'impressions' | 'clicks' | 'leads' | 'roas'
export type GroupBy = 'platform' | 'channel'
export type SortBy = 'roas' | 'cpl' | 'cpc' | 'ctr' | 'spend' | 'impressions' | 'clicks' | 'leads' | 'name'
export type SortDir = 'asc' | 'desc'

export interface DateRange { from: Date; to: Date }

export interface DashboardFilters {
  period: PeriodKey
  dateFrom?: string
  dateTo?: string
  channelId?: string
  platform?: PlatformFilter
  objective?: string
}

export interface KpiValues {
  spendCents: number
  impressions: number
  clicks: number
  ctr: number      // percentage 0-100
  cpc: number      // R$ (cents / 100)
  cpl: number      // R$
  leads: number
  roas: number     // multiplier
}

export interface KpiResponse {
  current: KpiValues
  previous: KpiValues
  deltas: Record<keyof KpiValues, number>  // percentage delta
}

export interface TimeseriesPoint { date: string; value: number }

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
  roas: number
  cpl: number
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
  roas: number
}
