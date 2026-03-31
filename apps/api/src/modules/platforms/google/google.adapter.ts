import type { PlatformAdapter, CampaignSyncData, MetricSyncData, AdapterDateRange, ConnectionResult } from '../platforms.adapter.types'

const ADS_BASE = 'https://googleads.googleapis.com/v17'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

interface GoogleAccessToken {
  access_token: string
  expires_in: number
}

async function getAccessToken(credentials: Record<string, string>): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: credentials.refresh_token,
    }),
  })
  const data = await res.json() as GoogleAccessToken & { error?: string; error_description?: string }
  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? data.error ?? `Token refresh failed: HTTP ${res.status}`)
  }
  return data.access_token
}

function adsHeaders(accessToken: string, developerToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  }
}

function mapObjective(channelType: string): string {
  const map: Record<string, string> = {
    SEARCH: 'TRAFFIC',
    DISPLAY: 'AWARENESS',
    SHOPPING: 'SALES',
    VIDEO: 'ENGAGEMENT',
    SMART: 'SALES',
    PERFORMANCE_MAX: 'SALES',
  }
  return map[channelType] ?? 'TRAFFIC'
}

function mapStatus(status: string): string {
  if (status === 'ENABLED') return 'ACTIVE'
  if (status === 'PAUSED') return 'PAUSED'
  return 'ARCHIVED'
}

export const googleAdapter: PlatformAdapter = {
  async testConnection(credentials): Promise<ConnectionResult> {
    try {
      const accessToken = await getAccessToken(credentials)
      const customerId = credentials.customer_id.replace(/-/g, '')
      const res = await fetch(`${ADS_BASE}/customers/${customerId}`, {
        headers: adsHeaders(accessToken, credentials.developer_token),
      })
      const data = await res.json() as { resourceName?: string; descriptiveName?: string; error?: { message: string } }
      if (!res.ok || data.error) {
        throw new Error(data.error?.message ?? `HTTP ${res.status}`)
      }
      return { ok: true, message: `Conectado: ${data.descriptiveName ?? customerId}`, accountName: data.descriptiveName }
    } catch (err) {
      return { ok: false, message: (err as Error).message }
    }
  },

  async syncCampaigns(credentials, _range): Promise<CampaignSyncData[]> {
    const accessToken = await getAccessToken(credentials)
    const customerId = credentials.customer_id.replace(/-/g, '')

    const res = await fetch(`${ADS_BASE}/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers: adsHeaders(accessToken, credentials.developer_token),
      body: JSON.stringify({
        query: `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.campaign_budget
                FROM campaign
                WHERE campaign.status != 'REMOVED'`,
      }),
    })
    const data = await res.json() as { results?: Array<{ campaign: { id: string; name: string; status: string; advertisingChannelType: string; campaignBudget?: string } }> }
    if (!res.ok) throw new Error(`Google Ads API error: HTTP ${res.status}`)

    return (data.results ?? []).map((r) => ({
      externalId: r.campaign.id,
      name: r.campaign.name,
      objective: mapObjective(r.campaign.advertisingChannelType),
      status: mapStatus(r.campaign.status),
      dailyBudgetCents: null,
    }))
  },

  async syncMetrics(credentials, externalCampaignIds, range): Promise<MetricSyncData[]> {
    if (externalCampaignIds.length === 0) return []
    const accessToken = await getAccessToken(credentials)
    const customerId = credentials.customer_id.replace(/-/g, '')

    const idList = externalCampaignIds.map((id) => `'${id}'`).join(', ')
    const res = await fetch(`${ADS_BASE}/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers: adsHeaders(accessToken, credentials.developer_token),
      body: JSON.stringify({
        query: `SELECT campaign.id, segments.date,
                       metrics.cost_micros, metrics.impressions, metrics.clicks,
                       metrics.conversions, metrics.conversions_value
                FROM campaign
                WHERE segments.date BETWEEN '${range.from}' AND '${range.to}'
                  AND campaign.id IN (${idList})`,
      }),
    })
    const data = await res.json() as { results?: Array<{ campaign: { id: string }; segments: { date: string }; metrics: { costMicros: string; impressions: string; clicks: string; conversions: string; conversionsValue: string } }> }
    if (!res.ok) throw new Error(`Google Ads metrics error: HTTP ${res.status}`)

    return (data.results ?? []).map((r) => ({
      externalCampaignId: r.campaign.id,
      date: r.segments.date,
      impressions: parseInt(r.metrics.impressions, 10) || 0,
      clicks: parseInt(r.metrics.clicks, 10) || 0,
      spendCents: Math.round(parseInt(r.metrics.costMicros, 10) / 10_000),
      leads: 0,
      purchases: Math.round(parseFloat(r.metrics.conversions) || 0),
      revenueCents: Math.round((parseFloat(r.metrics.conversionsValue) || 0) * 100),
    }))
  },
}
