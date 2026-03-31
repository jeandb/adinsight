import type { PlatformAdapter, CampaignSyncData, MetricSyncData, AdapterDateRange, ConnectionResult } from '../platforms.adapter.types'

const BASE = 'https://business-api.tiktok.com/open_api/v1.3'

async function ttFetch<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('Access-Token', token)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString())
  const json = await res.json() as { code: number; message: string; data: T }
  if (json.code !== 0) throw new Error(json.message)
  return json.data
}

function mapObjective(tt: string): string {
  const map: Record<string, string> = {
    TRAFFIC: 'TRAFFIC',
    APP_PROMOTION: 'APP_PROMOTION',
    WEB_CONVERSIONS: 'SALES',
    LEAD_GENERATION: 'LEADS',
    AWARENESS: 'AWARENESS',
    ENGAGEMENT: 'ENGAGEMENT',
    PRODUCT_SALES: 'SALES',
    SHOP_PURCHASES: 'SALES',
  }
  return map[tt] ?? 'TRAFFIC'
}

function mapStatus(tt: string): string {
  if (tt === 'CAMPAIGN_STATUS_ENABLE') return 'ACTIVE'
  if (tt === 'CAMPAIGN_STATUS_DISABLE') return 'PAUSED'
  return 'ARCHIVED'
}

export const tiktokAdapter: PlatformAdapter = {
  async testConnection(credentials): Promise<ConnectionResult> {
    try {
      const data = await ttFetch<{ display_name?: string }>('/user/info/', credentials.access_token)
      const name = data.display_name ?? 'conta TikTok'
      return { ok: true, message: `Conectado: ${name}`, accountName: name }
    } catch (err) {
      return { ok: false, message: (err as Error).message }
    }
  },

  async syncCampaigns(credentials, _range): Promise<CampaignSyncData[]> {
    const data = await ttFetch<{ list: Array<{ campaign_id: string; campaign_name: string; objective_type: string; operation_status: string; budget: number }> }>(
      '/campaign/get/',
      credentials.access_token,
      { advertiser_id: credentials.advertiser_id, page_size: '200' },
    )

    return (data.list ?? []).map((c) => ({
      externalId: c.campaign_id,
      name: c.campaign_name,
      objective: mapObjective(c.objective_type),
      status: mapStatus(c.operation_status),
      dailyBudgetCents: c.budget ? Math.round(c.budget * 100) : null,
    }))
  },

  async syncMetrics(credentials, externalCampaignIds, range): Promise<MetricSyncData[]> {
    if (externalCampaignIds.length === 0) return []

    const data = await ttFetch<{ list: Array<{ dimensions: { campaign_id: string; stat_time_day: string }; metrics: { spend: string; impressions: string; clicks: string; real_time_conversion: string; real_time_result: string } }> }>(
      '/report/integrated/get/',
      credentials.access_token,
      {
        advertiser_id: credentials.advertiser_id,
        report_type: 'BASIC',
        dimensions: JSON.stringify(['campaign_id', 'stat_time_day']),
        metrics: JSON.stringify(['spend', 'impressions', 'clicks', 'real_time_conversion', 'real_time_result']),
        start_date: range.from,
        end_date: range.to,
        filtering: JSON.stringify([{ field_name: 'campaign_ids', filter_type: 'IN', filter_value: JSON.stringify(externalCampaignIds) }]),
        page_size: '1000',
      },
    )

    return (data.list ?? []).map((row) => ({
      externalCampaignId: row.dimensions.campaign_id,
      date: row.dimensions.stat_time_day.slice(0, 10),
      impressions: parseInt(row.metrics.impressions, 10) || 0,
      clicks: parseInt(row.metrics.clicks, 10) || 0,
      spendCents: Math.round(parseFloat(row.metrics.spend) * 100),
      leads: Math.round(parseFloat(row.metrics.real_time_result) || 0),
      purchases: Math.round(parseFloat(row.metrics.real_time_conversion) || 0),
      revenueCents: 0,
    }))
  },
}
