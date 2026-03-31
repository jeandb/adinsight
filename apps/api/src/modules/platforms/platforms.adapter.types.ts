export interface AdapterDateRange {
  from: string  // YYYY-MM-DD
  to: string    // YYYY-MM-DD
}

export interface CampaignSyncData {
  externalId: string
  name: string
  objective: string   // will be mapped to campaign_objective enum
  status: string      // will be mapped to campaign_status enum
  dailyBudgetCents: number | null
}

export interface MetricSyncData {
  externalCampaignId: string
  date: string  // YYYY-MM-DD
  impressions: number
  clicks: number
  spendCents: number
  leads: number
  purchases: number
  revenueCents: number
}

export interface ConnectionResult {
  ok: boolean
  message: string
  accountName?: string
}

export interface PlatformAdapter {
  testConnection(credentials: Record<string, string>): Promise<ConnectionResult>
  syncCampaigns(credentials: Record<string, string>, range: AdapterDateRange): Promise<CampaignSyncData[]>
  syncMetrics(credentials: Record<string, string>, externalCampaignIds: string[], range: AdapterDateRange): Promise<MetricSyncData[]>
}
