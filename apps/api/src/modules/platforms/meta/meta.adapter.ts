import type { PlatformAdapter, CampaignSyncData, MetricSyncData, AdapterDateRange, ConnectionResult } from '../platforms.adapter.types'

const BASE = 'https://graph.facebook.com/v20.0'

function mapObjective(meta: string): string {
  const map: Record<string, string> = {
    OUTCOME_AWARENESS: 'AWARENESS',
    OUTCOME_TRAFFIC: 'TRAFFIC',
    OUTCOME_ENGAGEMENT: 'ENGAGEMENT',
    OUTCOME_LEADS: 'LEADS',
    OUTCOME_APP_PROMOTION: 'APP_PROMOTION',
    OUTCOME_SALES: 'SALES',
    LINK_CLICKS: 'TRAFFIC',
    CONVERSIONS: 'SALES',
    LEAD_GENERATION: 'LEADS',
    BRAND_AWARENESS: 'AWARENESS',
    VIDEO_VIEWS: 'ENGAGEMENT',
    APP_INSTALLS: 'APP_PROMOTION',
  }
  return map[meta] ?? 'TRAFFIC'
}

function mapStatus(meta: string): string {
  if (meta === 'ACTIVE') return 'ACTIVE'
  if (meta === 'PAUSED') return 'PAUSED'
  if (meta === 'ARCHIVED' || meta === 'DELETED') return 'ARCHIVED'
  return 'PAUSED'
}

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  const json = await res.json() as T & { error?: { message: string } }
  if (!res.ok || (json as { error?: { message: string } }).error) {
    throw new Error((json as { error?: { message: string } }).error?.message ?? `HTTP ${res.status}`)
  }
  return json
}

export const metaAdapter: PlatformAdapter = {
  async testConnection(credentials): Promise<ConnectionResult> {
    try {
      const data = await apiFetch<{ id: string; name: string }>(
        '/me?fields=id,name',
        credentials.access_token,
      )
      return { ok: true, message: `Conectado como: ${data.name}`, accountName: data.name }
    } catch (err) {
      return { ok: false, message: (err as Error).message }
    }
  },

  async syncCampaigns(credentials, _range): Promise<CampaignSyncData[]> {
    const accountId = credentials.ad_account_id.startsWith('act_')
      ? credentials.ad_account_id
      : `act_${credentials.ad_account_id}`

    const data = await apiFetch<{ data: Array<{ id: string; name: string; objective: string; status: string; daily_budget?: string }> }>(
      `/${accountId}/campaigns?fields=id,name,objective,status,daily_budget&limit=200`,
      credentials.access_token,
    )

    return data.data.map((c) => ({
      externalId: c.id,
      name: c.name,
      objective: mapObjective(c.objective),
      status: mapStatus(c.status),
      dailyBudgetCents: c.daily_budget ? Math.round(parseFloat(c.daily_budget)) : null,
    }))
  },

  async syncMetrics(credentials, externalCampaignIds, range): Promise<MetricSyncData[]> {
    if (externalCampaignIds.length === 0) return []

    const accountId = credentials.ad_account_id.startsWith('act_')
      ? credentials.ad_account_id
      : `act_${credentials.ad_account_id}`

    const timeRange = encodeURIComponent(JSON.stringify({ since: range.from, until: range.to }))
    const fields = 'campaign_id,spend,impressions,clicks,actions,action_values,date_start'
    const filtering = encodeURIComponent(JSON.stringify([{
      field: 'campaign.id',
      operator: 'IN',
      value: externalCampaignIds,
    }]))

    const data = await apiFetch<{ data: Array<{
      campaign_id: string
      spend: string
      impressions: string
      clicks: string
      date_start: string
      actions?: Array<{ action_type: string; value: string }>
      action_values?: Array<{ action_type: string; value: string }>
    }> }>(
      `/${accountId}/insights?level=campaign&fields=${fields}&time_range=${timeRange}&filtering=${filtering}&time_increment=1&limit=1000`,
      credentials.access_token,
    )

    return data.data.map((row) => {
      const findAction = (type: string) =>
        parseFloat(row.actions?.find((a) => a.action_type === type)?.value ?? '0')
      const findValue = (type: string) =>
        Math.round(parseFloat(row.action_values?.find((a) => a.action_type === type)?.value ?? '0') * 100)

      const leads = findAction('lead') + findAction('onsite_conversion.lead_grouped')
      const purchases = findAction('purchase') + findAction('omni_purchase')
      const revenueCents = findValue('purchase') + findValue('omni_purchase')

      return {
        externalCampaignId: row.campaign_id,
        date: row.date_start,
        impressions: parseInt(row.impressions, 10) || 0,
        clicks: parseInt(row.clicks, 10) || 0,
        spendCents: Math.round(parseFloat(row.spend) * 100),
        leads: Math.round(leads),
        purchases: Math.round(purchases),
        revenueCents,
      }
    })
  },
}
