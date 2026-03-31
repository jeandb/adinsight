import type { PlatformAdapter, CampaignSyncData, MetricSyncData, AdapterDateRange, ConnectionResult } from '../platforms.adapter.types'

const BASE = 'https://api.pinterest.com/v5'

async function pinFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const json = await res.json() as T & { code?: number; message?: string }
  if (!res.ok) throw new Error((json as { message?: string }).message ?? `HTTP ${res.status}`)
  return json
}

function mapObjective(pin: string): string {
  const map: Record<string, string> = {
    AWARENESS: 'AWARENESS',
    CONSIDERATION: 'TRAFFIC',
    VIDEO_VIEW: 'ENGAGEMENT',
    WEB_SESSIONS: 'TRAFFIC',
    CATALOG_SALES: 'SALES',
    WEB_CONVERSIONS: 'SALES',
  }
  return map[pin] ?? 'AWARENESS'
}

function mapStatus(pin: string): string {
  if (pin === 'ACTIVE') return 'ACTIVE'
  if (pin === 'PAUSED') return 'PAUSED'
  return 'ARCHIVED'
}

export const pinterestAdapter: PlatformAdapter = {
  async testConnection(credentials): Promise<ConnectionResult> {
    try {
      const data = await pinFetch<{ username?: string; business_name?: string }>('/user_account', credentials.access_token)
      const name = data.business_name ?? data.username ?? 'conta Pinterest'
      return { ok: true, message: `Conectado: ${name}`, accountName: name }
    } catch (err) {
      return { ok: false, message: (err as Error).message }
    }
  },

  async syncCampaigns(credentials, _range): Promise<CampaignSyncData[]> {
    const accountId = credentials.ad_account_id
    const data = await pinFetch<{ items: Array<{ id: string; name: string; objective_type: string; status: string; daily_spend_cap?: number }> }>(
      `/ad_accounts/${accountId}/campaigns?page_size=100`,
      credentials.access_token,
    )

    return (data.items ?? []).map((c) => ({
      externalId: c.id,
      name: c.name,
      objective: mapObjective(c.objective_type),
      status: mapStatus(c.status),
      dailyBudgetCents: c.daily_spend_cap ? Math.round(c.daily_spend_cap / 1_000_000 * 100) : null,
    }))
  },

  async syncMetrics(credentials, externalCampaignIds, range): Promise<MetricSyncData[]> {
    if (externalCampaignIds.length === 0) return []
    const accountId = credentials.ad_account_id

    const results: MetricSyncData[] = []

    for (const campaignId of externalCampaignIds) {
      try {
        const params = new URLSearchParams({
          start_date: range.from,
          end_date: range.to,
          granularity: 'DAY',
          columns: 'SPEND_IN_MICRO_DOLLAR,IMPRESSION_1,CLICK_TYPE_URL,TOTAL_CONVERSIONS,TOTAL_CONVERSION_VALUE_IN_MICRO_DOLLAR',
          campaign_ids: campaignId,
        })
        const data = await pinFetch<{ all_daily_metrics?: Array<{ data_status: string; date: string; metrics: Record<string, number> }> }>(
          `/ad_accounts/${accountId}/analytics?${params}`,
          credentials.access_token,
        )

        for (const row of data.all_daily_metrics ?? []) {
          results.push({
            externalCampaignId: campaignId,
            date: row.date,
            impressions: row.metrics['IMPRESSION_1'] ?? 0,
            clicks: row.metrics['CLICK_TYPE_URL'] ?? 0,
            spendCents: Math.round((row.metrics['SPEND_IN_MICRO_DOLLAR'] ?? 0) / 10_000),
            leads: 0,
            purchases: Math.round(row.metrics['TOTAL_CONVERSIONS'] ?? 0),
            revenueCents: Math.round((row.metrics['TOTAL_CONVERSION_VALUE_IN_MICRO_DOLLAR'] ?? 0) / 10_000),
          })
        }
      } catch {
        // skip campaigns that fail individually
      }
    }

    return results
  },
}
