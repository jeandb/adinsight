import { db } from '../../../shared/database/client'

export interface CampaignExportRow {
  name: string
  platform: string
  channel: string
  status: string
  objective: string
  spend: number
  impressions: number
  clicks: number
  ctr: string
  cpc: string
  leads: number
  cpl: string
  revenue: number
  roas: string
}

export interface RevenueExportRow {
  date: string
  store: string
  orders: number
  revenue: number
}

export async function fetchCampaignsForExport(from: string, to: string): Promise<CampaignExportRow[]> {
  const { rows } = await db.query<{
    name: string
    platform_type: string
    channel_name: string | null
    status: string
    objective: string
    spend_cents: string
    impressions: string
    clicks: string
    leads: string
    revenue_cents: string
  }>(
    `SELECT
       c.name,
       ap.type::text       AS platform_type,
       bc.name             AS channel_name,
       c.status::text,
       c.objective::text,
       COALESCE(SUM(ms.spend_cents), 0)    AS spend_cents,
       COALESCE(SUM(ms.impressions), 0)    AS impressions,
       COALESCE(SUM(ms.clicks), 0)         AS clicks,
       COALESCE(SUM(ms.leads), 0)          AS leads,
       COALESCE(SUM(ms.revenue_cents), 0)  AS revenue_cents
     FROM campaigns c
     JOIN ad_platforms ap ON ap.id = c.platform_id
     LEFT JOIN business_channels bc ON bc.id = c.channel_id
     LEFT JOIN metric_snapshots ms ON ms.campaign_id = c.id
       AND ms.snapshot_date BETWEEN $1 AND $2
     GROUP BY c.id, c.name, ap.type, bc.name, c.status, c.objective
     ORDER BY SUM(COALESCE(ms.spend_cents, 0)) DESC`,
    [from, to],
  )

  return rows.map((r) => {
    const spend    = parseInt(r.spend_cents) / 100
    const revenue  = parseInt(r.revenue_cents) / 100
    const clicks   = parseInt(r.clicks)
    const impressions = parseInt(r.impressions)
    const leads    = parseInt(r.leads)
    return {
      name:        r.name,
      platform:    r.platform_type,
      channel:     r.channel_name ?? 'Sem canal',
      status:      r.status,
      objective:   r.objective,
      spend,
      impressions,
      clicks,
      ctr:         impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0%',
      cpc:         clicks > 0 ? 'R$' + (spend / clicks).toFixed(2) : '-',
      leads,
      cpl:         leads > 0 ? 'R$' + (spend / leads).toFixed(2) : '-',
      revenue,
      roas:        spend > 0 ? (revenue / spend).toFixed(2) + 'x' : '-',
    }
  })
}

export async function fetchRevenueForExport(from: string, to: string): Promise<RevenueExportRow[]> {
  const { rows } = await db.query<{
    order_date: string
    store_name: string
    cnt: string
    total_cents: string
  }>(
    `SELECT
       o.order_date::date::text AS order_date,
       s.name                  AS store_name,
       COUNT(*)::text          AS cnt,
       COALESCE(SUM(o.total_cents), 0)::text AS total_cents
     FROM woo_orders o
     JOIN woo_stores s ON s.id = o.store_id
     WHERE o.order_date BETWEEN $1 AND $2 AND o.status = 'completed'
     GROUP BY o.order_date::date, s.name
     ORDER BY o.order_date::date DESC, s.name`,
    [from, to],
  )

  return rows.map((r) => ({
    date:    r.order_date,
    store:   r.store_name,
    orders:  parseInt(r.cnt),
    revenue: parseInt(r.total_cents) / 100,
  }))
}
